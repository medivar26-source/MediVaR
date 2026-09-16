/**
 * The URL slugs for /performance/[skill], mapped to `report_category_meta`
 * keys. A slug is an address, so it is stable and readable; the key is the
 * database's name for the category. Nothing else may translate between them.
 *
 * Lives in `lib/` because both server pages and the client nav read it —
 * both server pages and the client nav read it.
 */

export const SKILL_SLUGS: Record<string, string> = {
  planning: "preop_planning",
  "bone-cuts": "bone_cuts",
  gaps: "gap_assessment",
  trialling: "trialling",
  implantation: "implantation",
  patella: "patellar",
  exposure: "exposure_closure",
};

export function slugForCategory(key: string): string | undefined {
  return Object.keys(SKILL_SLUGS).find((slug) => SKILL_SLUGS[slug] === key);
}
