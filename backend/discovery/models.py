from django.db import models
from authentication.models import User


class MatchScore(models.Model):
    user_1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='match_scores_as_user1')
    user_2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='match_scores_as_user2')
    score = models.FloatField(default=0.0)
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user_1', 'user_2')
        indexes = [
            models.Index(fields=['user_1', '-score']),
            models.Index(fields=['user_2', '-score']),
        ]

    def __str__(self):
        return f"{self.user_1.email} <-> {self.user_2.email}: {self.score}"
