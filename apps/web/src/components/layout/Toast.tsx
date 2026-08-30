"use client";

import { ToastMessage } from "@/types";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const icon =
          toast.type === "success"
            ? "✅"
            : toast.type === "warning"
              ? "⚠️"
              : toast.type === "error"
                ? "❌"
                : "ℹ️";

        return (
          <div key={toast.id} className={`toast-card toast-${toast.type}`} role="status">
            <span className="toast-icon">{icon}</span>
            <div className="toast-content">
              <strong>{toast.title}</strong>
              {toast.message && <p>{toast.message}</p>}
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
