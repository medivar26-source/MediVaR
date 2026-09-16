import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./Card.module.css";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  tone?: "default" | "sunken" | "tonal";
  selected?: boolean;
  children?: ReactNode;
};

export function Card({
  padding = "md",
  tone = "default",
  selected,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        s.card,
        padding === "none" && s["pad-none"],
        padding === "sm" && s["pad-sm"],
        padding === "lg" && s["pad-lg"],
        tone === "sunken" && s.sunken,
        tone === "tonal" && s.tonal,
        selected && s.selected,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Use inside a padding="none" card so the header keeps its own inset. */
  flush?: boolean;
  className?: string;
};

export function CardHeader({
  title,
  subtitle,
  action,
  flush,
  className,
}: CardHeaderProps) {
  return (
    <div className={cx(s.header, flush && s.headerFlush, className)}>
      <div className={s.headerText}>
        <h3 className={s.title}>{title}</h3>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
