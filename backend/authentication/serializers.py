from rest_framework import serializers
from .models import User, Profile, StudyGoal, Activity, Guild, Event, EventParticipant, UserSuspension, AdminNotification, ConnectionRequest
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

# Study Goal Serializer
class StudyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyGoal
        fields = [
            'goal_id',
            'title',
            'is_completed',
            'created_at',
            'updated_at',
            'completed_at'
        ]
        read_only_fields = ['goal_id', 'created_at', 'updated_at']

# Activity Serializer
class ActivitySerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Activity
        fields = [
            'activity_id',
            'activity_type',
            'action',
            'description',
            'created_at',
            'time_ago'
        ]
    
    def get_time_ago(self, obj):
        return obj.get_time_ago()
    
# Admin Dashboard Stats Serializer
class AdminDashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    verified_users = serializers.IntegerField()
    unverified_users = serializers.IntegerField()
    total_profiles = serializers.IntegerField()
    recent_signups = serializers.ListField()
    users_by_role = serializers.DictField()

# Guild Serializer
class GuildSerializer(serializers.ModelSerializer):
    event_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Guild
        fields = ['guild_id', 'name', 'description', 'member_count', 'event_count', 'created_at', 'updated_at']
        read_only_fields = ['guild_id', 'member_count', 'created_at', 'updated_at']
    
    def get_event_count(self, obj):
        return obj.events.count()

# Event Serializer
class EventSerializer(serializers.ModelSerializer):
    guild_name = serializers.CharField(source='guild.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    pre_joined_users = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ['event_id', 'guild', 'guild_name', 'title', 'description', 'category', 'date', 'time_start', 'time_end', 'venue', 'created_by', 'created_by_name', 'status', 'pre_joined_count', 'attendee_count', 'pre_joined_users', 'created_at', 'updated_at']
        read_only_fields = ['event_id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by and hasattr(obj.created_by, 'profile'):
            return obj.created_by.profile.full_name
        return 'Unknown'
    
    def get_pre_joined_users(self, obj):
        if obj.status == 'pending':
            participants = obj.participants.filter(is_confirmed=False)[:5]
            return [{'name': p.user.profile.full_name if hasattr(p.user, 'profile') else p.user.email, 'email': p.user.email} for p in participants]
        return []

# User Suspension Serializer
class UserSuspensionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    suspended_by_email = serializers.CharField(source='suspended_by.email', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSuspension
        fields = ['suspension_id', 'user', 'user_email', 'suspended_by', 'suspended_by_email', 'reason', 'duration_days', 'suspended_at', 'expires_at', 'is_active', 'days_remaining']
        read_only_fields = ['suspension_id', 'suspended_at', 'expires_at']
    
    def get_days_remaining(self, obj):
        if obj.is_active and not obj.is_expired():
            remaining = obj.expires_at - timezone.now()
            return max(0, remaining.days)
        return 0

# Admin Notification Serializer
class AdminNotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminNotification
        fields = ['notification_id', 'notification_type', 'title', 'description', 'is_read', 'created_at', 'time_ago']
        read_only_fields = ['notification_id', 'created_at']
    
    def get_time_ago(self, obj):
        return obj.get_time_ago()


class AdminUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    active_suspension = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['user_id', 'email', 'role', 'is_verified', 'is_suspended', 'is_active', 'created_at', 'profile', 'active_suspension']
    
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
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
            }
        except:
            return None
    
    def get_active_suspension(self, obj):
        if obj.is_suspended:
            suspension = obj.suspensions.filter(is_active=True, expires_at__gt=timezone.now()).first()
            if suspension:
                return UserSuspensionSerializer(suspension).data
        return None

class AdminUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    active_suspension = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'user_id',
            'email',
            'role',
            'is_verified',
            'is_suspended',
            'is_active',
            'created_at',
            'profile',
            'active_suspension'
        ]
    
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
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
            }
        except:
            return None
    
    def get_active_suspension(self, obj):
        if obj.is_suspended:
            suspension = obj.suspensions.filter(is_active=True, expires_at__gt=timezone.now()).first()
            if suspension:
                return UserSuspensionSerializer(suspension).data
        return None


# Analytics Serializers
class UserGrowthSerializer(serializers.Serializer):
    month = serializers.CharField()
    users = serializers.IntegerField()


class EventStatsSerializer(serializers.Serializer):
    month = serializers.CharField()
    confirmed = serializers.IntegerField()
    pending = serializers.IntegerField()


class GuildStatsSerializer(serializers.Serializer):
    name = serializers.CharField()
    members = serializers.IntegerField()
    events = serializers.IntegerField()

# Discovery User Serializer
class DiscoveryUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    is_connected = serializers.SerializerMethodField()
    connection_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['user_id', 'profile', 'is_connected', 'connection_status']
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'full_name': profile.full_name,
                'bio': profile.bio,
                'university_name': profile.university_name,
                'course': profile.course,
                'year': profile.year,
                'interests': profile.interests,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
            }
        except:
            return None
    
    def get_is_connected(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        
        from authentication.models import ConnectionRequest
        # Check if connected (both directions)
        return ConnectionRequest.objects.filter(
            (models.Q(from_user=request.user, to_user=obj) | models.Q(from_user=obj, to_user=request.user)),
            status='accepted'
        ).exists()
    
    def get_connection_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        from authentication.models import ConnectionRequest
        # Check if there's a pending request
        conn_request = ConnectionRequest.objects.filter(
            models.Q(from_user=request.user, to_user=obj) | 
            models.Q(from_user=obj, to_user=request.user)
        ).first()
        
        if conn_request:
            if conn_request.status == 'accepted':
                return 'accepted'
            elif conn_request.from_user == request.user:
                return 'pending_sent'
            else:
                return 'pending_received'
        return None


# Connection Request Serializer
class ConnectionRequestSerializer(serializers.ModelSerializer):
    from_user_profile = serializers.SerializerMethodField()
    to_user_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = ConnectionRequest
        fields = ['request_id', 'from_user', 'to_user', 'from_user_profile', 'to_user_profile', 'status', 'created_at']
        read_only_fields = ['request_id', 'created_at']
    
    def get_from_user_profile(self, obj):
        try:
            profile = obj.from_user.profile
            return {
                'full_name': profile.full_name,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
            }
        except:
            return None
    
    def get_to_user_profile(self, obj):
        try:
            profile = obj.to_user.profile
            return {
                'full_name': profile.full_name,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
            }
        except:
            return None