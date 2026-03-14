@echo off
<<<<<<< HEAD
cd /d c:\CODING\CoreInventory\frontend
mkdir prisma
mkdir app\lib
mkdir app\api
mkdir app\api\products
mkdir "app\api\products\[id]"
mkdir app\api\auth
mkdir app\api\auth\signup
mkdir app\api\auth\login
mkdir app\api\auth\send-otp
mkdir app\api\auth\verify-otp
mkdir app\api\auth\reset-password
echo Directories created successfully!
echo.
echo Now run: npx prisma generate
echo Then run: npx prisma db push
pause
=======
cd /d c:\CODING\CoreInventory
mkdir backend\config
mkdir backend\controllers
mkdir backend\middleware
mkdir backend\models
mkdir backend\routes
mkdir backend\services
mkdir backend\utils
mkdir frontend
echo Directories created successfully!
dir /s /B backend frontend
>>>>>>> b1a16da (Initial commit)
