# Case Study Tab - Option B Implementation Plan
**Created**: December 21, 2025
**Type**: Smart Timeline View (Grouped by Tooth)
**Status**: 📋 Ready to Implement

---

## 🎯 OVERVIEW

**Goal**: Create intelligent timeline view showing treatment progression per tooth with:
- Auto-grouping by tooth number
- Chronological timeline per tooth
- Selectable observations/procedures/images
- iPad-first UX (buttons only, no dropdowns)
- Prepare for Phase 4 AI generation

**Estimated Time**: 4-5 hours
**Complexity**: Medium-High

---

## 📐 UI/UX DESIGN

### Desktop Layout (1200px+):
```
┌─────────────────────────────────────────────────────────────┐
│ Case Study - Treatment Journey                               │
├─────────────────────────────────────────────────────────────┤
│ Filter by Tooth:                                            │
│ [All] [11] [12] [13] [14] [15] [16] [21] ... (buttons)     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🦷 Tooth 16 - Root Canal Treatment                      │ │
│ │ 4 visits • Dec 1 - Dec 20, 2025                        │ │
│ │                                                         │ │
│ │ Timeline:                                               │ │
│ │ ┌─────────────────────────────────────────────────┐   │ │
│ │ │ ☐ Visit 1 - Dec 1, 2025                        │   │ │
│ │ │ Observation: Deep cavity, pulp exposed         │   │ │
│ │ │ Procedure: Emergency pulpectomy                │   │ │
│ │ │ 📎 2 attachments                               │   │ │
│ │ │ [🖼️] [🖼️]                                      │   │ │
│ │ └─────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────┐   │ │
│ │ │ ☑ Visit 2 - Dec 5, 2025                        │   │ │
│ │ │ Observation: Canal cleaned, ready for shaping  │   │ │
│ │ │ Procedure: Canal preparation                   │   │ │
│ │ │ 📎 3 attachments                               │   │ │
│ │ │ [🖼️] [🖼️] [🖼️]                                │   │ │
│ │ └─────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │ [Select All] [Deselect All] [Preview Case Study →]    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🦷 Tooth 14 - Composite Filling                        │ │
│ │ 1 visit • Nov 15, 2025                                 │ │
│ │ ... (collapsed)                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### iPad Layout (768-1024px):
```
┌─────────────────────────────────┐
│ Case Study                       │
├─────────────────────────────────┤
│ Tooth:                          │
│ [All] [11] [12] [13] [14] [15] │
│ [16] [21] [22] [23] [24] [25]  │
├─────────────────────────────────┤
│ 🦷 Tooth 16                     │
│ Root Canal Treatment            │
│ 4 visits • Dec 1-20, 2025      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ☐ Dec 1, 2025              │ │
│ │ Emergency pulpectomy       │ │
│ │ [🖼️] [🖼️]                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ☑ Dec 5, 2025              │ │
│ │ Canal preparation          │ │
│ │ [🖼️] [🖼️] [🖼️]            │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Select All] [Preview →]       │
└─────────────────────────────────┘
```

---

## 🏗️ COMPONENT ARCHITECTURE

### Main Component:
```
CaseStudyView.tsx
├── ToothFilterBar (buttons)
├── ToothTreatmentCard[] (one per tooth)
│   └── TimelineItem[] (one per visit)
│       ├── VisitCheckbox
│       ├── ObservationInfo
│       ├── ProcedureInfo
│       └── ImageSelector (thumbnails with checkboxes)
└── ActionBar
    ├── Select All button
    ├── Deselect All button
    └── Preview Case Study button (Phase 4)
```

### State Management:
```typescript
interface CaseStudyState {
  // Data
  observations: DentalObservation[];
  procedures: DentalProcedure[];
  attachments: DentalAttachment[];

  // Grouping
  toothGroups: Map<string, ToothTreatmentGroup>;

  // Filters
  selectedTooth: string | 'all';

  // Selection for case study
  selectedVisits: Set<string>; // visit IDs
  selectedImages: Set<string>; // attachment IDs

  // Loading
  loading: boolean;
}

interface ToothTreatmentGroup {
  toothNumber: string;
  visits: VisitData[];
  summary: {
    totalVisits: number;
    dateRange: { start: Date; end: Date };
    treatmentType: string; // inferred from procedures
  };
}

