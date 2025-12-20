"""
Custom middleware for handling Render.com domains
"""
import os
from django.core.exceptions import DisallowedHost


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

