from rest_framework import serializers
from django.utils import timezone
from .models import UserSuspension, AdminNotification
from authentication.models import User
from user_profile.models import Profile
from guild.models import Guild, Event
    
# Admin Dashboard Stats Serializer
class AdminDashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    verified_users = serializers.IntegerField()
    unverified_users = serializers.IntegerField()
    total_profiles = serializers.IntegerField()
    recent_signups = serializers.ListField()
    users_by_role = serializers.DictField()

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
        fields = ['user_id', 'email', 'role', 'is_verified', 'is_suspended', 
                  'is_active', 'created_at', 'profile', 'active_suspension']
    
    def get_profile(self, obj):
        try:
            p = obj.profile
            return {
                'profile_id': str(p.profile_id),
                'full_name': p.full_name,
                'bio': p.bio,
                'university_name': p.university_name,
                'course': p.course,
                'year': p.year,
                'interests': p.interests,
                'profile_picture': p.profile_picture.url if p.profile_picture else None,
                'initials': p.get_initials(),
            }
        except Profile.DoesNotExist:
            return None
    
    def get_active_suspension(self, obj):
        if not obj.is_suspended:
            return None
        suspension = obj.suspensions.filter(
            is_active=True, expires_at__gt=timezone.now()
        ).first()
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