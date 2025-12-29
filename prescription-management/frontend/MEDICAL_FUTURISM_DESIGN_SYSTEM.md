# Medical Futurism Design System
**For Prescription Management System - iPad Optimized**

## 🛠️ Using the Design Skill

For major UI redesigns or new page creation, use the frontend-design skill:

```
/frontend-design Apply Medical Futurism design system to [Component/Page Name].
Reference: MEDICAL_FUTURISM_DESIGN_SYSTEM.md

Requirements:
- Space-efficient layouts
- iPad-optimized touch targets
- Purple gradient theme
- Compact spacing
```

**When to use the skill:**
- Creating new pages from scratch
- Major redesigns of existing components
- Converting vertical layouts to horizontal
- Implementing complex animations/interactions

## 📱 iPad-Mindful Design Principles

### Touch Targets
```typescript
Minimum: 44px × 44px (Apple HIG standard)
Optimal: 48px × 48px
Icon Buttons: minWidth: 44, minHeight: 44
Primary Buttons: minHeight: { xs: 40, sm: 48 }
Small Actions: minHeight: 32 (with 8px margin around)
```

### Spacing for Touch
```typescript
Gap between interactive elements: min 8px
Gap between buttons: 12px (1.5 spacing units)
Card padding: { xs: 12px, sm: 16px } // Fingertip-friendly
```

### Responsive Breakpoints (iPad Focus)
```typescript
xs: 0-600px      // Mobile portrait
sm: 600-900px    // Tablet portrait (iPad)
md: 900-1200px   // Tablet landscape (iPad Pro)
lg: 1200px+      // Desktop
```

### iPad-Specific Patterns
```typescript
// Split view for iPad landscape
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: 3,
}}>
  <Box sx={{ width: { xs: '100%', md: '35%' } }}>{/* List */}</Box>
  <Box sx={{ width: { xs: '100%', md: '65%' } }}>{/* Details */}</Box>
</Box>

// Hide/show panels on mobile
display: { xs: selectedItem ? 'none' : 'block', md: 'block' }
```

### Avoid on iPad
- ❌ Hover-only interactions (use tap/click)
- ❌ Small touch targets (<40px)
- ❌ Dropdown menus (use button grids instead)
- ❌ Right-click context menus
- ❌ Tooltips that require hover

## 📏 Space Optimization Strategies

### 1. Horizontal Layouts (Not Vertical Stacks)
```typescript
// ❌ BAD: Vertical stack (takes 4-5 rows)
<Box>
  <Typography>Procedure Name</Typography>
  <Typography>Code: D740</Typography>
  <Typography>Date: 20/12/2025</Typography>
  <Typography>Cost: $500</Typography>
  <Chip>Status</Chip>
</Box>

// ✅ GOOD: Horizontal inline (1-2 rows)
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <Box>
    <Typography fontWeight={700}>Procedure Name</Typography>
    <Typography variant="caption">D740 • Tooth #14 • 30min • 20/12/2025 • $500</Typography>
  </Box>
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    <Button>Complete</Button>
    <Chip>Status</Chip>
  </Box>
</Box>
```

### 2. Remove Redundant Information
```typescript
// ❌ BAD: Section title + status on every row
Upcoming (3)
  - Procedure 1 [Planned]
  - Procedure 2 [Planned]

// ✅ GOOD: Section title implies status
Planned (3)
  - Procedure 1
  - Procedure 2
```

### 3. Compact Headers
```typescript
// ❌ BAD: Large headers with subtitles
<Typography variant="h3">Treatment Dashboard</Typography>
<Typography variant="body1">Manage patient treatments and monitor progress</Typography>

// ✅ GOOD: Compact title only
<Typography variant="h5" color="#667eea">Treatment Dashboard</Typography>
```

### 4. Inline Metadata with Bullets
```typescript
// Use bullet separation for inline data
<Typography variant="caption">
  D740 • 30min • 📅 20/12/2025 • $500.00
</Typography>
```

### 5. Accordions for Long Lists
```typescript
// Group similar items in expandable sections
<Accordion>
  <AccordionSummary>
    Planned (5) <Button>Add New</Button>
  </AccordionSummary>
  <AccordionDetails>{/* Cards */}</AccordionDetails>
</Accordion>
```

### 6. Reduce Padding
```typescript
Container: py: 2 (not py: 3 or py: 4)
Cards: p: { xs: 1.25, sm: 1.5 } (not p: 3)
Sections: mb: 2 (not mb: 4)
Row gaps: gap: 0.5 or gap: 1 (not gap: 2)
```

