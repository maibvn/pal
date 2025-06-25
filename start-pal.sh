#!/bin/bash

echo "===================================="
echo "Starting Pal - AI Assistant"
echo "===================================="

# Check if we're in the project root
if [ ! -d "backend" ]; then
    echo "Error: backend directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "Error: frontend directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Function to start backend
start_backend() {
    echo "Starting backend server..."
    cd backend
    if [ -f "start.sh" ]; then
        chmod +x start.sh
        ./start.sh &
        BACKEND_PID=$!
        echo "Backend started with PID: $BACKEND_PID"
    else
        echo "Backend start script not found"
        exit 1
    fi
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "Starting frontend..."
    cd frontend
    if [ -f "package.json" ]; then
        npm start &
        FRONTEND_PID=$!
        echo "Frontend started with PID: $FRONTEND_PID"
    else
        echo "Frontend package.json not found"
        exit 1
    fi
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down Pal..."
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start services
start_backend
sleep 5  # Wait for backend to start
start_frontend

echo ""
echo "===================================="
echo "Pal is running!"
echo "===================================="
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "===================================="
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
