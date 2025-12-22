"""
Custom middleware for handling Render.com domains and CORS
"""
import os
import re
from django.core.exceptions import DisallowedHost
from django.http import JsonResponse


class RenderHostMiddleware:
    """
    Middleware to allow any .onrender.com domain when on Render.
    This is needed because Django doesn't support wildcards in ALLOWED_HOSTS.
    Place this BEFORE CommonMiddleware in MIDDLEWARE settings.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if we're on Render and host is .onrender.com
        if os.getenv('RENDER'):
            host = request.get_host().split(':')[0]  # Remove port if present
            
            if host.endswith('.onrender.com'):
                # Add to ALLOWED_HOSTS if not already there
                from django.conf import settings
                if host not in settings.ALLOWED_HOSTS:
                    settings.ALLOWED_HOSTS.append(host)
        
        response = self.get_response(request)
        return response


class CORSExceptionMiddleware:
    """
    Middleware to ensure CORS headers are sent even when exceptions occur.
    This wraps the response to add CORS headers even on 500 errors.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
            # Always ensure CORS headers are present on ALL responses
            # This is critical for 401, 403, 404, 500, etc.
            response = self._add_cors_headers(response, request)
            return response
        except Exception as e:
            # Catch any exception and ensure CORS headers are added
            from django.http import HttpResponseServerError
            from django.conf import settings
            import traceback
            import json
            
            # Log the exception for debugging
            error_trace = traceback.format_exc()
            print(f"[CORSExceptionMiddleware] Exception caught in __call__")
            print(f"[CORSExceptionMiddleware] Path: {request.path}")
            print(f"[CORSExceptionMiddleware] Method: {request.method}")
            print(f"[CORSExceptionMiddleware] Exception: {str(e)}")
            print(f"[CORSExceptionMiddleware] Type: {type(e).__name__}")
            print(f"[CORSExceptionMiddleware] Traceback: {error_trace}")
            
            # Create error response with CORS headers
            error_data = {
                "error": "Internal server error",
                "message": "An error occurred processing your request"
            }
            
            # Include more details in DEBUG mode
            if getattr(settings, 'DEBUG', False):
                error_data['exception'] = str(e)
                error_data['exception_type'] = type(e).__name__
                error_data['path'] = request.path
                error_data['method'] = request.method
                error_data['traceback'] = error_trace
            
            response = HttpResponseServerError(
                content=json.dumps(error_data),
                content_type='application/json'
            )
            response = self._add_cors_headers(response, request)
            return response

    def process_exception(self, request, exception):
        """
        Handle exceptions and ensure CORS headers are added to error responses.
        This is called by Django when an exception occurs during view processing.
        """
        from django.http import HttpResponseServerError
        from django.conf import settings
        import traceback
        import json
        
        # Log the exception for debugging
        error_trace = traceback.format_exc()
        print(f"[CORSExceptionMiddleware] process_exception called")
        print(f"[CORSExceptionMiddleware] Path: {request.path}")
        print(f"[CORSExceptionMiddleware] Method: {request.method}")
        print(f"[CORSExceptionMiddleware] Exception: {str(exception)}")
        print(f"[CORSExceptionMiddleware] Type: {type(exception).__name__}")
        print(f"[CORSExceptionMiddleware] Traceback: {error_trace}")
        
        # Create error response data
        error_data = {
            "error": "Internal server error",
            "message": "An error occurred processing your request"
        }
        
        # Include more details in DEBUG mode
        if getattr(settings, 'DEBUG', False):
            error_data['exception'] = str(exception)
            error_data['exception_type'] = type(exception).__name__
            error_data['path'] = request.path
            error_data['method'] = request.method
            error_data['traceback'] = error_trace
        
        # Create a JSON error response
        response = HttpResponseServerError(
            content=json.dumps(error_data),
            content_type='application/json'
        )
        # Add CORS headers to the error response
        response = self._add_cors_headers(response, request)
        return response

    def _is_allowed_origin(self, origin, request):
        """Check if origin is allowed based on CORS settings"""
        from django.conf import settings
        
        # Check exact matches
        if origin in getattr(settings, 'CORS_ALLOWED_ORIGINS', []):
            return True
        
        # Check regex patterns
        for pattern in getattr(settings, 'CORS_ALLOWED_ORIGIN_REGEXES', []):
            if re.match(pattern, origin):
                return True
        
        return False

    def _add_cors_headers(self, response, request):
        """Add CORS headers to response - ensures headers are always added for allowed origins"""
        from django.conf import settings
        
        origin = request.META.get('HTTP_ORIGIN')
        
        # If no origin header, try to get it from Referer
        if not origin:
            referer = request.META.get('HTTP_REFERER', '')
            if referer:
                from urllib.parse import urlparse
                parsed = urlparse(referer)
                origin = f"{parsed.scheme}://{parsed.netloc}"
        
        # Handle OPTIONS preflight requests
        if request.method == 'OPTIONS':
            if origin and self._is_allowed_origin(origin, request):
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Credentials'] = 'true'
                response['Access-Control-Allow-Methods'] = ', '.join(
                    getattr(settings, 'CORS_ALLOW_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
                )
                response['Access-Control-Allow-Headers'] = ', '.join(
                    getattr(settings, 'CORS_ALLOW_HEADERS', ['accept', 'accept-encoding', 'authorization', 'content-type', 'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with'])
                )
                response['Access-Control-Max-Age'] = str(
                    getattr(settings, 'CORS_PREFLIGHT_MAX_AGE', 86400)
                )
                response.status_code = 200
            return response
        
        # For all other responses, add CORS headers if origin is allowed
        if origin and self._is_allowed_origin(origin, request):
            # Only set if not already set (to avoid overriding django-cors-headers)
            if not response.has_header('Access-Control-Allow-Origin'):
                response['Access-Control-Allow-Origin'] = origin
            if not response.has_header('Access-Control-Allow-Credentials'):
                response['Access-Control-Allow-Credentials'] = 'true'
            # Always add these headers for consistency
            response['Access-Control-Allow-Methods'] = ', '.join(
                getattr(settings, 'CORS_ALLOW_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
            )
            response['Access-Control-Allow-Headers'] = ', '.join(
                getattr(settings, 'CORS_ALLOW_HEADERS', ['accept', 'accept-encoding', 'authorization', 'content-type', 'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with'])
            )
        elif not origin:
            # Log when origin is missing (for debugging)
            print(f"[CORSExceptionMiddleware] No origin header found in request to {request.path}")
        
        return response

