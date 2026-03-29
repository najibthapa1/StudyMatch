from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Guild, Event, EventParticipant, EventPhoto
from .serializers import GuildSerializer, EventSerializer, EventPhotoSerializer
from user_profile.models import Profile, Activity


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_guild(request):
    """Get the guild for the current user's university."""
    try:
        profile = request.user.profile
        guild = Guild.objects.get(name=profile.university_name)
        serializer = GuildSerializer(guild)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Profile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Guild.DoesNotExist:
        return Response({'error': 'Guild not found for your university'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_guild_events(request, guild_id):
    """Get all events for a guild with participation status and expiry."""
    try:
        guild = Guild.objects.get(guild_id=guild_id)
        today = timezone.now().date()
        events = guild.events.all()

        events_data = []
        for event in events:
            event_data = EventSerializer(event).data

            # Expiry flag
            event_data['is_expired'] = event.date < today

            # Participation status
            participant = EventParticipant.objects.filter(
                event=event, user=request.user
            ).first()
            event_data['is_joined'] = participant is not None
            event_data['is_confirmed_participant'] = participant.is_confirmed if participant else False

            # Photos (only for expired/past events)
            if event_data['is_expired']:
                photos = EventPhoto.objects.filter(event=event)
                event_data['photos'] = EventPhotoSerializer(photos, many=True).data
            else:
                event_data['photos'] = []

            events_data.append(event_data)

        return Response(events_data, status=status.HTTP_200_OK)
    except Guild.DoesNotExist:
        return Response({'error': 'Guild not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_guild_event(request, guild_id):
    """Create a new event in a guild."""
    try:
        guild = Guild.objects.get(guild_id=guild_id)

        try:
            profile = request.user.profile
            if profile.university_name != guild.name:
                return Response(
                    {'error': 'You can only create events in your university guild'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        required = ['title', 'description', 'category', 'date', 'time_start', 'time_end', 'venue']
        for field in required:
            if not request.data.get(field):
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent creating events in the past
        from datetime import date as date_type
        import datetime
        event_date = datetime.date.fromisoformat(request.data['date'])
        if event_date < timezone.now().date():
            return Response({'error': 'Event date cannot be in the past'}, status=status.HTTP_400_BAD_REQUEST)

        event = Event.objects.create(
            guild=guild,
            title=request.data['title'],
            description=request.data['description'],
            category=request.data['category'],
            date=request.data['date'],
            time_start=request.data['time_start'],
            time_end=request.data['time_end'],
            venue=request.data['venue'],
            created_by=request.user,
            status='pending'
        )

        # Creator automatically pre-joins
        EventParticipant.objects.create(event=event, user=request.user)

        Activity.objects.create(
            user=request.user,
            activity_type='event',
            action='Created an event',
            description=event.title
        )

        serializer = EventSerializer(event)
        event_data = serializer.data
        event_data['is_expired'] = False
        event_data['is_joined'] = True
        event_data['is_confirmed_participant'] = False
        event_data['photos'] = []
        return Response(event_data, status=status.HTTP_201_CREATED)

    except Guild.DoesNotExist:
        return Response({'error': 'Guild not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_event(request, event_id):
    """Join/pre-join an event — blocked if expired."""
    try:
        event = Event.objects.get(event_id=event_id)

        # Block joining expired events
        if event.date < timezone.now().date():
            return Response(
                {'error': 'This event has already passed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if EventParticipant.objects.filter(event=event, user=request.user).exists():
            return Response({'error': 'Already joined this event'}, status=status.HTTP_400_BAD_REQUEST)

        participant = EventParticipant.objects.create(event=event, user=request.user)

        Activity.objects.create(
            user=request.user,
            activity_type='event',
            action='Joined an event',
            description=event.title
        )

        event.refresh_from_db()
        serializer = EventSerializer(event)
        event_data = serializer.data
        event_data['is_expired'] = event.date < timezone.now().date()
        event_data['is_joined'] = True
        event_data['is_confirmed_participant'] = participant.is_confirmed
        event_data['photos'] = []

        return Response({
            'message': 'Successfully joined event',
            'event': event_data
        }, status=status.HTTP_200_OK)

    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_event(request, event_id):
    """Leave an event."""
    try:
        event = Event.objects.get(event_id=event_id)

        if event.date < timezone.now().date():
            return Response(
                {'error': 'Cannot leave a past event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        participant = EventParticipant.objects.filter(event=event, user=request.user).first()
        if not participant:
            return Response({'error': 'You have not joined this event'}, status=status.HTTP_400_BAD_REQUEST)

        if event.status == 'confirmed' and participant.is_confirmed:
            return Response(
                {'error': 'Cannot leave a confirmed event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        participant.delete()
        event.pre_joined_count = event.participants.count()
        event.save()

        return Response({'message': 'Successfully left event'}, status=status.HTTP_200_OK)

    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_event(request, event_id):
    """Delete an event (only creator, only pending, only future)."""
    try:
        event = Event.objects.get(event_id=event_id)

        if event.created_by != request.user:
            return Response({'error': 'Only the event creator can delete this event'}, status=status.HTTP_403_FORBIDDEN)

        if event.status == 'confirmed':
            return Response({'error': 'Cannot delete a confirmed event'}, status=status.HTTP_400_BAD_REQUEST)

        if event.date < timezone.now().date():
            return Response({'error': 'Cannot delete a past event'}, status=status.HTTP_400_BAD_REQUEST)

        event.delete()
        return Response({'message': 'Event deleted successfully'}, status=status.HTTP_200_OK)

    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_events(request):
    """Get events the current user has joined, with expiry and photos."""
    try:
        today = timezone.now().date()
        participations = EventParticipant.objects.filter(
            user=request.user
        ).select_related('event__guild')

        events_data = []
        for participation in participations:
            event = participation.event
            event_data = EventSerializer(event).data
            event_data['is_expired'] = event.date < today
            event_data['is_joined'] = True
            event_data['is_confirmed_participant'] = participation.is_confirmed

            if event_data['is_expired']:
                photos = EventPhoto.objects.filter(event=event)
                event_data['photos'] = EventPhotoSerializer(photos, many=True).data
            else:
                event_data['photos'] = []

            events_data.append(event_data)

        return Response(events_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Photo endpoints ────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_event_photo(request, event_id):
    """
    Upload a photo to a past event.
    Only participants of a confirmed + expired event can upload.
    """
    try:
        event = Event.objects.get(event_id=event_id)
        today = timezone.now().date()

        # Must be past
        if event.date >= today:
            return Response(
                {'error': 'Photos can only be uploaded after the event has taken place'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Must be a participant
        if not EventParticipant.objects.filter(event=event, user=request.user).exists():
            return Response(
                {'error': 'Only event participants can upload photos'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'photo' not in request.FILES:
            return Response({'error': 'No photo provided'}, status=status.HTTP_400_BAD_REQUEST)

        photo_file = request.FILES['photo']

        # 10 MB limit
        if photo_file.size > 10 * 1024 * 1024:
            return Response({'error': 'Photo must be under 10MB'}, status=status.HTTP_400_BAD_REQUEST)

        caption = request.data.get('caption', '')

        photo = EventPhoto.objects.create(
            event=event,
            uploaded_by=request.user,
            photo=photo_file,
            caption=caption
        )

        serializer = EventPhotoSerializer(photo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_event_photos(request, event_id):
    """Get all photos for an event."""
    try:
        event = Event.objects.get(event_id=event_id)
        photos = EventPhoto.objects.filter(event=event)
        serializer = EventPhotoSerializer(photos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_event_photo(request, photo_id):
    """Delete a photo — only the uploader can delete their own photo."""
    try:
        photo = EventPhoto.objects.get(photo_id=photo_id)

        if photo.uploaded_by != request.user:
            return Response(
                {'error': 'You can only delete your own photos'},
                status=status.HTTP_403_FORBIDDEN
            )

        photo.delete()
        return Response({'message': 'Photo deleted'}, status=status.HTTP_200_OK)

    except EventPhoto.DoesNotExist:
        return Response({'error': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_event(request, event_id):
    """Update an event — only creator, only pending, only future."""
    try:
        event = Event.objects.get(event_id=event_id)

        if event.created_by != request.user:
            return Response(
                {'error': 'Only the event creator can edit this event'},
                status=status.HTTP_403_FORBIDDEN
            )

        if event.status == 'confirmed':
            return Response(
                {'error': 'Cannot edit a confirmed event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if event.date < timezone.now().date():
            return Response(
                {'error': 'Cannot edit a past event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate and parse the new date BEFORE applying any field updates
        import datetime
        if 'date' in request.data:
            import datetime
            try:
                new_date = datetime.date.fromisoformat(request.data['date'])
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if new_date < timezone.now().date():
                return Response(
                    {'error': 'Event date cannot be in the past'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Update only provided fields (date is stored as parsed object)
        updatable = ['title', 'description', 'category', 'time_start', 'time_end', 'venue']
        for field in updatable:
            if field in request.data:
                setattr(event, field, request.data[field])

        # Set the date as a proper date object (not the raw string)
        if 'date' in request.data:
            event.date = new_date

        event.save()

        serializer = EventSerializer(event)
        event_data = serializer.data
        event_data['is_expired'] = False
        event_data['is_joined'] = True
        event_data['is_confirmed_participant'] = False
        event_data['photos'] = []
        return Response(event_data, status=status.HTTP_200_OK)

    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)