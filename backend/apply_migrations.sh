#!/bin/bash
echo "Checking and applying migrations for pets app..."
cd "$(dirname "$0")"
python manage.py showmigrations pets
echo ""
echo "Applying migrations..."
python manage.py migrate pets
echo ""
echo "Done! Check the output above to see if migrations were applied."

