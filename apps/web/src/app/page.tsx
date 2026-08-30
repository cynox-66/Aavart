"use client";

import { useCallback, useState } from "react";
import {
  AppView,
  DepartmentDataSource,
  OptimizationStatus,
  PlanRunView,
  ToastMessage,
  ValidationState,
} from "@/types";
import {
  initialDepartmentSources,
  mockBaselinePlan,
  mockDefaultValidationState,
  mockValidValidationState,
} from "@/lib/mock-data";
import {
  approveRunAdapter,
  createPlanningRunAdapter,
  exportRunAdapter,
  lockScheduleItemAdapter,
  replanRunAdapter,
  validateDatasetAdapter,
} from "@/lib/adapters/planning-adapter";
import { AppHeader } from "@/components/layout/AppHeader";
import { WorkflowStepper } from "@/components/navigation/WorkflowStepper";
import { ToastContainer } from "@/components/layout/Toast";
import { HomeScreen } from "@/components/home/HomeScreen";
import { SelectDataStep } from "@/components/planning/SelectDataStep";
import { CheckDataStep } from "@/components/planning/CheckDataStep";
import { CreatePlanStep } from "@/components/planning/CreatePlanStep";
import { ReviewPlanScreen } from "@/components/review/ReviewPlanScreen";
import { ApprovePlanStep } from "@/components/planning/ApprovePlanStep";
import { PlanApprovedScreen } from "@/components/approved/PlanApprovedScreen";
import { PreviousPlansList } from "@/components/previous-plans/PreviousPlansList";
import { RapidBlockView } from "@/components/rapid-block/RapidBlockView";

