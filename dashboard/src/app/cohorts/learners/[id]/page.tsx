import { redirect } from "next/navigation";

/**
 * Compatibility redirect:
 * A learner profile now lives at `/learners/[id]`.
 */
export default async function LegacyLearnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/learners/${id}`);
}
