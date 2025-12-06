from django.contrib import admin
from .models import ChatRoom, Message


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    filter_horizontal = ('participants',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'room', 'read_status', 'created_at')
    list_filter = ('read_status', 'created_at')
    search_fields = ('content', 'sender__name', 'sender__email')

