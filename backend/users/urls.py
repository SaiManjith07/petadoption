from django.urls import path
from . import views
from . import views_volunteer
from . import views_feeding
from . import views_admin
from . import views_role_request

urlpatterns = [
    # Authentication
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('me/', views.get_current_user, name='current-user'),
    path('check-email/', views.check_email, name='check-email'),
    path('check-phone/', views.check_phone, name='check-phone'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/', views.reset_password, name='reset-password'),
    
    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('change-password/', views.change_password, name='change-password'),
    
    # User management (admin)
    path('list/', views.UserListView.as_view(), name='user-list'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    
    # Volunteer and Shelter endpoints
    path('volunteer/register/', views_volunteer.register_volunteer, name='register-volunteer'),
    path('volunteer/profile/', views_volunteer.my_volunteer_profile, name='my-volunteer-profile'),
    path('shelter/register/', views_volunteer.register_shelter, name='register-shelter'),
    path('shelters/my/', views_volunteer.my_shelters, name='my-shelters'),
    path('shelters/nearby/', views_volunteer.nearby_shelters, name='nearby-shelters'),
    path('volunteers/nearby/', views_volunteer.nearby_volunteers, name='nearby-volunteers'),
    
    # Admin endpoints
    path('admin/volunteers/pending/', views_volunteer.pending_volunteers, name='pending-volunteers'),
    path('admin/volunteers/<int:volunteer_id>/verify/', views_volunteer.verify_volunteer, name='verify-volunteer'),
    path('admin/shelters/pending/', views_volunteer.pending_shelters, name='pending-shelters'),
    path('admin/shelters/<int:shelter_id>/verify/', views_volunteer.verify_shelter, name='verify-shelter'),
    path('admin/shelters/create/', views_volunteer.create_shelter, name='admin-create-shelter'),
    
    # Feeding points endpoints
    path('feeding-points/', views_feeding.list_feeding_points, name='list-feeding-points'),
    path('feeding-points/create/', views_feeding.create_feeding_point, name='create-feeding-point'),
    path('feeding-points/<int:point_id>/', views_feeding.feeding_point_detail, name='feeding-point-detail'),
    path('feeding-points/<int:point_id>/records/', views_feeding.feeding_records_by_point, name='feeding-records-by-point'),
    path('admin/feeding-points/create/', views_feeding.create_feeding_point, name='admin-create-feeding-point'),
    path('admin/feeding-points/<int:point_id>/update/', views_feeding.update_feeding_point, name='update-feeding-point'),
    path('admin/feeding-points/<int:point_id>/delete/', views_feeding.delete_feeding_point, name='delete-feeding-point'),
    
    # Feeding records endpoints
    path('feeding-records/create/', views_feeding.create_feeding_record, name='create-feeding-record'),
    path('feeding-records/my/', views_feeding.my_feeding_records, name='my-feeding-records'),
    path('shelters/accepting-feeding/', views_feeding.shelters_accepting_feeding, name='shelters-accepting-feeding'),
    
    # Admin registration endpoints
    path('admin/register/request/', views_admin.request_admin_registration, name='request-admin-registration'),
    path('admin/register/verify/', views_admin.verify_admin_pin, name='verify-admin-pin'),
    path('admin/list/', views_admin.list_admins, name='list-admins'),
    path('admin/<int:user_id>/remove/', views_admin.remove_admin, name='remove-admin'),
    path('admin/<int:user_id>/update-level/', views_admin.update_admin_level, name='update-admin-level'),
    
    # Role request endpoints
    path('role-requests/', views_role_request.RoleRequestListCreateView.as_view(), name='role-request-list-create'),
    path('role-requests/my/', views_role_request.my_role_requests, name='my-role-requests'),
    path('role-requests/pending/', views_role_request.pending_role_requests, name='pending-role-requests'),
    path('role-requests/<int:pk>/', views_role_request.RoleRequestDetailView.as_view(), name='role-request-detail'),
    path('role-requests/<int:request_id>/approve/', views_role_request.approve_role_request, name='approve-role-request'),
    path('role-requests/<int:request_id>/reject/', views_role_request.reject_role_request, name='reject-role-request'),
    path('role-requests/all/', views_role_request.all_role_requests, name='all-role-requests'),
]

