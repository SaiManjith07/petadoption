@echo off
echo ========================================
echo Starting Django Development Server
echo ========================================
echo.

REM Change to backend directory
cd /d "%~dp0"

REM Activate virtual environment from root
call ..\petadoption\Scripts\activate.bat

echo Starting server at http://127.0.0.1:8000
echo API endpoints available at http://127.0.0.1:8000/api/
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver

