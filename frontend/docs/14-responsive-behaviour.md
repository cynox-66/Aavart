# 14 — Responsive Behaviour

RailNiyojan is a **desktop-first operational planning system**. It is designed for use on large monitor displays in a railway divisional office. Mobile support is not the primary use case.

---

## Primary Experience: Desktop (≥1280px)

The full application layout is designed for desktop screens.

### Review Plan Layout (≥1280px)

```
+------------------------------------------+-------------------+
|  Corridor Overview                        |  Job Inspector    |
|  [full width map with sections]           |  [right panel     |
|  [section status cards below]             |   240px wide]     |
+-------------------+----------------------+                   |
|  Weekly Timeline  |  Plan Impact         |  Job Actions      |
|  [gantt, compact] |  [3 KPI cards]       |                   |
|                   |  [Detailed Compare]  |  Global Action    |
+-------------------+----------------------+                   |
| [Export Plan]          [Approve Plan →]  |                   |
+------------------------------------------+-------------------+
```

Column widths:
- Left/Main area: `calc(100% - 280px)` (flexible)
- Right panel (Inspector): `280px` (fixed)

### Home Screen (≥1280px)

```
+------------------------------------------+
|  Logo   |  (empty center)   |  User pill  |
+------------------------------------------+
|  Left: Feature list        |  Right: 3   |
|  "Optimize schedules..."   |  action     |
|  "Reduce track downtime..."| buttons     |
|  "Ensure compliance..."    |             |
+------------------------------------------+
```

---

## Tablet Experience (768px – 1279px)

The layout must adapt for tablet screens (e.g., supervisors reviewing plans on an iPad in the field).

### Review Plan — Tablet Adaptations

- Right panel (Job Inspector) collapses into a **slide-up bottom drawer**
- The bottom drawer is triggered by clicking a job in the Gantt or Map
- A persistent `[Inspector]` tab appears at the bottom right corner of the screen to re-open it
- Corridor Overview and Weekly Timeline remain stacked vertically in the main area
- Plan Impact KPI cards collapse into a horizontal scrollable row

**Layout**:
```
+------------------------------------------+
|  WorkflowStepper (scrollable if needed)  |
+------------------------------------------+
|  Corridor Overview                        |
|  [full width]                             |
+------------------------------------------+
|  Weekly Timeline                          |
|  [full width, condensed]                  |
+------------------------------------------+
|  Plan Impact (horizontal scroll)          |
+------------------------------------------+
|  [Export Plan]     [Approve Plan →]       |
+------------------------------------------+
         [Inspector ↑] ← floating tab

--- Bottom drawer (when job selected) ---
|  JOB-042 - Track Maintenance             |
|  [full job details]                       |
|  [Actions grid]                          |
|  [Global Re-Optimize if dirty]           |
+------------------------------------------+
```

### Select Data — Tablet

- Department rows stack vertically at full width
- No changes needed to the form logic

---

## Mobile Experience (< 768px)

Mobile is **limited operational support only**. The Gantt chart and full corridor map cannot practically fit on mobile. The system still functions but in a simplified mode.

### What Works on Mobile

- Home screen with all three action buttons
- Check Data screen (validation summary and issues)
- Plan Approved screen (success state + export button)
- Emergency Rapid-Block Form (incident form only)

### What Does Not Work Well on Mobile

- Review Plan dashboard (too complex for small screens)
- Full corridor map
- Full Gantt chart (weekly timeline)

### Mobile Review Plan

On mobile, the Review Plan screen should show:

```
+----------------------------------------+
|  Plan: SNAP-014  [OPTIMAL]              |
|  KPIs: -36% Closure  |  Optimal Quality |
+----------------------------------------+
|  [📋 View Job List]                     |
|  [🗺️ View Corridor Map]                 |
|  [📅 View Timeline]                     |
+----------------------------------------+
|  [Export Plan]   [Approve Plan →]       |
+----------------------------------------+
```

Three action tiles open simplified full-screen views for each component.

**Recommendation**: Add a banner on mobile: "For the best experience, use a laptop or desktop to review and approve plans."

---

## Breakpoint Reference

| Breakpoint | Label | Target Device |
|-----------|-------|---------------|
| `< 768px` | Mobile | Phones — limited support |
| `768px – 1279px` | Tablet | iPads, surface tablets |
| `≥ 1280px` | Desktop | Office workstations, laptops |

---

## Panel Collapse Behaviour

### Corridor Overview
- Desktop: Always visible, fixed height (~250px)
- Tablet: Always visible, fixed height (~200px)
- Mobile: Hidden, accessible via "View Corridor Map" button

### Weekly Timeline Summary
- Desktop: Always visible, condensed Gantt (~200px)
- Tablet: Always visible, condensed Gantt (~160px)
- Mobile: Hidden, accessible via "View Timeline" button

### Job Inspector (Right Panel)
- Desktop: Fixed right sidebar, always visible
- Tablet: Collapsed bottom drawer, opens on job selection
- Mobile: Full-screen overlay when a job is selected from the job list

### Expanded Timeline
- Desktop: Full-page overlay with close button
- Tablet: Full-page overlay with close button
- Mobile: Horizontally scrollable simplified timeline (limited functionality)

---

## Important Notes for Implementation

1. Use CSS Grid or Flexbox — NOT absolute positioning for the main layout panels.
2. The Review Plan right panel should be a CSS Grid column, not a floating sidebar, to ensure proper reflow on tablet.
3. The bottom drawer on tablet should use CSS `transform: translateY()` for smooth animation.
4. Use `@media (min-width: 768px)` (mobile-first) or `@media (max-width: 1279px)` depending on your CSS approach.
5. Test the Gantt chart specifically on 1280px width — at exactly this breakpoint it should be usable without horizontal scrolling.
