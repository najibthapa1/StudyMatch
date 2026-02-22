from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .permissions import IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from authentication.models import User
from user_profile.models import Profile
from guild.models import Guild, Event
from .models import UserSuspension, AdminNotification
from .serializers import (AdminUserSerializer, UserSuspensionSerializer,AdminNotificationSerializer)
from guild.serializers import GuildSerializer, EventSerializer
from authentication.serializers import UserSerializer

# Admin Views
@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Admin login endpoint 
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(email=email, password=password)
    
    if not user:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user is admin
    if user.role != 'admin' or not user.is_staff:
        return Response(
            {'error': 'Access denied. Admin privileges required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if not user.is_verified:
        return Response(
            {'error': 'Email not verified. Please verify your email first.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    # Prepare response data
    user_data = UserSerializer(user).data
    
    return Response({
        'message': 'Admin login successful',
        'user': user_data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """
    Get dashboard statistics for admin panel
    """
    try:
        # Total users count
        total_users = User.objects.count()
        
        # Verified vs unverified users
        verified_users = User.objects.filter(is_verified=True).count()
        unverified_users = User.objects.filter(is_verified=False).count()
        
        # Total profiles
        total_profiles = Profile.objects.count()
        
        # Users by role
        users_by_role = User.objects.values('role').annotate(count=Count('role'))
        role_counts = {item['role']: item['count'] for item in users_by_role}
        
        # Recent signups (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_users = User.objects.filter(created_at__gte=seven_days_ago).order_by('-created_at')[:10]
        
        recent_signups = []
        for user in recent_users:
            try:
                profile = user.profile
                recent_signups.append({
                    'user_id': str(user.user_id),
                    'email': user.email,
                    'full_name': profile.full_name,
                    'role': user.role,
                    'is_verified': user.is_verified,
                    'created_at': user.created_at.isoformat(),
                })
            except Profile.DoesNotExist:
                recent_signups.append({
                    'user_id': str(user.user_id),
                    'email': user.email,
                    'full_name': 'N/A',
                    'role': user.role,
                    'is_verified': user.is_verified,
                    'created_at': user.created_at.isoformat(),
                })
        
        stats = {
            'total_users': total_users,
            'verified_users': verified_users,
            'unverified_users': unverified_users,
            'total_profiles': total_profiles,
            'users_by_role': role_counts,
            'recent_signups': recent_signups,
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_verify_access(request):
    """
    Verify admin access for frontend route protection
    """
    return Response({
        'message': 'Admin access verified',
        'user': {
            'email': request.user.email,
            'role': request.user.role,
            'is_staff': request.user.is_staff,
        }
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_users(request):
    """Get all users with filtering, search, and pagination"""
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', 'all')  
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        
        # Base query
        users = User.objects.all().exclude(is_superuser=True)
        
        # Apply search
        if search:
            users = users.filter(
                Q(email__icontains=search) |
                Q(profile__full_name__icontains=search)
            )
        
        # Apply status filter
        if status_filter == 'active':
            users = users.filter(is_suspended=False, is_active=True)
        elif status_filter == 'suspended':
            users = users.filter(is_suspended=True)
        
        # Get totals before pagination
        total_users = users.count()
        active_users = users.filter(is_suspended=False, is_active=True).count()
        suspended_users = users.filter(is_suspended=True).count()
        
        # Pagination
        start = (page - 1) * per_page
        end = start + per_page
        paginated_users = users[start:end]
        
        # Serialize
        serializer = AdminUserSerializer(paginated_users, many=True)
        
        return Response({
            'users': serializer.data,
            'pagination': {
                'total': total_users,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_users + per_page - 1) // per_page
            },
            'stats': {
                'total_users': total_users,
                'active_users': active_users,
                'suspended_users': suspended_users
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_user_detail(request, user_id):
    """Get detailed information about a specific user"""
    try:
        user = User.objects.get(user_id=user_id)
        serializer = AdminUserSerializer(user)
        
        # Get user's study goals
        goals = user.study_goals.all()[:5]
        
        # Get user's recent activities
        activities = user.activities.all()[:10]
        
        return Response({
            'user': serializer.data,
            'study_goals_count': user.study_goals.count(),
            'activities_count': user.activities.count()
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


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_user(request, user_id):
    """Update user information (admin only)"""
    try:
        user = User.objects.get(user_id=user_id)
        
        # Update allowed fields
        if 'role' in request.data:
            user.role = request.data['role']
        if 'is_verified' in request.data:
            user.is_verified = request.data['is_verified']
        
        user.save()
        
        # Update profile if provided
        if 'profile' in request.data:
            profile = user.profile
            profile_data = request.data['profile']
            
            if 'full_name' in profile_data:
                profile.full_name = profile_data['full_name']
            if 'university_name' in profile_data:
                profile.university_name = profile_data['university_name']
            if 'course' in profile_data:
                profile.course = profile_data['course']
            if 'year' in profile_data:
                profile.year = profile_data['year']
            
            profile.save()
        
        serializer = AdminUserSerializer(user)
        return Response({
            'message': 'User updated successfully',
            'user': serializer.data
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


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_suspend_user(request, user_id):
    """Suspend a user"""
    try:
        user = User.objects.get(user_id=user_id)
        
        if user.is_superuser or user.role == 'admin':
            return Response(
                {'error': 'Cannot suspend admin users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reason = request.data.get('reason', 'Policy violation')
        duration_days = int(request.data.get('duration_days', 7))
        
        # Create suspension record
        suspension = UserSuspension.objects.create(
            user=user,
            suspended_by=request.user,
            reason=reason,
            duration_days=duration_days
        )
        
        # Update user status
        user.is_suspended = True
        user.save()
        
        # Create admin notification
        AdminNotification.objects.create(
            notification_type='system',
            title='User Suspended',
            description=f'{user.email} was suspended for {duration_days} days'
        )
        
        serializer = UserSuspensionSerializer(suspension)
        return Response({
            'message': 'User suspended successfully',
            'suspension': serializer.data
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


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_unsuspend_user(request, user_id):
    """Remove suspension from a user"""
    try:
        user = User.objects.get(user_id=user_id)
        
        # Deactivate all active suspensions
        UserSuspension.objects.filter(
            user=user,
            is_active=True
        ).update(is_active=False)
        
        # Update user status
        user.is_suspended = False
        user.save()
        
        # Create admin notification
        AdminNotification.objects.create(
            notification_type='system',
            title='User Unsuspended',
            description=f'{user.email} suspension was lifted'
        )
        
        return Response({
            'message': 'User unsuspended successfully'
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


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_user(request, user_id):
    """Delete a user permanently"""
    try:
        user = User.objects.get(user_id=user_id)
        
        if user.is_superuser or user.role == 'admin':
            return Response(
                {'error': 'Cannot delete admin users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = user.email
        user.delete()
        
        # Create admin notification
        AdminNotification.objects.create(
            notification_type='system',
            title='User Deleted',
            description=f'User {email} was permanently deleted'
        )
        
        return Response({
            'message': 'User deleted successfully'
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
# Guild Management Views
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_guilds(request):
    """Get all guilds with their events"""
    try:
        guilds = Guild.objects.all()
        
        guilds_data = []
        for guild in guilds:
            guild_serializer = GuildSerializer(guild)
            events = guild.events.all()
            events_serializer = EventSerializer(events, many=True)
            
            guilds_data.append({
                **guild_serializer.data,
                'events': events_serializer.data
            })
        
        # Calculate totals
        total_members = sum(g['member_count'] for g in guilds_data)
        total_events = sum(len(g['events']) for g in guilds_data)
        
        return Response({
            'guilds': guilds_data,
            'stats': {
                'total_guilds': len(guilds_data),
                'total_members': total_members,
                'total_events': total_events
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_guild_detail(request, guild_id):
    """Get detailed information about a specific guild"""
    try:
        guild = Guild.objects.get(guild_id=guild_id)
        guild_serializer = GuildSerializer(guild)
        
        events = guild.events.all()
        events_serializer = EventSerializer(events, many=True)
        
        return Response({
            'guild': guild_serializer.data,
            'events': events_serializer.data
        }, status=status.HTTP_200_OK)
        
    except Guild.DoesNotExist:
        return Response(
            {'error': 'Guild not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Analytics Views
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_analytics(request):
    """Get comprehensive analytics data"""
    try:
        # User growth over last 8 months
        eight_months_ago = timezone.now() - timedelta(days=240)
        user_growth = User.objects.filter(
            created_at__gte=eight_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            users=Count('user_id')
        ).order_by('month')
        
        # Format user growth data
        user_growth_data = []
        for item in user_growth:
            user_growth_data.append({
                'month': item['month'].strftime('%b'),
                'users': item['users']
            })
        
        # Event participation stats
        event_stats = Event.objects.filter(
            created_at__gte=eight_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            confirmed=Count('event_id', filter=Q(status='confirmed')),
            pending=Count('event_id', filter=Q(status='pending'))
        ).order_by('month')
        
        event_stats_data = []
        for item in event_stats:
            event_stats_data.append({
                'month': item['month'].strftime('%b'),
                'confirmed': item['confirmed'],
                'pending': item['pending']
            })
        
        # Guild statistics
        guilds = Guild.objects.all()
        guild_stats_data = []
        for guild in guilds:
            guild_stats_data.append({
                'name': guild.name,
                'members': guild.member_count,
                'events': guild.events.count()
            })
        
        # Event category distribution
        event_categories = Event.objects.values('category').annotate(
            count=Count('event_id')
        )
        
        category_colors = {
            'workshop': '#3b82f6',
            'study_group': '#10b981',
            'competition': '#f59e0b',
            'networking': '#8b5cf6',
            'symposium': '#ec4899'
        }
        
        event_category_data = [
            {
                'name': cat['category'].replace('_', ' ').title(),
                'value': cat['count'],
                'color': category_colors.get(cat['category'], '#6b7280')
            }
            for cat in event_categories
        ]
        
        # Engagement metrics (mock data for now)
        engagement_data = [
            {'day': 'Mon', 'messages': 1240, 'connections': 45},
            {'day': 'Tue', 'messages': 1580, 'connections': 52},
            {'day': 'Wed', 'messages': 1890, 'connections': 68},
            {'day': 'Thu', 'messages': 1650, 'connections': 58},
            {'day': 'Fri', 'messages': 2100, 'connections': 75},
            {'day': 'Sat', 'messages': 950, 'connections': 32},
            {'day': 'Sun', 'messages': 720, 'connections': 28},
        ]
        
        # Conversion rate (pre-join to confirmed)
        total_pending = Event.objects.filter(status='pending').count()
        total_confirmed = Event.objects.filter(status='confirmed').count()
        conversion_rate = 0
        if total_pending + total_confirmed > 0:
            conversion_rate = round((total_confirmed / (total_pending + total_confirmed)) * 100)
        
        # Key stats
        active_guilds = Guild.objects.filter(member_count__gt=0).count()
        events_this_month = Event.objects.filter(
            created_at__month=timezone.now().month
        ).count()
        daily_active_users = User.objects.filter(
            is_active=True,
            is_suspended=False
        ).count()
        
        return Response({
            'user_growth': user_growth_data,
            'event_stats': event_stats_data,
            'guild_stats': guild_stats_data,
            'event_categories': event_category_data,
            'engagement': engagement_data,
            'key_stats': {
                'conversion_rate': f'{conversion_rate}%',
                'active_guilds': active_guilds,
                'events_this_month': events_this_month,
                'daily_active_users': daily_active_users
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Notification Views
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_notifications(request):
    """Get all admin notifications"""
    try:
        filter_type = request.GET.get('filter', 'all')  # all, unread
        
        notifications = AdminNotification.objects.all()
        
        if filter_type == 'unread':
            notifications = notifications.filter(is_read=False)
        
        serializer = AdminNotificationSerializer(notifications, many=True)
        
        unread_count = AdminNotification.objects.filter(is_read=False).count()
        
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        notification = AdminNotification.objects.get(notification_id=notification_id)
        notification.is_read = True
        notification.save()
        
        return Response({
            'message': 'Notification marked as read'
        }, status=status.HTTP_200_OK)
        
    except AdminNotification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_mark_all_notifications_read(request):
    """Mark all notifications as read"""
    try:
        AdminNotification.objects.filter(is_read=False).update(is_read=True)
        
        return Response({
            'message': 'All notifications marked as read'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_notification(request, notification_id):
    """Delete a notification"""
    try:
        notification = AdminNotification.objects.get(notification_id=notification_id)
        notification.delete()
        
        return Response({
            'message': 'Notification deleted'
        }, status=status.HTTP_200_OK)
        
    except AdminNotification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )