# Multi-Tenancy Testing Guide
## Step-by-Step Testing Instructions

---

**📅 Created**: January 6, 2026
**🎯 Purpose**: Test multi-tenancy implementation end-to-end
**⚠️ Status**: **DO ON TEST DATABASE FIRST!**

---

## 🔒 Pre-Testing Checklist

### ✅ Before You Start

1. **Backup Your Database** ⚠️ **CRITICAL!**
   ```bash
   # If using Docker
   docker exec test-postgres-fresh pg_dump -U postgres prescription_management > backup_$(date +%Y%m%d_%H%M%S).sql

   # To restore if needed
   # cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i test-postgres-fresh psql -U postgres prescription_management
   ```

2. **Check Current Database State**
   ```bash
   docker exec -it test-postgres-fresh psql -U postgres -d prescription_management
   ```

   ```sql
   -- Check existing data
   SELECT COUNT(*) as user_count FROM users;
   SELECT COUNT(*) as doctor_count FROM doctors;
   SELECT COUNT(*) as patient_count FROM patients;

   -- Exit
   \q
   ```

---

## 📦 Phase 1: Run Migrations

### **Step 1: Check Migration Status**

```bash
cd prescription-management/backend

# Check current migration
alembic current

# See pending migrations
alembic heads
```

### **Step 2: Review Migrations (Optional)**

```bash
# See what will be created
alembic upgrade head --sql > preview_migrations.sql
cat preview_migrations.sql

# Or view specific migration
cat alembic/versions/2026_01_06_1400_create_tenants_table.py
```

### **Step 3: Run Migrations**

```bash
# Run all migrations
alembic upgrade head
```

**Expected Output:**
```
INFO  [alembic.runtime.migration] Running upgrade -> 2026_01_06_1400, create tenants table
✅ Tenants table created successfully

INFO  [alembic.runtime.migration] Running upgrade 2026_01_06_1400 -> 2026_01_06_1410, add tenant_id to all tables
✅ All tenant_id columns and indexes created successfully

INFO  [alembic.runtime.migration] Running upgrade 2026_01_06_1410 -> 2026_01_06_1415, migrate existing data to default tenant
✅ Migration complete! Total records migrated: XXX

INFO  [alembic.runtime.migration] Running upgrade 2026_01_06_1415 -> 2026_01_06_1420, enable row level security
✅ Row-Level Security successfully enabled!
```

### **Step 4: Verify Database Changes**

```bash
docker exec -it test-postgres-fresh psql -U postgres -d prescription_management
```

```sql
-- 1. Check tenants table exists
\d tenants

-- 2. Check tenant_id added to users
\d users
-- Should see: tenant_id | uuid | foreign key to tenants(id)

-- 3. Check if default tenant exists
SELECT * FROM tenants;
-- Should see: LEGACY_001 with premium plan

-- 4. Check if existing data has tenant_id
SELECT COUNT(*) as users_with_tenant FROM users WHERE tenant_id IS NOT NULL;
SELECT COUNT(*) as users_without_tenant FROM users WHERE tenant_id IS NULL;
-- All users should have tenant_id now

-- 5. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'doctors', 'patients')
  AND schemaname = 'public';
-- rowsecurity should be 't' (true)

-- 6. Check RLS policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
-- Should see policies like: users_tenant_isolation, doctors_tenant_isolation, etc.

-- Exit
\q
```

---

## 🧪 Phase 2: Test Tenant Isolation

### **Test 1: Verify RLS is Working**

```sql
-- Connect to database
docker exec -it test-postgres-fresh psql -U postgres -d prescription_management

-- Get the default tenant ID
SELECT id, tenant_name, tenant_code FROM tenants;
-- Copy the 'id' value

-- Set tenant context (replace with actual UUID)
SET app.current_tenant_id = 'your-tenant-uuid-here';

-- Query users - should see all users
SELECT id, email, role FROM users;

-- Change to a non-existent tenant
SET app.current_tenant_id = '00000000-0000-0000-0000-000000000000';

-- Query again - should see NO users (RLS working!)
SELECT id, email, role FROM users;

-- Reset
RESET app.current_tenant_id;

\q
```

### **Test 2: Test Medicine Sharing (Global vs Tenant)**

```sql
docker exec -it test-postgres-fresh psql -U postgres -d prescription_management

-- Get default tenant ID
SELECT id FROM tenants WHERE tenant_code = 'LEGACY_001';

-- Create a global medicine (tenant_id = NULL)
INSERT INTO medicines (
    name, composition, tenant_id, created_at, updated_at, is_active
) VALUES (
    'Global Paracetamol', 'Paracetamol 500mg', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true
);

-- Create a tenant-specific medicine
INSERT INTO medicines (
    name, composition, tenant_id, created_at, updated_at, is_active
) VALUES (
    'Custom Medicine', 'Custom Formula', (SELECT id FROM tenants WHERE tenant_code = 'LEGACY_001'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true
);

-- Set tenant context
SET app.current_tenant_id = (SELECT id::text FROM tenants WHERE tenant_code = 'LEGACY_001');

-- Query medicines - should see BOTH global AND tenant-specific
SELECT name, tenant_id IS NULL as is_global FROM medicines;

-- Create a second tenant for testing
INSERT INTO tenants (tenant_name, tenant_code, subscription_plan, max_doctors, max_patients)
VALUES ('Test Clinic', 'TEST_001', 'trial', 5, 1000);

-- Switch to new tenant
SET app.current_tenant_id = (SELECT id::text FROM tenants WHERE tenant_code = 'TEST_001');

-- Query medicines - should see ONLY global medicine (not TEST_001's custom one)
SELECT name, tenant_id IS NULL as is_global FROM medicines;

\q
```

---

## 🏥 Phase 3: Test Tenant Creation (Simulated)

### **Test 3: Create a New Tenant Manually**

```sql
docker exec -it test-postgres-fresh psql -U postgres -d prescription_management

-- Create a new tenant
INSERT INTO tenants (
    tenant_name,
    tenant_code,
    subscription_plan,
    subscription_status,
    trial_ends_at,
    max_clinics,
    max_doctors,
    max_patients,
    max_storage_mb,
    is_active
) VALUES (
    'Dr. Smith Dental Clinic',
    'SMITH_DENTAL',
    'trial',
    'active',
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    1,
    5,
    1000,
    1000,
    true
) RETURNING id;

-- Copy the returned ID for next steps
-- Example: 12345678-1234-1234-1234-123456789012

\q
```

### **Test 4: Verify Tenant Limits**

```sql
docker exec -it test-postgres-fresh psql -U postgres -d prescription_management

-- Check tenant limits
SELECT
    tenant_name,
    tenant_code,
    subscription_plan,
    max_doctors,
    max_patients,
    CASE
        WHEN trial_ends_at < CURRENT_TIMESTAMP THEN 'EXPIRED'
        WHEN trial_ends_at IS NOT NULL THEN 'TRIAL (expires in ' || EXTRACT(DAY FROM trial_ends_at - CURRENT_TIMESTAMP) || ' days)'
        ELSE 'ACTIVE'
    END as status
FROM tenants;

\q
```

---

## 📊 Phase 4: Test Multi-Clinic Support

### **Test 5: Doctor with Multiple Offices**

```sql
docker exec -it test-postgres-fresh psql -U postgres -d prescription_management

-- Get a doctor
SELECT id, tenant_id FROM doctors LIMIT 1;

-- Update doctor with multiple offices
UPDATE doctors
SET offices = '[
    {"id": "office-1", "name": "Main Clinic", "address": "123 Main St", "is_primary": true},
    {"id": "office-2", "name": "Downtown Branch", "address": "456 Downtown Ave", "is_primary": false}
]'::jsonb
WHERE id = 'your-doctor-id-here';

-- Verify
SELECT offices FROM doctors WHERE id = 'your-doctor-id-here';

\q
```

---

## 🔍 Phase 5: Verification Checklist

### ✅ **What to Verify**

| Item | Expected Result | Status |
|------|----------------|--------|
| Tenants table exists | ✓ Has all columns | [ ] |
| tenant_id on all tables | ✓ Foreign key to tenants | [ ] |
| Default tenant created | ✓ LEGACY_001 exists | [ ] |
| Existing data migrated | ✓ All records have tenant_id | [ ] |
| tenant_id is NOT NULL | ✓ Constraint enforced | [ ] |
| RLS enabled | ✓ rowsecurity = true | [ ] |
| RLS policies created | ✓ 26 policies (2 per table) | [ ] |
| Tenant isolation works | ✓ Can't see other tenant's data | [ ] |
| Medicine sharing works | ✓ Global medicines visible to all | [ ] |
| Indexes created | ✓ 16+ indexes on tenant_id | [ ] |

---

## 🐛 Troubleshooting

### **Problem: Migration fails**

```bash
# Check current migration
alembic current

# Rollback one step
alembic downgrade -1

# Try again
alembic upgrade head
```

### **Problem: RLS policies blocking queries**

```sql
-- Check if app.current_tenant_id is set
SHOW app.current_tenant_id;

-- If empty, set it
SET app.current_tenant_id = 'your-tenant-id';

-- Or disable RLS temporarily (testing only!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### **Problem: Can't see any data**

```sql
-- Check tenant_id values
SELECT DISTINCT tenant_id FROM users;

-- Set to correct tenant
SET app.current_tenant_id = 'correct-tenant-uuid';

-- Query again
SELECT * FROM users;
```

### **Problem: Want to start fresh**

```bash
# Rollback all migrations
cd prescription-management/backend
alembic downgrade base

# Restore from backup
cat your_backup.sql | docker exec -i test-postgres-fresh psql -U postgres prescription_management
```

---

## 📈 Performance Testing

### **Test 6: Check Query Performance**

```sql
docker exec -it test-postgres-fresh psql -U postgres -d prescription_management

-- Enable timing
\timing

-- Set tenant context
SET app.current_tenant_id = (SELECT id::text FROM tenants LIMIT 1);

-- Query users (should be fast with index)
EXPLAIN ANALYZE SELECT * FROM users WHERE tenant_id = current_setting('app.current_tenant_id')::uuid;

-- Should show: Index Scan using idx_users_tenant_id

\q
```

---

## ✅ Success Criteria

Your multi-tenancy implementation is working if:

1. ✅ All migrations ran successfully
2. ✅ Default tenant (LEGACY_001) exists
3. ✅ All existing data has tenant_id
4. ✅ RLS policies are active on all tables
5. ✅ Setting tenant context filters data correctly
6. ✅ Global medicines visible to all tenants
7. ✅ Tenant-specific medicines only visible to that tenant
8. ✅ Indexes improve query performance

---

## 🎯 Next Steps After Testing

Once testing is complete:

1. **Backend Updates**
   - [ ] Implement tenant middleware
   - [ ] Update JWT to include tenant_id
   - [ ] Create clinic registration API
   - [ ] Add subscription limit checks

2. **Frontend Updates**
   - [ ] Update registration form
   - [ ] Add tenant info to UI
   - [ ] Display subscription status

3. **Documentation**
   - [ ] Update API docs with tenant info
   - [ ] Create user guide for multi-clinic setup

---

## 🚨 Production Deployment Checklist

Before deploying to production:

- [ ] **Full database backup**
- [ ] **Test on staging with production data copy**
- [ ] **Verify all migrations run successfully**
- [ ] **Test tenant isolation thoroughly**
- [ ] **Load test with multiple tenants**
- [ ] **Verify RLS performance**
- [ ] **Update monitoring/alerts**
- [ ] **Prepare rollback plan**
- [ ] **Schedule maintenance window**

---

**🎉 Ready to test? Start with Phase 1!**
