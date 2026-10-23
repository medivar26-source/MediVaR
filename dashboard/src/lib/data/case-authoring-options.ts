/**
 * The skills offered when an instructor authors a case. One list, used by the full-page Create Case
 * and by the Add Case dialog on Procedures, so the two can never offer different skills.
 *
 * These are the ids of the skill rows seeded for the TKR procedure.
 */
export const AUTHORING_SKILLS: { id: string; name: string; weight: number }[] = [
  { id: "116c30d7-817e-417d-afd7-a76c296af9ec", name: "Bone cuts & alignment", weight: 0.3 },
  { id: "2006c1cd-e655-4011-9b1d-078cc8b2ae48", name: "Gap assessment", weight: 0.25 },
  { id: "2932685b-c3b5-4553-acaf-336718077723", name: "Trialling & stability", weight: 0.25 },
];
