@echo off
echo ========================================
echo 🚨 EMERGENCY BACKEND STARTUP
echo ========================================
echo.
echo The Render backend is down. Starting local backend...
echo.

cd veilos_backend

echo 📦 Installing dependencies...
call npm install

echo.
echo 🚀 Starting backend server...
echo Backend will be available at: http://localhost:3000
echo.
echo ⚠️  Make sure MongoDB is running locally or update MONGODB_URI in .env
echo.

call npm run dev

pause