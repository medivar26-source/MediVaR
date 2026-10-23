import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Reports" };

/**
 * Reports is a tab of a learner's Progress (`/progress?tab=reports`) and of staff Insights
 * (`/performance?tab=reports`), which lists every report the viewer may read; this address sends each
 * to theirs, so old links keep working.
 */
export default async function ReportsPage() {
  const user = await getCurrentUser();
  redirect(personaFor(user.role) === "learner" ? "/progress?tab=reports" : "/performance?tab=reports");
}
