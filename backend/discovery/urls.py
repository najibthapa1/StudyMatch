from django.urls import path
from . import views
urlpatterns = [
    path('users/', views.discovery_users, name='discovery_users'),
    path('user/<uuid:user_id>/', views.discovery_user_detail, name='discovery_user_detail'),
]