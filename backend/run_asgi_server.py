#!/usr/bin/env python
"""
Run Django with ASGI support for WebSockets
This script runs the Django server with ASGI support using daphne or uvicorn
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

if __name__ == '__main__':
    try:
        # Try to use daphne (recommended for Django Channels)
        import daphne
        from django.core.management import execute_from_command_line
        
        print("=" * 60)
        print("Starting Django server with ASGI support (daphne)")
        print("WebSocket support: ENABLED")
        print("=" * 60)
        
        # Run with daphne
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        execute_from_command_line(['daphne', '-b', '0.0.0.0', '-p', '8000', 'backend.asgi:application'])
    except ImportError:
        try:
            # Fallback to uvicorn
            import uvicorn
            print("=" * 60)
            print("Starting Django server with ASGI support (uvicorn)")
            print("WebSocket support: ENABLED")
            print("=" * 60)
            uvicorn.run(
                'backend.asgi:application',
                host='0.0.0.0',
                port=8000,
                log_level='info'
            )
        except ImportError:
            print("=" * 60)
            print("WARNING: Neither daphne nor uvicorn is installed!")
            print("WebSocket support requires an ASGI server.")
            print("=" * 60)
            print("\nTo install daphne (recommended):")
            print("  pip install daphne")
            print("\nOr install uvicorn:")
            print("  pip install uvicorn")
            print("\nFalling back to regular runserver (WebSockets may not work)")
            print("=" * 60)
            from django.core.management import execute_from_command_line
            execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])

