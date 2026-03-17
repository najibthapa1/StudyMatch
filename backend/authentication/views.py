from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, EmailVerification
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, VerifyEmailSerializer
from .utils import generate_verification_code, send_verification_email
from user_profile.models import Profile 
from django.conf import settings as django_settings
OTP_MINUTES = getattr(django_settings, 'OTP_EXPIRY_MINUTES', 10)

# Generate JWT tokens for user
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@extend_schema(request=RegisterSerializer)
@api_view(['POST'])
@permission_classes([AllowAny]) 
def register(request):

    #Register a new user

    # Validate data
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        # Create user and profile
        user = serializer.save()
        
        if 'profile_picture' in request.FILES:
            user.profile.profile_picture = request.FILES['profile_picture']
            user.profile.save()
            
        # Generate verification code
        code = generate_verification_code()
        expires_at = timezone.now() + timedelta(minutes=OTP_MINUTES)
        
        # Save verification code
        EmailVerification.objects.create(
            user=user,
            code=code,
            expires_at=expires_at
        )
        
        # Send email
        send_verification_email(user.email, code)
        
        # Return response
        return Response({
            'message': 'Registration successful. Please check your email for verification code.',
            'email': user.email,
            'user_id': str(user.user_id)
        }, status=status.HTTP_201_CREATED)
    
    # If validation failed, return errors
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
@permission_classes([AllowAny])
def check_email(request):
    """Check if an email is already registered without creating any user."""
    email = request.data.get('email', '').strip().lower()
 
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
 
    from django.conf import settings
    allowed_domains = getattr(settings, 'ALLOWED_EMAIL_DOMAINS', ['islingtoncollege.edu.np'])
    if not any(email.endswith(f'@{domain}') for domain in allowed_domains):
        return Response({'available': False, 'error': 'Email domain not allowed'}, status=status.HTTP_400_BAD_REQUEST)
 
    exists = User.objects.filter(email=email).exists()
    return Response({'available': not exists}, status=status.HTTP_200_OK)

@extend_schema(request=VerifyEmailSerializer)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    #Verify email with code

    serializer = VerifyEmailSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    code = serializer.validated_data['code']
    
    # Find user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already verified
    if user.is_verified:
        return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
    
    # Find verification code
    try:
        verification = EmailVerification.objects.filter(
            user=user,
            code=code,
            is_used=False
        ).latest('created_at')
    except EmailVerification.DoesNotExist:
        return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if expired
    if timezone.now() > verification.expires_at:
        return Response({'error': 'Verification code has expired'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mark user as verified
    user.is_verified = True
    user.save()
    
    verification.is_used = True
    verification.save()
    
    # Generate JWT tokens
    tokens = get_tokens_for_user(user)
    
    # Return user data and tokens
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
    
    # Find user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already verified
    if user.is_verified:
        return Response({'error': 'Email already verified'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new code
    code = generate_verification_code()
    expires_at = timezone.now() + timedelta(minutes=OTP_MINUTES)
    
    # Save new code
    EmailVerification.objects.create(
        user=user,
        code=code,
        expires_at=expires_at
    )
    
    # Send email
    send_verification_email(user.email, code)
    
    return Response({
        'message': 'Verification code sent successfully'
    }, status=status.HTTP_200_OK)

@extend_schema(request=LoginSerializer)
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
        expires_at = timezone.now() + timedelta(minutes=OTP_MINUTES)
        
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

This code will expire in {getattr(django_settings, 'OTP_EXPIRY_MINUTES', 10)} minutes.

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
    

