# Quick Start Guide

## 🚀 Starting Servers

### Start Both Servers
```bash
cd /Users/murugadoss/MedicalApp/prescription-management
./start-servers.sh
```

### Stop Both Servers
```bash
cd /Users/murugadoss/MedicalApp/prescription-management
./stop-servers.sh
```

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 👤 Test Credentials

### Doctor Account
- **Email**: `test.doctor@example.com`
- **Password**: `testpassword123`

### Doctor Account 2
- **Email**: `test.doctor2@example.com`
- **Password**: `testpassword123`

## 📊 Check Server Status

```bash
# Check if servers are running
lsof -ti:8000  # Backend
lsof -ti:5173  # Frontend

# View logs
tail -f /tmp/backend_dev.log   # Backend logs
tail -f /tmp/frontend_dev.log  # Frontend logs

# Test backend is responding
curl http://localhost:8000/health
```

## 🗄️ Database Access

```bash
# Connect to database via Docker
docker exec -it test-postgres-fresh psql -U prescription_user -d prescription_management

# Check users
docker exec test-postgres-fresh psql -U prescription_user -d prescription_management -c "SELECT email, role FROM users;"
```

## 🔧 Manual Server Start (if needed)

### Backend
```bash
cd /Users/murugadoss/MedicalApp/prescription-management/backend
DATABASE_URL="postgresql://prescription_user:prescription_password@localhost:5432/prescription_management" python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd /Users/murugadoss/MedicalApp/prescription-management/frontend
npm run dev
```

## 📝 Git Branch

Current branch: `development`

---

**Last Updated**: December 19, 2025
