# 05 — Component System

This document defines the major UI components, their responsibilities, the data they receive, and the events they emit. This is NOT implementation code — it defines the component contract.

---

## Component Hierarchy

```
App
├── AppHeader
│   └── WorkflowStepper (when in wizard)
├── Home (page)
│   └── HomeActionPanel
├── NewPlan (wizard page)
│   ├── SelectDataStep
│   │   └── DepartmentDataRow × 3
│   ├── CheckDataStep
│   │   ├── ValidationSummary
│   │   └── IssueCard × N
│   ├── CreatePlanStep
│   │   └── OptimizationProgress
│   ├── ReviewPlanStep
│   │   ├── CorridorOverview
│   │   │   └── SectionStatusCard × N
│   │   ├── WeeklyTimelineSummary
│   │   │   ├── TimelineBar × N
│   │   │   └── TaskSummaryRow
│   │   ├── PlanImpactPanel
│   │   │   └── KpiMetricCard × 3
│   │   ├── JobInspector
│   │   │   ├── JobDetailCard
│   │   │   ├── ReasonCodeList
│   │   │   └── JobActionPanel
│   │   └── GlobalPlanStatus
│   │       └── ReOptimizePanel
│   └── ApprovePlanStep
├── PlanApproved (page)
├── EmergencyMode (page)
│   ├── EmergencyIncidentForm
│   ├── CorridorMapPanel
│   └── CascadeImpactPanel
└── Shared
    ├── StatusBadge
    ├── ConfirmModal
    ├── Toast / ToastQueue
    ├── LoadingSkeleton
    └── ErrorBanner
```

---

## AppHeader

**Responsibility**: Top navigation bar visible on all screens.

**Props**:
```typescript
{
  user: { name: string; role: string; division: string };
  currentStep?: number;        // 1-5, undefined for non-wizard pages
  emergencyMode?: boolean;      // true for Emergency Rapid-Block page
}
```

**Renders**:
- Left: RailNiyojan logo and wordmark
- Center: `<WorkflowStepper>` (only in wizard mode, steps 1-5)
- Center: `🔴 LIVE SYSTEM` indicator (only in emergency mode)
- Right: Date, time, user avatar pill with name and division

---

## WorkflowStepper

**Responsibility**: Shows the 5-step wizard progress.

**Props**:
```typescript
{
  currentStep: 1 | 2 | 3 | 4 | 5;
  completedSteps: number[];
}
```

**Behaviour**:
- Active step: Bold, underlined, visually prominent
- Completed steps: Checkmark, clickable? (see note below)
- Future steps: Greyed out, not clickable

> **Note**: Once a planning run exists (step 3 complete), navigating back to steps 1-2 would invalidate the current run. These should be non-clickable with a tooltip: "Start a new plan to go back."

---

## CorridorOverview

**Responsibility**: Visualize the railway corridor with section statuses and the selected job's location.

**Props**:
```typescript
{
  sections: Section[];
  jobs: JobContext[];
  scheduleItems: ScheduleItem[];
  selectedJobId: string | null;
  onSectionClick: (sectionId: string) => void;
}
```

**Emits**:
- `onSectionClick(sectionId)` → Highlights all jobs in that section

**Derives locally**:
- Section status (Clear/Caution/Restricted) based on job count per section
- Which section the selected job belongs to
- Integrated block location (sections with `reason_codes` including shared possession)

---

## WeeklyTimelineSummary

**Responsibility**: Condensed Gantt-style view of the week's schedule.

**Props**:
```typescript
{
  run: RunDetail;
  selectedJobId: string | null;
  onJobSelect: (jobId: string) => void;
  onExpand: () => void;
  weekStartDate: Date;
}
```

**Emits**:
- `onJobSelect(jobId)` when user clicks a bar
- `onExpand()` when user clicks `[Expand Timeline ↗]`

**Derives locally**:
- Bar positions from `schedule_item.start` and `schedule_item.end`
- Section rows from unique `job.section_id` values

---

## PlanImpactPanel

**Responsibility**: Show the KPI metrics comparing this plan to the baseline.

**Props**:
```typescript
{
  kpis: KpiSummary;
  planState: RunDetail['state'];
  onViewDetailedComparison: () => void;
}
```

**Derives locally**:
- Percentage string from `kpis.downtime_reduction_percent`
- Plan Quality label: `OPTIMAL → "Optimal"`, `FEASIBLE → "Feasible"`, others → "Degraded"
- Closure time reduction: `(baseline - optimized) / baseline * 100`

---

## JobInspector

**Responsibility**: Show all details for the currently selected job.

**Props**:
```typescript
{
  job: JobContext | null;
  scheduleItem: ScheduleItem | undefined;
  unscheduledReasonCodes: string[] | undefined;
  aiEstimate: AiEstimate | undefined;
  totalJobCount: number;
  currentJobIndex: number;
  onPrevJob: () => void;
  onNextJob: () => void;
}
```

