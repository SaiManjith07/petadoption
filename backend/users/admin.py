from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AllowedAdminEmail, AdminRegistration
from .models_role_request import RoleRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'name', 'phone')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'phone', 'country_code', 'age', 'gender', 'address', 'landmark', 'pincode', 'profile_image')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'role'),
        }),
    )


@admin.register(AllowedAdminEmail)
class AllowedAdminEmailAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'is_active', 'created_at', 'created_by')
    list_filter = ('is_active', 'created_at')
    search_fields = ('email', 'name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(AdminRegistration)
class AdminRegistrationAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'region', 'is_verified', 'created_at', 'pin_expires_at')
    list_filter = ('is_verified', 'created_at', 'region')
    search_fields = ('email', 'name', 'phone', 'region')
    ordering = ('-created_at',)
    readonly_fields = ('verification_pin', 'pin_sent_at', 'pin_expires_at', 'verified_at', 'created_at')


@admin.register(RoleRequest)
class RoleRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'requested_role', 'status', 'created_at', 'reviewed_by', 'reviewed_at')
    list_filter = ('status', 'requested_role', 'created_at', 'reviewed_at')
    search_fields = ('user__name', 'user__email', 'requested_role', 'reason', 'review_notes')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'reviewed_at')
    fieldsets = (
        ('Request Information', {
            'fields': ('user', 'requested_role', 'status')
        }),
        ('Application Details', {
            'fields': ('reason', 'experience', 'availability', 'resources')
        }),
        ('Review Information', {
            'fields': ('reviewed_by', 'reviewed_at', 'review_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj and obj.status != 'pending':
            return self.readonly_fields + ('status', 'reviewed_by', 'reviewed_at', 'review_notes')
        return self.readonly_fields

