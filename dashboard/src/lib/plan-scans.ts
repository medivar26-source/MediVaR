/**
 * Which radiograph a planning step draws on.
 *
 * Assessment, tibial and femoral planning must show the SAME scan for a given
 * view: landmarks placed on one image mean nothing on another. The case's own
 * imaging always wins; the fallbacks below are the demo plates, one per view,
 * shared by every step so they can never disagree.
 */

export type ScanView = "FLAP" | "KLAT";

export const FALLBACK_SCAN: Record<ScanView, string> = {
  FLAP: "/flap.jpg",
  KLAT: "/klat.jpg",
};

export function resolveScan(
  match: { src?: string } | undefined,
  view: ScanView,
): { src: string; isFallback: boolean } {
  return match?.src
    ? { src: match.src, isFallback: false }
    : { src: FALLBACK_SCAN[view], isFallback: true };
}

/** The badge copy shown over a canvas that is drawing a fallback plate. */
export function fallbackNotice(view: ScanView): string {
  return `Placeholder scan: this case has no ${view} image uploaded.`;
}
