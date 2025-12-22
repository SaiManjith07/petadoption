"""
Test views for Cloudinary integration.
These endpoints are for testing purposes only.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .cloudinary_utils import upload_image_to_cloudinary, configure_cloudinary
import cloudinary


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_cloudinary_upload(request):
    """
    Test endpoint to upload an image to Cloudinary.
    Returns the Cloudinary URL and public_id.
    """
    try:
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided. Please upload an image.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        # Test upload
        result = upload_image_to_cloudinary(
            image_file,
            folder='petadoption/test',
            public_id=f'petadoption/test/test_{request.user.id}_{image_file.name}',
            overwrite=True
        )
        
        if result.get('success'):
            return Response({
                'success': True,
                'message': 'Image uploaded successfully to Cloudinary',
                'cloudinary_url': result['url'],
                'public_id': result['public_id'],
                'format': result.get('format'),
                'width': result.get('width'),
                'height': result.get('height'),
                'size_bytes': result.get('bytes'),
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': result.get('error', 'Unknown error'),
                'message': 'Failed to upload image to Cloudinary'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        import traceback
        return Response({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if request.user.is_staff else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_cloudinary_config(request):
    """
    Test endpoint to check Cloudinary configuration.
    """
    try:
        configure_cloudinary()
        
        # Get Cloudinary config (without exposing secrets)
        import os
        config = {
            'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME', 'drp2hx5d6'),
            'api_key': os.getenv('CLOUDINARY_API_KEY', '392655696679497'),
            'api_secret_set': bool(os.getenv('CLOUDINARY_API_SECRET')),
            'configured': True
        }
        
        return Response({
            'success': True,
            'config': config,
            'message': 'Cloudinary is configured'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to check Cloudinary configuration'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_pets_with_cloudinary(request):
    """
    Test endpoint to check which pets have Cloudinary URLs.
    """
    try:
        from .models import Pet, PetImage
        
        # Get pets with Cloudinary URLs
        pets_with_cloudinary = Pet.objects.filter(
            cloudinary_url__isnull=False
        ).values('id', 'name', 'cloudinary_url', 'cloudinary_public_id', 'created_at')
        
        # Get additional images with Cloudinary URLs
        images_with_cloudinary = PetImage.objects.filter(
            cloudinary_url__isnull=False
        ).values('id', 'pet_id', 'cloudinary_url', 'cloudinary_public_id', 'created_at')
        
        # Statistics
        total_pets = Pet.objects.count()
        pets_with_cloudinary_count = Pet.objects.filter(cloudinary_url__isnull=False).count()
        total_images = PetImage.objects.count()
        images_with_cloudinary_count = PetImage.objects.filter(cloudinary_url__isnull=False).count()
        
        return Response({
            'success': True,
            'statistics': {
                'total_pets': total_pets,
                'pets_with_cloudinary': pets_with_cloudinary_count,
                'pets_without_cloudinary': total_pets - pets_with_cloudinary_count,
                'total_additional_images': total_images,
                'images_with_cloudinary': images_with_cloudinary_count,
                'images_without_cloudinary': total_images - images_with_cloudinary_count,
            },
            'pets_with_cloudinary': list(pets_with_cloudinary),
            'images_with_cloudinary': list(images_with_cloudinary),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        return Response({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if request.user.is_staff else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

