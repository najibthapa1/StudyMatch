from django.db.models.signals import post_save
from django.dispatch import receiver
from user_profile.models import Profile
from .models import MatchScore
from .services.matching import calculate_match_score


@receiver(post_save, sender=Profile)
def recalculate_match_scores(sender, instance, **kwargs):
    """When a profile is saved, recalculate scores against same-university profiles"""
    # Only calculate scores for users in the same university (only these are shown in discovery)
    same_uni_profiles = Profile.objects.filter(
        university_name=instance.university_name,
        user__is_verified=True,
        user__is_suspended=False,
        user__role='student',
        user__is_active=True
    ).exclude(user=instance.user).select_related('user')
    
    for other in same_uni_profiles:
        score = calculate_match_score(instance, other)
        
        # Save both directions for easy querying
        MatchScore.objects.update_or_create(
            user_1=instance.user,
            user_2=other.user,
            defaults={'score': score}
        )
        MatchScore.objects.update_or_create(
            user_1=other.user,
            user_2=instance.user,
            defaults={'score': score}
        )
