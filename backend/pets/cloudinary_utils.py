"""
Cloudinary utility functions for image uploads.
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.conf import settings
import os


def configure_cloudinary():
    """Configure Cloudinary with credentials from environment variables."""
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME', 'drp2hx5d6'),
        api_key=os.getenv('CLOUDINARY_API_KEY', '392655696679497'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET', 'gytzkjH084pi1cXoKBc98PbelUU')
    )


def upload_image_to_cloudinary(image_file, folder='petadoption', public_id=None, overwrite=False):
    """
    Upload an image file to Cloudinary.
    
    Args:
        image_file: The image file to upload (Django UploadedFile or file-like object)
        folder: The folder in Cloudinary where the image will be stored
        public_id: Optional public ID for the image. If not provided, Cloudinary generates one.
        overwrite: Whether to overwrite if image with same public_id exists
    
    Returns:
        dict: Cloudinary upload response containing 'secure_url' and other metadata
    """
    # Configure Cloudinary
    configure_cloudinary()
    
    try:
        # Reset file pointer to beginning if it's a file object
        if hasattr(image_file, 'seek'):
            try:
                image_file.seek(0)
            except:
                pass
        
        # Prepare upload options
        upload_options = {
            'folder': folder,
            'use_filename': True,
            'unique_filename': False,
            'use_filename_as_display_name': True,
            'overwrite': overwrite,
            'resource_type': 'image',
        }
        
        # Add public_id if provided
        if public_id:
            upload_options['public_id'] = public_id
        
        print(f"[Cloudinary] Uploading image with options: folder={folder}, public_id={public_id}")
        
        # Upload the image
        result = cloudinary.uploader.upload(
            image_file,
            **upload_options
        )
        
        print(f"[Cloudinary] Upload successful. URL: {result.get('secure_url')}")
        
        return {
            'success': True,
            'url': result.get('secure_url'),
            'public_id': result.get('public_id'),
            'format': result.get('format'),
            'width': result.get('width'),
            'height': result.get('height'),
            'bytes': result.get('bytes'),
            'created_at': result.get('created_at'),
        }
    except Exception as e:
        import traceback
        error_msg = f"Error uploading image to Cloudinary: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        return {
            'success': False,
            'error': str(e)
        }


def delete_image_from_cloudinary(public_id):
    """
    Delete an image from Cloudinary.
    
    Args:
        public_id: The public_id of the image to delete
    
    Returns:
        dict: Result of the deletion operation
    """
    # Configure Cloudinary
    configure_cloudinary()
    
    try:
        result = cloudinary.uploader.destroy(public_id)
        return {
            'success': result.get('result') == 'ok',
            'result': result
        }
    except Exception as e:
        print(f"Error deleting image from Cloudinary: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def get_cloudinary_url(public_id, transformation=None):
    """
    Generate a Cloudinary URL for an image with optional transformations.
    
    Args:
        public_id: The public_id of the image
        transformation: Optional transformation parameters (dict)
    
    Returns:
        str: The Cloudinary URL
    """
    configure_cloudinary()
    
    try:
        if transformation:
            url = cloudinary.CloudinaryImage(public_id).build_url(**transformation)
        else:
            url = cloudinary.CloudinaryImage(public_id).build_url()
        return url
    except Exception as e:
        print(f"Error generating Cloudinary URL: {str(e)}")
        return None

