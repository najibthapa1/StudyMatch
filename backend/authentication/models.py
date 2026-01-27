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