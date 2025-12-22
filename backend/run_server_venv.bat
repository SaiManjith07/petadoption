@echo off
echo ========================================
echo Starting Django Development Server
echo ========================================
echo.

REM Change to backend directory
cd /d "%~dp0"

REM Use virtual environment Python directly
echo Using virtual environment Python...
C:\Users\HP\Desktop\PK\petadoption\petadoption\Scripts\python.exe manage.py runserver

