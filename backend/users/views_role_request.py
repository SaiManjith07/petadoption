from rest_framework import status, generics, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.conf import settings
from .models_role_request import RoleRequest
from .serializers_role_request import RoleRequestSerializer


class RoleRequestListCreateView(generics.ListCreateAPIView):
    """List user's role requests or create new request"""
    serializer_class = RoleRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only see their own requests"""
        return RoleRequest.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        """Create role request for current user"""
        serializer.save(user=self.request.user)


class RoleRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a role request"""
    serializer_class = RoleRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only access their own requests"""
        return RoleRequest.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_role_requests(request):
    """Get current user's role requests"""
    try:
        requests = RoleRequest.objects.filter(user=request.user).order_by('-created_at')
        serializer = RoleRequestSerializer(requests, many=True)
        return Response({'data': serializer.data})
    except Exception as e:
        return Response(
            {'error': f'Error loading role requests: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_role_requests(request):
    """Get all pending role requests (admin only)"""
    try:
        requests = RoleRequest.objects.filter(status='pending').order_by('-created_at')
        serializer = RoleRequestSerializer(requests, many=True)
        return Response({'data': serializer.data})
    except Exception as e:
        return Response(
            {'error': f'Error loading pending role requests: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_role_request(request, request_id):
    """Approve a role request (admin only)"""
    try:
        role_request = RoleRequest.objects.get(id=request_id, status='pending')
    except RoleRequest.DoesNotExist:
        return Response(
            {'error': 'Role request not found or already processed'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update role request
    role_request.status = 'approved'
    role_request.reviewed_by = request.user
    role_request.reviewed_at = timezone.now()
    role_request.review_notes = request.data.get('admin_notes', request.data.get('notes', ''))
    role_request.save()
    
    # Update user role if needed
    user = role_request.user
    if role_request.requested_role == 'volunteer':
        user.is_volunteer = True
    user.role = role_request.requested_role
    user.save()
    
    serializer = RoleRequestSerializer(role_request)
    return Response({
        'message': 'Role request approved',
        'data': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_role_request(request, request_id):
    """Reject a role request (admin only)"""
    try:
        role_request = RoleRequest.objects.get(id=request_id, status='pending')
    except RoleRequest.DoesNotExist:
        return Response(
            {'error': 'Role request not found or already processed'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update role request
    role_request.status = 'rejected'
    role_request.reviewed_by = request.user
    role_request.reviewed_at = timezone.now()
    role_request.review_notes = request.data.get('admin_notes', request.data.get('notes', ''))
    role_request.save()
    
    serializer = RoleRequestSerializer(role_request)
    return Response({
        'message': 'Role request rejected',
        'data': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_role_requests(request):
    """Get all role requests with filtering (admin only)"""
    try:
        queryset = RoleRequest.objects.all().select_related('user', 'reviewed_by').order_by('-created_at')
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by role
        role_filter = request.query_params.get('role')
        if role_filter:
            queryset = queryset.filter(requested_role=role_filter)
        
        # Search by user name or email
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(user__name__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(reason__icontains=search)
            )
        
        serializer = RoleRequestSerializer(queryset, many=True)
        return Response({'data': serializer.data})
    except Exception as e:
        import traceback
        return Response(
            {'error': f'Error loading role requests: {str(e)}', 'details': traceback.format_exc() if settings.DEBUG else None},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def role_request_statistics(request):
    """Get statistics about role requests (admin only)"""
    try:
        from django.db.models import Count, Q
        from datetime import datetime, timedelta
        
        total = RoleRequest.objects.count()
        pending = RoleRequest.objects.filter(status='pending').count()
        approved = RoleRequest.objects.filter(status='approved').count()
        rejected = RoleRequest.objects.filter(status='rejected').count()
        
        # Count by role
        by_role = RoleRequest.objects.values('requested_role').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Count by status
        by_status = RoleRequest.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Recent requests (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent = RoleRequest.objects.filter(created_at__gte=thirty_days_ago).count()
        
        # Pending by role
        pending_by_role = RoleRequest.objects.filter(status='pending').values('requested_role').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'recent_30_days': recent,
            'by_role': list(by_role),
            'by_status': list(by_status),
            'pending_by_role': list(pending_by_role)
        })
    except Exception as e:
        import traceback
        return Response(
            {'error': f'Error loading statistics: {str(e)}', 'details': traceback.format_exc() if settings.DEBUG else None},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_approve_role_requests(request):
    """Bulk approve multiple role requests (admin only)"""
    try:
        request_ids = request.data.get('request_ids', [])
        if not request_ids or not isinstance(request_ids, list):
            return Response(
                {'error': 'request_ids must be a list of role request IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        role_requests = RoleRequest.objects.filter(id__in=request_ids, status='pending')
        if not role_requests.exists():
            return Response(
                {'error': 'No pending role requests found with the provided IDs'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        approved_count = 0
        notes = request.data.get('notes', '')
        
        for role_request in role_requests:
            role_request.status = 'approved'
            role_request.reviewed_by = request.user
            role_request.reviewed_at = timezone.now()
            role_request.review_notes = notes
            role_request.save()
            
            # Update user role
            user = role_request.user
            if role_request.requested_role == 'volunteer':
                user.is_volunteer = True
            user.role = role_request.requested_role
            user.save()
            
            approved_count += 1
        
        return Response({
            'message': f'Successfully approved {approved_count} role request(s)',
            'approved_count': approved_count
        })
    except Exception as e:
        import traceback
        return Response(
            {'error': f'Error bulk approving: {str(e)}', 'details': traceback.format_exc() if settings.DEBUG else None},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_reject_role_requests(request):
    """Bulk reject multiple role requests (admin only)"""
    try:
        request_ids = request.data.get('request_ids', [])
        if not request_ids or not isinstance(request_ids, list):
            return Response(
                {'error': 'request_ids must be a list of role request IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        role_requests = RoleRequest.objects.filter(id__in=request_ids, status='pending')
        if not role_requests.exists():
            return Response(
                {'error': 'No pending role requests found with the provided IDs'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        rejected_count = 0
        notes = request.data.get('admin_notes', request.data.get('notes', ''))
        
        for role_request in role_requests:
            role_request.status = 'rejected'
            role_request.reviewed_by = request.user
            role_request.reviewed_at = timezone.now()
            role_request.review_notes = notes
            role_request.save()
            rejected_count += 1
        
        return Response({
            'message': f'Successfully rejected {rejected_count} role request(s)',
            'rejected_count': rejected_count
        })
    except Exception as e:
        import traceback
        return Response(
            {'error': f'Error bulk rejecting: {str(e)}', 'details': traceback.format_exc() if settings.DEBUG else None},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

