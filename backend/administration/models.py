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
        

class UserReport(models.Model):
    REPORT_REASONS = [
        ('spam', 'Spam or Misleading Content'),
        ('harassment', 'Harassment or Bullying'),
        ('inappropriate', 'Inappropriate Behavior'),
        ('fake', 'Fake Profile or Impersonation'),
        ('scam', 'Scam or Fraud'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    ]

    report_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reported_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reports_filed'
    )
    reported_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reports_received'
    )
    reason = models.CharField(max_length=30, choices=REPORT_REASONS)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reports_reviewed'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return (
            f"{self.reported_by.email} reported {self.reported_user.email} "
            f"for {self.reason}"
        )

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

