import { redirect } from "next/navigation";
import { getCohort } from "@/lib/data/cohorts";

/**
 * Compatibility redirect:
 * Individual cohort workspaces are now organized under their parent program in the approved hierarchy:
 * /programs/[programId]/cohorts/[cohortId]
 */
export default async function CohortDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCohort(id).catch(() => null);

  if (!detail || !detail.cohort.program_id) {
    redirect("/programs");
  }

  redirect(`/programs/${detail.cohort.program_id}/cohorts/${id}`);
}
