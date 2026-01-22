from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, EmailVerification
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, VerifyEmailSerializer
from .utils import generate_verification_code, send_verification_email


# Generate JWT tokens for user
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