from django.contrib import admin
from .models import VaccinationCamp, CampRegistration, HealthResource


@admin.register(VaccinationCamp)
class VaccinationCampAdmin(admin.ModelAdmin):
    list_display = ['location', 'date', 'ngo', 'is_active', 'current_registrations', 'max_capacity', 'created_at']
    list_filter = ['is_active', 'date', 'city', 'state']
    search_fields = ['location', 'address', 'ngo', 'city', 'state']
    readonly_fields = ['created_at', 'updated_at', 'current_registrations']
    date_hierarchy = 'date'


@admin.register(CampRegistration)
class CampRegistrationAdmin(admin.ModelAdmin):
    list_display = ['pet_name', 'user', 'camp', 'status', 'registered_at']
    list_filter = ['status', 'camp', 'registered_at']
    search_fields = ['pet_name', 'user__name', 'user__email', 'camp__location']
    readonly_fields = ['registered_at', 'updated_at']


@admin.register(HealthResource)
class HealthResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'resource_type', 'is_featured', 'created_at']
    list_filter = ['resource_type', 'is_featured', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']