interface VisitData {
  visitId: string; // generated or appointment_id
  date: Date;
  observations: DentalObservation[];
  procedures: DentalProcedure[];
  attachments: DentalAttachment[];
}
```

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Add API Methods (20 min) ✅
**File**: `frontend/src/services/dentalService.ts`

**Add**:
```typescript
// Get patient observations
getPatientObservations: async (mobile: string, firstName: string) => {
  const response = await axiosInstance.get(
    `/dental/patients/${mobile}/${firstName}/observations`
  );
  return response.data;
},

// Get patient procedures
getPatientProcedures: async (mobile: string, firstName: string) => {
  const response = await axiosInstance.get(
    `/dental/patients/${mobile}/${firstName}/procedures`
  );
  return response.data;
},

// Get patient attachments (already exists, verify)
getPatientAttachments: async (mobile: string, firstName: string, fileType?: string) => {
  const params = new URLSearchParams();
  if (fileType) params.append('file_type', fileType);

  const response = await axiosInstance.get(
    `/dental/patients/${mobile}/${firstName}/attachments?${params.toString()}`
  );
  return response.data;
},
```

**Checklist**:
```
□ Check if observations endpoint exists
□ Check if procedures endpoint exists
□ Add missing methods
□ Test with console.log
```

---

### Step 2: Create Data Grouping Utility (30 min) 📊
**File**: `frontend/src/utils/caseStudyHelpers.ts` (new)

```typescript
/**
 * Group observations, procedures, and attachments by tooth and date
 */
export function groupByTooth(
  observations: DentalObservation[],
  procedures: DentalProcedure[],
  attachments: DentalAttachment[]
): Map<string, ToothTreatmentGroup> {
  const groups = new Map<string, ToothTreatmentGroup>();

  // Group observations by tooth
  observations.forEach(obs => {
    obs.tooth_numbers.forEach(toothNum => {
      if (!groups.has(toothNum)) {
        groups.set(toothNum, {
          toothNumber: toothNum,
          visits: [],
          summary: { totalVisits: 0, dateRange: null, treatmentType: '' }
        });
      }

      const group = groups.get(toothNum)!;
      // Add to visits array (grouped by date)
      addToVisits(group.visits, obs, procedures, attachments);
    });
  });

  // Calculate summaries
  groups.forEach(group => {
    group.summary.totalVisits = group.visits.length;
    group.summary.dateRange = calculateDateRange(group.visits);
    group.summary.treatmentType = inferTreatmentType(group.visits);
  });

  return groups;
}

/**
 * Infer treatment type from procedures
 */
function inferTreatmentType(visits: VisitData[]): string {
  const procedureNames = visits
    .flatMap(v => v.procedures)
    .map(p => p.procedure_name.toLowerCase());

  if (procedureNames.some(n => n.includes('root canal') || n.includes('rct'))) {
    return 'Root Canal Treatment';
  }
  if (procedureNames.some(n => n.includes('filling') || n.includes('restoration'))) {
    return 'Restorative Treatment';
  }
  if (procedureNames.some(n => n.includes('extraction'))) {
    return 'Extraction';
  }
  if (procedureNames.some(n => n.includes('crown') || n.includes('bridge'))) {
    return 'Prosthetic Treatment';
  }

  return 'General Treatment';
}
```

**Checklist**:
```
□ Create utility file
□ Implement groupByTooth function
□ Implement inferTreatmentType
□ Add date range calculation
□ Test with sample data
```

---

### Step 3: Create ToothFilterBar Component (30 min) 🔘
**File**: `frontend/src/components/treatments/ToothFilterBar.tsx` (new)

```typescript
interface ToothFilterBarProps {
  availableTeeth: string[];
  selectedTooth: string;
  onToothChange: (tooth: string) => void;
}

