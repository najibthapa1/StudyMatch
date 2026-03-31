from django.contrib import admin
from .models import UserReport, UserSuspension, AdminNotification

admin.site.register(UserSuspension)
admin.site.register(AdminNotification)
admin.site.register(UserReport)