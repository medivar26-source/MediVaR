import { Button } from "@/components/ui";
import { sessionLinks } from "@/lib/data/session-links";
import type { SessionSummary } from "@/lib/types";

/**
 * The row buttons for a session: its own page, its case, its report. They are three
 * different destinations, so they are three buttons, and a button is shown only when
 * its page exists for this session (a report that was never generated has no link).
 * A scheduled session has not run, so it has no session page to open: its case is
 * where it is prepared.
 */
export function SessionActions({
  session,
}: {
  session: Pick<SessionSummary, "id" | "caseId" | "planId" | "status">;
}) {
  const links = sessionLinks(session);
  const scheduled = session.status === "scheduled";

  return (
    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
      {!scheduled && (
        <Button variant="ghost" size="sm" href={links.session}>
          Session
        </Button>
      )}
      {links.case && (
        <Button variant="ghost" size="sm" href={links.case}>
          {scheduled ? "Prepare" : "Case"}
        </Button>
      )}
      {links.report && (
        <Button variant="ghost" size="sm" href={links.report}>
          Report
        </Button>
      )}
    </div>
  );
}