const ToothFilterBar: React.FC<ToothFilterBarProps> = ({
  availableTeeth,
  selectedTooth,
  onToothChange,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Filter by Tooth:
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant={selectedTooth === 'all' ? 'contained' : 'outlined'}
          onClick={() => onToothChange('all')}
          sx={{ minWidth: 60, minHeight: 44 }} // iPad-friendly
        >
          All
        </Button>

        {availableTeeth.sort().map(tooth => (
          <Button
            key={tooth}
            variant={selectedTooth === tooth ? 'contained' : 'outlined'}
            onClick={() => onToothChange(tooth)}
            sx={{ minWidth: 60, minHeight: 44 }} // iPad-friendly
          >
            {tooth}
          </Button>
        ))}
      </Box>
    </Box>
  );
};
```

**Checklist**:
```
□ Create component file
□ Add button grid layout
□ Style active/inactive states
□ Ensure min 44px height (iPad)
□ Test tooth selection
```

---

### Step 4: Create TimelineItem Component (45 min) 📅
**File**: `frontend/src/components/treatments/TimelineItem.tsx` (new)

```typescript
interface TimelineItemProps {
  visit: VisitData;
  isSelected: boolean;
  selectedImages: Set<string>;
  onToggleVisit: (visitId: string) => void;
  onToggleImage: (imageId: string) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  visit,
  isSelected,
  selectedImages,
  onToggleVisit,
  onToggleImage,
}) => {
  return (
    <Paper
      elevation={isSelected ? 3 : 1}
      sx={{
        p: 2,
        mb: 2,
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        transition: 'all 0.2s',
      }}
    >
      {/* Header with checkbox */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleVisit(visit.visitId)}
          sx={{ mt: -1, minWidth: 44, minHeight: 44 }} // iPad
        />

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {format(visit.date, 'MMM dd, yyyy')}
          </Typography>

          {/* Observations */}
          {visit.observations.map(obs => (
            <Typography key={obs.id} variant="body2" color="text.secondary">
              Observation: {obs.observation_notes}
            </Typography>
          ))}

          {/* Procedures */}
          {visit.procedures.map(proc => (
            <Typography key={proc.id} variant="body2" color="primary">
              Procedure: {proc.procedure_name}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* Attachments with selection */}
      {visit.attachments.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            📎 {visit.attachments.length} attachment(s)
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {visit.attachments.map(att => (
              <Box
                key={att.id}
                sx={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  cursor: 'pointer',
                }}
                onClick={() => onToggleImage(att.id)}
              >
                <img
                  src={att.file_path}
                  alt={att.file_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: selectedImages.has(att.id)
                      ? '3px solid blue'
                      : '1px solid #ddd',
                  }}
                />

                {/* Selection checkbox overlay */}
                <Checkbox
                  checked={selectedImages.has(att.id)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'white',
                    borderRadius: '50%',
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};
```

**Checklist**:
```
□ Create component file
□ Add visit checkbox
□ Display observation info
□ Display procedure info
□ Add image thumbnails with checkboxes
□ Style selected state
□ Test selection/deselection
```

---

### Step 5: Create ToothTreatmentCard Component (30 min) 🦷
**File**: `frontend/src/components/treatments/ToothTreatmentCard.tsx` (new)

```typescript
interface ToothTreatmentCardProps {
  group: ToothTreatmentGroup;
  selectedVisits: Set<string>;
  selectedImages: Set<string>;
  onToggleVisit: (visitId: string) => void;
  onToggleImage: (imageId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const ToothTreatmentCard: React.FC<ToothTreatmentCardProps> = ({
  group,
  selectedVisits,
  selectedImages,
  onToggleVisit,
  onToggleImage,
  onSelectAll,
  onDeselectAll,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            🦷 Tooth {group.toothNumber}
          </Typography>
          <Typography variant="body2">
            {group.summary.treatmentType}
          </Typography>
        </Box>

        <Typography variant="caption">
          {group.summary.totalVisits} visit(s) •
          {format(group.summary.dateRange.start, 'MMM dd')} -
          {format(group.summary.dateRange.end, 'MMM dd, yyyy')}
        </Typography>
      </Box>

      {/* Timeline (collapsible) */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Timeline items */}
          {group.visits.map(visit => (
            <TimelineItem
              key={visit.visitId}
              visit={visit}
              isSelected={selectedVisits.has(visit.visitId)}
              selectedImages={selectedImages}
              onToggleVisit={onToggleVisit}
              onToggleImage={onToggleImage}
            />
          ))}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={onSelectAll}
              sx={{ minHeight: 44 }} // iPad
            >
              Select All
            </Button>
            <Button
              variant="outlined"
              onClick={onDeselectAll}
              sx={{ minHeight: 44 }} // iPad
            >
              Deselect All
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};
```

**Checklist**:
```
□ Create component file
□ Add collapsible header
□ Display tooth number and treatment type
□ Render timeline items
□ Add Select All/Deselect All buttons
□ Test expand/collapse
```

---

### Step 6: Create Main CaseStudyView Component (60 min) 🎯
**File**: `frontend/src/components/treatments/CaseStudyView.tsx` (new)

```typescript
interface CaseStudyViewProps {
  patientMobile: string;
  patientFirstName: string;
}

const CaseStudyView: React.FC<CaseStudyViewProps> = ({
  patientMobile,
  patientFirstName,
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [observations, setObservations] = useState<DentalObservation[]>([]);
  const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
  const [attachments, setAttachments] = useState<DentalAttachment[]>([]);
  const [toothGroups, setToothGroups] = useState<Map<string, ToothTreatmentGroup>>(new Map());
  const [selectedTooth, setSelectedTooth] = useState<string>('all');
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // Load data
  useEffect(() => {
    loadCaseStudyData();
  }, [patientMobile, patientFirstName]);

  const loadCaseStudyData = async () => {
    setLoading(true);
    try {
      const [obsData, procData, attData] = await Promise.all([
        dentalService.getPatientObservations(patientMobile, patientFirstName),
        dentalService.getPatientProcedures(patientMobile, patientFirstName),
        dentalService.getPatientAttachments(patientMobile, patientFirstName),
      ]);

      setObservations(obsData);
      setProcedures(procData);
      setAttachments(attData);

      // Group by tooth
      const groups = groupByTooth(obsData, procData, attData);
      setToothGroups(groups);
    } catch (error) {
      toast.error('Failed to load case study data');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleToothChange = (tooth: string) => {
    setSelectedTooth(tooth);
  };

  const handleToggleVisit = (visitId: string) => {
    setSelectedVisits(prev => {
      const next = new Set(prev);
      if (next.has(visitId)) {
        next.delete(visitId);
      } else {
        next.add(visitId);
      }
      return next;
    });
  };

  const handleToggleImage = (imageId: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  // Filtered groups
  const filteredGroups = selectedTooth === 'all'
    ? Array.from(toothGroups.values())
    : [toothGroups.get(selectedTooth)].filter(Boolean);

  if (loading) {
    return <CircularProgress />;
  }

  if (toothGroups.size === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          📁 No Treatment Data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This patient has no dental observations or procedures yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Case Study - Treatment Journey
      </Typography>

      {/* Tooth filter */}
      <ToothFilterBar
        availableTeeth={Array.from(toothGroups.keys())}
        selectedTooth={selectedTooth}
        onToothChange={handleToothChange}
      />

      {/* Treatment cards */}
      {filteredGroups.map(group => (
        <ToothTreatmentCard
          key={group.toothNumber}
          group={group}
          selectedVisits={selectedVisits}
          selectedImages={selectedImages}
          onToggleVisit={handleToggleVisit}
          onToggleImage={handleToggleImage}
          onSelectAll={() => {
            // Select all visits for this tooth
            group.visits.forEach(v => selectedVisits.add(v.visitId));
            setSelectedVisits(new Set(selectedVisits));
          }}
          onDeselectAll={() => {
            // Deselect all visits for this tooth
            group.visits.forEach(v => selectedVisits.delete(v.visitId));
            setSelectedVisits(new Set(selectedVisits));
          }}
        />
      ))}

      {/* Bottom action bar (Phase 4 placeholder) */}
      <Paper
        elevation={3}
        sx={{
          position: 'sticky',
          bottom: 0,
          p: 2,
          mt: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Selected: {selectedVisits.size} visit(s), {selectedImages.size} image(s)
        </Typography>

        <Button
          variant="contained"
          size="large"
          disabled // Phase 4
          sx={{ minHeight: 44 }} // iPad
        >
          Generate Case Study with AI →
        </Button>
      </Paper>
    </Box>
  );
};

export default CaseStudyView;
```

**Checklist**:
```
□ Create main component
□ Add data loading logic
□ Implement state management
□ Add tooth filter bar
□ Render treatment cards
□ Add bottom action bar
□ Handle loading state
□ Handle empty state
□ Test selection logic
```

---

### Step 7: Update TreatmentDetailsPanel (10 min) ✅
**File**: `frontend/src/components/treatments/TreatmentDetailsPanel.tsx`

```typescript
// Add import
import CaseStudyView from './CaseStudyView';

// Line 107: Remove disabled
<Tab
  label="Case Study"
  value="case-study"
  icon={<DescriptionIcon />}
  iconPosition="start"
  // disabled // REMOVE THIS
/>

// Line 128: Replace placeholder
{activeTab === 'case-study' && (
  <CaseStudyView
    patientMobile={patient.patient.mobile_number}
    patientFirstName={patient.patient.first_name}
  />
)}
```

**Checklist**:
```
□ Import CaseStudyView
□ Remove disabled prop
□ Replace placeholder
□ Test tab works
```

---

### Step 8: Check/Add Backend Endpoints (15 min) 🔍
**Files**: Check if these exist, add if missing

```python
# backend/app/api/v1/endpoints/dental.py

@router.get("/patients/{mobile}/{first_name}/observations")
async def get_patient_observations(...):
    """Get all observations for a patient"""
    # Return list of observations

@router.get("/patients/{mobile}/{first_name}/procedures")
async def get_patient_procedures(...):
    """Get all procedures for a patient"""
    # Return list of procedures
```

**Checklist**:
```
□ Check if observations endpoint exists
□ Check if procedures endpoint exists
□ Add missing endpoints
□ Test with curl
□ Verify returns correct data
```

---

### Step 9: Testing & Refinement (45 min) 🧪

**Test Cases**:
```
□ Load page with patient data
□ Tooth filter buttons work
□ Click "All" shows all teeth
□ Click specific tooth shows only that tooth
□ Timeline items display correctly
□ Visit checkbox selection works
□ Image checkbox selection works
□ Select All button works
□ Deselect All button works
□ Selected count updates in action bar
□ Empty state displays (no data)
□ Loading state displays while fetching
□ Works on iPad (touch targets ≥44px)
□ Responsive on desktop/tablet/mobile
□ No console errors
□ Images load correctly
□ Treatment type inference works
```

---

## 📊 DATA FLOW

```
User Opens Case Study Tab
        ↓
Load patient data (observations, procedures, attachments)
        ↓
Group by tooth using groupByTooth()
        ↓
Display ToothFilterBar with available teeth
        ↓
Render ToothTreatmentCard for each tooth
        ↓
Each card contains TimelineItem[] (chronological)
        ↓
User selects visits/images
        ↓
Selection state stored in CaseStudyView
        ↓
Bottom bar shows count
        ↓
[Phase 4: Generate button uses selection]
```

---

## 🎨 STYLING GUIDELINES

### Colors:
- Primary: Use theme primary color
- Selected: Blue (#2196f3) with 3px border
- Unselected: Gray (#ddd) with 1px border
- Background: White cards on light gray background

### Touch Targets (iPad):
- Buttons: Min 44px height
- Checkboxes: Min 44px touch area
- Tooth filter buttons: 60px wide, 44px tall
- Image thumbnails: 80x80px with padding

### Spacing:
- Card margin: 24px bottom
- Content padding: 16px
- Button gap: 8px
- Image gap: 8px

### Typography:
- Heading: h5 (24px, 600 weight)
- Tooth number: h6 (20px, 600 weight)
- Date: subtitle1 (16px, 600 weight)
- Info: body2 (14px, normal)
- Caption: caption (12px)

---

## 📁 FILES TO CREATE

### New Files (5):
```
✅ frontend/src/utils/caseStudyHelpers.ts
✅ frontend/src/components/treatments/ToothFilterBar.tsx
✅ frontend/src/components/treatments/TimelineItem.tsx
✅ frontend/src/components/treatments/ToothTreatmentCard.tsx
✅ frontend/src/components/treatments/CaseStudyView.tsx
```

### Modify (2):
```
✅ frontend/src/services/dentalService.ts (add methods)
✅ frontend/src/components/treatments/TreatmentDetailsPanel.tsx (enable tab)
```

### Backend (maybe):
```
⚪ backend/app/api/v1/endpoints/dental.py (check/add endpoints)
```

---

## 🚀 IMPLEMENTATION ORDER

```
1. Check backend endpoints exist (15 min)
2. Add dentalService methods (20 min)
3. Create caseStudyHelpers.ts (30 min)
4. Create ToothFilterBar (30 min)
5. Create TimelineItem (45 min)
6. Create ToothTreatmentCard (30 min)
7. Create CaseStudyView (60 min)
8. Enable tab in TreatmentDetailsPanel (10 min)
9. Test and refine (45 min)

Total: ~4.5 hours
```

---

## ✅ SUCCESS CRITERIA

Phase 3 complete when:
- [x] Case Study tab enabled and loads
- [x] Data grouped by tooth automatically
- [x] Timeline shows chronological visits
- [x] Doctor can select visits
- [x] Doctor can select images
- [x] Tooth filter buttons work
- [x] Selection count displays
- [x] iPad-friendly (no dropdowns, 44px+ buttons)
- [x] Responsive layout
- [x] No console errors
- [x] Empty/loading states work

---

**Status**: Ready to implement! 🎯
**Next**: Start with Step 1 - Check backend endpoints
