from django.db import models
from authentication.models import User
from django.utils import timezone
from datetime import timedelta
import uuid

# User Suspension Model
class UserSuspension(models.Model):
    suspension_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suspensions')
    suspended_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='suspensions_issued')
    reason = models.TextField()
    duration_days = models.IntegerField()
    suspended_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-suspended_at']
    
    def __str__(self):
        return f"{self.user.email} - Suspended until {self.expires_at}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=self.duration_days)
        super().save(*args, **kwargs)


# Admin Notification Model
class AdminNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('user', 'User'),
        ('report', 'Report'),
        ('event', 'Event'),
        ('system', 'System'),
    ]
    
    notification_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=500)
    description = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.created_at}"
    
    def get_time_ago(self):
        now = timezone.now()
        diff = now - self.created_at
        
        if diff.days > 0:
            if diff.days == 1:
                return "1 day ago"
            return f"{diff.days} days ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            if hours == 1:
                return "1 hour ago"
            return f"{hours} hours ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            if minutes == 1:
                return "1 minute ago"
            return f"{minutes} minutes ago"
        else:
            return "Just now"
        

