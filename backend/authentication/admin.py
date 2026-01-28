from django.contrib import admin
from .models import User, Profile, EmailVerification, StudyGoal, Activity

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'role', 'is_verified', 'is_active', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active', 'created_at']
    search_fields = ['email']
    readonly_fields = ['user_id', 'created_at']

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user_email', 'university_name', 'course', 'year']
    search_fields = ['full_name', 'user__email']
    readonly_fields = ['profile_id', 'created_at', 'updated_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'code', 'is_used', 'expires_at']
    list_filter = ['is_used']
    
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

# Customize admin site headers
admin.site.site_header = 'StudyMatch Administration'
admin.site.site_title = 'StudyMatch Admin'
admin.site.index_title = 'Welcome to StudyMatch Admin Panel'