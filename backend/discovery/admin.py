from django.contrib import admin
from .models import MatchScore

@admin.register(MatchScore)
class MatchScoreAdmin(admin.ModelAdmin):
    list_display = ('user_1', 'user_2', 'score', 'calculated_at')
    list_filter = ('calculated_at',)
    search_fields = ('user_1__email', 'user_2__email')
    ordering = ('-score',)
