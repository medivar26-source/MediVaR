"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { settingsHref } from "@/lib/embed";
import s from "./SettingsModal.module.css";

/**
 * Quick access to settings without a full page transition. The trigger is
 * styled by whoever renders it; the dialog hosts the real /settings page in an
 * iframe with the app chrome removed (`?embed=1`).
 *
 * The close button lives in its own bar above the iframe, so the iframe's
 * scrollbar can never run underneath it.
 */
export function SettingsButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label="Settings"
        title="Settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      {open &&
        createPortal(
          <div className={s.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
            <div
              className={s.dialog}
              role="dialog"
              aria-modal="true"
              aria-label="Settings"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Top bar holding the close button */}
              <div className={s.topBar}>
                <button
                  ref={closeRef}
                  type="button"
                  className={s.close}
                  aria-label="Close settings"
                  title="Close"
                  onClick={() => setOpen(false)}
                >
                  <X className={s.closeIcon} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>

              {/* Iframe viewport */}
              <div className={s.frameWrapper}>
                <iframe className={s.frame} src={settingsHref(undefined, true)} title="Settings" />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
