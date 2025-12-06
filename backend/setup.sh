#!/bin/bash

# Setup script for Django backend

echo "Setting up Django backend..."

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please update .env with your database credentials and secret key"
fi

# Run migrations
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Setup complete!"
echo "Next steps:"
echo "1. Update .env file with your settings"
echo "2. Create superuser: python manage.py createsuperuser"
echo "3. Run server: python manage.py runserver"

