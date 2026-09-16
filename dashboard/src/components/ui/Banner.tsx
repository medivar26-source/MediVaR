import type { ReactNode } from "react";
import { Check, Info, TriangleAlert, CircleX, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Banner.module.css";

export type BannerTone = "info" | "brand" | "pass" | "warn" | "fail";

const TONE_ICON: Record<BannerTone, LucideIcon> = {
  info: Info,
  brand: Info,
  pass: Check,
  warn: TriangleAlert,
  fail: CircleX,
};

const TONE_ROLE: Record<BannerTone, string> = {
  info: "Information",
  brand: "Information",
  pass: "Success",
  warn: "Warning",
  fail: "Error",
};

export type BannerProps = {
  tone?: BannerTone;
  title: ReactNode;
  /** State the problem and the fix. Never just "Invalid input". */
  children?: ReactNode;
  action?: ReactNode;
  /** Swaps the glyph for a pulsing dot — for states that are happening now. */
  live?: boolean;
  onDismiss?: () => void;
  className?: string;
};

export function Banner({
  tone = "info",
  title,
  children,
  action,
  live,
  onDismiss,
  className,
}: BannerProps) {
  const Icon = TONE_ICON[tone];
  // Whether assistive tech should interrupt — unrelated to the `live` dot.
  const urgent = tone === "fail" || tone === "warn";

  return (
    <div
      className={cx(s.banner, s[tone], className)}
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
    >
      <span className={s.icon} aria-hidden="true">
        {live ? (
          <span className={s.pulse} />
        ) : (
          <Icon className={s.glyph} strokeWidth={2.5} />
        )}
      </span>

      <div className={s.body}>
        <p className={s.title}>
          <span className="srOnly">{TONE_ROLE[tone]}: </span>
          {title}
        </p>
        {children && <div className={s.text}>{children}</div>}
      </div>

      {action && <div className={s.action}>{action}</div>}

      {onDismiss && (
        <button
          type="button"
          className={s.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X width={16} height={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
