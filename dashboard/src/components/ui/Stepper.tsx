import { Fragment } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Stepper.module.css";

export type StepState = "done" | "current" | "upcoming" | "blocked";

export type Step = {
  label: string;
  /** Sub-label: a time budget, a scene count, an outcome. */
  meta?: string;
  state: StepState;
  href?: string;
};

export type StepperProps = {
  steps: Step[];
  orientation?: "vertical" | "horizontal";
  /** Accessible name, e.g. "Pre-operative planning steps". */
  label: string;
  className?: string;
};

export function Stepper({
  steps,
  orientation = "vertical",
  label,
  className,
}: StepperProps) {
  const horizontal = orientation === "horizontal";

  return (
    <nav
      aria-label={label}
      className={cx(s.rail, horizontal && s.horizontal, className)}
    >
      {steps.map((step, i) => {
        const stateClass =
          step.state === "done"
            ? s.done
            : step.state === "current"
              ? s.current
              : step.state === "blocked"
                ? s.blocked
                : undefined;

        const inner = (
          <>
            <span className={s.dot} aria-hidden="true">
              {step.state === "done" ? (
                <Check className={s.glyph} strokeWidth={3} />
              ) : step.state === "blocked" ? (
                <Lock className={s.glyph} strokeWidth={2.25} />
              ) : (
                i + 1
              )}
            </span>
            <span className={s.body}>
              <span className={s.label}>{step.label}</span>
              {step.meta && <span className={s.meta}>{step.meta}</span>}
            </span>
          </>
        );

        const common = {
          className: cx(s.step, stateClass, step.href && s.stepLink),
          "aria-current": step.state === "current" ? ("step" as const) : undefined,
        };

        return (
          <Fragment key={step.label}>
            {i > 0 && horizontal && (
              <span
                className={cx(
                  s.connector,
                  steps[i - 1].state === "done" && s.connectorDone,
                )}
                aria-hidden="true"
              />
            )}
            {step.href && step.state !== "blocked" ? (
              <Link href={step.href} {...common}>
                {inner}
              </Link>
            ) : (
              <div {...common}>{inner}</div>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
