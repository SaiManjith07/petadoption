from django.urls import path
from . import views
from . import views_chat_requests
from . import views_sse

urlpatterns = [
    # Chat room endpoints
    path('rooms/', views.ChatRoomListView.as_view(), name='chat-room-list'),
    path('rooms/<int:pk>/', views.ChatRoomDetailView.as_view(), name='chat-room-detail'),
    path('rooms/user/<int:user_id>/', views.get_or_create_room, name='get-or-create-room'),
    path('rooms/<int:room_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('rooms/<int:room_id>/send/', views.send_message, name='send-message'),
    path('rooms/<str:room_id>/send/', views.send_message_by_room_id, name='send-message-by-room-id'),
    path('rooms/<int:room_id>/read/', views.mark_messages_read, name='mark-messages-read'),
    path('rooms/<str:room_id>/read/', views.mark_messages_read_by_room_id, name='mark-messages-read-by-room-id'),
    path('rooms/<str:room_id>/messages/', views.get_room_messages, name='get-room-messages-by-id'),
    
    # New chat request workflow endpoints
    path('request/', views_chat_requests.create_chat_request, name='create-chat-request'),
    path('requests/my/', views_chat_requests.get_my_chat_requests, name='get-my-chat-requests'),
    path('requests/user/<int:user_id>/', views_chat_requests.get_user_chat_requests, name='get-user-chat-requests'),
    path('requests/<int:request_id>/admin-approve/', views_chat_requests.admin_approve_request, name='admin-approve-request'),
    path('requests/<int:request_id>/admin-reject/', views_chat_requests.admin_reject_request, name='admin-reject-request'),
    path('requests/<int:request_id>/user-accept/', views_chat_requests.user_accept_request, name='user-accept-request'),
    path('requests/<int:request_id>/owner-respond/', views_chat_requests.user_accept_request, name='owner-respond-request'),  # Alias for backward compatibility
    
    # Legacy endpoints (for backward compatibility)
    path('requests/', views.get_chat_requests, name='get-chat-requests'),
    path('requests/owner', views.get_chat_requests_for_owner, name='get-chat-requests-for-owner'),
    
    # Server-Sent Events (SSE) for real-time updates (alternative to WebSocket)
    path('rooms/<str:room_id>/stream/', views_sse.stream_messages, name='stream-messages'),
]

