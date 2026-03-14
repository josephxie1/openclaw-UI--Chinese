import React, { useCallback, useEffect, useRef } from "react";
import { t } from "../i18n/index.ts";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Cerrar con Esc
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  // Focus trap: auto-focus al botón cancelar
  useEffect(() => {
    if (open && dialogRef.current) {
      const cancelBtn = dialogRef.current.querySelector<HTMLButtonElement>(".confirm-dialog__cancel");
      cancelBtn?.focus();
    }
  }, [open]);

  const onOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onCancel();
    },
    [onCancel],
  );

  if (!open) return null;

  return (
    <div className="confirm-dialog__overlay" onClick={onOverlayClick}>
      <div className="confirm-dialog" ref={dialogRef} role="alertdialog" aria-modal="true">
        {title && <div className="confirm-dialog__title">{title}</div>}
        <div className="confirm-dialog__message">{message}</div>
        <div className="confirm-dialog__actions">
          <button className="btn confirm-dialog__cancel" onClick={onCancel}>
            {cancelLabel ?? t("shared.cancel")}
          </button>
          <button
            className={`btn ${danger ? "danger" : ""} confirm-dialog__ok`}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("shared.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
