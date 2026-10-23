"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/cx";
import { shouldMountDialogContent } from "@/lib/case-creation";
import s from "./Dialog.module.css";

/**
 * A modal dialog on the platform's own `<dialog>`: focus is trapped, Escape closes it, and the page
 * behind is inert, all without a library.
 *
 * Its content is created the first time it opens and then kept (hidden when closed), so a form inside
 * keeps what has been typed if the dialog is closed by accident and reopened.
 */
export function Dialog({
  open,
  onClose,
  title,
  size = "lg",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** `sm` for a short form of a few fields; `lg` for a wizard or a list. */
  size?: "sm" | "lg";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [everOpened, setEverOpened] = useState(open);
  // Remembered while rendering (not in an effect), so the content exists on the very render that opens it.
  if (open && !everOpened) setEverOpened(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cx(s.dialog, size === "sm" && s.sm)}
      aria-labelledby={titleId}
      // Escape: let the owner decide, so its state and the dialog never disagree.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A click on the backdrop lands on the dialog element itself, not on its content.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className={s.frame}>
        <header className={s.head}>
          <h2 id={titleId} className={s.title}>
            {title}
          </h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <X width={18} height={18} aria-hidden="true" />
          </button>
        </header>
        <div className={s.body}>{shouldMountDialogContent(open, everOpened) ? children : null}</div>
      </div>
    </dialog>
  );
}
