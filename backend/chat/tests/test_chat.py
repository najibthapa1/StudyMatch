from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from authentication.models import User
from chat.models import Conversation, Message


class TestConversationModel(TestCase):
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='user1@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@islingtoncollege.edu.np',
            password='Pass123'
        )
    
    def test_conversation_uniqueness_one_pair_only(self):
        u1, u2 = sorted([self.user1, self.user2], key=lambda u: u.user_id)
        conv1, created1 = Conversation.objects.get_or_create(
            participant_one=u1,
            participant_two=u2
        )
        conv2, created2 = Conversation.objects.get_or_create(
            participant_one=u1,
            participant_two=u2
        )
        
        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(conv1.conversation_id, conv2.conversation_id)
    

class TestMessageModel(TestCase):
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='user1@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.conversation = Conversation.objects.create(
            participant_one=self.user1,
            participant_two=self.user2
        )
    
    def test_message_timestamp_auto_set(self):
        before = timezone.now()
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.user1,
            content="Hello"
        )
        after = timezone.now()
        
        self.assertGreaterEqual(message.created_at, before)
        self.assertLessEqual(message.created_at, after)
    
    def test_message_read_status_default_false(self):
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.user1,
            content="Hello"
        )
        
        self.assertIsNone(message.read_at)
    
    def test_soft_delete_message(self):
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.user1,
            content="Hello"
        )
        
        message.is_deleted = True
        message.save()
        
        message.refresh_from_db()
        self.assertTrue(message.is_deleted)


class TestCreateOrGetConversationEndpoint(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            email='user1@islingtoncollege.edu.np',
            password='TestPass123'
        )
        self.user1.is_verified = True
        self.user1.save()
        
        self.user2 = User.objects.create_user(
            email='user2@islingtoncollege.edu.np',
            password='TestPass123'
        )
        self.user2.is_verified = True
        self.user2.save()
        
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_create_conversation_via_api_return_201(self):
        response = self.client.post('/api/chat/conversations/create/', {
            'user_id': str(self.user2.user_id)
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('conversation_id', response.data)
    
    def test_cannot_create_conversation_with_self(self):
        response = self.client.post('/api/chat/conversations/create/', {
            'user_id': str(self.user1.user_id)
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestSendMessageEndpoint(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            email='user1@islingtoncollege.edu.np',
            password='TestPass123'
        )
        self.user1.is_verified = True
        self.user1.save()
        
        self.user2 = User.objects.create_user(
            email='user2@islingtoncollege.edu.np',
            password='TestPass123'
        )
        self.user2.is_verified = True
        self.user2.save()
        
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        u1, u2 = sorted([self.user1, self.user2], key=lambda u: u.user_id)
        self.conversation = Conversation.objects.create(
            participant_one=u1,
            participant_two=u2
        )
    
    def test_non_participant_cannot_send_message(self):
        user3 = User.objects.create_user(
            email='user3@islingtoncollege.edu.np',
            password='TestPass123'
        )
        user3.is_verified = True
        user3.save()
        
        refresh = RefreshToken.for_user(user3)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = client.post(
            f'/api/chat/conversations/{self.conversation.conversation_id}/messages/send/',
            {'content': 'Unauthorized'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
