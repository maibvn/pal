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
if exist "start.bat" (
    start "Pal Backend" cmd /k "start.bat"
) else (
    echo Backend start script not found
    pause
    exit /b 1
)

REM Wait a moment for backend to start
timeout /t 5 /nobreak

REM Start frontend
echo Starting frontend...
cd ..\frontend
if exist "package.json" (
    start "Pal Frontend" cmd /k "npm start"
) else (
    echo Frontend package.json not found
    pause
    exit /b 1
)

echo.
echo ====================================
echo Pal is starting up!
echo ====================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ====================================
echo.
echo Both servers should open in separate windows.
echo Close those windows to stop the servers.
echo.
pause
