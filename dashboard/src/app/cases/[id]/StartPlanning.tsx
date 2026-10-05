import { Play } from "lucide-react";
import { Button } from "@/components/ui";
import { startPlan } from "@/app/actions";

/**
 * The one control that creates a `plans` row.
 *
 * `/setup` deliberately writes nothing — an abandoned setup should not leave a
 * draft behind — so the configuration it collected rides here in the URL and is
 * committed at the moment somebody picks a case. A form rather than a link,
 * because this is a write.
 */
export type ExistingPlan = {
  id: string;
  state: "draft" | "ready" | "paired" | "performed";
  sessionId?: string;
};

/**
 * A learner can plan the same case more than once. This resumes their latest draft if they have
 * one; otherwise it starts a plan. `startFresh` always creates a new plan, even beside a draft.
 */
export function StartPlanning({
  caseId,
  config,
  plan,
  hasPlans = false,
  startFresh = false,
  variant = "primary",
}: {
  caseId: string;
  config: Record<string, string | undefined>;
  /** The learner's latest plan on this case that is still a draft, if there is one. */
  plan?: ExistingPlan;
  /** Whether the learner has any plan on this case at all (including sealed ones). */
  hasPlans?: boolean;
  startFresh?: boolean;
  variant?: "primary" | "secondary";
}) {
  const label = startFresh
    ? "Start another plan"
    : plan
      ? "Resume planning"
      : hasPlans
        ? "Start a new plan"
        : "Start planning";

  return (
    <form action={startPlan}>
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="new" value={startFresh ? "1" : ""} />
      <input type="hidden" name="mode" value={config.mode ?? ""} />
      <input type="hidden" name="difficulty" value={config.difficulty ?? ""} />
      <input type="hidden" name="design" value={config.design ?? ""} />
      <input type="hidden" name="fixation" value={config.fixation ?? ""} />
      <Button type="submit" variant={variant} icon={Play}>
        {label}
      </Button>
    </form>
  );
}
