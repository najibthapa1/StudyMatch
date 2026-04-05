from django.db.models.signals import post_save
from django.dispatch import receiver
from user_profile.models import Profile
from .models import MatchScore
from .services.matching import calculate_match_score

@receiver(post_save, sender=Profile)
def recalculate_match_scores(sender, instance, **kwargs):
    profiles = Profile.objects.filter(
        university_name=instance.university_name,
        user__is_verified=True, user__is_suspended=False,
        user__role='student', user__is_active=True
    ).exclude(user=instance.user).select_related('user')
    
    for p in profiles:
        score = calculate_match_score(instance, p)
        MatchScore.objects.update_or_create(
            user_1=instance.user, user_2=p.user, defaults={'score': score})
        MatchScore.objects.update_or_create(
            user_1=p.user, user_2=instance.user, defaults={'score': score})
