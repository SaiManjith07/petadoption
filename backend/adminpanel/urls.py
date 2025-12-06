from django.urls import path
from . import views

urlpatterns = [
    # Dashboard and stats
    path('dashboard', views.dashboard_stats, name='admin-dashboard'),
    
    # Pending reports
    path('pending/', views.pending_reports, name='admin-pending-reports'),
    path('pending-requests/', views.pending_requests, name='admin-pending-requests'),
    
    # Adoption requests
    path('adoptions/pending', views.pending_adoptions, name='admin-pending-adoptions'),
    path('adoptions/<int:pet_id>/accept', views.accept_adoption_request, name='admin-accept-adoption'),
    
    # Chats
    path('chats', views.all_chats, name='admin-all-chats'),
    path('chats/stats', views.chat_stats, name='admin-chat-stats'),
    path('chats/requests', views.chat_requests, name='admin-chat-requests'),
    path('chats/requests/<int:request_id>/respond', views.respond_to_chat_request, name='admin-respond-chat-request'),
    path('chats/<int:room_id>/close', views.close_chat_room, name='admin-close-chat'),
    
    # Users
    path('users', views.all_users, name='admin-all-users'),
    
    # Pets
    path('pets', views.all_pets, name='admin-all-pets'),
    path('pets/<int:pet_id>/approve', views.approve_pet, name='admin-approve-pet'),
    path('pets/<int:pet_id>/reject', views.reject_pet, name='admin-reject-pet'),
    
    # Lost/Found
    path('lost', views.all_lost, name='admin-all-lost'),
    path('found', views.all_found, name='admin-all-found'),
    
    # Logs and settings
    path('logs', views.all_logs, name='admin-all-logs'),
    path('logs/', views.AdminLogListView.as_view(), name='admin-log-list'),
    path('logs/create/', views.log_admin_action, name='log-admin-action'),
    path('settings/', views.SystemSettingsListView.as_view(), name='system-settings-list'),
    path('settings/<str:key>/', views.SystemSettingsDetailView.as_view(), name='system-settings-detail'),
]

