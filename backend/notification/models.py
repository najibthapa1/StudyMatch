from django.db import models
from authentication.models import User
import uuid

class UserNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('connection_request', 'Connection Request'),
        ('connection_accepted', 'Connection Accepted'),
        ('event_created', 'Event Created'),
        ('event_updated', 'Event Updated'),
        ('event_deleted', 'Event Deleted'),
        ('event_confirmed', 'Event Confirmed'),
        ('event_reminder', 'Event Reminder'),
        ('report_received', 'Report Received'),
        ('general', 'General'),
    ]

    notification_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications'
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    related_event_id = models.CharField(max_length=100, blank=True)
    related_user_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] → {self.recipient.email}: {self.title}"

    def get_time_ago(self):
        from django.utils import timezone
        now = timezone.now()
        diff = now - self.created_at
        if diff.days >= 7:
            return self.created_at.strftime('%b %d')
        elif diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds >= 3600:
            return f"{diff.seconds // 3600}h ago"
        elif diff.seconds >= 60:
            return f"{diff.seconds // 60}m ago"
        return "just now"