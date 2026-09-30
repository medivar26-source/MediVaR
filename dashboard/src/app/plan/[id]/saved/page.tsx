import { redirect } from "next/navigation";

/**
 * Retired: the standalone "plan saved" screen of the seven-step flow.
 *
 * A sealed plan now lives on the review step, which explains what happens next.
 */
export default async function LegacySavedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/plan/${id}/review`);
}
