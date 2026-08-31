"use client";

import { ReactNode, useEffect, useRef } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  // ReactNode, not string: callers pass an icon alongside the text.
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  variant?: "default" | "destructive" | "emergency";
  isBusy?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isBusy = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Remember what had focus so it can be restored on close.
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      // Keep Tab focus inside the dialog.
      const focusables = cardRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // Move focus into the dialog on open.
    const timer = window.setTimeout(() => {
      const target = cardRef.current?.querySelector<HTMLElement>(
        'input:not(:disabled), textarea:not(:disabled), button:not(:disabled)',
      );
      target?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, isBusy, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        // Click the backdrop (not the card) to dismiss.
        if (e.target === e.currentTarget && !isBusy) onCancel();
      }}
    >
      <div className={`modal-card modal-${variant}`} ref={cardRef}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            {variant === "destructive" && <span className="modal-icon-badge danger">⚠️</span>}
            {variant === "emergency" && <span className="modal-icon-badge emergency">🚨</span>}
            {variant === "default" && <span className="modal-icon-badge neutral">ℹ️</span>}
            <h3 id="modal-title">{title}</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            disabled={isBusy}
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">{description}</p>
          {children}
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn-cancel" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`modal-btn-confirm ${variant}`}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
