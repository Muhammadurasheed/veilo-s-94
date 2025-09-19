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
echo 🔧 Fixing package.json for backend...
echo Creating proper backend startup script...

echo {^
  "name": "veilos-backend",^
  "version": "1.0.0",^
  "type": "module",^
  "scripts": {^
    "dev": "nodemon server.js",^
    "start": "node server.js"^
  },^
  "dependencies": {^
    "express": "^4.18.2",^
    "cors": "^2.8.5",^
    "helmet": "^7.1.0",^
    "dotenv": "^16.3.1",^
    "mongodb": "^6.3.0",^
    "jsonwebtoken": "^9.0.2",^
    "bcryptjs": "^2.4.3",^
    "socket.io": "^4.7.4",^
    "nodemon": "^3.0.2"^
  }^
} > package.json

echo.
echo 🚀 Starting backend server...
echo Backend will be available at: http://localhost:3001
echo.
echo ⚠️  Make sure MongoDB is running locally or update MONGODB_URI in .env
echo.

call npm run dev

pause