import { AppShell } from "@/components/shell";
import { InstructorDashboard } from "@/components/dashboard/InstructorDashboard";
import { LearnerDashboard } from "@/components/dashboard/LearnerDashboard";
import {
  getInstructorDashboard,
  getLearnerDashboard,
} from "@/lib/data/dashboard";
import { getPlans } from "@/lib/data/plans";
import { listCases } from "@/lib/data/cases";
import { getPrograms } from "@/lib/data/programs";
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

  if (persona === "instructor") {
    return (
      <AppShell user={user} searchHint='Try searching "below pass mark"'>
        <InstructorDashboard
          user={user}
          data={await getInstructorDashboard(user.id, weeks)}
          weeks={weeks}
        />
      </AppShell>
    );
  }

  const [learnerData, programs, plansResult, casesResult] = await Promise.all([
    getLearnerDashboard(user.id, weeks),
    getPrograms(),
    getPlans(),
    listCases(user.id, { attempted: "all" }),
  ]);

  return (
    <AppShell user={user} searchHint='Try searching "tibial slope"'>
      <LearnerDashboard
        user={user}
        data={learnerData}
        programs={programs}
        plans={plansResult.plans}
        cases={casesResult.cases}
        weeks={weeks}
      />
    </AppShell>
  );
}

