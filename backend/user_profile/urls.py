from django.urls import path
from . import views

urlpatterns = [
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
    path('study-tip/', views.get_study_tip, name='get_study_tip'),
]