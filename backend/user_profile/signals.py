from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile

@receiver(post_save, sender=Profile)
def create_guild_and_notification(sender, instance, created, **kwargs):
    """Auto-create guild when new profile is created and send admin notification"""
    if created:
        from guild.models import Guild
        from administration.models import AdminNotification

        # Create guild if doesn't exist
        guild, guild_created = Guild.objects.get_or_create(
            name=instance.university_name,
            defaults={'description': f'Official guild for {instance.university_name} students'}
        )
        
        # Update member count
        guild.update_member_count()
        
        # Create admin notification
        AdminNotification.objects.create(
            notification_type='user',
            title='New User Registration',
            description=f'{instance.full_name} just signed up from {instance.university_name}'
        )