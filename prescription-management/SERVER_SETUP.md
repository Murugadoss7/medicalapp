# Server Startup Scripts

Quick and easy way to start your Prescription Management System servers.

## 📋 Files Created

1. **start-servers.sh** - Main script to check and start all servers
2. **setup-alias.sh** - Optional script to create a convenient alias
3. **SERVER_SETUP.md** - This documentation file

---

## 🚀 Quick Start

### Method 1: Direct Script Execution (Recommended)

Simply run the script from anywhere:

```bash
cd ~/MedicalApp/prescription-management
./start-servers.sh
```

### Method 2: With Alias (Even Easier!)

Setup the alias once:

```bash
cd ~/MedicalApp/prescription-management
./setup-alias.sh
source ~/.zshrc  # or ~/.bash_profile or ~/.bashrc
```

After that, you can start servers from anywhere by simply typing:

```bash
start-medical
```

---

## 🔍 What the Script Does

The `start-servers.sh` script automatically:

1. ✅ **Checks PostgreSQL** - Ensures database is running in Docker
2. ✅ **Checks Backend** (Port 8000) - Starts if not running
3. ✅ **Checks Frontend** (Port 5173) - Starts if not running
4. ✅ **Waits for Health Checks** - Confirms servers are ready
5. ✅ **Shows Status** - Displays URLs and log file locations

### Output Example

```
================================================
  Prescription Management System - Server Check
================================================

1. Checking PostgreSQL...
   ✓ PostgreSQL is running

2. Checking Backend (Port 8000)...
   ✓ Backend is already running
   URL: http://localhost:8000

3. Checking Frontend (Port 5173)...
   ✓ Frontend is already running
   URL: http://localhost:5173

================================================
✓ All servers are running!
================================================

Access your application:
  Frontend:  http://localhost:5173
  Backend:   http://localhost:8000
  API Docs:  http://localhost:8000/docs

View logs:
  Frontend:  tail -f /tmp/frontend_dev.log
  Backend:   tail -f /tmp/backend_dev.log

Current git branch:
  development
```

---

## 📊 What Gets Checked

| Component | Port | Check Method | Health URL |
|-----------|------|--------------|------------|
| PostgreSQL | 5432 | Docker container | N/A |
| Backend | 8000 | Port + HTTP check | http://localhost:8000/api/v1/health |
| Frontend | 5173 | Port + HTTP check | http://localhost:5173 |

---

## 📝 Log Files

Both servers write logs to `/tmp/` directory:

- **Backend Log:** `/tmp/backend_dev.log`
- **Frontend Log:** `/tmp/frontend_dev.log`

View logs in real-time:

```bash
# Backend logs
tail -f /tmp/backend_dev.log

# Frontend logs
tail -f /tmp/frontend_dev.log
```

---

## 🛠️ Troubleshooting

### Script Permission Denied

If you get a permission denied error:

```bash
chmod +x start-servers.sh
chmod +x setup-alias.sh
```

### Servers Won't Start

1. Check if ports are already in use:
   ```bash
   lsof -ti:8000  # Backend
   lsof -ti:5173  # Frontend
   ```

2. Kill existing processes if needed:
   ```bash
   kill -9 $(lsof -ti:8000)
   kill -9 $(lsof -ti:5173)
   ```

3. Check the logs:
   ```bash
   tail -50 /tmp/backend_dev.log
   tail -50 /tmp/frontend_dev.log
   ```

### PostgreSQL Issues

If PostgreSQL won't start:

```bash
cd ~/MedicalApp/prescription-management
docker-compose down
docker-compose up -d postgres
```

Check PostgreSQL status:
```bash
docker ps | grep postgres
```

---

## 🎯 Manual Server Commands

If you need to start servers manually:

### Backend
```bash
cd ~/MedicalApp/prescription-management/backend
DATABASE_URL="postgresql://postgres:prescription123@localhost:5432/prescription_management" \
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd ~/MedicalApp/prescription-management/frontend
npm run dev
```

### PostgreSQL
```bash
cd ~/MedicalApp/prescription-management
docker-compose up -d postgres
```

---

## 🔧 Customization

