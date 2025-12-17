@echo off
echo Checking and applying migrations for pets app...
cd /d %~dp0
python manage.py showmigrations pets
echo.
echo Applying migrations...
python manage.py migrate pets
echo.
echo Done! Check the output above to see if migrations were applied.
pause

