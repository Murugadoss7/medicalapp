# Pre-Implementation Checklist
**Use this BEFORE making any code changes**
**Last Updated**: December 23, 2025

---

## ✅ IMPLEMENTED FEATURES (December 2025)

### Dental Module - Complete
- [x] Observation File Upload (xray, photos, documents)
- [x] Post-Procedure File Upload (photo_after)
- [x] AI Case Study Generation (GPT-4o-mini)
- [x] Case Study History (view, print, delete)
- [x] Treatment Dashboard (tooth-grouped journey view)

### Database Tables Added
- `dental_attachments` - File uploads for observations/procedures
- `case_studies` - AI-generated treatment case studies

### API Endpoints Added (16 new endpoints)
- `/dental/attachments/*` - 8 endpoints for file management
- `/case-studies/*` - 8 endpoints for AI case study generation

### Frontend Components Added
- `FileUpload.tsx` - Reusable file upload component
- `PostProcedureUploadDialog.tsx` - Upload after procedure completion
- `CaseStudyView.tsx` - Treatment dashboard with AI generation
- `TreatmentDetailsPanel.tsx` - Procedure details with upload

---

## ⚠️ CRITICAL: Read LESSONS_LEARNED.md First!

**Before using this checklist**, review recent issues:
- **File**: `LESSONS_LEARNED.md`
- **Purpose**: Learn from past mistakes to avoid repeating them
- **Location**: `/Users/murugadoss/MedicalApp/LESSONS_LEARNED.md`

**This checklist + LESSONS_LEARNED = Complete prevention system**

---

## ⚡ QUICK START (Must Do Every Time)

```
□ Read LESSONS_LEARNED.md for recent issues (START HERE!)
□ Use this checklist for implementation steps
□ Search for existing similar code: rg "feature_name"
□ Check documentation files for requirements
□ Follow project architecture structure
```

---

## 📚 DOCUMENTATION REVIEW

```
□ CLAUDE.md - Project rules and workflows
□ LESSONS_LEARNED.md - Common mistakes to avoid
□ ENTITY_RELATIONSHIP_DIAGRAM.md - Database schema
□ API_REFERENCE_GUIDE.md - Endpoint mappings
□ PROJECT_ARCHITECTURE.md - Folder structure
□ DATE_STANDARDIZATION_PLAN.md - Date handling
```

---

## 🔍 CODE SEARCH (Prevent Duplicates)

```bash
# Search for existing functions
rg "function_name" --type py
rg "class ClassName" --type py

# Search for API endpoints
rg "router\." backend/app/api/
rg "@router\.(get|post|put|delete)" backend/app/api/

# Search for components
rg "ComponentName" frontend/src/
```

---

## 🗄️ DATABASE CHECKS (Before Model Changes)

```
□ Check database schema matches model
□ Verify column names exist in table
□ Only use mixins with matching columns:
  - UUIDMixin → requires 'id' column
  - TimestampMixin → requires 'created_at', 'updated_at'
  - AuditMixin → requires 'created_by' column
  - ActiveMixin → requires 'is_active' column
□ Document if using custom audit fields
```

---

## 🛣️ API ENDPOINT CHECKLIST

If creating new API endpoints:

```
□ Create endpoint file in correct location
□ Import router in app/api/v1/__init__.py
□ Add include_router() with prefix and tags
□ Test endpoint returns non-404: curl localhost:8000/api/v1/{path}
□ Verify appears in /docs: http://localhost:8000/api/v1/docs
□ Check no duplicate endpoints exist
```

---

## 🎨 FRONTEND CHECKLIST

```
□ Check existing components before creating new
□ Follow PROJECT_ARCHITECTURE.md structure
□ Validate UUIDs before API calls
□ Handle both saved (UUID) and unsaved (temp ID) states
□ Use existing hooks and services
□ Follow Toast notification patterns
```

---

## ⚙️ BACKEND CHECKLIST

```
□ Follow ERD schema exactly
□ Use existing service patterns
□ Check field mappings in API_REFERENCE_GUIDE.md
□ Test endpoint immediately after creation
□ Handle errors properly (404, 422, 500)
□ Log errors for debugging
```

---

## 🧪 TESTING CHECKLIST

```
□ Test immediately after changes
□ Verify backend logs show no errors
□ Check frontend console for errors
□ Test with actual data/UUIDs
□ Verify database operations work
```

---

## 🚀 BEFORE YOU START CODING

**Ask yourself**:
1. Does this already exist? (Search first!)
2. Where does this belong? (Check architecture)
3. What can break? (Check dependencies)
4. How will I test this? (Plan verification)
5. **Have I checked LESSONS_LEARNED.md?** (Critical!)

**If unsure**:
- **Review LESSONS_LEARNED.md first** (see similar issues)
- Check similar existing code
- Use this checklist step-by-step
- Ask user for clarification

**Common Patterns in LESSONS_LEARNED.md**:
- Issue #1: Route registration (404 errors)
- Issue #2: Database mixins (500 errors)
- Issue #3: Toast imports (import errors)
- Issue #4: UUID validation (422 errors)
- Issue #5: Duplicate code

---

## 💡 Remember

- **Simplicity**: Impact minimal code
- **Search First**: Avoid duplicates
- **Test Early**: Catch issues fast
- **Document**: Update LESSONS_LEARNED.md if you find new issues

---

**Shortcut**: Save this checklist and reference it every time!
