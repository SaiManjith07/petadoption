from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('unread-count/', views.unread_count, name='notification-unread-count'),
    path('read-all/', views.mark_all_as_read, name='notification-mark-all-read'),
    path('<int:pk>/read/', views.mark_read, name='notification-mark-read'),
    path('create/', views.create_notification, name='notification-create'),
]

