from rest_framework import serializers
from .models import UserNotification


class UserNotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = UserNotification
        fields = [
            'notification_id', 'notification_type', 'title', 'message',
            'is_read', 'read_at', 'related_event_id', 'related_user_id',
            'sender_name', 'sender_avatar', 'created_at', 'time_ago',
        ]
        read_only_fields = ['notification_id', 'created_at']

    def get_time_ago(self, obj):
        return obj.get_time_ago()

    def get_sender_name(self, obj):
        if obj.sender:
            try:
                return obj.sender.profile.full_name or obj.sender.email
            except Exception:
                return obj.sender.email
        return None

    def get_sender_avatar(self, obj):
        if obj.sender:
            try:
                pic = obj.sender.profile.profile_picture
                if pic:
                    return pic.url
            except Exception:
                pass
        return None