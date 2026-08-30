# RailNiyojan Frontend Architecture & Behavior Spec

This document serves as the master blueprint for the frontend behavior, UI states, and user flows for the RailNiyojan web application. The frontend is designed to look and feel like a highly polished, enterprise-grade Single Page Application (SPA), completely removing any "hackathon" aesthetics.

---

## 1. Global UI/UX Philosophy
* **Enterprise SPA Feel:** Silky transitions, zero page reloads. The application feels like a robust native desktop application.
* **Intelligent Feedback:** The UI always tells the user what the AI is doing (Explainable AI) rather than acting as a black box.
* **Constrained Actions:** Operational safety requires that "Draft" plans cannot be exported. Only explicitly approved plans can leave the system.

---

## 2. The 5-Step Workflow (State Machine)

The application flow is strictly guided by a top-level 5-step progress wizard:
`[ 1. Select Data ] ➔ [ 2. Check Data ] ➔ [ 3. Create Plan ] ➔ [ 4. Review Plan ] ➔ [ 5. Approve Plan ]`

### Step 1: Select Data (The Integration Hub)
* **Purpose:** Ingest master data from the three siloed departments (TMS, SMMS, TDMS).
* **Behavior:** Displays three rows/cards representing the departments. Users can selectively upload new data or "Skip" to use the last synced data from the API. The system verifies the CSV schemas.

### Step 2: Check Data (The Validation Engine)
* **Purpose:** Run spatial and temporal conflict checks *before* optimization.
* **Behavior:** 
  * Displays a summary: e.g., "ALL GOOD - 26 tasks ready" or "Needs Attention (2 items)".
  * If items need attention, a dropdown/table reveals the specific broken rows (e.g., missing priority values) so the user understands why the data failed.

### Step 3: Create Plan (The Optimization Engine)
* **Purpose:** Trigger the backend CP-SAT solver (`POST /planning_runs`).
* **Behavior:** A progress screen showing a visual representation of the AI at work. A checklist updates dynamically:
  1. `[x] Parsing multi-department inputs...`
  2. `[x] Identifying spatial & temporal conflicts...`
  3. `[x] Running CP-SAT Optimization Engine...`
  4. `[ ] Validating safety constraints...`
* **Optional:** A slider here allows tuning the AI heuristics (e.g., Prioritize Safety vs. Prioritize Speed).

### Step 4: Review Plan (The Core Workspace)
* **Purpose:** The main interactive dashboard where the human reviews and modifies the AI's schedule.
* **UI Layout:**
  * **Top Left:** Advanced Network Corridor Map. Shows railway nodes (BRC -> VDA) with colored lines indicating clear tracks vs. integrated block zones.
  * **Bottom Left:** Weekly Timeline Summary (Gantt Chart). Visualizes when jobs occur.
  * **Bottom Center:** Plan Impact KPIs (e.g., Closure Time -36%). Compares the optimized run to the baseline.
  * **Right Panel:** The Job Inspector.

### Step 5: Approve Plan (The Dispatch Gate)
* **Purpose:** Lock the plan and push it to operational systems.
* **Behavior:** The interactive elements disappear (Read-Only Mode). A digital sign-off modal appears for the Divisional Manager. Once signed, the backend is triggered (`POST /approve`), and the UI reveals the `[ Export PDF/CSV ]` and `[ Share to TMS ]` buttons.

---

## 3. The Job Inspector & Actions Matrix

When a user clicks a specific job (e.g., `JOB-042`) on the Gantt chart or Map, the **Job Inspector** panel slides in on the right. 

### Explainable AI
The Inspector includes a "WHY THIS TIME?" checklist to explain the AI's logic (e.g., "✅ Window available", "✅ Compatible with signal work").

### Job-Specific Actions Grid
These actions *only* apply to the selected job:
1. **`[ 🔒 Lock in Schedule ]`**: Pins the job. The AI is no longer allowed to move it.
2. **`[ 🕒 Change Window ]`**: Opens a modal to manually shift the time.
3. **`[ 🗑️ Exclude ]`**: Drops the job from the current plan.
4. **`[ 🔀 Find Alternative ]`**: Asks the AI to suggest the *next best* time slot specifically for this job without moving others.

---

## 4. The Global "Re-Optimize" Loop

Because railway planning is highly interconnected, human edits (like Locking a job) create new constraints that might break the rest of the AI's schedule. 

### The Trigger
When a user performs a Job-Specific Action (e.g., clicks `Lock`), the system state becomes "Dirty". 
A global notification appears: **"⚠️ Unsaved Constraints. You have locked a job. The plan must be recalculated."**

### The Interaction Sequence
1. **The Click:** User clicks the global `[ 🔄 Re-Optimize Plan ]` button. The button disables and changes to `[ ⚙️ Optimizing... ]`.
2. **The Loading State:** A glassmorphic blur / shimmer covers the Gantt Chart and Map. 
   * *Crucial UI detail:* Locked jobs DO NOT blur. They remain solid to show they are anchored.
3. **The Success Reveal:** 
   * The shimmer lifts.
   * Unlocked job blocks in the Gantt chart smoothly animate/slide to their new optimal positions.
   * The KPI numbers flash (Green if improved, Yellow if the human's locks caused efficiency to drop).
4. **The Failure State:** If the human locked two conflicting jobs, the screen shakes slightly, a red error banner drops down ("Plan Infeasible"), and the offending locked jobs glow red on the timeline.
