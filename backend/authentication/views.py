from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from .permissions import IsAdminUser
from django.db import models
from .models import User, EmailVerification, Activity, StudyGoal, Profile, Guild, Event, EventParticipant, UserSuspension, AdminNotification, ConnectionRequest
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, VerifyEmailSerializer, ActivitySerializer, StudyGoalSerializer, GuildSerializer, EventSerializer, UserSuspensionSerializer,AdminNotificationSerializer, AdminUserSerializer,UserGrowthSerializer, EventStatsSerializer, GuildStatsSerializer, DiscoveryUserSerializer, ConnectionRequestSerializer
from .utils import generate_verification_code, send_verification_email


# Generate JWT tokens for userß
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny]) 
def register(request):

    #Register a new user

    # Step 1: Validate data
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        # Step 2: Create user and profile
        user = serializer.save()
        
        # Step 3: Generate verification code
        code = generate_verification_code()
        expires_at = timezone.now() + timedelta(minutes=15)
        
        # Step 4: Save verification code
        EmailVerification.objects.create(
            user=user,
            code=code,
            expires_at=expires_at
        )
        
        # Step 5: Send email
        send_verification_email(user.email, code)
        
        # Step 6: Return response
        return Response({
            'message': 'Registration successful. Please check your email for verification code.',
            'email': user.email,
            'user_id': str(user.user_id)
        }, status=status.HTTP_201_CREATED)
    
    # If validation failed, return errors
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    #Verify email with code

    serializer = VerifyEmailSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    code = serializer.validated_data['code']
    
    # Step 1: Find user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Step 2: Check if already verified
    if user.is_verified:
        return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
    
    # Step 3: Find verification code
    try:
        verification = EmailVerification.objects.filter(
            user=user,
            code=code,
            is_used=False
        ).latest('created_at')
    except EmailVerification.DoesNotExist:
        return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Step 4: Check if expired
    if timezone.now() > verification.expires_at:
        return Response({'error': 'Verification code has expired'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Step 5: Mark user as verified
    user.is_verified = True
    user.save()
    
    verification.is_used = True
    verification.save()
    
    # Step 6: Generate JWT tokens
    tokens = get_tokens_for_user(user)
    
    # Step 7: Return user data and tokens
    user_data = UserSerializer(user).data
    
    return Response({
        'message': 'Email verified successfully',
        'tokens': tokens,
        'user': user_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    #Resend verification code

    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Step 1: Find user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Step 2: Check if already verified
    if user.is_verified:
        return Response({'error': 'Email already verified'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Step 3: Generate new code
    code = generate_verification_code()
    expires_at = timezone.now() + timedelta(minutes=15)
    
    # Step 4: Save new code
    EmailVerification.objects.create(
        user=user,
        code=code,
        expires_at=expires_at
    )
    
    # Step 5: Send email
    send_verification_email(user.email, code)
    
    return Response({
        'message': 'Verification code sent successfully'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
   # Login user

    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    # Authenticate user
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check if verified
    if not user.is_verified:
        return Response({
            'error': 'Please verify your email first',
            'email': email
        }, status=status.HTTP_403_FORBIDDEN)
    # Check if suspended
    if user.is_suspended:
        active_suspension = user.suspensions.filter(
            is_active=True,
            expires_at__gt=timezone.now()
        ).first()
        
        if active_suspension:
            days_remaining = (active_suspension.expires_at - timezone.now()).days
            return Response({
                'error': 'Account suspended',
                'reason': active_suspension.reason,
                'days_remaining': max(1, days_remaining),
                'expires_at': active_suspension.expires_at.isoformat()
            }, status=status.HTTP_403_FORBIDDEN)
        else:
            # Suspension expired, unsuspend user
            user.is_suspended = False
            user.save()

    # Generate tokens
    tokens = get_tokens_for_user(user)
    
    # Get user data
    user_data = UserSerializer(user).data
    
    return Response({
        'message': 'Login successful',
        'tokens': tokens,
        'user': user_data
    }, status=status.HTTP_200_OK)


# Profile Management Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Get current user's profile"""
    try:
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update current user's profile"""
    try:
        user = request.user
        profile = user.profile
        
        # Update profile fields
        profile_data = request.data.get('profile', {})
        
        if 'full_name' in profile_data:
            profile.full_name = profile_data['full_name']
        if 'bio' in profile_data:
            profile.bio = profile_data['bio']
        if 'university_name' in profile_data:
            profile.university_name = profile_data['university_name']
        if 'course' in profile_data:
            profile.course = profile_data['course']
        if 'year' in profile_data:
            profile.year = profile_data['year']
        if 'interests' in profile_data:
            profile.interests = profile_data['interests']
        if 'projects' in profile_data:
            profile.projects = profile_data['projects']
        
        profile.save()
        
        serializer = UserSerializer(user)
        return Response(
            {
                'message': 'Profile updated successfully',
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """Upload profile picture to Cloudinary"""
    try:        
        if 'profile_picture' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile = request.user.profile
        profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        
        serializer = UserSerializer(request.user)
        return Response(
            {
                'message': 'Profile picture uploaded successfully',
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """Get user statistics"""
    try:
        from authentication.models import ConnectionRequest
        
        connections_count = ConnectionRequest.objects.filter(
            (models.Q(from_user=request.user) | models.Q(to_user=request.user)),
            status='accepted'
        ).count()
        stats = {
            'connections': connections_count,
            'messages': 0,
            'match_rate': 0,
            'projects_completed': 0,
            'study_hours': 0
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_activity_timeline(request):
    """Get user's activity timeline"""
    try:
        
        activities = Activity.objects.filter(user=request.user)[:10]
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
 # Study Goals 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_study_goals(request):
    """Get all study goals for current user"""
    try:
        goals = StudyGoal.objects.filter(user=request.user)
        serializer = StudyGoalSerializer(goals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_study_goal(request):
    """Create a new study goal"""
    try:
        title = request.data.get('title')
        
        if not title:
            return Response(
                {'error': 'Title is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        goal = StudyGoal.objects.create(
            user=request.user,
            title=title
        )
        
        # Create activity
        Activity.objects.create(
            user=request.user,
            activity_type='goal',
            action='Created a new study goal',
            description=title
        )
        
        serializer = StudyGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_study_goal(request, goal_id):
    """Update a study goal"""
    try:
        goal = StudyGoal.objects.get(goal_id=goal_id, user=request.user)
        
        if 'title' in request.data:
            goal.title = request.data['title']
        
        goal.save()
        serializer = StudyGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except StudyGoal.DoesNotExist:
        return Response(
            {'error': 'Study goal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_study_goal(request, goal_id):
    """Delete a study goal"""
    try:
        goal = StudyGoal.objects.get(goal_id=goal_id, user=request.user)
        goal.delete()
        
        return Response(
            {'message': 'Study goal deleted successfully'},
            status=status.HTTP_200_OK
        )
        
    except StudyGoal.DoesNotExist:
        return Response(
            {'error': 'Study goal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_study_goal(request, goal_id):
    """Toggle study goal completion status"""
    try:
        goal = StudyGoal.objects.get(goal_id=goal_id, user=request.user)
        
        goal.is_completed = not goal.is_completed
        if goal.is_completed:
            goal.completed_at = timezone.now()
            # Create activity
            Activity.objects.create(
                user=request.user,
                activity_type='goal',
                action='Completed a study goal',
                description=goal.title
            )
        else:
            goal.completed_at = None
        
        goal.save()
        serializer = StudyGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except StudyGoal.DoesNotExist:
        return Response(
            {'error': 'Study goal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Password Reset Views
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Send password reset code to email"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not (security)
            return Response(
                {'message': 'If the email exists, a reset code has been sent'},
                status=status.HTTP_200_OK
            )
        
        # Generate reset code
        from .models import PasswordReset
        code = generate_verification_code()
        expires_at = timezone.now() + timedelta(minutes=15)
        
        # Save reset code
        PasswordReset.objects.create(
            user=user,
            code=code,
            expires_at=expires_at
        )
        
        # Send email
        from django.core.mail import send_mail
        from django.conf import settings
        
        subject = 'Password Reset Code - StudyMatch'
        message = f'''
Hello,

You requested to reset your password for StudyMatch.

Your password reset code is: {code}

This code will expire in 15 minutes.

If you didn't request this, please ignore this email.

Best regards,
StudyMatch Team
        '''
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending email: {e}")
        
        return Response(
            {'message': 'If the email exists, a reset code has been sent'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    """Verify password reset code"""
    try:
        from .models import PasswordReset
        
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response(
                {'error': 'Email and code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find reset code
        try:
            reset = PasswordReset.objects.filter(
                user=user,
                code=code,
                is_used=False
            ).latest('created_at')
        except PasswordReset.DoesNotExist:
            return Response(
                {'error': 'Invalid code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if expired
        if timezone.now() > reset.expires_at:
            return Response(
                {'error': 'Code has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            {'message': 'Code verified successfully'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with verified code"""
    try:
        from .models import PasswordReset
        
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('password')
        
        if not email or not code or not new_password:
            return Response(
                {'error': 'Email, code, and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password length
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find reset code
        try:
            reset = PasswordReset.objects.filter(
                user=user,
                code=code,
                is_used=False
            ).latest('created_at')
        except PasswordReset.DoesNotExist:
            return Response(
                {'error': 'Invalid code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if expired
        if timezone.now() > reset.expires_at:
            return Response(
                {'error': 'Code has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset password
        user.set_password(new_password)
        user.save()
        
        # Mark code as used
        reset.is_used = True
        reset.save()
        
        return Response(
            {'message': 'Password reset successfully'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
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
    
# Discovery Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discovery_users(request):
    """Get all users for discovery page with search and filters"""
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        course = request.GET.get('course', '')
        year = request.GET.get('year', '')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        # Get current user's university
        try:
            current_user_university = request.user.profile.university_name
        except:
            current_user_university = None
        users = User.objects.filter(
            is_verified=True,
            is_suspended=False,
            role='student',
            is_active=True,
            profile__university_name=current_user_university  
        ).exclude(
            user_id=request.user.user_id
        ).select_related('profile')
        
        # Apply search filter
        if search:
            users = users.filter(
                Q(profile__full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(profile__interests__icontains=search) |
                Q(profile__bio__icontains=search)
            )
        
        # Apply course filter
        if course:
            users = users.filter(profile__course__icontains=course)
        
        # Apply year filter
        if year:
            users = users.filter(profile__year__icontains=year)
        
        all_profiles = Profile.objects.filter(
            user__is_verified=True,
            user__is_suspended=False,
            user__role='student',
            university_name=current_user_university  
        ).exclude(user=request.user)
        
        available_courses = list(all_profiles.exclude(course='').values_list('course', flat=True).distinct().order_by('course'))
        available_years = list(all_profiles.exclude(year='').values_list('year', flat=True).distinct().order_by('year'))
        
        total_users = users.count()
        
        start = (page - 1) * per_page
        end = start + per_page
        paginated_users = users[start:end]
        
        serializer = DiscoveryUserSerializer(paginated_users, many=True, context={'request': request})
        
        return Response({
            'users': serializer.data,
            'pagination': {
                'total': total_users,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_users + per_page - 1) // per_page
            },
            'filters': {
                'available_courses': available_courses,
                'available_years': available_years
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discovery_user_detail(request, user_id):
    """Get detailed view of a specific user"""
    try:
        user = User.objects.get(
            user_id=user_id,
            is_verified=True,
            is_suspended=False,
            role='student',
            is_active=True
        )
        
        if user == request.user:
            return Response(
                {'error': 'Cannot view own profile through discovery'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DiscoveryUserSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
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