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
export function StartPlanning({
  caseId,
  config,
}: {
  caseId: string;
  config: Record<string, string | undefined>;
}) {
  return (
    <form action={startPlan}>
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="mode" value={config.mode ?? ""} />
      <input type="hidden" name="difficulty" value={config.difficulty ?? ""} />
      <input type="hidden" name="design" value={config.design ?? ""} />
      <input type="hidden" name="fixation" value={config.fixation ?? ""} />
      <Button type="submit" variant="primary" icon={Play}>
        Start planning
      </Button>
    </form>
  );
}
