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

export function StartPlanning({
  caseId,
  config,
  plan,
}: {
  caseId: string;
  config: Record<string, string | undefined>;
  /** The learner's latest plan on this case, if there is one. */
  plan?: ExistingPlan;
}) {
  // Past "draft" the plan is sealed: send them to where it now lives rather
  // than through `startPlan`, which would bounce a finished plan back here.
  if (plan?.state === "performed" && plan.sessionId) {
    return (
      <Button variant="primary" href={`/sessions/${plan.sessionId}/report`}>
        View report
      </Button>
    );
  }
  if (plan && plan.state !== "draft") {
    return (
      <Button variant="primary" href={`/plan/${plan.id}/review`}>
        View sealed plan
      </Button>
    );
  }
  return (
    <form action={startPlan}>
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="mode" value={config.mode ?? ""} />
      <input type="hidden" name="difficulty" value={config.difficulty ?? ""} />
      <input type="hidden" name="design" value={config.design ?? ""} />
      <input type="hidden" name="fixation" value={config.fixation ?? ""} />
      <Button type="submit" variant="primary" icon={Play}>
        {plan ? "Resume planning" : "Start planning"}
      </Button>
    </form>
  );
}
