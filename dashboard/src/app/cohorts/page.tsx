import { redirect } from "next/navigation";

/**
 * Compatibility redirect:
 * Cohorts are now nested under Programs in the approved information architecture.
 */
export default function CohortsPageRedirect() {
  redirect("/programs");
}
