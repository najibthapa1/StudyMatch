from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_notifications, name='list_notifications'),
    path('unread-count/', views.unread_count, name='unread_count'),
    path('mark-all-read/', views.mark_all_as_read, name='mark_all_as_read'),
    path('clear-all/', views.clear_all_notifications, name='clear_all_notifications'),
    path('<uuid:notification_id>/read/', views.mark_as_read, name='mark_as_read'),
    path('<uuid:notification_id>/delete/', views.delete_notification, name='delete_notification'),
]