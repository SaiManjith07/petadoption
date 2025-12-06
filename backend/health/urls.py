from django.urls import path
from . import views

urlpatterns = [
    # Vaccination Camps
    path('camps/', views.VaccinationCampListView.as_view(), name='vaccination-camp-list'),
    path('camps/<int:pk>/', views.VaccinationCampDetailView.as_view(), name='vaccination-camp-detail'),
    
    # Camp Registrations
    path('registrations/', views.CampRegistrationListView.as_view(), name='camp-registration-list'),
    path('registrations/<int:pk>/', views.CampRegistrationDetailView.as_view(), name='camp-registration-detail'),
    path('camps/<int:camp_id>/registrations/', views.admin_camp_registrations, name='admin-camp-registrations'),
    
    # Health Resources
    path('resources/', views.HealthResourceListView.as_view(), name='health-resource-list'),
    path('resources/<int:pk>/', views.HealthResourceDetailView.as_view(), name='health-resource-detail'),
]

