"""
URL configuration for backend project.
"""
import os
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Serve media files
# In production, we need to serve media files even when DEBUG=False
# Render's filesystem is ephemeral, so consider using cloud storage (S3, Cloudinary) for production
if settings.DEBUG or os.getenv('SERVE_MEDIA', 'False').lower() == 'true':
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

