from django.contrib import admin
from .models import UserSuspension, AdminNotification

admin.site.register(UserSuspension)
admin.site.register(AdminNotification)