### 7. Use Icons for Actions (Not Full Text)
```typescript
// Combine icon + text for compact buttons
<Button startIcon={<CheckIcon />} size="small">Complete</Button>

// Not verbose
<Button>Mark as Completed</Button>
```

## 🎨 Color Palette

### Primary Colors (Purple Gradient Theme)
```typescript
Primary Gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
Primary Hover: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)'
Primary Light: 'rgba(102, 126, 234, 0.08)' // Subtle background
Primary Border: 'rgba(102, 126, 234, 0.15)'
```

### Status Colors (Gradient Style)
```typescript
Success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // Green
Error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' // Red
Warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Orange
Info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' // Blue
```

### Text Colors
```typescript
Primary Text: 'text.primary' (default #1a1a1a)
Secondary Text: 'text.secondary' (default #666)
Brand Purple: '#667eea' // Use for headings, important text
Dark Purple: '#5568d3' // Accessible on white backgrounds
```

**Accessibility Note:** Avoid gradient text - use solid colors with proper contrast ratios (WCAG AA: 4.5:1 for body, 3:1 for headings)

## 📐 Spacing System

### Container Padding
```typescript
Page Container: py: 2, px: { xs: 1.5, sm: 2 }
Card Padding: p: { xs: 1.5, sm: 2 }
Compact Padding: p: { xs: 1.25, sm: 1.5 }
```

### Margins
```typescript
Section Margin Bottom: mb: 2
Small Gap: gap: 0.5
Medium Gap: gap: 1
Large Gap: gap: 1.5
```

### Border Radius
```typescript
Cards/Papers: borderRadius: 2 (16px)
Buttons: borderRadius: 1.5 (12px)
Compact Buttons: borderRadius: 8
Large Containers: borderRadius: 3-4
```

## ✍️ Typography

### Headings
```typescript
Page Title (Compact): {
  variant: 'h5',
  fontSize: { xs: '1.25rem', sm: '1.5rem' },
  fontWeight: 700,
  color: '#667eea', // Solid brand purple
}

Section Title: {
  variant: 'subtitle1',
  fontSize: '0.9375rem',
  fontWeight: 700,
  color: 'text.primary',
}

Card Title: {
  variant: 'subtitle2',
  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
  fontWeight: 700,
  color: 'text.primary',
}
```

### Body Text
```typescript
Body Text: {
  variant: 'body2',
  fontSize: '0.8125rem',
  color: 'text.secondary',
}

Caption/Meta: {
  variant: 'caption',
  fontSize: '0.75rem',
  color: 'text.secondary',
  fontWeight: 500,
}
```

## 🎯 iPad-Friendly Touch Targets

```typescript
Minimum Touch Target: 44px x 44px
Button MinHeight: { xs: 40, sm: 48 }
Icon Button: minWidth: 44, minHeight: 44
Compact Buttons: minHeight: 32
Small Action Buttons: minHeight: 28
```

## 🔘 Component Patterns

### Primary Button
```typescript
<Button
  variant="contained"
  sx={{
    minHeight: { xs: 40, sm: 48 },
    px: { xs: 2, sm: 3 },
    fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
    borderRadius: 2,
    '&:hover': {
      background: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)',
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
    },
  }}
>
  Button Text
</Button>
```

### Outlined Button
```typescript
<Button
  variant="outlined"
  sx={{
    minHeight: { xs: 40, sm: 48 },
    borderColor: '#667eea',
    color: '#667eea',
    fontWeight: 600,
    borderRadius: 2,
    '&:hover': {
      borderColor: '#5568d3',
      background: 'rgba(102, 126, 234, 0.05)',
    },
  }}
>
  Button Text
</Button>
```

### Compact Action Buttons (with icon + text)
```typescript
<Button
  size="small"
  variant="contained"
  startIcon={<Icon sx={{ fontSize: 14 }} />}
  sx={{
    minHeight: 28,
    px: 1,
    py: 0.5,
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: 1.5,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 1px 4px rgba(16, 185, 129, 0.3)',
  }}
>
  Action
</Button>
```

### Status Chips
```typescript
<Chip
  label="Status"
  size="small"
  sx={{
    textTransform: 'capitalize',
    fontWeight: 700,
    fontSize: '0.6875rem',
    height: 24,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  }}
/>
```

### Cards with Glassmorphism
```typescript
<Card
  sx={{
    borderRadius: 2,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.15)',
    boxShadow: '0 2px 12px rgba(102, 126, 234, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
      transform: 'translateY(-2px)',
    },
  }}
>
```

