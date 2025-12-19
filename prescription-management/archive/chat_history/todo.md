# Dental Chart Redesign - iPad Focused

## Current Issues (from screenshot) - RESOLVED
1. ✅ **Teeth cut off** - Fixed by adjusting SVG heights and viewBox
2. ✅ **Teeth too small** - Increased ~35% for iPad touch
3. ✅ **No collapse feature** - Added collapse/expand functionality
4. ✅ **Lower arch order wrong** - Swapped 31-38 to LEFT, 41-48 to RIGHT (patient view)

## Todo Items - ALL COMPLETED

- [x] 1. Fix lower arch tooth order: swap 31-38 to LEFT, 41-48 to RIGHT (patient view)
- [x] 2. Fix teeth visibility - adjust SVG viewBox/heights to show all teeth without clipping
- [x] 3. Increase teeth size for iPad touch targets (molars: ~40x48, incisors: rx=16/ry=24)
- [x] 4. Add collapse/expand functionality to AnatomicalDentalChart
- [x] 5. Update DentalConsultation layout for collapsed chart mode

## Review

### Changes Made:

**1. AnatomicalDentalChart.tsx:**
- Fixed lower arch ordering: 31-38 now on LEFT, 41-48 on RIGHT (patient's mirror view)
- Increased SVG height from 110px to 200px
- Updated viewBox to 760x200 for better visibility
- Increased tooth sizes ~35% (molars: 40x48, incisors: rx=16/ry=24)
- Widened tooth spacing (x positions adjusted from 50-650 to 55-705)
- Added `allowCollapse`, `isCollapsed`, `onCollapseChange` props
- Added collapse toggle button with smooth animation
- Chart content wrapped in MUI Collapse component

**2. DentalConsultation.tsx:**
- Added `chartCollapsed` state
- Passed collapse props to AnatomicalDentalChart
- Grid layout adjusts when chart collapsed (500px → 600px for observations)

### Behavior:
- **Default**: Chart visible with full dental arches
- **Collapsed**: Click eye icon → chart slides up/collapses, observations get more space
- **Pinned**: When pinned, chart stays sticky at top (existing feature)
- **iPad optimized**: Larger touch targets, wider spacing

### Files Modified:
1. `frontend/src/components/dental/AnatomicalDentalChart.tsx`
2. `frontend/src/pages/dental/DentalConsultation.tsx`
