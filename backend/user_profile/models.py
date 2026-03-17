from django.db import models
from django.utils import timezone
from authentication.models import User
from cloudinary_storage.storage import MediaCloudinaryStorage

import uuid
    
# Profile table 
class Profile(models.Model):
    profile_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    university_name = models.CharField(max_length=255)
    course = models.CharField(max_length=255, blank=True)
    year = models.CharField(max_length=50, blank=True)
    interests = models.TextField(blank=True)  
    projects = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', storage=MediaCloudinaryStorage(),blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.full_name
    
    def get_initials(self):
        """Get user initials for avatar"""
        names = self.full_name.split()
        if len(names) >= 2:
            return f"{names[0][0]}{names[1][0]}".upper()
        elif len(names) == 1:
            return names[0][:2].upper()
        return "U"


# Study Goals Model
class StudyGoal(models.Model):
    goal_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_goals')
    title = models.CharField(max_length=500)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"

# Activity Tracking Model
class Activity(models.Model):
    ACTIVITY_TYPES = [
        ('connection', 'Connection'),
        ('message', 'Message'),
        ('event', 'Event'),
        ('match', 'Match'),
        ('goal', 'Study Goal'),
    ]
    
    activity_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    action = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Activities'
    
    def __str__(self):
        return f"{self.user.email} - {self.action}"
    
    def get_time_ago(self):
        """Get human-readable time difference"""
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
        

