# Technical Architecture Guide
## Prescription Management System

---

## 🏗️ System Architecture Overview

### Technology Stack
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Database      │
│                 │    │                  │    │                 │
│ Next.js 14+     │◄──►│ Python FastAPI   │◄──►│ PostgreSQL 14+  │
│ TypeScript      │    │ SQLAlchemy       │    │ Redis (Cache)   │
│ Tailwind CSS    │    │ Pydantic         │    │                 │
│ React Query     │    │ Celery (Tasks)   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │                       │
          │              ┌──────────────────┐            │
          └──────────────►│    Keycloak      │◄───────────┘
                         │  Authentication  │
                         └──────────────────┘
```

---

## 📁 Project Structure

### Root Directory Structure
```
prescription-management/
├── 📁 frontend/                 # Next.js application
├── 📁 backend/                  # FastAPI application
├── 📁 database/                 # Database scripts & migrations
├── 📁 keycloak/                 # Keycloak configuration
├── 📁 infrastructure/           # Docker, K8s, CI/CD
├── 📁 docs/                     # Documentation
├── 📄 docker-compose.yml        # Local development setup
├── 📄 docker-compose.prod.yml   # Production setup
├── 📄 README.md                 # Project overview
└── 📄 .gitignore               # Git ignore rules
```

### Frontend Structure (Next.js)
```
frontend/
├── 📁 src/
│   ├── 📁 app/                  # App Router (Next.js 13+)
│   │   ├── 📁 (auth)/
│   │   │   ├── 📁 login/
│   │   │   └── 📁 register/
│   │   ├── 📁 doctor/
│   │   │   ├── 📁 dashboard/
│   │   │   ├── 📁 patients/
│   │   │   ├── 📁 appointments/
│   │   │   └── 📁 prescriptions/
│   │   ├── 📁 admin/
│   │   │   ├── 📁 dashboard/
│   │   │   ├── 📁 users/
│   │   │   └── 📁 medicines/
│   │   ├── 📁 patient/
│   │   │   ├── 📁 dashboard/
│   │   │   ├── 📁 history/
│   │   │   └── 📁 prescriptions/
│   │   ├── 📄 layout.tsx        # Root layout
│   │   ├── 📄 page.tsx          # Home page
│   │   └── 📄 globals.css       # Global styles
│   ├── 📁 components/           # Reusable components
│   │   ├── 📁 ui/               # Base UI components
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 input.tsx
│   │   │   ├── 📄 modal.tsx
│   │   │   └── 📄 index.ts
│   │   ├── 📁 forms/            # Form components
│   │   │   ├── 📄 patient-registration-form.tsx
│   │   │   ├── 📄 prescription-form.tsx
│   │   │   └── 📄 index.ts
│   │   ├── 📁 layout/           # Layout components
│   │   │   ├── 📄 header.tsx
│   │   │   ├── 📄 sidebar.tsx
│   │   │   ├── 📄 navigation.tsx
│   │   │   └── 📄 index.ts
│   │   └── 📁 features/         # Feature-specific components
│   │       ├── 📁 prescription/
│   │       ├── 📁 patient/
│   │       └── 📁 appointment/
│   ├── 📁 lib/                  # Utility libraries
│   │   ├── 📄 api.ts            # API client
│   │   ├── 📄 auth.ts           # Authentication utilities
│   │   ├── 📄 utils.ts          # General utilities
│   │   ├── 📄 validations.ts    # Form validations
│   │   └── 📄 constants.ts      # Application constants
│   ├── 📁 hooks/                # Custom React hooks
│   │   ├── 📄 use-auth.ts
│   │   ├── 📄 use-api.ts
│   │   └── 📄 use-local-storage.ts
│   ├── 📁 stores/               # State management
│   │   ├── 📄 auth-store.ts
│   │   ├── 📄 patient-store.ts
│   │   └── 📄 prescription-store.ts
│   ├── 📁 types/                # TypeScript definitions
│   │   ├── 📄 auth.ts
│   │   ├── 📄 patient.ts
│   │   ├── 📄 prescription.ts
│   │   └── 📄 api.ts
│   └── 📁 styles/               # Additional styles
│       └── 📄 components.css
├── 📁 public/                   # Static assets
│   ├── 📁 icons/
│   ├── 📁 images/
│   └── 📄 manifest.json         # PWA manifest
├── 📁 __tests__/                # Tests
│   ├── 📁 components/
│   ├── 📁 pages/
│   └── 📁 utils/
├── 📄 next.config.js            # Next.js configuration
├── 📄 tailwind.config.js        # Tailwind configuration
├── 📄 tsconfig.json             # TypeScript configuration
├── 📄 package.json              # Dependencies
├── 📄 .eslintrc.json           # ESLint configuration
├── 📄 .prettierrc              # Prettier configuration
└── 📄 jest.config.js           # Jest configuration
```

### Backend Structure (FastAPI)
```
backend/
├── 📁 app/
│   ├── 📄 __init__.py
│   ├── 📄 main.py               # FastAPI application entry
│   ├── 📁 api/                  # API routes
│   │   ├── 📄 __init__.py
│   │   ├── 📁 v1/               # API version 1
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 auth.py       # Authentication routes
│   │   │   ├── 📄 patients.py   # Patient management
│   │   │   ├── 📄 doctors.py    # Doctor management
│   │   │   ├── 📄 prescriptions.py # Prescription routes
│   │   │   ├── 📄 medicines.py  # Medicine catalog
│   │   │   ├── 📄 appointments.py # Appointment routes
│   │   │   └── 📄 reports.py    # Reporting routes
│   │   └── 📄 deps.py           # Dependencies
│   ├── 📁 core/                 # Core functionality
│   │   ├── 📄 __init__.py
│   │   ├── 📄 config.py         # Configuration
│   │   ├── 📄 security.py       # Security utilities
│   │   ├── 📄 database.py       # Database connection
│   │   └── 📄 logging.py        # Logging configuration
│   ├── 📁 models/               # SQLAlchemy models
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py           # Base model
│   │   ├── 📄 user.py           # User models
│   │   ├── 📄 patient.py        # Patient model
│   │   ├── 📄 doctor.py         # Doctor model
│   │   ├── 📄 prescription.py   # Prescription model
│   │   ├── 📄 medicine.py       # Medicine model
│   │   ├── 📄 appointment.py    # Appointment model
│   │   └── 📄 audit.py          # Audit trail model
│   ├── 📁 schemas/              # Pydantic schemas
│   │   ├── 📄 __init__.py
│   │   ├── 📄 user.py
│   │   ├── 📄 patient.py
│   │   ├── 📄 prescription.py
│   │   ├── 📄 medicine.py
│   │   └── 📄 appointment.py
│   ├── 📁 services/             # Business logic
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth_service.py
│   │   ├── 📄 patient_service.py
│   │   ├── 📄 prescription_service.py
│   │   ├── 📄 medicine_service.py
│   │   └── 📄 audit_service.py
│   ├── 📁 repositories/         # Data access layer
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py
│   │   ├── 📄 patient_repository.py
│   │   ├── 📄 prescription_repository.py
│   │   └── 📄 medicine_repository.py
│   ├── 📁 utils/                # Utilities
│   │   ├── 📄 __init__.py
│   │   ├── 📄 validators.py
│   │   ├── 📄 helpers.py
│   │   └── 📄 exceptions.py
│   └── 📁 workers/              # Background tasks
│       ├── 📄 __init__.py
│       ├── 📄 celery_app.py
│       └── 📄 tasks.py
├── 📁 alembic/                  # Database migrations
│   ├── 📁 versions/
│   ├── 📄 env.py
│   └── 📄 script.py.mako
├── 📁 tests/                    # Tests
│   ├── 📄 __init__.py
│   ├── 📄 conftest.py
│   ├── 📁 api/
│   ├── 📁 services/
│   └── 📁 utils/
├── 📄 requirements.txt          # Python dependencies
├── 📄 requirements-dev.txt      # Development dependencies
├── 📄 alembic.ini              # Alembic configuration
├── 📄 pytest.ini              # Pytest configuration
├── 📄 pyproject.toml           # Python project configuration
└── 📄 Dockerfile              # Docker configuration
```

---

## 🔧 Development Setup Guide

### Prerequisites
```bash
# Required software
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Docker & Docker Compose
- Git
```

### Local Development Setup

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd prescription-management

# Setup environment files
cp .env.example .env.local
cp backend/.env.example backend/.env
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-dev.txt

# Setup database
alembic upgrade head

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

#### 4. Database Setup
```bash
# Using Docker for local development
docker-compose up -d postgres redis

# Or install PostgreSQL locally and create database
createdb prescription_management
```

---

## 📊 Database Schema Design

### Core Tables Structure
```sql
-- Users table (managed by Keycloak)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table with composite key for family registration
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(15) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_enum NOT NULL,
    email VARCHAR(255),
    address TEXT,
    relationship_to_primary relationship_enum DEFAULT 'self',
    primary_contact_mobile VARCHAR(15), -- For family members, refers to main account holder
    emergency_contact JSONB,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite primary key: mobile_number + first_name
    PRIMARY KEY (mobile_number, first_name),
    
    -- Additional unique identifier for internal use
    UNIQUE(id)
);

-- Family relationships enum
CREATE TYPE relationship_enum AS ENUM (
    'self',
    'spouse',
    'child', 
    'parent',
    'sibling',
    'other'
);

-- Gender enum
CREATE TYPE gender_enum AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(255),
    qualification TEXT,
    experience_years INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicines table
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    composition TEXT,
    manufacturer VARCHAR(255),
    dosage_forms VARCHAR[],
    strength VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table with composite key reference
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(100) UNIQUE NOT NULL,
    -- Reference to patient using composite key
    patient_mobile_number VARCHAR(15) NOT NULL,
    patient_first_name VARCHAR(100) NOT NULL,
    -- Also maintain UUID reference for easier queries
    patient_uuid UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    visit_date DATE NOT NULL,
    diagnosis TEXT,
    symptoms TEXT,
    notes TEXT,
    status prescription_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint to patients table using composite key
    FOREIGN KEY (patient_mobile_number, patient_first_name) 
        REFERENCES patients(mobile_number, first_name)
);

-- Prescription status enum
CREATE TYPE prescription_status AS ENUM (
    'active',
    'completed',
    'cancelled',
    'expired'
);

-- Prescription items table
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id),
    medicine_id UUID REFERENCES medicines(id),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT,
    quantity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexing Strategy
```sql
-- Performance indexes for composite key structure
CREATE INDEX idx_patients_mobile_number ON patients(mobile_number);
CREATE INDEX idx_patients_id ON patients(id); -- For UUID lookups
CREATE INDEX idx_patients_primary_contact ON patients(primary_contact_mobile);
CREATE INDEX idx_prescriptions_patient_composite ON prescriptions(patient_mobile_number, patient_first_name);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_prescriptions_visit_date ON prescriptions(visit_date);

-- Family management indexes
CREATE INDEX idx_patients_family ON patients(mobile_number, relationship_to_primary);
CREATE INDEX idx_patients_active ON patients(is_active) WHERE is_active = true;

-- Search indexes
CREATE INDEX idx_patients_name_search ON patients(first_name, last_name);
CREATE INDEX idx_patients_full_text_search ON patients USING gin(to_tsvector('english', first_name || ' ' || last_name));
CREATE INDEX idx_medicines_search ON medicines USING gin(to_tsvector('english', name || ' ' || generic_name));
```

---

## 🎨 UI/UX Design Principles

