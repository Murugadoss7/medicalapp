#!/bin/bash

# Prescription Management System - Server Stop Script
# Simple script to stop frontend and backend servers

set -e

FRONTEND_PORT=5173
BACKEND_PORT=8000

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Stopping Prescription Management Servers${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2

    echo -e "${BLUE}Stopping $name (Port $port)...${NC}"

    # Find PID using port
    PID=$(lsof -ti:$port 2>/dev/null || echo "")

    if [ -z "$PID" ]; then
        echo -e "   ${GREEN}✓ $name is not running${NC}"
    else
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        sleep 1

        # Verify it's stopped
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "   ${RED}✗ Failed to stop $name${NC}"
        else
            echo -e "   ${GREEN}✓ $name stopped successfully${NC}"
        fi
    fi
}

# Stop frontend
kill_port $FRONTEND_PORT "Frontend"

# Stop backend
echo ""
kill_port $BACKEND_PORT "Backend"

# Clean up log files
echo ""
echo -e "${BLUE}Cleaning up log files...${NC}"
rm -f /tmp/frontend_dev.log /tmp/backend_dev.log
echo -e "   ${GREEN}✓ Log files cleaned${NC}"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ All servers stopped!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
