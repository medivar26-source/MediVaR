import { redirect } from "next/navigation";

/**
 * The launcher started here as literals. It moved to
 * `/simulations/[procedure]`, fed from the catalogue.
 *
 * The route stays as a redirect rather than being deleted: it is the URL a
 * kiosk-locked headset-adjacent machine may already have bookmarked, and
 * `npm run smoke` holds it at 200.
 */
export default function LaunchPage() {
  redirect("/simulations/tkr");
}
