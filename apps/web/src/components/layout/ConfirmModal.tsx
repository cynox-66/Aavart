"use client";

import { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
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
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`modal-card modal-${variant}`}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            {variant === "destructive" && <span className="modal-icon-badge danger">⚠️</span>}
            {variant === "emergency" && <span className="modal-icon-badge emergency">🚨</span>}
            {variant === "default" && <span className="modal-icon-badge neutral">ℹ️</span>}
            <h3 id="modal-title">{title}</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onCancel} disabled={isBusy}>
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