**Emits**:
- `onPrevJob()` / `onNextJob()` for the `< 2 of 26 >` navigation

**Derives locally**:
- Human-readable labels for `reason_codes`
- Priority badge color (High = red, Medium = amber, Low = grey) based on `job.priority`

---

## JobActionPanel

**Responsibility**: The 2×2 grid of job-specific action buttons in the Inspector.

**Props**:
```typescript
{
  job: JobContext | null;
  scheduleItem: ScheduleItem | undefined;
  isApproved: boolean;   // Plan is approved → all actions disabled
  isBusy: boolean;
  onLock: () => void;
  onChangeWindow: () => void;   // NOT YET IMPLEMENTED
  onFindAlternative: () => void; // NOT YET IMPLEMENTED
  onExclude: () => void;         // NOT YET IMPLEMENTED
}
```

**Internal button states**:

| Button | Enabled when | Tooltip when disabled |
|--------|-------------|----------------------|
| Lock in Schedule | `scheduleItem` exists AND `!scheduleItem.locked` AND `scheduleItem.status === 'SCHEDULED'` AND `!isApproved` | "Job is already locked", "Job is not scheduled", "Plan is approved" |
| Change Window | `NOT YET IMPLEMENTED` | "Coming soon" |
| Find Alternative | `NOT YET IMPLEMENTED` | "Coming soon" |
| Exclude from Plan | `NOT YET IMPLEMENTED` | "Coming soon" |

---

## GlobalPlanStatus

**Responsibility**: Shows the current plan state relative to unsaved constraints, and the Re-Optimize button.

**Props**:
```typescript
{
  isDirty: boolean;
  lockedJobCount: number;
  optimizationState: 'UP_TO_DATE' | 'UNSAVED_CONSTRAINTS' | 'REOPTIMIZING' | 'FAILED' | 'UPDATED';
  isBusy: boolean;
  onReoptimize: () => void;
}
```

**Renders based on `optimizationState`**:
- `UP_TO_DATE`: Quiet, no prominent UI
- `UNSAVED_CONSTRAINTS`: Warning banner + prominent Re-Optimize button
- `REOPTIMIZING`: Spinner, locked text, "Optimizing..." label
- `FAILED`: Error message + Retry button
- `UPDATED`: Brief success flash (then transitions back to UP_TO_DATE)

---

## ValidationSummary

**Responsibility**: Show the Check Data step result.

**Props**:
```typescript
{
  validation: ValidationResponse;
  isLoading: boolean;
}
```

**Renders**:
- Loading state: Skeleton / spinner
- `valid === true` with no errors: All Good panel (green, ✅)
- `valid === false`: Needs Attention panel (amber, ⚠️) with expandable issue list

---

## IssueCard

**Responsibility**: A single validation issue with action options.

**Props**:
```typescript
{
  issue: ValidationIssue;
  onAutoFix?: () => void;  // Optional — if auto-fix is possible
}
```

---

## EmergencyIncidentForm

**Responsibility**: The left panel of the Emergency Rapid-Block Mode.

**Props**:
```typescript
{
  availableSections: Section[];
  isBusy: boolean;
  onSubmit: (formData: EmergencyFormData) => void;
}

interface EmergencyFormData {
  incidentType: string;
  sectionId: string;
  durationMinutes: number;
  notes: string;
}
```

**Form validation**:
- `incidentType` required
- `sectionId` required
- `durationMinutes` required and > 0
- `notes` optional

---

## CascadeImpactPanel

**Responsibility**: Shows the impact of the emergency block on the existing schedule.

**Props**:
```typescript
{
  rapidBlockDetail: RapidBlockDetail | null;
  state: 'IDLE' | 'LOADING' | 'CANDIDATE_READY' | 'NO_CANDIDATE' | 'REJECTED';
  onApproveDispatch: () => void;
}
```

**Derives locally**:
- Count of CHANGED jobs from `rapidBlockDetail.changed_jobs`
- Preserved locked jobs count from `rapidBlockDetail.preserved_locked_jobs.length`

---

## ConfirmModal

**Responsibility**: A reusable confirmation dialog for destructive actions.

**Props**:
```typescript
{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant: 'default' | 'destructive' | 'emergency';
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

## StatusBadge

**Responsibility**: Color-coded badge for states.

**Props**:
```typescript
{
  status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'TIMEOUT' | 'INVALID' | 'FAILED'
        | 'LOCKED' | 'SCHEDULED' | 'REJECTED'
        | 'APPROVED' | 'PENDING'
        | 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'LOW_PRIORITY';
  label?: string;  // Override default label
}
```

**Color mapping**:
```
OPTIMAL, APPROVED, SCHEDULED → green
FEASIBLE, PENDING → amber
INFEASIBLE, FAILED, INVALID, REJECTED → red
TIMEOUT → orange
LOCKED → blue
HIGH_PRIORITY → red
```
