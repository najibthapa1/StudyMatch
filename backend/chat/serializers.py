from rest_framework import serializers
from .models import Conversation, Message
from authentication.models import User

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_id = serializers.UUIDField(source='sender.user_id', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    time_ago = serializers.CharField(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'message_id', 'conversation', 'sender', 'sender_id', 'sender_name','sender_avatar', 'content', 'file_attachment', 'file_name',
            'file_type', 'file_url', 'is_read', 'read_at', 'is_deleted','deleted_at', 'created_at', 'updated_at', 'time_ago'
        ]
        read_only_fields = ['message_id', 'sender', 'created_at', 'updated_at']

    def get_sender_avatar(self, obj):
        if obj.sender.profile_picture:
            return obj.sender.profile_picture.url
        return None

    def get_file_url(self, obj):
        if obj.file_attachment:
            return obj.file_attachment.url
        return None
    
class ConversationListSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'conversation_id', 'other_user', 'last_message','unread_count', 'created_at', 'updated_at'
        ]

    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return {
                    'user_id': str(other_user.user_id),
                    'name': other_user.get_full_name(),
                    'email': other_user.email,
                    'avatar': other_user.profile_picture.url if other_user.profile_picture else None,
                    'is_online': True  
                }
        return None

    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return {
                'message_id': str(last_msg.message_id),
                'content': last_msg.content[:50] if not last_msg.is_deleted else "Message deleted",
                'sender_id': str(last_msg.sender.user_id),
                'time_ago': last_msg.get_time_ago(),
                'is_deleted': last_msg.is_deleted,
                'created_at': last_msg.created_at.isoformat()
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.unread_count_for(request.user)
        return 0