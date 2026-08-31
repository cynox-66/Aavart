"use client";

import { AppView } from "@/types";

interface StepItem {
  number: number;
  label: string;
  view: AppView;
}

const steps: StepItem[] = [
  { number: 1, label: "Select Data", view: "wizard-step-1" },
  { number: 2, label: "Check Data", view: "wizard-step-2" },
  { number: 3, label: "Create Plan", view: "wizard-step-3" },
  { number: 4, label: "Review Plan", view: "wizard-step-4" },
  { number: 5, label: "Approve Plan", view: "wizard-step-5" },
];

interface WorkflowStepperProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isPlanCreated: boolean;
  isApproved: boolean;
}

export function WorkflowStepper({
  currentView,
  onNavigate,
  isPlanCreated,
  isApproved,
}: WorkflowStepperProps) {
  let activeStep = 1;
  if (currentView === "wizard-step-2") activeStep = 2;
  else if (currentView === "wizard-step-3") activeStep = 3;
  else if (currentView === "wizard-step-4") activeStep = 4;
  else if (currentView === "wizard-step-5" || currentView === "plan-approved") activeStep = 5;

  return (
    <nav className="rn-stepper" aria-label="Planning Workflow Steps">
      {steps.map((step) => {
        const isCurrent = step.number === activeStep;
        const isCompleted = step.number < activeStep;
        const isApprovedStep = step.number === 5 && isApproved;

        // Steps 4/5 are only reachable while a plan for THIS wizard pass
        // exists. `isPlanCreated` is reset when a new plan version starts, so
        // this can no longer jump into a stale plan from a fresh session.
        const isClickable =
          step.number <= activeStep ||
          (isPlanCreated && (step.number === 4 || step.number === 5));

        return (
          <button
            key={step.number}
            type="button"
            className={`rn-step-item ${isCurrent ? "active" : ""} ${
              isCompleted ? "completed" : ""
            } ${isApprovedStep ? "step-approved-theme" : ""}`}
            onClick={() => isClickable && onNavigate(step.view)}
            disabled={!isClickable}
            aria-current={isCurrent ? "step" : undefined}
            title={
              isClickable
                ? `Go to step ${step.number}: ${step.label}`
                : `Step ${step.number} (${step.label}) is not available yet`
            }
          >
            <div className="rn-step-badge">
              {isCompleted ? (
                <i aria-hidden="true" className="fi fi-ss-check-circle" style={{ fontSize: "12px", color: "currentColor", display: "flex" }}></i>
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <span className="rn-step-label">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
