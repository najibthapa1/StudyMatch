from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from django.db.models import Q
from authentication.models import User
from user_profile.models import Profile, Activity, StudyGoal
from .models import ConnectionRequest
from .serializers import ConnectionRequestSerializer


# Connection Request Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_connection_request(request, user_id):
    """Send a connection request to another user"""
    try:
        to_user = User.objects.get(
            user_id=user_id,
            is_verified=True,
            is_suspended=False,
            role='student',
            is_active=True
        )
        
        if to_user == request.user:
            return Response(
                {'error': 'Cannot send connection request to yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if request already exists
        existing_request = ConnectionRequest.objects.filter(
            Q(from_user=request.user, to_user=to_user) |
            Q(from_user=to_user, to_user=request.user)
        ).first()
        
        if existing_request:
            if existing_request.status == 'accepted':
                return Response(
                    {'error': 'Already connected'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_request.status == 'pending':
                return Response(
                    {'error': 'Connection request already sent'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else: 
                existing_request.status = 'pending'
                existing_request.from_user = request.user
                existing_request.to_user = to_user
                existing_request.save()
                
                serializer = ConnectionRequestSerializer(existing_request)
                return Response({
                    'message': 'Connection request sent',
                    'request': serializer.data
                }, status=status.HTTP_200_OK)
        
        # Create new request
        conn_request = ConnectionRequest.objects.create(
            from_user=request.user,
            to_user=to_user,
            status='pending'
        )
        try:
            from notification.service import notify_connection_request
            notify_connection_request(from_user=request.user, to_user=to_user)
        except Exception:
            pass
        
        # Create activity
        Activity.objects.create(
            user=request.user,
            activity_type='connection',
            action='Sent connection request',
            description=f'to {to_user.profile.full_name}'
        )
                
        serializer = ConnectionRequestSerializer(conn_request)
        return Response({
            'message': 'Connection request sent',
            'request': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_connection_requests(request):
    """Get all connection requests (sent and received)"""
    try:
        filter_type = request.GET.get('type', 'all')  
        
        if filter_type == 'sent':
            requests = ConnectionRequest.objects.filter(from_user=request.user)
        elif filter_type == 'received':
            requests = ConnectionRequest.objects.filter(to_user=request.user)
        elif filter_type == 'pending':
            requests = ConnectionRequest.objects.filter(
                to_user=request.user,
                status='pending'
            )
        else:  
            requests = ConnectionRequest.objects.filter(
                Q(from_user=request.user) | Q(to_user=request.user)
            )
        
        serializer = ConnectionRequestSerializer(requests, many=True)
        
        return Response({
            'requests': serializer.data,
            'count': requests.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_connection_request(request, request_id):
    """Accept a connection request"""
    try:
        conn_request = ConnectionRequest.objects.get(
            request_id=request_id,
            to_user=request.user,
            status='pending'
        )
        
        conn_request.status = 'accepted'
        conn_request.save()
        try:
            from notification.service import notify_connection_accepted
            notify_connection_accepted(
                acceptor=request.user,
                requester=conn_request.from_user,
            )
        except Exception:
            pass
        
        Activity.objects.create(
            user=request.user,
            activity_type='connection',
            action='Accepted connection request',
            description=f'from {conn_request.from_user.profile.full_name}'
        )
        
        Activity.objects.create(
            user=conn_request.from_user,
            activity_type='connection',
            action='Connection request accepted',
            description=f'by {request.user.profile.full_name}'
        )
                
        serializer = ConnectionRequestSerializer(conn_request)
        return Response({
            'message': 'Connection request accepted',
            'request': serializer.data
        }, status=status.HTTP_200_OK)
        
    except ConnectionRequest.DoesNotExist:
        return Response(
            {'error': 'Connection request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_connection_request(request, request_id):
    """Reject a connection request"""
    try:
        conn_request = ConnectionRequest.objects.get(
            request_id=request_id,
            to_user=request.user,
            status='pending'
        )
        
        conn_request.status = 'rejected'
        conn_request.save()
        
        Activity.objects.create(
            user=request.user,
            activity_type='connection',
            action='Rejected connection request',
            description=f'from {conn_request.from_user.profile.full_name}'
        )
        
        serializer = ConnectionRequestSerializer(conn_request)
        return Response({
            'message': 'Connection request rejected',
            'request': serializer.data
        }, status=status.HTTP_200_OK)
        
    except ConnectionRequest.DoesNotExist:
        return Response(
            {'error': 'Connection request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])   
@permission_classes([IsAuthenticated])
def get_connections(request):
    """Get all accepted connections for the current user"""
    try:
        search = request.GET.get('search', '')
        
        # Get all accepted connection requests where user is either sender or receiver
        accepted_connections = ConnectionRequest.objects.filter(
            (models.Q(from_user=request.user) | models.Q(to_user=request.user)),
            status='accepted'
        ).select_related('from_user__profile', 'to_user__profile')
        
        connections_data = []
        for conn in accepted_connections:
            # Determine which user is the "other" user
            other_user = conn.to_user if conn.from_user == request.user else conn.from_user
            
            # Skip if other user is suspended or not active
            if other_user.is_suspended or not other_user.is_active or not other_user.is_verified:
                continue
            
            try:
                profile = other_user.profile
                
                # Apply search filter
                if search:
                    if not (search.lower() in profile.full_name.lower() or 
                        search.lower() in (profile.course or '').lower() or
                        search.lower() in (profile.interests or '').lower()):
                        continue
                
                # Get last activity time
                last_activity = Activity.objects.filter(user=other_user).first()
                last_active = last_activity.get_time_ago() if last_activity else 'No recent activity'
                
                # Get study goals
                study_goals = list(StudyGoal.objects.filter(user=other_user, is_completed=False)[:5].values_list('title', flat=True))
                
                connections_data.append({
                    'user_id': str(other_user.user_id),
                    'connection_id': str(conn.request_id),
                    'profile': {
                        'full_name': profile.full_name,
                        'email': other_user.email,
                        'bio': profile.bio or '',
                        'university_name': profile.university_name,
                        'course': profile.course or '',
                        'year': profile.year or '',
                        'interests': profile.interests or '',
                        'projects': profile.projects or '',
                        'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                        'initials': profile.get_initials(),
                    },
                    'study_goals': study_goals,
                    'connected_date': conn.updated_at.strftime('%b %d, %Y'),
                    'last_active': last_active,
                    'is_connected': True,
                })
            except Profile.DoesNotExist:
                continue
        
        return Response({
            'connections': connections_data,
            'count': len(connections_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_connection(request, user_id):
    """Remove a connection by changing status to rejected"""
    try:
        other_user = User.objects.get(user_id=user_id)
        
        # Find the connection request (either direction)
        conn_request = ConnectionRequest.objects.filter(
            (models.Q(from_user=request.user, to_user=other_user) |
            models.Q(from_user=other_user, to_user=request.user)),
            status='accepted'
        ).first()
        
        if not conn_request:
            return Response(
                {'error': 'Connection not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete the connection request
        conn_request.delete()
        
        # Create activity
        Activity.objects.create(
            user=request.user,
            activity_type='connection',
            action='Removed connection',
            description=f'with {other_user.profile.full_name}'
        )
        
        return Response({
            'message': 'Connection removed successfully'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )