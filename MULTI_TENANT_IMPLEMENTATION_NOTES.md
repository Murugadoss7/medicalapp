# Multi-Tenant Implementation - Current Status & Decisions

## ✅ Existing Multi-Clinic Structure CONFIRMED

### **Current Implementation:**
```python
# Doctor model already has:
offices = Column(JSONB, nullable=True, default=list)
# Structure: [{"id": "uuid", "name": "Main Clinic", "address": "123 Main St", "is_primary": true}]

# Appointment model already has:
office_id = Column(String(50), nullable=True)
# References doctor's offices array
```

**DECISION**: ✅ **Keep existing offices JSONB structure** - It works well!

---

## 🎯 Multi-Tenancy Approach

### **What We're Adding:**
1. **`tenants` table** - Organization/clinic group management
2. **`tenant_id` column** - Added to all existing tables
3. **Medicine sharing** - Medicines shared across all offices within same tenant
4. **Row-Level Security** - PostgreSQL RLS for automatic tenant isolation

### **What We're NOT Changing:**
- ✅ Keep existing `offices` JSONB in doctors table
- ✅ Keep existing `office_id` in appointments table
- ✅ Keep all existing APIs working

---

## 📊 Architecture Summary

```
TENANT (Organization)
  ├── tenant_id: "abc-123"
  ├── subscription_plan: "trial"
  │
  ├── DOCTOR 1
  │   └── offices: [
  │         {"id": "off-1", "name": "Main Clinic", "is_primary": true},
  │         {"id": "off-2", "name": "Downtown", "is_primary": false}
  │       ]
  │
  ├── DOCTOR 2
  │   └── offices: [{"id": "off-3", "name": "North Branch", "is_primary": true}]
  │
  └── MEDICINES (shared across ALL offices in this tenant)
      - Paracetamol
      - Amoxicillin
      - Custom medicines
```

---

## 🔧 Implementation Steps

### **Phase 1: Database Schema** (Current)
1. Create `tenants` table
2. Add `tenant_id` to all tables
3. Keep existing offices JSONB structure
4. Medicines: Add `tenant_id` (NULL = global, NOT NULL = tenant-specific)

### **Phase 2: Backend Models**
1. Create Tenant model
2. Add tenant_id to all existing models
3. Create tenant middleware
4. Update JWT to include tenant_id

### **Phase 3: API Updates**
1. Clinic registration endpoint
2. Admin add-doctor endpoint
3. Update all queries to respect tenant_id

### **Phase 4: RLS & Security**
1. Enable Row-Level Security
2. Create tenant isolation policies
3. Test data isolation

---

## 🎯 Key Decisions Made

1. **Medicines**: Shared across ALL offices within same tenant ✅
2. **Offices**: Keep existing JSONB structure (don't create clinics table) ✅
3. **Doctor Creation**: Admin can create directly (no invitation needed) ✅
4. **Subscription Limits**: Trial=5 doctors, Basic=20, Premium=100 ✅

---

## 📝 Next Actions

- [x] Create feature/multi-tenancy branch
- [ ] Create tenants table migration
- [ ] Add tenant_id to all tables
- [ ] Create Tenant model
- [ ] Implement tenant middleware

---

**Branch**: `feature/multi-tenancy`
**Started**: January 6, 2026
