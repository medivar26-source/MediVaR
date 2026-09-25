import { AppShell } from "@/components/shell";
import { InstructorDashboard } from "@/components/dashboard/InstructorDashboard";
import { LearnerDashboard } from "@/components/dashboard/LearnerDashboard";
import {
  getInstructorDashboard,
  getLearnerDashboard,
} from "@/lib/data/dashboard";
import { personaFor } from "@/lib/roles";
import { WEEK_OPTIONS, windowFromParam } from "@/lib/window";
import { getCurrentUser } from "@/lib/session";

/**
 * One route, two dashboards. The persona is derived from the signed-in
 * profile's role — see lib/roles.ts. The administrator's view is not built.
 *
 * The window lives in the URL, like the case filters do, so a view stays put
 * across a reload and can be pasted into a message. The server re-runs the
 * accessors over it; there is no client-side copy of the series.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ weeks?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  const weeks = windowFromParam(params.weeks, WEEK_OPTIONS);

  return (
    <AppShell
      user={user}
      searchHint={
        persona === "instructor"
          ? 'Try searching "below pass mark"'
          : 'Try searching "tibial slope"'
      }
    >
      {persona === "instructor" ? (
        <InstructorDashboard
          user={user}
          data={await getInstructorDashboard(user.id, weeks)}
          weeks={weeks}
        />
      ) : (
        <LearnerDashboard
          user={user}
          data={await getLearnerDashboard(user.id, weeks)}
          weeks={weeks}
        />
      )}
    </AppShell>
  );
}