### Responsive Design Strategy
```css
/* Breakpoints */
/* Mobile: 320px - 768px */
/* Tablet: 768px - 1024px (Primary target) */
/* Desktop: 1024px+ (Secondary target) */

/* Tailwind CSS custom configuration */
module.exports = {
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',   // Tablet start
      'lg': '1024px',  // Desktop start
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    }
  }
}
```

### Accessibility Features
```typescript
// Example accessible component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  'aria-label'?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
  onClick,
  ...props
}) => {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // Size variants
        {
          'h-9 px-3 text-sm': size === 'sm',
          'h-11 px-4 py-2': size === 'md',
          'h-12 px-8 text-lg': size === 'lg',
        },
        // Color variants
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500': variant === 'secondary',
        }
      )}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
```

---

## 🔒 Security Implementation

### Authentication Flow
```typescript
// Keycloak integration example
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
  realm: 'prescription-management',
  clientId: 'prescription-app'
});

export const initKeycloak = async () => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
    });
    
    if (authenticated) {
      // Setup token refresh
      setInterval(() => {
        keycloak.updateToken(70).catch(() => {
          keycloak.login();
        });
      }, 60000);
    }
    
    return authenticated;
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    return false;
  }
};
```

### API Security
```python
# FastAPI security dependencies
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials, 
            JWT_SECRET_KEY, 
            algorithms=[JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# Role-based access control
def require_role(required_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker
```

---

## 📈 Performance Optimization

### Frontend Optimization
```typescript
// Next.js optimization strategies
// 1. Image optimization
import Image from 'next/image';

// 2. Dynamic imports for code splitting
const PrescriptionForm = dynamic(() => import('./PrescriptionForm'), {
  loading: () => <div>Loading...</div>,
});

// 3. React Query for API caching
import { useQuery } from '@tanstack/react-query';

export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: fetchPatients,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### Backend Optimization
```python
# FastAPI optimization
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import selectinload

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Database query optimization
async def get_patient_with_prescriptions(patient_id: UUID):
    return await session.execute(
        select(Patient)
        .options(selectinload(Patient.prescriptions))
        .where(Patient.id == patient_id)
    ).scalar_one_or_none()

# Redis caching
from redis import Redis
import json

redis_client = Redis(host='localhost', port=6379, db=0)

async def get_cached_medicines():
    cached = redis_client.get('medicines')
    if cached:
        return json.loads(cached)
    
    medicines = await get_all_medicines()
    redis_client.setex('medicines', 300, json.dumps(medicines))
    return medicines
```

---

## 🚀 Deployment Strategy

### Docker Configuration
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🧪 Testing Strategy

### Frontend Testing
```typescript
// Component testing with Jest and Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { PrescriptionForm } from './PrescriptionForm';

describe('PrescriptionForm', () => {
  it('should render form fields', () => {
    render(<PrescriptionForm />);
    
    expect(screen.getByLabelText(/patient name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/diagnosis/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save prescription/i })).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<PrescriptionForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/diagnosis/i), {
      target: { value: 'Common cold' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /save prescription/i }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      diagnosis: 'Common cold'
    });
  });
});
```

### Backend Testing
```python
# API testing with pytest
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_prescription():
    prescription_data = {
        "patient_id": "123e4567-e89b-12d3-a456-426614174000",
        "diagnosis": "Common cold",
        "medicines": [
            {
                "medicine_id": "456e7890-e89b-12d3-a456-426614174000",
                "dosage": "500mg",
                "frequency": "Twice daily",
                "duration": "5 days"
            }
        ]
    }
    
    response = client.post(
        "/api/v1/prescriptions/",
        json=prescription_data,
        headers={"Authorization": "Bearer valid-token"}
    )
    
    assert response.status_code == 201
    assert response.json()["diagnosis"] == "Common cold"
```

---

This architecture provides a robust, scalable, and maintainable foundation for your prescription management system with excellent tablet/desktop support and accessibility compliance.