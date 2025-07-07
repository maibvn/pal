@echo off
echo ====================================
echo Starting Pal - AI Assistant
echo ====================================

REM Check if we're in the project root
if not exist "backend" (
    echo Error: backend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo Error: frontend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Start backend first
echo Starting backend server...
cd backend

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Start the backend server

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found in backend directory
    echo Please ensure you have configured the .env file with your API keys
    pause
    exit /b 1
)

echo Backend starting...
start "Pal Backend" cmd /k "npm start"

REM Wait a moment for backend to start
echo Waiting for backend to initialize...
timeout /t 8 /nobreak

REM Start frontend
echo Starting frontend...
cd ..\frontend

REM Start the frontend server

echo Frontend starting...
start "Pal Frontend" cmd /k "set PORT=3000 && npm start"

echo.
echo ====================================
echo Pal is starting up!
echo ====================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ====================================
echo.
echo Both servers should open in separate windows.
echo If the frontend port conflicts, it will prompt to use 3001.
echo Close those windows to stop the servers.
echo.
echo Note: Make sure you have configured your API keys in backend\.env
echo.
pause
