from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count, Q
from .permissions import IsAdminUser

from .models import User, EmailVerification, Activity, StudyGoal, Profile
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, VerifyEmailSerializer, ActivitySerializer, StudyGoalSerializer
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
    
    # Step 1: Authenticate user
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Step 2: Check if verified
    if not user.is_verified:
        return Response({
            'error': 'Please verify your email first',
            'email': email
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Step 3: Generate tokens
    tokens = get_tokens_for_user(user)
    
    # Step 4: Get user data
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
        stats = {
            'connections': 0,
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