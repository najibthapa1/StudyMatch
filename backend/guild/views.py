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
    try:
        profile = request.user.profile
        guild = Guild.objects.get(name=profile.university_name)
        serializer = GuildSerializer(guild)
        return Response(serializer.data)
    except Profile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Guild.DoesNotExist:
        return Response({'error': 'No guild for your university'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_guild_events(request, guild_id):
    try:
        guild = Guild.objects.get(guild_id=guild_id)
        today = timezone.now().date()
        events = guild.events.all()

        events_data = []
        for event in events:
            data = EventSerializer(event).data
            data['is_expired'] = event.date < today

            participant = EventParticipant.objects.filter(event=event, user=request.user).first()
            data['is_joined'] = participant is not None
            data['is_confirmed_participant'] = participant.is_confirmed if participant else False

            if data['is_expired']:
                photos = EventPhoto.objects.filter(event=event)
                data['photos'] = EventPhotoSerializer(photos, many=True).data
            else:
                data['photos'] = []

            events_data.append(data)

        return Response(events_data)
    except Guild.DoesNotExist:
        return Response({'error': 'Guild not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_guild_event(request, guild_id):
    try:
        guild = Guild.objects.get(guild_id=guild_id)

        try:
            profile = request.user.profile
            if profile.university_name != guild.name:
                return Response({'error': 'Can only create events in your own guild'}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        required = ['title', 'description', 'category', 'date', 'time_start', 'time_end', 'venue']
        for field in required:
            if not request.data.get(field):
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)

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

        EventParticipant.objects.create(event=event, user=request.user)

        Activity.objects.create(
            user=request.user,
            activity_type='event',
            action='Created an event',
            description=event.title
        )

        serializer = EventSerializer(event)
        data = serializer.data
        data['is_expired'] = False
        data['is_joined'] = True
        data['is_confirmed_participant'] = False
        data['photos'] = []
        
        # notify guild members
        try:
            from notification.service import notify_event_created
            from authentication.models import User as _User
            from user_profile.models import Profile as _Profile
            member_ids = _Profile.objects.filter(university_name=guild.name).values_list('user_id', flat=True)
            members = _User.objects.filter(user_id__in=member_ids, is_active=True, is_verified=True)
            notify_event_created(event, members)
        except Exception:
            pass
        return Response(data, status=status.HTTP_201_CREATED)

    except Guild.DoesNotExist:
        return Response({'error': 'Guild not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_event(request, event_id):
    try:
        event = Event.objects.get(event_id=event_id)

        if event.date < timezone.now().date():
            return Response({'error': 'Event already passed'}, status=status.HTTP_400_BAD_REQUEST)

        if EventParticipant.objects.filter(event=event, user=request.user).exists():
            return Response({'error': 'Already joined'}, status=status.HTTP_400_BAD_REQUEST)

        participant = EventParticipant.objects.create(event=event, user=request.user)

        Activity.objects.create(
            user=request.user,
            activity_type='event',
            action='Joined an event',
            description=event.title
        )

        event.refresh_from_db()
        serializer = EventSerializer(event)
        data = serializer.data
        data['is_expired'] = event.date < timezone.now().date()
        data['is_joined'] = True
        data['is_confirmed_participant'] = participant.is_confirmed
        data['photos'] = []

        return Response({'message': 'Joined', 'event': data})

    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_event(request, event_id):
    try:
        event = Event.objects.get(event_id=event_id)

        if event.date < timezone.now().date():
            return Response({'error': 'Cannot leave past event'}, status=status.HTTP_400_BAD_REQUEST)

        participant = EventParticipant.objects.filter(event=event, user=request.user).first()
        if not participant:
            return Response({'error': 'Not joined'}, status=status.HTTP_400_BAD_REQUEST)

        if event.status == 'confirmed' and participant.is_confirmed:
            return Response({'error': 'Cannot leave confirmed event'}, status=status.HTTP_400_BAD_REQUEST)

        participant.delete()
        event.pre_joined_count = event.participants.count()
        event.save()

        return Response({'message': 'Left event'})

    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_event(request, event_id):
    try:
        event = Event.objects.get(event_id=event_id)

        if event.created_by != request.user:
            return Response({'error': 'Only the event creator can delete this event'}, status=status.HTTP_403_FORBIDDEN)

        if event.status == 'confirmed':
            return Response({'error': 'Cannot delete a confirmed event'}, status=status.HTTP_400_BAD_REQUEST)

        if event.date < timezone.now().date():
            return Response({'error': 'Cannot delete a past event'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from notification.service import notify_event_deleted
            from authentication.models import User as _User
            participant_user_ids = list(
                event.participants.values_list('user_id', flat=True)
            )
            participant_users = list(
                _User.objects.filter(user_id__in=participant_user_ids)
            )
            notify_event_deleted(event, participant_users)
        except Exception:
            pass
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
        try:
            from notification.service import notify_event_updated
            notify_event_updated(event)
        except Exception:
            pass

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