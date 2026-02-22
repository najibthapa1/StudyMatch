from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.admin_login, name='admin_login'),
    path('dashboard/stats/', views.admin_dashboard_stats, name='admin_dashboard_stats'),
    path('verify/', views.admin_verify_access, name='admin_verify_access'),
    path('users/', views.admin_get_users, name='admin_get_users'),
    path('users/<uuid:user_id>/', views.admin_get_user_detail, name='admin_get_user_detail'),
    path('users/<uuid:user_id>/update/', views.admin_update_user, name='admin_update_user'),
    path('users/<uuid:user_id>/suspend/', views.admin_suspend_user, name='admin_suspend_user'),
    path('users/<uuid:user_id>/unsuspend/', views.admin_unsuspend_user, name='admin_unsuspend_user'),
    path('users/<uuid:user_id>/delete/', views.admin_delete_user, name='admin_delete_user'),
    path('guilds/', views.admin_get_guilds, name='admin_get_guilds'),
    path('guilds/<uuid:guild_id>/', views.admin_get_guild_detail, name='admin_get_guild_detail'),
    path('analytics/', views.admin_get_analytics, name='admin_get_analytics'),
    path('notifications/', views.admin_get_notifications, name='admin_get_notifications'),
    path('notifications/<uuid:notification_id>/read/', views.admin_mark_notification_read, name='admin_mark_notification_read'),
    path('notifications/read-all/', views.admin_mark_all_notifications_read, name='admin_mark_all_notifications_read'),
    path('notifications/<uuid:notification_id>/delete/', views.admin_delete_notification, name='admin_delete_notification'),
]