from django.contrib import admin
from .models import User, EmailVerification, PasswordReset

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'role', 'is_verified', 'is_active', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active', 'created_at']
    search_fields = ['email']
    readonly_fields = ['user_id', 'created_at']

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'code', 'is_used', 'expires_at']
    list_filter = ['is_used']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

@admin.register(PasswordReset)
class PasswordResetAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'code', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used', 'created_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

# Customize admin site headers
admin.site.site_header = 'StudyMatch Administration'
admin.site.site_title = 'StudyMatch Admin'
admin.site.index_title = 'Welcome to StudyMatch Admin Panel'

