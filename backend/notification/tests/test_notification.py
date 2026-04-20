from django.test import TestCase
from django.utils import timezone
from authentication.models import User
from notification.models import UserNotification


class TestNotificationModel(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@islingtoncollege.edu.np',
            password='Pass123'
        )
    
    def test_create_notification(self):
        notification = UserNotification.objects.create(
            recipient=self.user,
            title="New Connection Request",
            message="User wants to connect",
            notification_type='connection_request'
        )
        
        self.assertEqual(notification.title, "New Connection Request")
        self.assertFalse(notification.is_read)
    
    def test_mark_notification_read(self):
        notification = UserNotification.objects.create(
            recipient=self.user,
            title="New Message",
            message="You have a new message",
            notification_type='general'
        )
        
        before = timezone.now()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        after = timezone.now()
        
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)
        self.assertGreaterEqual(notification.read_at, before)
        self.assertLessEqual(notification.read_at, after)
    
    def test_notification_types_valid(self):
        types = ['connection_request', 'event_created', 'event_updated', 'general']
        
        for notif_type in types:
            notification = UserNotification.objects.create(
                recipient=self.user,
                title=f"Test {notif_type}",
                message="Test message",
                notification_type=notif_type
            )
            self.assertEqual(notification.notification_type, notif_type)
