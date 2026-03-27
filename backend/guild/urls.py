from django.urls import path
from . import views

urlpatterns = [
    path('my-guild/', views.get_my_guild, name='get_my_guild'),
    path('<uuid:guild_id>/events/', views.get_guild_events, name='get_guild_events'),
    path('<uuid:guild_id>/events/create/', views.create_guild_event, name='create_guild_event'),
    path('events/my-events/', views.get_my_events, name='get_my_events'),
    path('events/<uuid:event_id>/join/', views.join_event, name='join_event'),
    path('events/<uuid:event_id>/leave/', views.leave_event, name='leave_event'),
    path('events/<uuid:event_id>/delete/', views.delete_event, name='delete_event'),
    path('events/<uuid:event_id>/photos/', views.get_event_photos, name='get_event_photos'),
    path('events/<uuid:event_id>/photos/upload/', views.upload_event_photo, name='upload_event_photo'),
    path('photos/<uuid:photo_id>/delete/', views.delete_event_photo, name='delete_event_photo'),
]