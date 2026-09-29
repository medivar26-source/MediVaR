import { redirect } from "next/navigation";

/**
 * Compatibility redirect:
 * Cohorts for a program are now accessed directly within the Program Workspace under the Cohorts tab.
 */
export default async function ProgramCohortsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/programs/${id}?tab=cohorts`);
}
