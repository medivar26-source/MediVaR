/**
 * The V1 size ladders — the single source of implant dimensions in the planner.
 *
 * PROVENANCE: ENGINEERING_DERIVATION. VALIDATION: CLINICAL_APPROVAL_REQUIRED.
 *
 * These numbers are NOT manufacturer data. They were inherited from the first planner implementation,
 * and they must not be presented as any manufacturer's implant. Two of them (tibial size 3 = 42.5 × 68.2 mm,
 * femoral size 4 = 58.4 × 64.1 mm) coincide with the *example radiographic bone dimensions* printed in the
 * V1 PDF; that is a coincidence of how the ladder was seeded, not evidence that those are implant sizes.
 *
 * V1 fixes the number of sizes (tibial 1-6, femoral 1-8). Changing any value here changes planning
 * results and must go through clinical review.
 */

export type SizeDimensions = { size: number; apMm: number; mlMm: number };

export const TIBIAL_SIZE_DIMENSIONS: readonly SizeDimensions[] = [
  { size: 1, apMm: 38.0, mlMm: 61.0 },
  { size: 2, apMm: 40.0, mlMm: 64.5 },
  { size: 3, apMm: 42.5, mlMm: 68.2 },
  { size: 4, apMm: 45.0, mlMm: 72.0 },
  { size: 5, apMm: 48.0, mlMm: 76.5 },
  { size: 6, apMm: 51.0, mlMm: 81.0 },
];

export const FEMORAL_SIZE_DIMENSIONS: readonly SizeDimensions[] = [
  { size: 1, apMm: 52.0, mlMm: 58.0 },
  { size: 2, apMm: 54.0, mlMm: 60.0 },
  { size: 3, apMm: 56.2, mlMm: 62.0 },
  { size: 4, apMm: 58.4, mlMm: 64.1 },
  { size: 5, apMm: 61.0, mlMm: 67.0 },
  { size: 6, apMm: 63.5, mlMm: 70.0 },
  { size: 7, apMm: 66.5, mlMm: 73.0 },
  { size: 8, apMm: 70.0, mlMm: 77.0 },
];

/** The sizes V1 requires. A test pins these. */
export const V1_TIBIAL_SIZES = [1, 2, 3, 4, 5, 6] as const;
export const V1_FEMORAL_SIZES = [1, 2, 3, 4, 5, 6, 7, 8] as const;
