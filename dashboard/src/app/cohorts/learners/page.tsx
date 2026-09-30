import { redirect } from "next/navigation";

/**
 * Compatibility redirect:
 * Learners moved to `/learners` so the address matches the sidebar.
 */
export default function LegacyLearnersPage() {
  redirect("/learners");
}
