from django.urls import path
from . import views
from . import views_workflow

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    
    # General pets
    path('', views.PetListView.as_view(), name='pet-list'),
    path('<int:pk>/', views.PetDetailView.as_view(), name='pet-detail'),
    
    # Lost pets
    path('lost/', views.LostPetListView.as_view(), name='lost-pet-list'),
    
    # Found pets
    path('found/', views.FoundPetListView.as_view(), name='found-pet-list'),
    
    # Matching
    path('match/<int:lost_pet_id>/<int:found_pet_id>/', views.match_lost_found, name='match-lost-found'),
    
    # Verification (admin)
    path('<int:pet_id>/verify/', views.verify_pet, name='verify-pet'),
    
    # Adoption
    path('<int:pet_id>/apply/', views.apply_for_adoption, name='apply-adoption'),
    path('applications/', views.AdoptionApplicationListView.as_view(), name='application-list'),
    path('applications/<int:pk>/', views.AdoptionApplicationDetailView.as_view(), name='application-detail'),
    
    # Workflow endpoints
    path('<int:pet_id>/workflow/', views_workflow.found_pet_workflow, name='found-pet-workflow'),
    path('<int:pet_id>/check-adoption/', views_workflow.check_15_day_adoption, name='check-15-day-adoption'),
    path('lost/<int:lost_pet_id>/match/', views_workflow.match_lost_pet, name='match-lost-pet'),
    path('found/<int:found_pet_id>/claim/', views_workflow.claim_lost_pet, name='claim-lost-pet'),
    
    # Medical Records (Admin only)
    path('medical-records/', views.MedicalRecordListView.as_view(), name='medical-record-list'),
    path('medical-records/<int:pk>/', views.MedicalRecordDetailView.as_view(), name='medical-record-detail'),
    path('<int:pet_id>/medical-records/', views.get_pet_medical_records, name='pet-medical-records'),
]

