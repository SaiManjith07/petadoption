from django.contrib import admin
from .models import AdminLog, SystemSettings, DashboardStats


@admin.register(AdminLog)
class AdminLogAdmin(admin.ModelAdmin):
    list_display = ('admin', 'action', 'model_type', 'object_id', 'created_at')
    list_filter = ('action', 'model_type', 'created_at')
    search_fields = ('admin__email', 'admin__name', 'description')
    readonly_fields = ('created_at',)


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_by', 'updated_at')
    search_fields = ('key', 'description')


@admin.register(DashboardStats)
class DashboardStatsAdmin(admin.ModelAdmin):
    list_display = ('last_updated', 'total_pets', 'total_users', 'total_chats', 'updated_by')
    readonly_fields = ('last_updated', 'total_pets', 'pending_pets', 'found_pets', 'lost_pets', 
                       'available_pets', 'adopted_pets', 'total_users', 'active_users',
                       'total_applications', 'pending_applications', 'total_chats', 'active_chats',
                       'pending_chat_requests', 'pets_last_7_days', 'users_last_7_days')
    
    def has_add_permission(self, request):
        return False  # Only one stats record should exist
    
    def has_delete_permission(self, request, obj=None):
        return False  # Don't allow deletion

