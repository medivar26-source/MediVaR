import { redirect } from "next/navigation";

/**
 * Retired: the seven-step planning flow.
 *
 * Planning is now assessment → tibial → femoral → review. This address stays
 * as a redirect so bookmarks and old links keep working.
 */
export default async function LegacyStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/plan/${id}`);
}
