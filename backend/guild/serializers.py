from rest_framework import serializers
from django.utils import timezone
from .models import Guild, Event, EventParticipant, EventPhoto


class EventPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    uploaded_by_avatar = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = EventPhoto
        fields = [
            'photo_id', 'event', 'uploaded_by', 'uploaded_by_name',
            'uploaded_by_avatar', 'photo', 'photo_url', 'caption', 'created_at'
        ]
        read_only_fields = ['photo_id', 'uploaded_by', 'created_at']

    def get_uploaded_by_name(self, obj):
        try:
            return obj.uploaded_by.profile.full_name
        except Exception:
            return obj.uploaded_by.email

    def get_uploaded_by_avatar(self, obj):
        try:
            pic = obj.uploaded_by.profile.profile_picture
            if pic:
                return pic.url
        except Exception:
            pass
        return None

    def get_photo_url(self, obj):
        if obj.photo:
            return obj.photo.url
        return None


class GuildSerializer(serializers.ModelSerializer):
    event_count = serializers.SerializerMethodField()

    class Meta:
        model = Guild
        fields = ['guild_id', 'name', 'description', 'member_count', 'event_count', 'created_at', 'updated_at']
        read_only_fields = ['guild_id', 'member_count', 'created_at', 'updated_at']

    def get_event_count(self, obj):
        return obj.events.count()


class EventSerializer(serializers.ModelSerializer):
    guild_name = serializers.CharField(source='guild.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    pre_joined_users = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    is_ended = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'event_id', 'guild', 'guild_name', 'title', 'description',
            'category', 'date', 'time_start', 'time_end', 'venue',
            'created_by', 'created_by_name', 'status', 'pre_joined_count',
            'attendee_count', 'pre_joined_users', 'is_expired', 'is_ended',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['event_id', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by and hasattr(obj.created_by, 'profile'):
            return obj.created_by.profile.full_name
        return 'Unknown'

    def get_is_expired(self, obj):
        try:
            from datetime import date as date_type
            event_date = obj.date if isinstance(obj.date, date_type) else obj.date
            return event_date < timezone.now().date()
        except (TypeError, AttributeError):
            return False
    
    def get_is_ended(self, obj):
        try:
            return obj.is_event_ended()
        except (TypeError, AttributeError):
            return False

    def get_pre_joined_users(self, obj):
        if obj.status == 'pending':
            participants = obj.participants.filter(is_confirmed=False)[:5]
            return [
                {
                    'name': p.user.profile.full_name if hasattr(p.user, 'profile') else p.user.email,
                    'email': p.user.email
                }
                for p in participants
            ]
        return []