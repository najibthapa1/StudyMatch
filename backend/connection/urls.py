from django.urls import path
from . import views

urlpatterns = [   
    path('send/<uuid:user_id>/', views.send_connection_request, name='send_connection_request'),
    path('requests/', views.get_connection_requests, name='get_connection_requests'),
    path('accept/<uuid:request_id>/', views.accept_connection_request, name='accept_connection_request'),
    path('reject/<uuid:request_id>/', views.reject_connection_request, name='reject_connection_request'),
    path('', views.get_connections, name='get_connections'),
    path('remove/<uuid:user_id>/', views.remove_connection, name='remove_connection'),
]   