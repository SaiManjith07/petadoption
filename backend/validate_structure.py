#!/usr/bin/env python
"""
Structure validation script for Django backend.
Checks if all required files are in place.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent

# Required files for each app
APP_REQUIRED_FILES = {
    'users': ['__init__.py', 'apps.py', 'models.py', 'views.py', 'serializers.py', 'urls.py', 'admin.py', 'backends.py'],
    'pets': ['__init__.py', 'apps.py', 'models.py', 'views.py', 'serializers.py', 'urls.py', 'admin.py'],
    'chats': ['__init__.py', 'apps.py', 'models.py', 'views.py', 'serializers.py', 'urls.py', 'admin.py'],
    'adminpanel': ['__init__.py', 'apps.py', 'models.py', 'views.py', 'serializers.py', 'urls.py', 'admin.py'],
    'api': ['__init__.py', 'apps.py', 'urls.py'],
}

# Required migrations
MIGRATIONS_REQUIRED = ['__init__.py']

def check_app_structure(app_name, required_files):
    """Check if app has all required files."""
    app_path = BASE_DIR / app_name
    missing = []
    existing = []
    
    if not app_path.exists():
        return False, [f"App folder '{app_name}' does not exist"], []
    
    for file in required_files:
        file_path = app_path / file
        if file_path.exists():
            existing.append(file)
        else:
            missing.append(file)
    
    return len(missing) == 0, missing, existing

def check_migrations(app_name):
    """Check if migrations folder exists and has __init__.py."""
    migrations_path = BASE_DIR / app_name / 'migrations'
    if not migrations_path.exists():
        return False, ["Migrations folder does not exist"]
    
    init_file = migrations_path / '__init__.py'
    if not init_file.exists():
        return False, ["migrations/__init__.py missing"]
    
    return True, []

def main():
    print("=" * 60)
    print("Django Backend Structure Validation")
    print("=" * 60)
    print()
    
    all_valid = True
    
    # Check each app
    for app_name, required_files in APP_REQUIRED_FILES.items():
        print(f"Checking {app_name}/")
        is_valid, missing, existing = check_app_structure(app_name, required_files)
        
        if is_valid:
            print(f"  ✅ All required files present")
            for file in existing:
                print(f"     ✓ {file}")
        else:
            all_valid = False
            print(f"  ❌ Missing files:")
            for file in missing:
                print(f"     ✗ {file}")
        
        # Check migrations
        if app_name != 'api':  # API doesn't need migrations
            migrations_valid, migrations_issues = check_migrations(app_name)
            if migrations_valid:
                print(f"  ✅ Migrations folder OK")
            else:
                all_valid = False
                print(f"  ❌ Migrations issues:")
                for issue in migrations_issues:
                    print(f"     ✗ {issue}")
        
        print()
    
    # Check project files
    print("Checking project files:")
    project_files = {
        'manage.py': BASE_DIR / 'manage.py',
        'requirements.txt': BASE_DIR / 'requirements.txt',
        'backend/settings.py': BASE_DIR / 'backend' / 'settings.py',
        'backend/urls.py': BASE_DIR / 'backend' / 'urls.py',
    }
    
    for name, path in project_files.items():
        if path.exists():
            print(f"  ✅ {name}")
        else:
            all_valid = False
            print(f"  ❌ {name} missing")
    
    print()
    print("=" * 60)
    if all_valid:
        print("✅ Structure is VALID - All files in place!")
    else:
        print("❌ Structure has ISSUES - See above for details")
    print("=" * 60)

if __name__ == '__main__':
    main()

