from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from datetime import timedelta
import random
import string
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        #Checks if the email exists
        if not email:
            raise ValueError('Email is required.')
        #Checks if the email is from Islington College domain
        if not extra_fields.get('is_superuser', False):
            if not email.endswith('@islingtoncollege.edu.np'):
                raise ValueError('Only Islington College emails allowed')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', 'admin')
        
        return self.create_user(email, password, **extra_fields)
    
    # User table 
class User(AbstractBaseUser,PermissionsMixin):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, default='student')  
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  
    is_suspended = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)  
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  
    
    def __str__(self):
        return self.email
    
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
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
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

#Email verification codes
class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.email} - {self.code}"
    
    # Password Reset Model
class PasswordReset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.email} - Password Reset"
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
        

# Guild Model
class Guild(models.Model):
    guild_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    member_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def update_member_count(self):
        from authentication.models import Profile
        self.member_count = Profile.objects.filter(university_name=self.name).count()
        self.save()


# Event Model
class Event(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    CATEGORY_CHOICES = [
        ('workshop', 'Workshop'),
        ('study_group', 'Study Group'),
        ('competition', 'Competition'),
        ('networking', 'Networking'),
        ('symposium', 'Symposium'),
    ]
    
    event_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=500)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='workshop')
    date = models.DateField()
    time_start = models.TimeField()
    time_end = models.TimeField()
    venue = models.CharField(max_length=255)
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='created_events')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    pre_joined_count = models.IntegerField(default=0)
    attendee_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.guild.name}"


# EventParticipant Model
class EventParticipant(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='event_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_confirmed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('event', 'user')
    
    def __str__(self):
        return f"{self.user.email} - {self.event.title}"


# User Suspension Model
class UserSuspension(models.Model):
    suspension_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='suspensions')
    suspended_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='suspensions_issued')
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