import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { DemoDataNote } from "@/components/ui";
import { getReportsList } from "@/lib/data/performance";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { ReportsView } from "./ReportsView";

export const metadata: Metadata = { title: "Reports" };

/**
 * Every generated report an instructor or administrator may read. A learner's reports are a tab of
 * Progress (`/progress?tab=reports`); this address sends them there, so old links keep working.
 */
export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (personaFor(user.role) === "learner") redirect("/progress?tab=reports");

  const reports = await getReportsList(user);

  // The scope decides whose reports are in the list; a name column only earns its width when the
  // viewer is looking across more than their own sessions.
  const showLearner = reports.some((r) => r.userId !== user.id);

  return (
    <AppShell user={user} searchHint='Try searching "reports"'>
      <Breadcrumbs items={[{ label: "Reports" }, { label: "Global Reports" }]} />

      <PageHeader
        title="Global Reports"
        lede="Every generated surgical case report you may read. A report exists once its session completes and the database scores it."
      />
      <DemoDataNote />
      <ReportsView reports={reports} learner={false} showLearner={showLearner} />
    </AppShell>
  );
}