### Change Ports

Edit `start-servers.sh` and modify these variables:

```bash
FRONTEND_PORT=5173
BACKEND_PORT=8000
```

### Change Log Locations

Edit these variables:

```bash
FRONTEND_LOG="/tmp/frontend_dev.log"
BACKEND_LOG="/tmp/backend_dev.log"
```

### Change Database Credentials

Edit the DATABASE_URL in the backend startup section:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

---

## 📚 Additional Resources

- **Frontend URL:** http://localhost:5173
- **Backend URL:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🤝 Support

For issues or questions:
1. Check log files first
2. Ensure all dependencies are installed (npm, python3, docker)
3. Verify you're on the correct git branch (`development`)

---

**Created:** November 2025
**Last Updated:** November 2025
**Maintained by:** Prescription Management System Team



 📝 Complete Guide to Finding Server Errors

  Log File Locations:

  | Server     | Log File Path                   |
  |------------|---------------------------------|
  | Backend    | /tmp/backend_dev.log            |
  | Frontend   | /tmp/frontend_dev.log           |
  | PostgreSQL | docker logs test-postgres-fresh |

  ---
  🚀 Quick Commands

  1. View Real-Time Logs (Recommended)

  # Backend (watch errors as they happen)
  tail -f /tmp/backend_dev.log

  # Frontend (watch errors as they happen)
  tail -f /tmp/frontend_dev.log

  # PostgreSQL
  docker logs -f test-postgres-fresh

  Tip: Press Ctrl+C to stop watching

  ---
  2. View Last N Lines

  # Backend - last 50 lines
  tail -50 /tmp/backend_dev.log

  # Frontend - last 50 lines
  tail -50 /tmp/frontend_dev.log

  # Backend - last 100 lines
  tail -100 /tmp/backend_dev.log

  ---
  3. Search for Specific Errors

  # Search for "error" in backend logs
  grep -i error /tmp/backend_dev.log

  # Search for exceptions
  grep -i exception /tmp/backend_dev.log

  # Search with context (5 lines before and after)
  grep -i -C 5 error /tmp/backend_dev.log

  # Watch for errors in real-time
  tail -f /tmp/backend_dev.log | grep -i error

  ---
  ✅ New Script: check-errors.sh

  I've created a bonus script that automatically checks all servers for errors!

  cd ~/MedicalApp/prescription-management
  ./check-errors.sh

  This will:
  - ✅ Check backend logs for errors
  - ✅ Check frontend logs for errors
  - ✅ Check PostgreSQL logs for errors
  - ✅ Show you the most recent errors from each server
  - ✅ Give you quick commands to investigate further

  ---
  📋 All Available Scripts

  You now have 4 helpful scripts:

  1. start-servers.sh - Check and start all servers
  2. check-errors.sh - Check all logs for errors ⭐ NEW
  3. setup-alias.sh - Setup convenient alias (one-time)
  4. SERVER_SETUP.md - Complete documentation

  ---
  💡 Common Error Scenarios

  Backend API Error (500, 404, etc.)

  tail -f /tmp/backend_dev.log | grep -i "error\|exception"

  Frontend Compilation Error

  tail -50 /tmp/frontend_dev.log

  Database Connection Error

  docker logs test-postgres-fresh 2>&1 | tail -50

  ---
  🎯 Example Usage

  Let's say you got an error on the website:

  Step 1: Check recent errors across all servers
  ./check-errors.sh

  Step 2: Watch the relevant server in real-time
  tail -f /tmp/backend_dev.log    # if backend issue
  tail -f /tmp/frontend_dev.log   # if frontend issue

  Step 3: Search for specific error message
  grep "YourErrorMessage" /tmp/backend_dev.log

  ---
  📂 File Locations Summary

  All scripts are in: /Users/murugadoss/MedicalApp/prescription-management/

  - ✅ start-servers.sh - Start/check servers
  - ✅ check-errors.sh - Check for errors ⭐ NEW
  - ✅ setup-alias.sh - Setup alias
  - ✅ SERVER_SETUP.md - Documentation

  Try running ./check-errors.sh now to see if there are any current errors!
