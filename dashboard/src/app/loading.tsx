import { PageSkeleton } from "@/components/ui/PageSkeleton";

/**
 * Shown the moment a link is followed, while the page's data loads. The side navigation and top bar stay
 * (they live in the root layout), so only the content area shows this placeholder.
 */
export default function Loading() {
  return <PageSkeleton variant="cards" />;
}
