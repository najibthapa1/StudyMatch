from django.test import TestCase
from authentication.models import User
from connection.models import ConnectionRequest


class TestConnectionRequest(TestCase):
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='user1@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@islingtoncollege.edu.np',
            password='Pass123'
        )
    
    def test_send_connection_request(self):
        request = ConnectionRequest.objects.create(
            from_user=self.user1,
            to_user=self.user2,
            status='pending'
        )
        
        self.assertEqual(request.from_user, self.user1)
        self.assertEqual(request.to_user, self.user2)
        self.assertEqual(request.status, 'pending')
    
    def test_accept_connection_request(self):
        request = ConnectionRequest.objects.create(
            from_user=self.user1,
            to_user=self.user2,
            status='pending'
        )
        
        request.status = 'accepted'
        request.save()
        
        request.refresh_from_db()
        self.assertEqual(request.status, 'accepted')
    
