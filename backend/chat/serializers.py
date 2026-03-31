from rest_framework import serializers
from .models import Conversation, Message
from authentication.models import User


def get_user_display_name(user):
    """Get user's full name from their profile, fallback to email."""
    try:
        return user.profile.full_name or user.email
    except Exception:
        return user.email


def get_user_avatar(user):
    """Get user's profile picture URL."""
    try:
        if user.profile.profile_picture:
            return user.profile.profile_picture.url
    except Exception:
        pass
    return None


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_id = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    message_id = serializers.SerializerMethodField()
    conversation = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    read_at = serializers.SerializerMethodField()
    deleted_at = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'message_id', 'conversation', 'sender_id', 'sender_name',
            'sender_avatar', 'content', 'file_attachment', 'file_name',
            'file_type', 'file_url', 'is_read', 'read_at', 'is_deleted',
            'deleted_at', 'created_at', 'updated_at', 'time_ago'
        ]

    def get_message_id(self, obj):
        return str(obj.message_id)

    def get_conversation(self, obj):
        return str(obj.conversation.conversation_id)

    def get_sender_id(self, obj):
        return str(obj.sender.user_id)

    def get_sender_name(self, obj):
        return get_user_display_name(obj.sender)

    def get_sender_avatar(self, obj):
        return get_user_avatar(obj.sender)

    def get_created_at(self, obj):
        return obj.created_at.isoformat() if obj.created_at else None

    def get_updated_at(self, obj):
        return obj.updated_at.isoformat() if obj.updated_at else None

    def get_read_at(self, obj):
        return obj.read_at.isoformat() if obj.read_at else None

    def get_deleted_at(self, obj):
        return obj.deleted_at.isoformat() if obj.deleted_at else None

    def get_time_ago(self, obj):
        return obj.get_time_ago()

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
            'conversation_id', 'other_user', 'last_message',
            'unread_count', 'created_at', 'updated_at'
        ]

    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return {
                    'user_id': str(other_user.user_id),
                    'name': get_user_display_name(other_user),
                    'email': other_user.email,
                    'avatar': get_user_avatar(other_user),
                    'is_online': False  # Extend with real presence later
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


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    participants = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'conversation_id', 'participant_one', 'participant_two',
            'participants', 'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['participant_one', 'participant_two']

    def get_participants(self, obj):
        return [
            {
                'user_id': str(obj.participant_one.user_id),
                'name': get_user_display_name(obj.participant_one),
                'email': obj.participant_one.email,
                'avatar': get_user_avatar(obj.participant_one)
            },
            {
                'user_id': str(obj.participant_two.user_id),
                'name': get_user_display_name(obj.participant_two),
                'email': obj.participant_two.email,
                'avatar': get_user_avatar(obj.participant_two)
            }
        ]