from rest_framework import serializers
from .models import User, EmailVerification, PasswordReset
from user_profile.models import Profile
from django.db import models
from django.utils import timezone

class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    university = serializers.CharField(max_length=255)
    major = serializers.CharField(max_length=255, required=False, allow_blank=True)
    year = serializers.CharField(max_length=50, required=False, allow_blank=True)
    interests = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    projects = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        # Check email domain
        if not value.endswith('@islingtoncollege.edu.np'):
            raise serializers.ValidationError('Only Islington College emails are allowed')
        
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already registered')
        
        return value

    def create(self, validated_data):
        # Extract profile data
        name = validated_data.pop('name')
        university = validated_data.pop('university')
        major = validated_data.pop('major', '')
        year = validated_data.pop('year', '')
        interests = validated_data.pop('interests', '')
        bio = validated_data.pop('bio', '')
        projects = validated_data.pop('projects', '')
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Create profile
        Profile.objects.create(
            user=user,
            full_name=name,
            university_name=university,
            course=major,
            year=year,
            interests=interests,
            bio=bio,
            projects=projects
        )
        
        return user

#For returning user data
class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['user_id', 'email', 'role', 'is_verified', 'created_at', 'profile']
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'profile_id': str(profile.profile_id),
                'full_name': profile.full_name,
                'bio': profile.bio,
                'university_name': profile.university_name,
                'course': profile.course,
                'year': profile.year,
                'interests': profile.interests,
                'projects': profile.projects,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
                'created_at': profile.created_at,
                'updated_at': profile.updated_at,
            }
        except:
            return None
        
#For login
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# For email verification
class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)




