from rest_framework import serializers
from .models import Guild, Event, EventParticipant

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
