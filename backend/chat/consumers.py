import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.db.models import Q


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection with JWT authentication."""
        # Authenticate user from JWT token (your approach)
        user = await self._get_user_from_token()
        if user is None:
            await self.close(code=4001)  
            return

        self.user = user
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.group_name = f'chat_{self.conversation_id}'

        # Verify user is a participant 
        is_participant = await self._check_participant()
        if not is_participant:
            await self.close(code=4003)  # Forbidden
            return

        # Join WebSocket group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Auto-mark messages as read
        await self._mark_messages_read()
        
        # Notify other users that messages were read
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'message_read',
                'conversation_id': str(self.conversation_id),
                'user_id': str(self.user.user_id)
            }
        )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            # Handle typing indicator (my approach)
            if message_type == 'typing_indicator':
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'typing_indicator',
                        'user_id': str(self.user.user_id),
                        'user_name': await self._get_sender_name(),
                        'is_typing': data.get('is_typing', False)
                    }
                )
                return

            content = data.get('content', '').strip()
            if not content:
                return

            # Save message to database
            message = await self._save_message(content)

            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'message_id': str(message.message_id),
                        'content': message.content,
                        'sender_id': str(self.user.user_id),
                        'sender_name': await self._get_sender_name(),
                        'sender_avatar': await self._get_sender_avatar(),
                        'created_at': message.created_at.isoformat(),
                        'is_read': False,
                        'is_deleted': False,
                    }
                }
            )

        except (json.JSONDecodeError, Exception) as e:
            pass

    
    async def chat_message(self, event):
        """Send new message to WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def message_deleted(self, event):
        """Send message deletion notification."""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id']
        }))

    async def typing_indicator(self, event):
        """Send typing indicator."""
        # Don't send to the user who is typing
        if str(self.user.user_id) != event['user_id']:
            await self.send(text_data=json.dumps({
                'type': 'typing_indicator',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'is_typing': event['is_typing']
            }))

    async def message_read(self, event):
        """Send read receipt notification."""
        await self.send(text_data=json.dumps({
            'type': 'message_read',
            'conversation_id': event['conversation_id']
        }))


    @database_sync_to_async
    def _get_user_from_token(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from authentication.models import User

        query_string = self.scope.get('query_string', b'').decode()
        params = dict(p.split('=') for p in query_string.split('&') if '=' in p)
        token_str = params.get('token')

        if not token_str:
            return None

        try:
            token = AccessToken(token_str)
            user_id = token['user_id']
            user = User.objects.get(
                user_id=user_id,
                is_active=True,
                is_verified=True  
            )
            return user
        except Exception:
            return None

    @database_sync_to_async
    def _check_participant(self):
        from chat.models import Conversation

        return Conversation.objects.filter(
            conversation_id=self.conversation_id
        ).filter(
            Q(participant_one=self.user) | Q(participant_two=self.user)
        ).exists()

    @database_sync_to_async
    def _save_message(self, content):
        """Save message to database ."""
        from chat.models import Conversation, Message

        conversation = Conversation.objects.get(conversation_id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )
        
        Conversation.objects.filter(
            conversation_id=self.conversation_id
        ).update(updated_at=timezone.now())
        
        return message

    @database_sync_to_async
    def _mark_messages_read(self):
        """Auto-mark messages as read on connection."""
        from chat.models import Message

        Message.objects.filter(
            conversation_id=self.conversation_id,
            is_read=False,
        ).exclude(
            sender=self.user
        ).update(
            is_read=True,
            read_at=timezone.now()
        )

    @database_sync_to_async
    def _get_sender_name(self):
        """Get sender's full name."""
        try:
            return self.user.profile.full_name
        except Exception:
            return self.user.email

    @database_sync_to_async
    def _get_sender_avatar(self):
        """Get sender's profile picture URL."""
        try:
            pic = self.user.profile.profile_picture
            if pic:
                return pic.url
        except Exception:
            pass
        return None