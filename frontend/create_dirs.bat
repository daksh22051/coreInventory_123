@echo off
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
