# PowerShell script to start Django backend server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Django Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "$PSScriptRoot\petadoption\Scripts\Activate.ps1"

Write-Host ""
Write-Host "Starting server at http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API endpoints available at http://127.0.0.1:8000/api/" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python manage.py runserver

