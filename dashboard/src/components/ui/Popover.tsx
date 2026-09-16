"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Popover.module.css";

/** Closes on Escape and on a click outside. Both are expected of a menu. */
export function Popover({
  trigger,
  children,
  align = "end",
  label,
}: {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={s.wrap} ref={wrapRef}>
      <button
        type="button"
        className={s.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>

      {open && (
        <div
          className={cx(s.panel, align === "end" ? s.alignEnd : s.alignStart)}
          role="menu"
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function PopoverHeading({ children }: { children: ReactNode }) {
  return <p className={s.heading}>{children}</p>;
}

export function PopoverItem({
  icon: Icon,
  children,
  meta,
  selected,
  onClick,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  meta?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cx(s.item, selected && s.itemOn)}
      onClick={onClick}
    >
      {Icon && <Icon className={s.itemIcon} strokeWidth={1.75} aria-hidden="true" />}
      <span className={s.itemBody}>
        {children}
        {meta && <span className={s.itemMeta}>{meta}</span>}
      </span>
    </button>
  );
}

export function PopoverDivider() {
  return <div className={s.divider} />;
}

export function PopoverEmpty({ children }: { children: ReactNode }) {
  return <p className={s.empty}>{children}</p>;
}
