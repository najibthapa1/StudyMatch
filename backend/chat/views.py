from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from authentication.models import User
from connection.models import ConnectionRequest
from .models import Conversation, Message
from .serializers import ConversationListSerializer, MessageSerializer, ConversationDetailSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_or_get_conversation(request):
    """
    Create or get existing conversation with another user 
    """
    other_user_id = request.data.get('user_id')
    
    if not other_user_id:
        return Response(
            {'error': 'user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        other_user = User.objects.get(user_id=other_user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if other_user == request.user:
        return Response(
            {'error': 'Cannot create conversation with yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user1, user2 = sorted([request.user, other_user], key=lambda u: u.user_id)
    
    conversation, created = Conversation.objects.get_or_create(
        participant_one=user1,
        participant_two=user2
    )
    
    serializer = ConversationDetailSerializer(conversation, context={'request': request})
    return Response(
        serializer.data, 
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


# List all conversations for current user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    conversations = Conversation.objects.filter(
        Q(participant_one=request.user) | Q(participant_two=request.user)
    ).select_related('participant_one', 'participant_two').prefetch_related('messages').distinct()
    
    serializer = ConversationListSerializer(
        conversations,
        many=True,
        context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


# Get conversation messages
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_messages(request, conversation_id):
    """Get all messages in a conversation."""
    conversation = get_object_or_404(Conversation, conversation_id=conversation_id)
    
    # Check if user is a participant
    if conversation.participant_one != request.user and conversation.participant_two != request.user:
        return Response(
            {'error': 'You are not a participant in this conversation'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    messages = conversation.messages.filter(is_deleted=False).order_by('created_at')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# Send message with WebSocket broadcast
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    conversation = get_object_or_404(Conversation, conversation_id=conversation_id)
    
    # Check if user is a participant
    if conversation.participant_one != request.user and conversation.participant_two != request.user:
        return Response(
            {'error': 'You are not a participant in this conversation'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    content = request.data.get('content', '')
    file_attachment = request.FILES.get('file_attachment')
    
    if not content and not file_attachment:
        return Response(
            {'error': 'Message content or file is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create message
    message = Message.objects.create(
        conversation=conversation,
        sender=request.user,
        content=content
    )
    
    # Handle file attachment
    if file_attachment:
        # Check file size (10MB limit)
        if file_attachment.size > 10 * 1024 * 1024:
            message.delete()
            return Response(
                {'error': 'File size must be less than 10MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message.file_attachment = file_attachment
        message.file_name = file_attachment.name
        message.file_type = file_attachment.content_type
        message.save()
    
    conversation.save()  
    
    serializer = MessageSerializer(message)
    
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{conversation_id}',
        {
            'type': 'chat_message',
            'message': serializer.data
        }
    )
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# Delete message with WebSocket broadcast
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    """Delete a message (soft delete) and broadcast via WebSocket."""
    message = get_object_or_404(Message, message_id=message_id)
    
    # Check if user is the sender
    if message.sender != request.user:
        return Response(
            {'error': 'You can only delete your own messages'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    message.is_deleted = True
    message.deleted_at = timezone.now()
    message.content = "Message deleted"
    message.save()
    
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{message.conversation.conversation_id}',
        {
            'type': 'message_deleted',
            'message_id': str(message_id)
        }
    )
    
    return Response(
        {'message': 'Message deleted successfully'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_as_read(request, conversation_id):
    """Mark all unread messages in a conversation as read."""
    conversation = get_object_or_404(Conversation, conversation_id=conversation_id)
    
    # Check if user is a participant
    if conversation.participant_one != request.user and conversation.participant_two != request.user:
        return Response(
            {'error': 'You are not a participant in this conversation'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Mark all unread messages from the other user as read
    unread_messages = conversation.messages.filter(
        is_read=False
    ).exclude(
        sender=request.user
    )
    
    updated_count = unread_messages.update(
        is_read=True,read_at=timezone.now()
    )
    
    if updated_count > 0:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{conversation_id}',
            {
                'type': 'message_read',
                'conversation_id': str(conversation_id)
            }
        )
    
    return Response(
        {'message': f'{updated_count} messages marked as read'},
        status=status.HTTP_200_OK
    )


# Search messages
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_messages(request, conversation_id):
    """Search messages in a conversation."""
    conversation = get_object_or_404(Conversation, conversation_id=conversation_id)
    
    # Check if user is a participant
    if conversation.participant_one != request.user and conversation.participant_two != request.user:
        return Response(
            {'error': 'You are not a participant in this conversation'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    query = request.query_params.get('q', '')
    
    if not query:
        return Response([], status=status.HTTP_200_OK)
    
    # Search in non-deleted messages
    messages = conversation.messages.filter(
        content__icontains=query,is_deleted=False
    ).order_by('-created_at')
    
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation(request, conversation_id):
    """Get a specific conversation with all details."""
    conversation = get_object_or_404(Conversation, conversation_id=conversation_id)
    
    # Check if user is a participant
    if conversation.participant_one != request.user and conversation.participant_two != request.user:
        return Response(
            {'error': 'You are not a participant in this conversation'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = ConversationDetailSerializer(conversation, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)






