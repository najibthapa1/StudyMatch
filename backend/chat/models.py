from django.db import models
from authentication.models import User
import uuid
from django.utils import timezone
from django.db.models import Q, F
from cloudinary_storage.storage import RawMediaCloudinaryStorage


class Conversation(models.Model):
    conversation_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant_one = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_one')
    participant_two = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_two')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  

    class Meta:
        ordering = ['-updated_at']
        unique_together = ('participant_one', 'participant_two')
        constraints = [
            models.CheckConstraint(
                check=~Q(participant_one=F('participant_two')),name='different_participants'
            )
        ]

    def __str__(self):
        return f"{self.participant_one.email} ↔ {self.participant_two.email}"

    def save(self, *args, **kwargs):
        # keep lower user_id first to avoid duplicate conversations
        if self.participant_two.user_id < self.participant_one.user_id:
            self.participant_one, self.participant_two = self.participant_two, self.participant_one
        super().save(*args, **kwargs)

    def get_other_participant(self, user):
        if self.participant_one == user:
            return self.participant_two
        return self.participant_one

    def get_last_message(self):
        return self.messages.first()

    def unread_count_for(self, user):
        return self.messages.filter(is_read=False).exclude(sender=user).count()


class Message(models.Model):
    message_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_messages'
    )
    content = models.TextField()
    file_attachment = models.FileField(
        upload_to='message_attachments/', storage=RawMediaCloudinaryStorage(), blank=True, null=True
    )
    file_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['conversation', '-created_at']),
            models.Index(fields=['is_read', 'sender']),
        ]

    def __str__(self):
        return f"{self.sender.email}: {self.content[:50]}"

    def get_time_ago(self):
        now = timezone.now()
        diff = now - self.created_at
        if diff.days > 0:
            if diff.days == 1:
                return "Yesterday"
            elif diff.days < 7:
                return f"{diff.days} days ago"
            else:
                return self.created_at.strftime('%b %d')
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"{hours}h ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"{minutes}m ago"
        else:
            return "Just now"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class TypingIndicator(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='typing_indicators'
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_typing = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f"{self.user.email} typing in {self.conversation.conversation_id}"







