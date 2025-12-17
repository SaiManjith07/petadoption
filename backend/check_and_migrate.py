#!/usr/bin/env python
"""
Script to check and apply migrations for pets app
Run this to ensure all migrations are applied
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.management import execute_from_command_line

if __name__ == '__main__':
    print("Checking migrations for pets app...")
    execute_from_command_line(['manage.py', 'showmigrations', 'pets'])
    print("\nApplying migrations if needed...")
    execute_from_command_line(['manage.py', 'migrate', 'pets'])

