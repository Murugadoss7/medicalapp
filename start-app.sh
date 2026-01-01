#!/bin/bash

# MedicalApp Startup Script
# Simple script to start all services

echo "🚀 Starting MedicalApp..."

# 1. Start Docker Desktop
echo "▶️  Starting Docker..."
open -a Docker
sleep 5

# 2. Start PostgreSQL
echo "▶️  Starting PostgreSQL..."
docker start test-postgres-fresh 2>/dev/null || \
docker run -d --name test-postgres-fresh \
  -e POSTGRES_PASSWORD=prescription123 \
  -e POSTGRES_DB=prescription_management \
  -p 5432:5432 \
  postgres:14-alpine
sleep 3

# 3. Kill existing processes
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# 4. Start Backend
echo "▶️  Starting Backend (port 8000)..."
cd prescription-management/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
cd ../..

# 5. Start Frontend
echo "▶️  Starting Frontend (port 5173)..."
cd prescription-management/frontend
npm run dev > /tmp/frontend.log 2>&1 &
cd ../..

sleep 5

# 6. Status Check
echo ""
echo "✅ Services Started:"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/api/v1/docs"
echo "   Frontend: http://localhost:5173"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
