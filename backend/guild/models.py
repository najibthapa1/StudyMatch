from django.db import models
from authentication.models import User
import uuid
        
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
        from user_profile.models import Profile
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
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_events')
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_confirmed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('event', 'user')
    
    def __str__(self):
        return f"{self.user.email} - {self.event.title}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            self.event.pre_joined_count = self.event.participants.count()
            
            # If 3 or more people pre-joined, auto-confirm the event
            if self.event.pre_joined_count >= 3 and self.event.status == 'pending':
                self.event.status = 'confirmed'
                self.event.attendee_count = self.event.pre_joined_count
                
                # Mark all participants as confirmed
                self.event.participants.all().update(is_confirmed=True)
                
                # Create admin notification
                from administration.models import AdminNotification
                AdminNotification.objects.create(
                    notification_type='event',
                    title='Event Confirmed',
                    description=f'{self.event.title} reached 3+ pre-joins and was auto-confirmed'
                )
            
            self.event.save()

