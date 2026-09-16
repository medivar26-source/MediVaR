import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Monitor, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/cx";
import {
  PLAN_STEPS,
  furthestOpenStep,
  gateFor,
  type PlanDetail,
} from "@/lib/plan";
import { titleCase } from "@/lib/format";
import s from "./plan.module.css";

/**
 * The planning chrome
 *
 * The stepper rail replaces the product navigation while planning, because
 * planning is a focused mode and the global nav is one click away on the back
 * link. Backward is always free; forward is gated.
 *
 * A step past the first unpassed one is not a link. Rendering it as a dead
 * anchor would be a control that cannot be used, so it renders as text with its
 * reason in the title
 *
 * "Locked" here means exactly what the page's redirect means — `step > open` —
 * and nothing else. It used to carry an extra `&& !gate.passed`, which sounds
 * like generosity and is not: gates are independent, so step 5 can pass while
 * step 2 is still open, and that clause rendered step 5 as a live link that
 * bounced the user straight back to step 2. Two rules for one decision is how a
 * rail starts lying about where it can take you.
 */
export function PlanShell({
  plan,
  step,
  title,
  lede,
  children,
}: {
  plan: PlanDetail;
  step: number;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const open = furthestOpenStep(plan.gates);
  const budget = PLAN_STEPS.find((s) => s.step === step)?.budget;

  return (
    <div className={s.page}>
      <nav className={s.rail} aria-label="Planning steps">
        <Link href={`/cases/${plan.caseId}`} className={s.back}>
          <ArrowLeft width={15} height={15} strokeWidth={2.25} aria-hidden="true" />
          Back to the case
        </Link>

        <div className={s.railCase}>
          <p className={s.railEyebrow}>Pre-operative phase</p>
          <p className={s.railTitle}>{plan.case.title}</p>
          <p className={s.railMeta}>
            {plan.case.pathologyLabel} · {titleCase(plan.case.side)} ·{" "}
            {titleCase(plan.case.difficulty)}
          </p>
        </div>

        <div className={s.steps}>
          {PLAN_STEPS.map((entry) => {
            const gate = gateFor(plan.gates, entry.step);
            const current = entry.step === step;
            const locked = entry.step > open;

            const inner = (
              <>
                <span className={s.stepDot} aria-hidden="true">
                  {gate.passed ? (
                    <Check className={s.stepGlyph} strokeWidth={3} />
                  ) : locked ? (
                    <Lock className={s.stepGlyph} strokeWidth={2.25} />
                  ) : (
                    entry.step
                  )}
                </span>
                <span className={s.stepBody}>
                  <span className={s.stepTitle}>{entry.title}</span>
                  <span className={s.stepMeta}>
                    {gate.passed
                      ? "Passed"
                      : current
                        ? "In progress"
                        : locked
                          ? "Locked"
                          : entry.budget}
                  </span>
                </span>
              </>
            );

            const classes = cx(
              s.step,
              gate.passed && s.stepDone,
              current && s.stepOn,
              locked && s.stepLocked,
            );

            if (locked) {
              return (
                <div
                  key={entry.step}
                  className={classes}
                  title={`Finish step ${open} first.`}
                  aria-disabled="true"
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={entry.step}
                href={`/plan/${plan.id}/step/${entry.step}`}
                className={classes}
                aria-current={current ? "step" : undefined}
              >
                {inner}
              </Link>
            );
          })}
        </div>

        <p className={s.railFoot}>
          Autosaved on every change. Time on each step is recorded silently for
          the report.
        </p>
      </nav>

      <div className={s.main}>
        <main className={s.surface}>
          <div className={s.tooSmall}>
            <Monitor width={26} height={26} strokeWidth={1.5} aria-hidden="true" />
            <h1 className={s.title}>Planning needs a larger display</h1>
            <p className={s.lede}>
              The measurement tools work on a radiograph at real scale, and
              shrinking them would mean compromising the measurement rather than
              the layout. Open this plan on a desktop of at least 1024px.
            </p>
          </div>

          <div className={s.head}>
            <div className={s.headText}>
              <p className={s.eyebrow}>
                Step {step} of {PLAN_STEPS.length} · Pre-operative phase
              </p>
              <h1 className={s.title}>{title}</h1>
              <p className={s.lede}>{lede}</p>
            </div>
            <div className={s.headSide}>
              {budget && <span className={s.budget}>Budget {budget}</span>}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * The forward gate. A disabled control states its unmet condition beside it.
 *
 * `aria-live` because this sentence is the only thing that changes when an
 * answer is graded. Autosave rewrites it in place a beat after the last
 * keystroke, and without a live region a screen-reader user gets no signal that
 * the verdict they are working towards has moved. `polite`, not `assertive`:
 * it should arrive at the end of what is being read, not interrupt somebody
 * mid-question.
 */
export function GateNote({ passed, reason }: { passed: boolean; reason: string }) {
  const Icon = passed ? Check : TriangleAlert;
  return (
    <p
      className={cx(s.gate, passed ? s.gatePass : s.gateOpen)}
      aria-live="polite"
    >
      <Icon className={s.gateIcon} strokeWidth={2.25} aria-hidden="true" />
      <span className={s.gateText}>
        <span className="srOnly">{passed ? "Step passed: " : "Step open: "}</span>
        {reason}
      </span>
    </p>
  );
}
