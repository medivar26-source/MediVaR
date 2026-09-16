import type { ReactNode } from "react";
import { Check, Minus, TriangleAlert, CircleX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Badge.module.css";

/**
 * The product's core mechanic is a tri-state clinical judgement.
 * Colour is never the only signal: every status carries an icon and a
 * text label, because roughly 1 in 12 male users has a colour-vision
 * deficiency and several of them will be surgeons.
 */
export type BadgeStatus = "pass" | "warn" | "fail" | "neutral" | "active";

const STATUS_ICON: Record<Exclude<BadgeStatus, "active">, LucideIcon> = {
  pass: Check,
  warn: TriangleAlert,
  fail: CircleX,
  neutral: Minus,
};

/** Read aloud by assistive tech in place of the glyph. */
const STATUS_MEANING: Record<BadgeStatus, string> = {
  pass: "Pass",
  warn: "Borderline",
  fail: "Fail",
  neutral: "Pending",
  active: "In progress",
};

export type BadgeProps = {
  status?: BadgeStatus;
  children: ReactNode;
  /** Hide the icon. Only for places where the label alone already carries the state. */
  hideIcon?: boolean;
  className?: string;
};

export function Badge({
  status = "neutral",
  children,
  hideIcon,
  className,
}: BadgeProps) {
  const Icon = status === "active" ? null : STATUS_ICON[status];

  return (
    <span className={cx(s.badge, s[status], className)}>
      <span className="srOnly">{STATUS_MEANING[status]}: </span>
      {!hideIcon &&
        (status === "active" ? (
          <span className={s.dot} aria-hidden="true" />
        ) : (
          Icon && (
            <Icon className={s.icon} aria-hidden="true" strokeWidth={2.5} />
          )
        ))}
      {children}
    </span>
  );
}
