import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell";
import { DemoDataNote } from "@/components/ui";
import { getActivity } from "@/lib/data/performance";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { ActivityView } from "./ActivityView";

export const metadata: Metadata = { title: "Activity" };

/**
 * A learner's activity is a tab of Progress (`/progress?tab=activity`); this address sends them there,
 * so old links keep working. Instructors and administrators keep this page.
 */
export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (personaFor(user.role) === "learner") redirect("/progress?tab=activity");

  const view = await getActivity(user.id);

  return (
    <AppShell user={user} searchHint='Try searching "activity"'>
      <PageHeader
        title="Activity"
        lede="Your practice rhythm — every session, day by day, and the weekly pattern behind it."
      />
      <DemoDataNote />
      <ActivityView view={view} />
    </AppShell>
  );
}
