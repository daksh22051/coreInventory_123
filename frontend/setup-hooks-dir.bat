@echo off
echo Creating frontend/app/hooks directory...
cd /d c:\CODING\CoreInventory\frontend
mkdir app\hooks
if exist app\hooks (
    echo ✓ Directory created successfully: c:\CODING\CoreInventory\frontend\app\hooks
) else (
    echo ✗ Failed to create directory
)
pause
