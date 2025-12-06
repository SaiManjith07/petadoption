@echo off
REM Setup script for Django backend (Windows)

echo Setting up Django backend...

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo Please update .env with your database credentials and secret key
)

REM Run migrations
echo Running migrations...
python manage.py makemigrations
python manage.py migrate

echo Setup complete!
echo Next steps:
echo 1. Update .env file with your settings
echo 2. Create superuser: python manage.py createsuperuser
echo 3. Run server: python manage.py runserver

pause

