import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./States.module.css";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  /** One line. Say what to do, not just that nothing is here. */
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(s.empty, className)}>
      <div className={s.emptyInner}>
        <div className={s.emptyIcon} aria-hidden="true">
          <Icon width={26} height={26} strokeWidth={1.5} />
        </div>
        <h3 className={s.emptyTitle}>{title}</h3>
        {children && <p className={s.emptyText}>{children}</p>}
        {action}
      </div>
    </div>
  );
}

export type SkeletonProps = {
  width?: string;
  height?: string;
  block?: boolean;
  className?: string;
};

/** Reserves the final layout's space so nothing shifts when data lands. */
export function Skeleton({
  width = "100%",
  height = "12px",
  block,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cx(s.skeleton, block && s.skeletonBlock, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