export default function RailNiyojanApp() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<AppView>("home");

  // Ingestion & Validation State
  const [sources, setSources] = useState<DepartmentDataSource[]>(initialDepartmentSources);
  const [validation, setValidation] = useState<ValidationState>(mockDefaultValidationState);

  // Active Planning Run State
  const [plan, setPlan] = useState<PlanRunView>(mockBaselinePlan);
  const [hasPlanCreated, setHasPlanCreated] = useState(false);

  // Constraint Dirty Tracking
  const [isDirty, setIsDirty] = useState(false);
  const [lockedCount, setLockedCount] = useState(0);
  const [optimizationStatus, setOptimizationStatus] = useState<OptimizationStatus>("UP_TO_DATE");

  // Global Async State & Notifications
  const [isBusy, setIsBusy] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper for Toasts
  const showToast = useCallback(
    (type: ToastMessage["type"], title: string, message?: string) => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random()}`,
        type,
        title,
        message,
      };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    },
    [],
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Step 1: Select Data Handlers ---
  const handleToggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: s.status === "loaded" ? "skipped" : "loaded",
            }
          : s,
      ),
    );
  };

  const handleReplaceFile = (id: string, fileName: string) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              fileName,
              status: "loaded",
              updatedAt: "Just now",
            }
          : s,
      ),
    );
    showToast("info", "Dataset File Updated", `Loaded ${fileName} for ${id.toUpperCase()}`);
  };

  const handleProceedToValidation = async () => {
    setIsBusy(true);
    try {
      const res = await validateDatasetAdapter(null, "JSON");
      setValidation(res);
      setCurrentView("wizard-step-2");
    } catch {
      setValidation(mockDefaultValidationState);
      setCurrentView("wizard-step-2");
    } finally {
      setIsBusy(false);
    }
  };

  // --- Step 2: Check Data Handlers ---
  const handleResolveIssue = (issueId: string) => {
    setValidation((prev) => {
      const updated = prev.issues.map((i) => (i.id === issueId ? { ...i, resolved: true } : i));
      const allResolved = updated.every((i) => i.resolved);
      return {
        ...prev,
        valid: allResolved,
        issues: updated,
      };
    });
    showToast("success", "Issue Resolved", "Candidate snapshot updated with auto-fix.");
  };

  const handleAutoFixAll = () => {
    // Keep the snapshot id the backend actually registered during validation --
    // falling back to the mock id here makes the solver POST an unknown snapshot.
    setValidation((prev) => ({
      ...mockValidValidationState,
      snapshotCandidateId: prev.snapshotCandidateId ?? mockValidValidationState.snapshotCandidateId,
    }));
    showToast("success", "All Issues Auto-Fixed", "Dataset is 100% compliant and ready for solver.");
  };

  // --- Step 3: Create Plan Handlers ---
  const handleTriggerSolve = useCallback(async (): Promise<boolean> => {
    try {
      const newPlan = await createPlanningRunAdapter(
        validation.snapshotCandidateId || "SNAP-014",
      );
      setPlan(newPlan);
      setHasPlanCreated(true);
      setIsDirty(false);
      setLockedCount(0);
      setOptimizationStatus("UP_TO_DATE");
      return true;
    } catch (err: any) {
      showToast("error", "Solver Error", err?.message || "Optimization failed.");
      return false;
    }
  }, [validation.snapshotCandidateId, showToast]);

  const handlePlanReady = useCallback(() => {
    setCurrentView("wizard-step-4");
    showToast("success", "Plan Generated Successfully", "Review corridor schedule and lock priority jobs.");
  }, [showToast]);

  // --- Step 4: Review Plan Actions ---
  const handleLockJob = async (jobId: string) => {
    setIsBusy(true);
    try {
      const updatedPlan = await lockScheduleItemAdapter(plan.run_id, jobId, plan);
      setPlan(updatedPlan);
      setIsDirty(true);
      setLockedCount((prev) => prev + 1);
      setOptimizationStatus("UNSAVED_CONSTRAINTS");
      showToast("success", `Job ${jobId} Locked`, "Schedule pinned. Re-optimize when ready to recalculate other work.");
    } catch (err: any) {
      showToast("error", "Lock Action Failed", err?.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleChangeWindow = (jobId: string, newWindowId: string) => {
    setPlan((prev) => {
      const updatedJobs = prev.jobs.map((j) =>
        j.job_id === jobId
          ? {
              ...j,
              scheduled_window_id: newWindowId,
              preferred_window: newWindowId,
              locked: true,
              status: "LOCKED" as const,
            }
          : j,
      );
      return { ...prev, jobs: updatedJobs };
    });
    setIsDirty(true);
    setLockedCount((prev) => prev + 1);
    setOptimizationStatus("UNSAVED_CONSTRAINTS");
    showToast("info", `Window Adjusted for ${jobId}`, "Constraint modified. Re-optimize required.");
  };

  const handleFindAlternative = (jobId: string) => {
    handleChangeWindow(jobId, "WIN-ST03-SAT-MORN");
  };

  const handleExcludeJob = (jobId: string) => {
    setPlan((prev) => {
      const updatedJobs = prev.jobs.map((j) =>
        j.job_id === jobId ? { ...j, status: "UNSCHEDULED" as const } : j,
      );
      const updatedSchedule = prev.schedule_items.filter((s) => s.job_id !== jobId);
      return { ...prev, jobs: updatedJobs, schedule_items: updatedSchedule };
    });
    setIsDirty(true);
    setOptimizationStatus("UNSAVED_CONSTRAINTS");
    showToast("warning", `Job ${jobId} Excluded`, "Task removed from weekly schedule.");
  };

  const handleReoptimize = async () => {
    setIsBusy(true);
    setOptimizationStatus("REOPTIMIZING");
    try {
      const replanned = await replanRunAdapter(
        plan.run_id,
        ["ST-02", "ST-03"],
        ["WIN-ST03-FRI-NIGHT"],
        plan,
      );
      setPlan(replanned);
      setIsDirty(false);
      setOptimizationStatus("UPDATED");
      showToast(
        "success",
        "Re-Optimization Complete",
        `New run ${replanned.run_id} calculated. Locked items preserved, downstream jobs shifted.`,
      );
    } catch (err: any) {
      setOptimizationStatus("FAILED");
      showToast("error", "Re-Optimization Infeasible", err?.message || "Constraint conflict.");
    } finally {
      setIsBusy(false);
    }
  };

  // --- Step 5: Approve Plan Handlers ---
  const handleApprovePlan = async (reviewer: string, comment: string) => {
    setIsBusy(true);
    try {
      const approved = await approveRunAdapter(plan.run_id, reviewer, comment, plan);
      setPlan(approved);
      setCurrentView("plan-approved");
      showToast("success", "Plan Digitally Approved", "Official dispatch clearance granted.");
    } catch (err: any) {
      showToast("error", "Approval Failed", err?.message);
    } finally {
      setIsBusy(false);
    }
  };

  // --- Post-Approval Export ---
  const handleExportPlan = async () => {
    try {
      await exportRunAdapter(plan.run_id, plan);
      showToast("success", "Export Initiated", `Downloading schedule for ${plan.run_id}`);
    } catch (err: any) {
      showToast("error", "Export Failed", err?.message);
    }
  };

  const handleNewPlanVersion = () => {
    setCurrentView("wizard-step-1");
  };

  // --- Past Plans Handler ---
  const handleOpenPreviousPlan = (runId: string) => {
    setPlan({
      ...mockBaselinePlan,
      run_id: runId,
      approval: {
        reviewer: "Arnav Pathak",
        comment: "Historical approved run",
        approved_at: "2026-08-23T12:00:00Z",
        run_id: runId,
        snapshot_id: "SNAP-013",
        ruleset_version: "Demo Ruleset v1",
      },
    });
    setIsDirty(false);
    setCurrentView("wizard-step-4");
    showToast("info", "Opened Past Plan", `Viewing ${runId} in Read-Only Mode`);
  };

  const isWizardView =
    currentView === "wizard-step-1" ||
    currentView === "wizard-step-2" ||
    currentView === "wizard-step-3" ||
    currentView === "wizard-step-4" ||
    currentView === "wizard-step-5";

  return (
    <main className="railniyojan-app-root">
      {/* 1. Global Application Header with Integrated Stepper */}
      <AppHeader
        currentView={currentView}
        onNavigate={setCurrentView}
        planId={plan.run_id}
        isPlanCreated={hasPlanCreated}
        isApproved={Boolean(plan.approval)}
      />

      {/* 2. Main Dynamic Content Switcher */}
      <div className="view-content-wrapper">
        {currentView === "home" && (
          <HomeScreen
            onNavigate={setCurrentView}
            activePlanId={plan.run_id}
            hasActivePlan={hasPlanCreated}
          />
        )}

        {currentView === "wizard-step-1" && (
          <SelectDataStep
            sources={sources}
            onToggleSourceStatus={handleToggleSource}
            onReplaceFile={handleReplaceFile}
            onContinue={handleProceedToValidation}
            onCancel={() => setCurrentView("home")}
            isBusy={isBusy}
          />
        )}

        {currentView === "wizard-step-2" && (
          <CheckDataStep
            validation={validation}
            onResolveIssue={handleResolveIssue}
            onAutoFixAll={handleAutoFixAll}
            onContinue={() => setCurrentView("wizard-step-3")}
            onBack={() => setCurrentView("wizard-step-1")}
            isBusy={isBusy}
          />
        )}

        {currentView === "wizard-step-3" && (
          <CreatePlanStep
            snapshotId={validation.snapshotCandidateId || "SNAP-014"}
            onPlanReady={handlePlanReady}
            onCancel={() => setCurrentView("wizard-step-2")}
            onTriggerSolve={handleTriggerSolve}
          />
        )}

        {currentView === "wizard-step-4" && (
          <ReviewPlanScreen
            plan={plan}
            isDirty={isDirty}
            lockedCount={lockedCount}
            optimizationStatus={optimizationStatus}
            isBusy={isBusy}
            onLockJob={handleLockJob}
            onChangeWindow={handleChangeWindow}
            onFindAlternative={handleFindAlternative}
            onExcludeJob={handleExcludeJob}
            onReoptimize={handleReoptimize}
            onApproveStep={() => setCurrentView("wizard-step-5")}
            onExport={handleExportPlan}
            onNewVersion={handleNewPlanVersion}
          />
        )}

        {currentView === "wizard-step-5" && (
          <ApprovePlanStep
            plan={plan}
            onApprove={handleApprovePlan}
            onBack={() => setCurrentView("wizard-step-4")}
            onExport={handleExportPlan}
            isBusy={isBusy}
          />
        )}

        {currentView === "plan-approved" && (
          <PlanApprovedScreen
            plan={plan}
            onExport={handleExportPlan}
            onNewVersion={handleNewPlanVersion}
          />
        )}

        {currentView === "previous-plans" && (
          <PreviousPlansList
            onSelectPlan={handleOpenPreviousPlan}
            onBackToHome={() => setCurrentView("home")}
          />
        )}

        {currentView === "rapid-block" && (
          <RapidBlockView
            baseRunId={plan.run_id}
            onExitToHome={() => setCurrentView("home")}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* 4. Global Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 5. Static Technical Footer */}
      <footer className="app-system-footer">
        <div className="footer-left">
          <span>RailNiyojan v0.1.0 • SIH26027</span>
          <span className="footer-separator">•</span>
          <span>Google OR-Tools CP-SAT</span>
          <span className="footer-separator">•</span>
          <span>Western Railway Division</span>
        </div>
        <div className="footer-right">
          <span>Synthetic data • Demonstration ruleset • Human approval required</span>
        </div>
      </footer>
    </main>
  );
}
