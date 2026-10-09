import { Check } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./JourneyStrip.module.css";

/**
 * The learner's line through the product, shown on the case page, the planning
 * workspace and the session report so the next step is never a guess:
 * assigned case → pre-op plan → lock plan → headset session → report.
 */
export type JourneyStage = "assigned" | "plan" | "lock" | "session" | "report";

const STAGES: { id: JourneyStage; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "plan", label: "Pre-op plan" },
  { id: "lock", label: "Lock plan" },
  { id: "session", label: "Headset session" },
  { id: "report", label: "Report" },
];

/** Where a learner stands on one case, from facts the case and plan pages already hold. */
export function journeyStage(input: {
  hasPlan: boolean;
  /** Every step but the last has an answer, so only locking is left. */
  readyToLock: boolean;
  planLocked: boolean;
  hasSession: boolean;
  hasScoredReport: boolean;
}): JourneyStage | "done" {
  if (input.hasScoredReport) return "done";
  if (input.hasSession) return "session";
  if (input.planLocked) return "session";
  if (input.readyToLock) return "lock";
  return "plan";
}

export function JourneyStrip({
  current,
  detail,
}: {
  current: JourneyStage | "done";
  /** One short line about the current stage, such as "Tibial step". */
  detail?: string;
}) {
  const currentIndex = current === "done" ? STAGES.length : STAGES.findIndex((x) => x.id === current);

  return (
    <ol className={s.strip} aria-label="Where you are on this case">
      {STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const now = i === currentIndex;
        return (
          <li
            key={stage.id}
            className={cx(s.stage, done && s.done, now && s.now)}
            aria-current={now ? "step" : undefined}
          >
            <span className={s.dot} aria-hidden="true">
              {done ? <Check className={s.tick} strokeWidth={3} /> : i + 1}
            </span>
            <span className={s.text}>
              <span className={s.label}>{stage.label}</span>
              <span className={s.state}>
                {done ? "Done" : now ? (detail ?? "Next") : "Later"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
