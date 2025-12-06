from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.ChatRoomListView.as_view(), name='chat-room-list'),
    path('rooms/<int:pk>/', views.ChatRoomDetailView.as_view(), name='chat-room-detail'),
    path('rooms/user/<int:user_id>/', views.get_or_create_room, name='get-or-create-room'),
    path('rooms/<int:room_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('rooms/<int:room_id>/send/', views.send_message, name='send-message'),
    path('rooms/<int:room_id>/read/', views.mark_messages_read, name='mark-messages-read'),
]

