# Claude Code Instructions
# Update on:  31-oct-2025:12PM
## Prescription Management System - Development Guidelines

### 🚨 CRITICAL RULES - ALWAYS FOLLOW

#### **1. DOCUMENTATION FIRST**
- **ALWAYS** read these files BEFORE any action:
  - `ENTITY_RELATIONSHIP_DIAGRAM.md` - Database schema authority
  - `API_REFERENCE_GUIDE.md` - API endpoints and field mappings
  - `FRONTEND_DEVELOPMENT_PLAN.md` - Page specifications
  - `PROJECT_ARCHITECTURE.md` - Folder structure
  - `DATE_STANDARDIZATION_PLAN.md` - date structure

#### **2. NO RANDOM FILE CREATION**
- **NEVER** create files in random locations
- **ALWAYS** follow folder structure in `PROJECT_ARCHITECTURE.md`
- **MUST** check existing files before creating new ones
- Use `Glob` and `Read` tools to check existing code first

#### **3. NO DUPLICATE FUNCTIONS**
- **ALWAYS** search existing functions with `Grep` tool before creating new ones
- **MUST** check service files, utils, and helpers first
- **NEVER** create duplicate API endpoints or database functions

#### **4. NO RANDOM ENDPOINT CHANGES**
- **NEVER** modify API endpoints without checking `API_REFERENCE_GUIDE.md`
- **MUST** verify endpoint exists in backend before frontend integration
- **ALWAYS** check field mappings in ERD before changing data structures

#### **5. VALIDATION WORKFLOW**
Before ANY code changes:
1. Read relevant documentation files
2. Search existing codebase with `Grep`/`Glob`
3. Verify API endpoint exists
4. Check field mappings match ERD
5. Only then proceed with changes

### 📁 PROJECT STRUCTURE REFERENCE

#### **Backend Structure**
```
backend/app/
├── api/v1/endpoints/     # API endpoints (95 total)
├── services/             # Business logic
├── models/               # Database models
├── schemas/              # Pydantic validation
└── core/                 # Configuration
```

#### **Testing Commands**
```bash
# Run specific module tests
python test_auth_simple.py
python test_patient_simple.py
python test_prescription_simple.py

# Start server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 🔍 SEARCH BEFORE ACTION

#### **Check Existing Functions**
```bash
# Search for existing functions
rg "def function_name" --type py
rg "class ClassName" --type py

# Search for API endpoints
rg "router\." backend/app/api/
rg "@router\.(get|post|put|delete)" backend/app/api/
```

#### **Check Database Models**
```bash
# Search existing models
rg "class.*Model" backend/app/models/
rg "Column\(" backend/app/models/

# Check field names
rg "mobile_number|first_name" backend/app/models/
```

### 🚫 FORBIDDEN ACTIONS

1. **Creating files outside documented structure**
2. **Modifying API endpoints without ERD reference**
3. **Adding duplicate business logic**
4. **Changing database fields randomly**
5. **Creating functions without checking existing ones**

### ✅ REQUIRED ACTIONS

1. **Always read documentation first**
2. **Always search existing code**
3. **Always verify API endpoints exist**
4. **Always check field mappings**
5. **Always follow project structure**

### 🎯 CURRENT PROJECT STATUS

- **Backend**: Complete (95 endpoints implemented)
- **Frontend**: Not started (use FRONTEND_DEVELOPMENT_PLAN.md)
- **Database**: ERD-compliant schema implemented
- **Tests**: Comprehensive test suites available

### 📋 WORKFLOW REMINDERS

- **Patient composite key**: mobile_number + first_name
- **API base URL**: http://localhost:8000/api/v1
- **Authentication**: JWT Bearer tokens
- **Field mappings**: See ENTITY_RELATIONSHIP_DIAGRAM.md
- **Page specs**: See FRONTEND_DEVELOPMENT_PLAN.md