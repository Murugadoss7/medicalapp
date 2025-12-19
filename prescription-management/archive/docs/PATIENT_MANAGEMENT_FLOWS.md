# Patient Management Flow Diagrams

**Last Updated**: November 2, 2025  
**Purpose**: Visual documentation of implemented patient management workflows

## 1. Patient Registration Flow

```mermaid
flowchart TD
    A[Start Patient Registration] --> B[Check Mobile Number]
    B --> C{Family Exists?}
    C -->|Yes| D[Show Family Alert]
    D --> E[User Choice]
    E --> F[Add to Existing Family]
    E --> G[Continue New Registration]
    C -->|No| H[New Primary Patient Form]
    
    F --> I[Family Member Form]
    G --> H
    H --> J[Medical Information Form]
    J --> K[Add Family Members?]
    K -->|Yes| I
    K -->|No| L[Review & Submit]
    I --> M[More Family Members?]
    M -->|Yes| I
    M -->|No| L
    
    L --> N[Validate Form]
    N --> O{Valid?}
    O -->|No| P[Show Errors]
    P --> Q[Return to Form]
    O -->|Yes| R[Submit Registration]
    
    R --> S[Create Primary Patient API]
    S --> T[Create Family Members API]
    T --> U[Registration Complete]
    U --> V[Navigate to Family View]
```

## 2. Patient Search & Management Flow

```mermaid
flowchart TD
    A[Patient Search Page] --> B[Load All Patients by Default]
    B --> C[Display Patient List]
    C --> D[User Actions]
    
    D --> E[Search by Criteria]
    E --> F[Apply Filters]
    F --> G[API Search Request]
    G --> H[Update Patient List]
    
    D --> I[View Patient Details]
    I --> J[Navigate to Family View]
    
    D --> K[Edit Patient]
    K --> L[Open Registration in Edit Mode]
    
    D --> M[Book Appointment]
    M --> N[Navigate to Appointment Booking]
    
    H --> C
    J --> O[Family View Page]
    L --> P[Pre-filled Registration Form]
```

## 3. Family View & Management Flow

```mermaid
flowchart TD
    A[Family View Page] --> B[Load Family Data API]
    B --> C[Display Primary Member]
    C --> D[Display Family Members]
    D --> E[Family Actions Available]
    
    E --> F[Edit Primary Member]
    F --> G[Open Registration in Primary Edit Mode]
    
    E --> H[Edit Family Member]
    H --> I[Open Registration in Family Edit Mode]
    I --> J[Pre-load Full Family Context]
    J --> K[Highlight Member Being Edited]
    
    E --> L[Add New Family Member]
    L --> M[Open Registration in Add Mode]
    
    E --> N[View Medical History]
    E --> O[Book Appointment]
    
    G --> P[Update Primary Patient]
    K --> Q[Add/Update Family Members]
    M --> R[Add New Family Member]
    
    P --> S[Refresh Family View]
    Q --> S
    R --> S
```

## 4. API Integration Flow

```mermaid
flowchart TD
    A[Frontend Component] --> B{Action Type}
    
    B -->|Create| C[Create Patient API]
    C --> D[POST /patients/]
    D --> E[Primary Member Created]
    E --> F[Create Family Members]
    F --> G[POST /patients/families/{mobile}]
    
    B -->|Search| H[Search Patients API]
    H --> I[GET /patients/?params]
    
    B -->|Load Family| J[Get Family Members API]
    J --> K[GET /patients/families/{mobile}]
    
    B -->|Update| L[Update Patient API]
    L --> M[PUT /patients/{mobile}/{name}]
    
    G --> N[Handle API Response]
    I --> N
    K --> N
    M --> N
    
    N --> O{Success?}
    O -->|Yes| P[Update UI State]
    O -->|No| Q[Handle Error]
    Q --> R[Show Error Message]
    Q --> S[Retry or Fallback]
    
    P --> T[Navigate or Refresh]
```

## 5. Field Mapping & Validation Flow

```mermaid
flowchart TD
    A[Frontend Form Data] --> B[Validate Required Fields]
    B --> C{Validation Passed?}
    C -->|No| D[Show Field Errors]
    C -->|Yes| E[Map Frontend to Backend Fields]
    
    E --> F[Transform Field Names]
    F --> G[relationship → relationship_to_primary]
    F --> H[Add primary_contact_mobile]
    F --> I[Set primary_member flag]
    
    G --> J[Prepare API Payload]
    H --> J
    I --> J
    
    J --> K[Send API Request]
    K --> L[Backend Validation]
    L --> M{Backend Valid?}
    M -->|No| N[422 Error Response]
    M -->|Yes| O[Database Operation]
    
    N --> P[Parse Error Details]
    P --> Q[Map Backend to Frontend Errors]
    Q --> R[Display User-Friendly Errors]
    
    O --> S[Success Response]
    S --> T[Update Frontend State]
```

## 6. Edit Mode State Management

```mermaid
flowchart TD
    A[User Clicks Edit] --> B{Edit Type}
    
    B -->|Primary Member| C[Set editMode = 'primary']
    B -->|Family Member| D[Set editMode = 'family']
    
    C --> E[Load Primary Member Data]
    D --> F[Load Full Family Data]
    
    E --> G[Pre-fill Primary Form]
    F --> H[Pre-fill Family Context]
    H --> I[Highlight Editing Member]
    
    G --> J[Show Registration Form]
    I --> J
    
    J --> K[User Makes Changes]
    K --> L[Submit Form]
    
    L --> M{Edit Mode}
    M -->|Primary| N[Update Primary Patient Only]
    M -->|Family| O[Add New Family Members Only]
    
    N --> P[PUT /patients/{mobile}/{name}]
    O --> Q[POST /patients/families/{mobile}]
    
    P --> R[Success: Navigate to Family View]
    Q --> R
```

## 7. Error Handling & Recovery Flow

```mermaid
flowchart TD
    A[API Call Made] --> B[API Response]
    B --> C{Response Status}
    
    C -->|200-299| D[Success Path]
    C -->|400| E[Bad Request]
    C -->|401| F[Unauthorized]
    C -->|404| G[Not Found]
    C -->|422| H[Validation Error]
    C -->|500| I[Server Error]
    
    E --> J[Show Field Validation Errors]
    F --> K[Redirect to Login]
    G --> L[Show 'Resource Not Found' Message]
    H --> M[Parse Validation Details]
    I --> N[Show Generic Error Message]
    
    M --> O[Map to Specific Fields]
    O --> P[Highlight Problem Fields]
    P --> Q[Allow User to Correct]
    
    J --> Q
    L --> R[Offer Retry Option]
    N --> R
    
    Q --> S[User Retries]
    R --> S
    S --> A
    
    D --> T[Update UI Successfully]
```

## Implementation Notes

### **Key Features Implemented**

1. **Multi-Step Registration**: 4-step wizard with validation at each step
2. **Family Support**: Multiple patients sharing same mobile number
3. **Edit Modes**: Separate handling for primary vs family member edits
4. **Field Mapping**: Proper transformation between frontend and backend
5. **Error Recovery**: Comprehensive error handling and user feedback
6. **Search & Filter**: Advanced patient search with multiple criteria
7. **Navigation**: Clean breadcrumb and route management

### **API Endpoints Used**

- `GET /patients/` - List/search patients
- `POST /patients/` - Create primary patient
- `GET /patients/families/{mobile}` - Get family members
- `POST /patients/families/{mobile}` - Add family member
- `PUT /patients/{mobile}/{name}` - Update patient (planned)

### **State Management**

- Redux Toolkit for global state
- RTK Query for API caching and data fetching
- Local component state for form management
- URL parameters for edit mode configuration

### **Data Flow Patterns**

1. **Optimistic Updates**: UI updates immediately, reverts on error
2. **Progressive Loading**: Family data loads as needed
3. **Cache Invalidation**: Automatic refresh after mutations
4. **Error Boundaries**: Graceful error recovery with user feedback