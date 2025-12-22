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
        response = self.get_response(request)
        # Always add CORS headers if not already present
        if not response.has_header('Access-Control-Allow-Origin'):
            response = self._add_cors_headers(response, request)
        return response

    def process_exception(self, request, exception):
        """
        Handle exceptions and ensure CORS headers are added to error responses.
        This is called by Django when an exception occurs.
        """
        from django.views.debug import ExceptionReporter
        from django.http import HttpResponseServerError
        
        # Create a basic error response
        response = HttpResponseServerError()
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
        """Add CORS headers to response"""
        from django.conf import settings
        
        origin = request.META.get('HTTP_ORIGIN')
        
        if origin and self._is_allowed_origin(origin, request):
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = ', '.join(
                getattr(settings, 'CORS_ALLOW_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
            )
            response['Access-Control-Allow-Headers'] = ', '.join(
                getattr(settings, 'CORS_ALLOW_HEADERS', ['content-type', 'authorization'])
            )
            response['Access-Control-Max-Age'] = str(
                getattr(settings, 'CORS_PREFLIGHT_MAX_AGE', 86400)
            )
        
        return response

