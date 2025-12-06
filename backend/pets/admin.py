from django.contrib import admin
from .models import Category, Pet, PetImage, AdoptionApplication, MedicalRecord


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ('name', 'breed', 'adoption_status', 'category', 'owner', 'created_at')
    list_filter = ('adoption_status', 'category', 'is_verified', 'is_featured')
    search_fields = ('name', 'breed', 'description')
    readonly_fields = ('created_at', 'updated_at', 'views_count')


@admin.register(PetImage)
class PetImageAdmin(admin.ModelAdmin):
    list_display = ('pet', 'caption', 'created_at')
    list_filter = ('created_at',)


@admin.register(AdoptionApplication)
class AdoptionApplicationAdmin(admin.ModelAdmin):
    list_display = ('pet', 'applicant', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('pet__name', 'applicant__name', 'applicant__email')


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('pet', 'health_status', 'vaccination_status', 'registered_by', 'created_at')
    list_filter = ('health_status', 'vaccination_status', 'is_spayed_neutered', 'created_at')
    search_fields = ('pet__name', 'veterinarian_name', 'clinic_name')
    readonly_fields = ('created_at', 'updated_at', 'registered_by')

