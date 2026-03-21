from django.urls import path
from .views import (create_or_get_conversation,list_conversations,get_conversation_messages,send_message,delete_message,mark_messages_as_read,search_messages
)

urlpatterns = [
    path('conversations/', list_conversations, name='list_conversations'),
    path('conversations/create/', create_or_get_conversation, name='create_conversation'),
    path('conversations/<uuid:conversation_id>/messages/', get_conversation_messages, name='get_messages'),
    path('conversations/<uuid:conversation_id>/messages/send/', send_message, name='send_message'),
    path('conversations/<uuid:conversation_id>/messages/read/', mark_messages_as_read, name='mark_read'),
    path('conversations/<uuid:conversation_id>/messages/search/', search_messages, name='search_messages'),
    path('messages/<uuid:message_id>/delete/', delete_message, name='delete_message'),
]