### Paper Container
```typescript
<Paper
  elevation={0}
  sx={{
    borderRadius: 4,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(102, 126, 234, 0.15)',
    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
    position: 'relative',
    // Top accent gradient
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    },
  }}
>
```

## 🎭 Icons

### Icon Sizing
```typescript
Large Icons: fontSize: 40-48
Medium Icons: fontSize: 18-24
Small Icons: fontSize: 14-16
```

### Icon Colors
```typescript
Primary Icon: color: '#667eea'
Secondary Icon: color: 'text.secondary'
White Icon: color: 'white'
```

## ⚡ Animations & Transitions

### Standard Transition
```typescript
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
```

### Fade In
```typescript
<Fade in timeout={600}>
  <Component />
</Fade>
```

### Hover Effects
```typescript
'&:hover': {
  transform: 'translateY(-2px)', // Lift effect
  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
}
```

## 📱 Responsive Breakpoints

```typescript
xs: 0-600px (mobile)
sm: 600-900px (tablet portrait)
md: 900-1200px (tablet landscape / iPad)
lg: 1200px+ (desktop)
```

## 🎨 Scrollbar Styling

```typescript
'&::-webkit-scrollbar': {
  width: '6px',
},
'&::-webkit-scrollbar-track': {
  background: 'rgba(102, 126, 234, 0.05)',
  borderRadius: 10,
},
'&::-webkit-scrollbar-thumb': {
  background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
  borderRadius: 10,
  '&:hover': {
    background: 'linear-gradient(180deg, #5568d3 0%, #66348a 100%)',
  },
},
```

## 📋 Layout Patterns

### Split Panel (35% / 65%)
```typescript
<Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
  <Box sx={{ width: { xs: '100%', md: '35%' } }}>
    {/* Left Panel */}
  </Box>
  <Box sx={{ width: { xs: '100%', md: '65%' } }}>
    {/* Right Panel */}
  </Box>
</Box>
```

### Scrollable Tab Content
```typescript
<Box
  sx={{
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    p: { xs: 1.5, sm: 2 },
    minHeight: 0, // Critical for flex child scrolling
  }}
>
  {/* Tab Content */}
</Box>
```

### Sticky Footer Button
```typescript
<Box sx={{ pb: 14 }}> {/* Extra padding for sticky footer */}
  {/* Content */}
</Box>

<Box
  sx={{
    position: 'sticky',
    bottom: 0,
    zIndex: 1200,
    mt: 2,
  }}
>
  <Paper
    elevation={8}
    sx={{
      p: { xs: 1.5, sm: 2 },
      borderTop: '3px solid',
      borderImage: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%) 1',
      bgcolor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 -4px 20px rgba(102, 126, 234, 0.15)',
      borderRadius: '12px 12px 0 0',
    }}
  >
    {/* Sticky Button */}
  </Paper>
</Box>
```

## 🔧 Quick Reference Checklist

### Design Skill Usage
- [ ] Consider using `/frontend-design` skill for major redesigns
- [ ] Reference this document in the skill prompt

### Space Optimization
- [ ] Convert vertical stacks to horizontal inline layouts
- [ ] Remove redundant labels (e.g., status chips in "Planned" section)
- [ ] Use compact headers (h5 instead of h3)
- [ ] Inline metadata with bullet separators (•)
- [ ] Reduce padding: py: 2, p: 1.5, gap: 0.5-1
- [ ] Use accordions for grouping similar items
- [ ] Combine icons + text for compact action buttons

### iPad-Mindful Design
- [ ] Ensure all touch targets are ≥44px × 44px
- [ ] Use button grids instead of dropdowns
- [ ] Avoid hover-only interactions
- [ ] Test on iPad portrait (sm) and landscape (md) breakpoints
- [ ] Use split-panel layouts: 35% list / 65% details
- [ ] Gap between buttons: min 12px

### Theme Application
- [ ] Replace default colors with purple gradients (backgrounds/buttons only)
- [ ] Apply glassmorphism to cards/papers
- [ ] Use solid purple (#667eea) for headings (no gradient text)
- [ ] Use status color gradients for chips/badges
- [ ] Apply custom purple scrollbar styling
- [ ] Add smooth transitions (0.3s cubic-bezier)
- [ ] Verify text contrast ratios meet WCAG AA standards

### Scrolling & Layout
- [ ] Use `height: calc(100vh - 200px)` for fixed-height containers
- [ ] Add `minHeight: 0` to flex children for scrolling
- [ ] Add `overflowY: 'auto'` to scrollable content areas
- [ ] Use sticky positioning for important action buttons

---

**Last Updated:** December 28, 2025
**Version:** 1.0
