/**
 * Content and tuning for the feature grid on the sign-in brand panel.
 * The component reads everything from here, so changing a headline, the number
 * of tiles, or how far a tile opens never means editing markup or CSS.
 */

export type AuthFeature = {
  title: string;
  description: string;
};

export const AUTH_FEATURES: readonly AuthFeature[] = [
  {
    title: "Patient-Specific Planning",
    description: "Prepare surgical plans around individual patient anatomy.",
  },
  {
    title: "Measurable Progress",
    description: "Track every attempt with meaningful performance data.",
  },
  {
    title: "Repeat Without Risk",
    description: "Practise surgical workflows in a controlled virtual environment.",
  },
  {
    title: "Step-by-Step Guidance",
    description: "Move through each stage, from first incision to final closure.",
  },
  {
    title: "Real-Time Assessment",
    description: "Evaluate technique and identify opportunities to improve.",
  },
  {
    title: "Better Surgical Outcomes",
    description: "Build confidence through structured, repeatable practice.",
  },
];

/** Footer labels shown at the bottom-left and bottom-right of every tile. */
export const AUTH_FEATURE_LABELS = { start: "DEV BY", end: "MEDIVER" } as const;

export const AUTH_FEATURE_GROUP_LABEL = "Platform highlights";

export const AUTH_GRID = {
  /** Grid columns on a wide screen, and on a narrower one. */
  columnsWide: 3,
  columnsNarrow: 2,
  /** Width of the active tile's column, and height of its row, relative to 1fr. */
  activeColumnFr: 2,
  activeRowFr: 1.6,
  /** Media queries: where the 3-column layout starts, and what counts as touch-only. */
  wideQuery: "(min-width: 1180px)",
  noHoverQuery: "(hover: none)",
  /**
   * Hover intent, in ms. The layout moves under the pointer, so switching instantly
   * made tiles flap; these waits let the pointer settle before the grid reacts.
   */
  delay: { open: 40, switch: 90, leave: 140, blur: 60 },
} as const;
