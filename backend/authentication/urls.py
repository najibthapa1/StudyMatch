from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification, name='resend_verification'),
    path('login/', views.login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('verify-reset-code/', views.verify_reset_code, name='verify_reset_code'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/upload-picture/', views.upload_profile_picture, name='upload_profile_picture'),    
    path('profile/stats/', views.get_user_stats, name='get_user_stats'),
    path('profile/activity/', views.get_activity_timeline, name='get_activity_timeline'),    
    path('study-goals/', views.get_study_goals, name='get_study_goals'),
    path('study-goals/create/', views.create_study_goal, name='create_study_goal'),
    path('study-goals/<uuid:goal_id>/update/', views.update_study_goal, name='update_study_goal'),
    path('study-goals/<uuid:goal_id>/delete/', views.delete_study_goal, name='delete_study_goal'),
    path('study-goals/<uuid:goal_id>/toggle/', views.toggle_study_goal, name='toggle_study_goal'),
]