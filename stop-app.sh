#!/bin/bash

# MedicalApp Stop Script

echo "🛑 Stopping MedicalApp..."

# Kill servers
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Backend stopped"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✅ Frontend stopped"

# Optional: Stop PostgreSQL (comment out if you want to keep DB running)
# docker stop test-postgres-fresh && echo "✅ PostgreSQL stopped"

echo "✅ All services stopped"
