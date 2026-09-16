/**
 * The authored content the seven planning steps offer.
 *
 * Kept out of the components on purpose: a differential list, a size catalogue
 * and a risk are content, and a screen that hardcodes them is a screen that has
 * to be edited to add a diagnosis. Everything here is keyed by procedure, so a
 * second procedure adds rows rather than branches.
 */

import type { CaseRisk, MeasurementKey, StepOption } from "@/lib/plan";
import type { CaseRow } from "@/lib/seed";

/** Choices, keyed by the payload field they answer. */
export const STEP_OPTIONS: Record<string, StepOption[]> = {
  diagnosis: [
    {
      value: "primary_oa_varus",
      label: "Medial compartment osteoarthritis with varus deformity",
      detail:
        "Age, insidious onset, medial pain, progressive varus, no inflammatory features.",
    },
    {
      value: "primary_oa_valgus",
      label: "Lateral compartment osteoarthritis with valgus deformity",
      detail: "Lateral joint line pain with a progressive knock-kneed alignment.",
    },
    {
      value: "inflammatory",
      label: "Inflammatory arthropathy",
      detail:
        "Small-joint involvement, prolonged morning stiffness, symmetrical disease.",
    },
    {
      value: "post_traumatic",
      label: "Post-traumatic arthritis",
      detail:
        "Follows an intra-articular fracture or a ligament injury, often asymmetrical.",
    },
    {
      value: "avascular_necrosis",
      label: "Avascular necrosis of the medial femoral condyle",
      detail:
        "Typically acute, focal, with night pain out of proportion to the radiograph.",
    },
    {
      value: "primary_oa_varus_severe",
      label: "End-stage osteoarthritis with fixed varus deformity",
      detail:
        "Advanced disease with an incompletely correctable deformity on stress testing.",
    },
  ],
  kl_grade: [
    { value: "2", label: "Kellgren–Lawrence grade 2", detail: "Definite osteophytes, possible joint space narrowing." },
    { value: "3", label: "Kellgren–Lawrence grade 3", detail: "Moderate multiple osteophytes, definite narrowing, some sclerosis." },
    { value: "4", label: "Kellgren–Lawrence grade 4", detail: "Large osteophytes, marked narrowing, severe sclerosis, bone-on-bone." },
    { value: "inflammatory", label: "Inflammatory pattern", detail: "Periarticular osteopenia and uniform loss rather than a compartment pattern." },
  ],
  compartment: [
    { value: "medial", label: "Medial", detail: "Medial joint space lost, lateral preserved." },
    { value: "lateral", label: "Lateral", detail: "Lateral joint space lost, medial preserved." },
    { value: "tricompartmental", label: "Tricompartmental", detail: "All three compartments involved, with no correctable single-compartment pattern." },
  ],
  design: [
    {
      value: "CR",
      label: "CR — cruciate retaining",
      detail:
        "The PCL is preserved and balanced at 6.1. No Part 8. Choose it when the PCL is intact and the deformity is correctable.",
    },
    {
      value: "PS",
      label: "PS — posterior stabilised",
      detail:
        "The PCL is resected at 5.1b and Part 8 adds the box cut. Choose it when the PCL is attenuated or the deformity needs more constraint.",
    },
  ],
  femoral_size: [3, 4, 5, 6].map((n) => ({ value: String(n), label: `Size ${n}` })),
  tibial_tray_size: [3, 4, 5, 6].map((n) => ({ value: String(n), label: `Size ${n}` })),
  pe_insert_mm: [10, 12, 14].map((n) => ({ value: String(n), label: `${n} mm` })),
  tight_side: [
    { value: "medial", label: "Medial", detail: "A contracted medial sleeve. Staged medial release will be required." },
    { value: "lateral", label: "Lateral", detail: "A contracted lateral sleeve, iliotibial band and popliteus. Release laterally." },
    { value: "balanced", label: "Neither — balanced", detail: "Symmetrical gaps. No structured release is planned." },
  ],
};

/** Step 6's intra-operative points — authored guidance, not a choice. */
export const GUIDANCE: string[] = [
  "Protect the MCL throughout the tibial cut — contact is a critical error.",
  "Keep the Hohmann posterior angle under 45° to clear the neurovascular bundle.",
  "Verify the anterior femoral cut does not notch the cortex.",
  "Re-check the extension gap after removing posterior osteophytes.",
];

/** Normal ranges for the six angles, against which a reading is judged. */
export const REFERENCE_RANGES: Partial<Record<MeasurementKey, [number, number]>> = {
  hka_deg: [178, 182],
  mad_mm: [-10, 10],
  mpta_deg: [85, 90],
  mldfa_deg: [85, 90],
  jlca_deg: [0, 3],
  ldta_deg: [86, 92],
};

/**
 * The risks a case actually carries, derived from its own columns — the same
 * derivation step 6's checklist is graded against, so the list on screen and
 * the list being graded cannot drift apart.
 */
export function risksFor(kase: CaseRow): CaseRisk[] {
  const bmi = Number(kase.patient.bmi ?? 0);
  const fixedFlexion = Number(kase.patient.fixed_flexion_deg ?? 0);

  const all: (CaseRisk & { applies: boolean })[] = [
    {
      id: "neurovascular",
      label: "Posterior neurovascular proximity",
      detail:
        "The popliteal bundle sits behind the posterior capsule and is at risk during osteophyte removal. Keep the Hohmann posterior angle under 45°.",
      severity: "critical",
      applies: true,
    },
    {
      id: "tightness",
      label: "Contracted collateral sleeve",
      detail:
        "The deformity is structural, not postural. A staged release will be required to balance the gaps.",
      severity: "high",
      applies: /varus|valgus/.test(kase.pathology),
    },
    {
      id: "fixed_flexion",
      label: "Fixed flexion contracture",
      detail:
        "Posterior osteophytes and a tight capsule must both be addressed, or the knee will not reach full extension.",
      severity: "moderate",
      applies: fixedFlexion >= 5,
    },
    {
      id: "elevated_bmi",
      label: "Elevated body mass index",
      detail:
        "Exposure, retractor management and the accuracy of extramedullary referencing are all harder.",
      severity: "moderate",
      applies: bmi >= 30,
    },
    {
      id: "bone_quality",
      label: "Compromised bone quality",
      detail:
        "Osteopenic or defective metaphyseal bone. Impaction and keel preparation risk fracture, and cement interdigitation is less predictable.",
      severity: "high",
      applies: ["inflammatory", "post_traumatic"].includes(kase.pathology),
    },
  ];

  return all.filter((r) => r.applies).map(({ applies, ...risk }) => { void applies; return risk; });
}
