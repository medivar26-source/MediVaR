/* No "use client" on purpose: with no hooks of its own this renders as a
   server component when a server page uses it, and is pulled into the client
   bundle only when a client component passes a handler. Marking it here would
   force every icon prop to cross the boundary and fail. */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Chip.module.css";

export type ChipProps = {
  children: ReactNode;
  icon?: LucideIcon;
  count?: number;
  selected?: boolean;
  tone?: "default" | "muted";
  onClick?: () => void;
  className?: string;
};

export function Chip({
  children,
  icon: Icon,
  count,
  selected,
  tone = "default",
  onClick,
  className,
}: ChipProps) {
  const classes = cx(
    s.chip,
    tone === "muted" && s.muted,
    selected && s.selected,
    onClick && s.interactive,
    className,
  );

  const content = (
    <>
      {Icon && <Icon className={s.icon} aria-hidden="true" strokeWidth={1.75} />}
      {children}
      {count !== undefined && <span className={s.count}>{count}</span>}
    </>
  );

  if (!onClick) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Describes the group for screen readers, e.g. "Difficulty". */
  label: string;
  className?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div className={cx(s.segmented, className)} role="group" aria-label={label}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            className={cx(s.segment, on && s.segmentOn)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
