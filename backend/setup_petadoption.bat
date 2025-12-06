@echo off
echo ========================================
echo Pet Adoption Backend Setup
echo ========================================
echo.

echo Step 1: Creating virtual environment "petadoption"...
python -m venv petadoption
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment. Trying with 'py' command...
    py -m venv petadoption
    if errorlevel 1 (
        echo ERROR: Python not found. Please install Python first.
        pause
        exit /b 1
    )
)
echo Virtual environment created successfully!
echo.

echo Step 2: Activating virtual environment...
call petadoption\Scripts\activate.bat
echo Virtual environment activated!
echo.

echo Step 3: Upgrading pip...
python -m pip install --upgrade pip
echo.

echo Step 4: Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo Step 5: Creating .env file...
if not exist .env (
    (
        echo DATABASE_URL=postgresql://neondb_owner:npg_vlOmWHKNQ45B@ep-empty-bush-a1ovrzm3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
        echo SECRET_KEY=django-insecure-change-this-to-a-secure-key-in-production
        echo DEBUG=True
        echo ALLOWED_HOSTS=localhost,127.0.0.1
    ) > .env
    echo .env file created!
) else (
    echo .env file already exists, skipping...
)
echo.

echo Step 6: Running migrations...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo WARNING: Migration errors occurred. Please check the output above.
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Activate virtual environment: petadoption\Scripts\activate.bat
echo 2. (Optional) Create superuser: python manage.py createsuperuser
echo 3. Run server: python manage.py runserver
echo.
echo To run the server, execute: run_server.bat
echo.
pause

