import type { ReactNode } from "react";
import Link from "next/link";
import { Bone, ChevronRight, Stethoscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./LaunchShell.module.css";

export type LaunchAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  disabled?: boolean;
  /** Stated beside a disabled action so it never reads as a dead control. */
  disabledReason?: string;
};

export type LaunchUtility = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type LaunchShellProps = {
  title: string;
  subtitle: string;
  actions: LaunchAction[];
  utilities: LaunchUtility[];
  /** The hero artwork. Falls back to a placeholder while assets are pending. */
  visual?: ReactNode;
};

export function LaunchShell({
  title,
  subtitle,
  actions,
  utilities,
  visual,
}: LaunchShellProps) {
  return (
    <div className={s.page}>
      <div className={s.frame}>
        <div className={s.top}>
          <div className={s.left}>
            <div className={s.brand}>
              <span className={s.mark} aria-hidden="true">
                <Stethoscope className={s.markGlyph} strokeWidth={1.75} />
              </span>
              <span>
                <span className={s.wordmark}>MEDIVER</span>
                <span className={s.tagline}>
                  Precision. Safety. Better outcomes.
                </span>
              </span>
            </div>

            <h1 className={s.title}>{title}</h1>
            <p className={s.subtitle}>{subtitle}</p>

            <nav className={s.actions} aria-label="Procedure actions">
              {actions.map((action) =>
                action.disabled ? (
                  <span
                    key={action.label}
                    className={cx(s.action, s.actionDisabled)}
                    aria-disabled="true"
                    title={action.disabledReason}
                  >
                    <action.icon
                      className={s.actionIcon}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className={s.actionLabel}>{action.label}</span>
                    <ChevronRight
                      className={s.actionChevron}
                      aria-hidden="true"
                    />
                  </span>
                ) : (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cx(s.action, action.primary && s.actionPrimary)}
                  >
                    <action.icon
                      className={s.actionIcon}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className={s.actionLabel}>{action.label}</span>
                    <ChevronRight
                      className={s.actionChevron}
                      aria-hidden="true"
                    />
                  </Link>
                ),
              )}
            </nav>
          </div>

          <div className={s.visual}>
            {visual ?? (
              <div className={s.visualFallback}>
                <Bone className={s.visualFallbackIcon} strokeWidth={1.25} />
                <span className={s.visualFallbackText}>
                  Procedure artwork pending
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className={s.utility} aria-label="Utilities">
          {utilities.map((utility) => (
            <Link
              key={utility.label}
              href={utility.href}
              className={s.utilityItem}
            >
              <utility.icon
                className={s.utilityIcon}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className={s.utilityLabel}>{utility.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
