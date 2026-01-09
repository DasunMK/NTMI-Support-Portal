#!/bin/bash

# Configuration
DB_CONTAINER_NAME="support-portal-mssql"
DB_PASSWORD="Password1234!"
DB_PORT=1433

echo "============================================"
echo "   Support Portal System Startup Script"
echo "============================================"

# 1. Database Setup
echo "[1/3] Checking Database..."

if docker ps | grep -q $DB_CONTAINER_NAME; then
    echo " -> MSSQL Container '$DB_CONTAINER_NAME' is already running."
elif docker ps -a | grep -q $DB_CONTAINER_NAME; then
    echo " -> Starting existing MSSQL Container '$DB_CONTAINER_NAME'..."
    docker start $DB_CONTAINER_NAME
else
    echo " -> Creating and starting new MSSQL Container '$DB_CONTAINER_NAME'..."
    # Check if we need sudo
    if groups | grep -q 'docker'; then
        DOCKER_CMD="docker"
    else
        echo "    (Requesting sudo for Docker)"
        DOCKER_CMD="sudo docker"
    fi

    $DOCKER_CMD run -e "ACCEPT_EULA=Y" \
        -e "MSSQL_SA_PASSWORD=$DB_PASSWORD" \
        -e "MSSQL_PID=Express" \
        -p $DB_PORT:1433 \
        --name $DB_CONTAINER_NAME \
        -d mcr.microsoft.com/mssql/server:2022-latest
fi

echo " -> Waiting for Database to be ready (15s)..."
sleep 15

# 2. Backend Setup
echo "[2/3] Starting Backend (Spring Boot)..."
cd support-portal-api
# Run in background, redirect output
./mvnw spring-boot:run > ../backend.log 2>&1 &
BACKEND_PID=$!
echo " -> Backend starting with PID $BACKEND_PID. Logs: backend.log"
cd ..

# 3. Frontend Setup
echo "[3/3] Starting Frontend (React/Vite)..."
cd support-portal-frontend
# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo " -> Installing frontend dependencies..."
    npm install
fi
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo " -> Frontend starting with PID $FRONTEND_PID. Logs: frontend.log"
cd ..

echo "============================================"
echo " System Started!"
echo " - Frontend: http://localhost:5173"
echo " - Backend:  http://localhost:8080"
echo " - Database: localhost:$DB_PORT"
echo ""
echo " To stop the servers, run: kill $BACKEND_PID $FRONTEND_PID"
echo "============================================"
