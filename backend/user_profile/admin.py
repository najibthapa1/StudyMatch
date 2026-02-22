from django.contrib import admin
from .models import Profile, StudyGoal, Activity

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user_email', 'university_name', 'course', 'year']
    search_fields = ['full_name', 'user__email']
    readonly_fields = ['profile_id', 'created_at', 'updated_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

@admin.register(StudyGoal)
class StudyGoalAdmin(admin.ModelAdmin):
    list_display = ['title_preview', 'user_email', 'is_completed', 'created_at']
    list_filter = ['is_completed', 'created_at']
    search_fields = ['title', 'user__email']
    readonly_fields = ['goal_id', 'created_at', 'updated_at']
    
    def title_preview(self, obj):
        return obj.title[:50] + '...' if len(obj.title) > 50 else obj.title
    title_preview.short_description = 'Title'
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['action', 'user_email', 'activity_type', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['action', 'user__email']
    readonly_fields = ['activity_id', 'created_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
    