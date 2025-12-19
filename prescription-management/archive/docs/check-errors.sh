#!/bin/bash

# Check Errors Script - Quick error detection across all servers
# Usage: ./check-errors.sh

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_LOG="/tmp/backend_dev.log"
FRONTEND_LOG="/tmp/frontend_dev.log"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Checking Server Logs for Errors${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check log file
check_log() {
    local log_file=$1
    local server_name=$2

    echo -e "${BLUE}Checking $server_name...${NC}"

    if [ ! -f "$log_file" ]; then
        echo -e "   ${YELLOW}⚠ Log file not found: $log_file${NC}"
        echo -e "   ${YELLOW}Server may not be running${NC}"
        echo ""
        return
    fi

    # Check for errors in last 50 lines
    local error_count=$(tail -50 "$log_file" | grep -i -E "error|exception|failed|traceback" | wc -l | tr -d ' ')

    if [ "$error_count" -gt 0 ]; then
        echo -e "   ${RED}✗ Found $error_count error(s) in last 50 lines${NC}"
        echo -e "   ${RED}Recent errors:${NC}"
        tail -50 "$log_file" | grep -i -E "error|exception|failed|traceback" --color=always | head -10
        echo ""
        echo -e "   ${YELLOW}View full log:${NC} tail -f $log_file"
    else
        echo -e "   ${GREEN}✓ No errors found in last 50 lines${NC}"
    fi
    echo ""
}

# Check Backend
check_log "$BACKEND_LOG" "Backend (FastAPI)"

# Check Frontend
check_log "$FRONTEND_LOG" "Frontend (Vite/React)"

# Check PostgreSQL
echo -e "${BLUE}Checking PostgreSQL (Docker)...${NC}"
if docker ps | grep -q postgres; then
    local pg_error_count=$(docker logs test-postgres-fresh 2>&1 | tail -50 | grep -i -E "error|fatal|panic" | wc -l | tr -d ' ')

    if [ "$pg_error_count" -gt 0 ]; then
        echo -e "   ${RED}✗ Found $pg_error_count error(s) in PostgreSQL logs${NC}"
        echo -e "   ${RED}Recent errors:${NC}"
        docker logs test-postgres-fresh 2>&1 | tail -50 | grep -i -E "error|fatal|panic" --color=always | head -10
        echo ""
        echo -e "   ${YELLOW}View full log:${NC} docker logs -f test-postgres-fresh"
    else
        echo -e "   ${GREEN}✓ No errors found in last 50 lines${NC}"
    fi
else
    echo -e "   ${RED}✗ PostgreSQL container not running${NC}"
fi
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Quick Commands:${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Backend errors:${NC}   tail -f $BACKEND_LOG | grep -i error"
echo -e "${YELLOW}Frontend errors:${NC}  tail -f $FRONTEND_LOG | grep -i error"
echo -e "${YELLOW}PostgreSQL:${NC}       docker logs -f test-postgres-fresh"
echo ""
