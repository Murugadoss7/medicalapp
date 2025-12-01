#!/bin/bash

# Prescription Management System - Server Startup Script
# This script checks if frontend and backend servers are running
# and starts them if they're not running

set -e

PROJECT_DIR="/Users/murugadoss/MedicalApp/prescription-management"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_PORT=5173
BACKEND_PORT=8000
FRONTEND_LOG="/tmp/frontend_dev.log"
BACKEND_LOG="/tmp/backend_dev.log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Prescription Management System - Server Check${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    lsof -ti:$port > /dev/null 2>&1
    return $?
}

# Function to wait for server to be ready
wait_for_server() {
    local url=$1
    local name=$2
    local max_attempts=15
    local attempt=0

    echo -ne "${YELLOW}Waiting for $name to be ready"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s $url > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -ne "."
        sleep 1
        ((attempt++))
    done
    echo -e " ${RED}✗${NC}"
    return 1
}

# Check PostgreSQL
echo -e "${BLUE}1. Checking PostgreSQL...${NC}"
if docker ps | grep -q postgres; then
    echo -e "   ${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "   ${YELLOW}⚠ PostgreSQL not running in Docker${NC}"
    echo -e "   ${YELLOW}Starting PostgreSQL container...${NC}"
    cd "$PROJECT_DIR"
    docker-compose up -d postgres
    sleep 3
    if docker ps | grep -q postgres; then
        echo -e "   ${GREEN}✓ PostgreSQL started successfully${NC}"
    else
        echo -e "   ${RED}✗ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi

# Check Backend
echo ""
echo -e "${BLUE}2. Checking Backend (Port $BACKEND_PORT)...${NC}"
if check_port $BACKEND_PORT; then
    echo -e "   ${GREEN}✓ Backend is already running${NC}"
    echo -e "   ${GREEN}   URL: http://localhost:$BACKEND_PORT${NC}"
else
    echo -e "   ${YELLOW}⚠ Backend not running, starting now...${NC}"
    cd "$BACKEND_DIR"

    # Clear old log
    rm -f "$BACKEND_LOG"

    # Start backend
    DATABASE_URL="postgresql://postgres:prescription123@localhost:5432/prescription_management" \
    python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT > "$BACKEND_LOG" 2>&1 &

    BACKEND_PID=$!
    echo -e "   ${YELLOW}Backend starting with PID: $BACKEND_PID${NC}"

    # Wait for backend to be ready
    if wait_for_server "http://localhost:$BACKEND_PORT/api/v1/health" "Backend"; then
        echo -e "   ${GREEN}✓ Backend started successfully${NC}"
        echo -e "   ${GREEN}   URL: http://localhost:$BACKEND_PORT${NC}"
        echo -e "   ${GREEN}   API Docs: http://localhost:$BACKEND_PORT/docs${NC}"
        echo -e "   ${GREEN}   Log: $BACKEND_LOG${NC}"
    else
        echo -e "   ${RED}✗ Backend failed to start${NC}"
        echo -e "   ${RED}   Check log: $BACKEND_LOG${NC}"
        tail -20 "$BACKEND_LOG"
        exit 1
    fi
fi

# Check Frontend
echo ""
echo -e "${BLUE}3. Checking Frontend (Port $FRONTEND_PORT)...${NC}"
if check_port $FRONTEND_PORT; then
    echo -e "   ${GREEN}✓ Frontend is already running${NC}"
    echo -e "   ${GREEN}   URL: http://localhost:$FRONTEND_PORT${NC}"
else
    echo -e "   ${YELLOW}⚠ Frontend not running, starting now...${NC}"
    cd "$FRONTEND_DIR"

    # Clear old log
    rm -f "$FRONTEND_LOG"

    # Start frontend
    npm run dev > "$FRONTEND_LOG" 2>&1 &

    FRONTEND_PID=$!
    echo -e "   ${YELLOW}Frontend starting with PID: $FRONTEND_PID${NC}"

    # Wait for frontend to be ready
    if wait_for_server "http://localhost:$FRONTEND_PORT" "Frontend"; then
        echo -e "   ${GREEN}✓ Frontend started successfully${NC}"
        echo -e "   ${GREEN}   URL: http://localhost:$FRONTEND_PORT${NC}"
        echo -e "   ${GREEN}   Network: http://$(ipconfig getifaddr en0):$FRONTEND_PORT${NC}"
        echo -e "   ${GREEN}   Log: $FRONTEND_LOG${NC}"
    else
        echo -e "   ${RED}✗ Frontend failed to start${NC}"
        echo -e "   ${RED}   Check log: $FRONTEND_LOG${NC}"
        tail -20 "$FRONTEND_LOG"
        exit 1
    fi
fi

# Summary
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ All servers are running!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}Access your application:${NC}"
echo -e "  Frontend:  ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "  API Docs:  ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
echo ""
echo -e "${GREEN}View logs:${NC}"
echo -e "  Frontend:  ${YELLOW}tail -f $FRONTEND_LOG${NC}"
echo -e "  Backend:   ${YELLOW}tail -f $BACKEND_LOG${NC}"
echo ""
echo -e "${GREEN}Current git branch:${NC}"
cd "$PROJECT_DIR"
echo -e "  ${BLUE}$(git branch --show-current)${NC}"
echo ""
