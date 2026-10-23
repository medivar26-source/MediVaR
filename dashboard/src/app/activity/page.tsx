import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Activity" };

/**
 * Activity is a tab of a learner's Progress (`/progress?tab=activity`) and of staff Insights
 * (`/performance?tab=activity`); this address sends each to theirs, so old links keep working.
 */
export default async function ActivityPage() {
  const user = await getCurrentUser();
  redirect(personaFor(user.role) === "learner" ? "/progress?tab=activity" : "/performance?tab=activity");
}
