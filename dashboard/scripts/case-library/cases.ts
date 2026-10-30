/**
 * The public case library: six knees with a deformity you can see on the films.
 *
 * Each case is a leg model (anatomy.ts) plus the clinical story. The story agrees with the films (side,
 * varus or valgus, which compartment is worn, the slope, the old fracture) but never quotes a number the
 * learner is scored on: what a learner reads (description, patient record, objectives) is descriptive,
 * and the measured values and sizes go only into the instructor notes, which sit with the reference plan
 * and are never sent to a learner. Those numbers are not typed here either: the generator measures them
 * on the built leg with the planner's own code and hands them to `notes`.
 */

import type { LegModel } from "./anatomy";

export type Difficulty = "beginner" | "intermediate" | "expert";

/** What the generator measured on the built leg. */
export type Measured = {
  mhka: number;
  alignment: "VARUS" | "VALGUS" | "NEUTRAL";
  mad: number;
  madSide: "medial" | "lateral";
  mpta: number;
  ldfa: number;
  ama: number;
  pts: number;
  tibialSize: number;
  femoralSize: number;
};

export type CaseSpec = {
  /** File-name prefix of the two scans. */
  key: string;
  caseId: string;
  versionId: string;
  difficulty: Difficulty;
  pathology: "osteoarthritis" | "post_traumatic";
  seed: number;
  model: LegModel;
  /** What the case is built to be; the generator stops if the measured leg says otherwise. */
  expect: { alignment: "VARUS" | "VALGUS"; tibialSize: number; femoralSize: number };
  title: string;
  pathologyLabel: string;
  /** Learner-facing: no scored numbers. */
  description: string;
  learningObjective: string;
  patient: Record<string, string | number>;
  objectives: string[];
  /** Instructor-only (stored with the reference plan): the measured answer. */
  notes: (m: Measured) => string;
};

const deg = (v: number) => `${v.toFixed(1)}°`;
/** The measured answer, for the instructor notes. */
const answer = (m: Measured) =>
  `Reference: ${m.alignment === "VARUS" ? "varus" : "valgus"} mHKA ${deg(m.mhka)}, MAD ${m.mad.toFixed(1)} mm ${m.madSide}, ` +
  `mLDFA ${deg(m.ldfa)}, MPTA ${deg(m.mpta)}, AMA ${deg(m.ama)}, PTS ${deg(m.pts)}; tibia size ${m.tibialSize}, femur size ${m.femoralSize}.`;

export const CASES: CaseSpec[] = [
  {
    key: "moderate_varus_right",
    caseId: "a0736360-9738-4e42-b7e1-295ea360e78b",
    versionId: "2d95a411-a7b6-4e00-a6c2-d916af992f86",
    difficulty: "beginner",
    pathology: "osteoarthritis",
    seed: 101,
    model: {
      side: "right", femurLength: 438, tibiaLength: 362, ldfa: 89.2, mpta: 85.2, jlca: 4, ama: 6, pts: 7,
      femur: { ml: 63.4, ap: 56.9, headRadius: 22.5, shaftHalf: 13.8 },
      tibia: { ml: 68.9, ap: 43.1, shaftHalf: 13.2 },
      wornGapMm: 1.2, osteophyteMm: 2.2, girth: 1.05, apMmPerPx: 0.31, latMmPerPx: 0.155,
    },
    expect: { alignment: "VARUS", tibialSize: 3, femoralSize: 3 },
    title: "Medial osteoarthritis with moderate varus (right knee)",
    pathologyLabel: "Medial osteoarthritis, moderate varus",
    description:
      "63-year-old woman with medial right knee pain. The standing film shows a bow-legged knee with the medial joint space almost gone.",
    learningObjective: "Learn the whole planning workflow on a clear, single-plane varus deformity.",
    patient: {
      patient_id: "SYN-TKA-101",
      age: 63, gender: "Female", bmi: 28.1, occupation: "Primary school teacher", walking_distance_m: 800,
      rom: "5–115°", fixed_flexion_deg: 5, deformity: "Varus, passively correctable",
      complaint: "Medial right knee pain on walking and stairs, worse at the end of the day.",
      clinical_notes: "Medial joint line tenderness, varus that corrects on valgus stress, stable ligaments. Kellgren-Lawrence grade 4 medially.",
      history: "Four years of gradually worsening pain; now limits her to about 800 m.",
      past_management: "Weight loss programme, physiotherapy, two steroid injections (the last one 9 months ago, little effect).",
    },
    objectives: [
      "Place the hip, knee and ankle centres and read mHKA and MAD from the full-length film.",
      "Work out whether the varus comes from the tibia, the femur or the worn joint (MPTA, mLDFA and the joint space).",
      "Mark the cortical rim of the plateau and of the condyles, not the small osteophyte, before sizing.",
      "Size the tibial tray and the femoral component and get an acceptable fit on both films.",
    ],
    notes: (m) =>
      `${answer(m)} Mechanical alignment target: neutral (0° ± 3°). Tibial cut perpendicular to the tibial mechanical axis; expect more bone off the lateral plateau than the worn medial side.`,
  },
  {
    key: "severe_varus_left",
    caseId: "ac4f672d-6495-4804-ac4b-ac04aa7eee33",
    versionId: "e4bcca88-5c00-4e58-9b4d-9e4c026e82c0",
    difficulty: "intermediate",
    pathology: "osteoarthritis",
    seed: 202,
    model: {
      side: "left", femurLength: 468, tibiaLength: 386, ldfa: 91.4, mpta: 82.2, jlca: 6.2, ama: 6.5, pts: 9,
      femur: { ml: 67.9, ap: 61.6, headRadius: 25, shaftHalf: 15 },
      tibia: { ml: 73.1, ap: 45.7, shaftHalf: 14.4 },
      wornGapMm: 0.7, osteophyteMm: 3.4, girth: 1.12, apMmPerPx: 0.32, latMmPerPx: 0.16,
    },
    expect: { alignment: "VARUS", tibialSize: 4, femoralSize: 5 },
    title: "Severe varus osteoarthritis (left knee)",
    pathologyLabel: "Tricompartmental osteoarthritis, severe varus",
    description:
      "71-year-old man with a markedly bowed left leg. Bone-on-bone medial compartment, large medial osteophytes and a tibia that slopes into varus.",
    learningObjective: "Plan a large varus correction where both the tibia and the worn joint contribute.",
    patient: {
      patient_id: "SYN-TKA-202",
      age: 71, gender: "Male", bmi: 30.4, occupation: "Retired builder", walking_distance_m: 300,
      rom: "8–105°", fixed_flexion_deg: 8, deformity: "Severe varus, only partly correctable",
      complaint: "Constant left knee pain, night pain, and the leg 'bending outwards' when he walks.",
      clinical_notes: "Varus thrust on walking. Large palpable medial osteophytes. Ahlbäck grade IV.",
      history: "Pain for eight years; walking distance down to about 300 m with a stick.",
      past_management: "Analgesia, an unloader brace (not tolerated), physiotherapy.",
    },
    objectives: [
      "Measure a large varus deformity and its MAD on the full-length film.",
      "Separate the bony deformity (MPTA, mLDFA) from the collapse of the medial joint space.",
      "Ignore the medial osteophytes when you mark the plateau and condyle edges.",
      "Size the tibia and femur with no medial overhang beyond 1 mm.",
    ],
    notes: (m) =>
      `${answer(m)} Medial release likely needed to balance. Cut the tibia perpendicular to its mechanical axis: the low MPTA means a lateral-heavy resection.`,
  },
  {
    key: "moderate_valgus_right",
    caseId: "87c3a6c2-3f8c-42c9-8d0d-271414f23ac7",
    versionId: "3f1922f0-64eb-4099-b1b8-2dc41324af1b",
    difficulty: "intermediate",
    pathology: "osteoarthritis",
    seed: 303,
    model: {
      side: "right", femurLength: 426, tibiaLength: 350, ldfa: 83.6, mpta: 89.4, jlca: -3.2, ama: 5.5, pts: 5,
      femur: { ml: 60.9, ap: 54.6, headRadius: 21.5, shaftHalf: 13.2 },
      tibia: { ml: 65.0, ap: 40.6, shaftHalf: 12.6 },
      wornGapMm: 1.1, osteophyteMm: 2, girth: 0.96, apMmPerPx: 0.3, latMmPerPx: 0.15,
    },
    expect: { alignment: "VALGUS", tibialSize: 2, femoralSize: 2 },
    title: "Lateral osteoarthritis with moderate valgus (right knee)",
    pathologyLabel: "Lateral osteoarthritis, moderate valgus",
    description:
      "66-year-old woman with a knock-kneed right leg. The lateral compartment is worn and the distal lateral femur looks short.",
    learningObjective: "Recognise a femoral-driven valgus knee and plan it without over-cutting the lateral femur.",
    patient: {
      patient_id: "SYN-TKA-303",
      age: 66, gender: "Female", bmi: 24.6, occupation: "Accountant", walking_distance_m: 1000,
      rom: "0–120°", fixed_flexion_deg: 0, deformity: "Valgus, passively correctable",
      complaint: "Lateral right knee pain and a feeling that the knee 'knocks inwards'.",
      clinical_notes: "Correctable valgus, intact medial collateral ligament, lateral joint line tenderness.",
      history: "Five years of lateral pain, worse in the last year.",
      past_management: "Physiotherapy, NSAIDs, a hyaluronic acid injection.",
    },
    objectives: [
      "Measure the valgus deformity and note which side of the knee centre the mechanical axis passes.",
      "Find where the deformity comes from: compare mLDFA and MPTA with their normal ranges.",
      "Size the small femur and tibia without notching the anterior femoral cortex.",
    ],
    notes: (m) =>
      `${answer(m)} Distal femoral cut perpendicular to the femoral mechanical axis: little bone comes off the hypoplastic lateral condyle.`,
  },
  {
    key: "severe_valgus_left",
    caseId: "18a4076f-76ce-4374-bdd8-5e82e01314b7",
    versionId: "dfa3c127-9727-4908-a9c7-da1f42d78c4d",
    difficulty: "expert",
    pathology: "osteoarthritis",
    seed: 404,
    model: {
      side: "left", femurLength: 418, tibiaLength: 342, ldfa: 80.2, mpta: 90.6, jlca: -4.6, ama: 5, pts: 4,
      femur: { ml: 58.9, ap: 52.7, headRadius: 21, shaftHalf: 12.8 },
      tibia: { ml: 61.6, ap: 38.4, shaftHalf: 12.2 },
      wornGapMm: 0.6, osteophyteMm: 2.8, girth: 0.92, apMmPerPx: 0.3, latMmPerPx: 0.15,
    },
    expect: { alignment: "VALGUS", tibialSize: 1, femoralSize: 1 },
    title: "Severe valgus deformity (left knee)",
    pathologyLabel: "Lateral osteoarthritis, severe valgus",
    description:
      "74-year-old woman with a severe knock-knee on the left. Bone-on-bone lateral compartment and a very short lateral femoral condyle.",
    learningObjective: "Plan a severe valgus knee: alignment, small sizes, and where the deformity lives.",
    patient: {
      patient_id: "SYN-TKA-404",
      age: 74, gender: "Female", bmi: 23.2, occupation: "Retired seamstress", walking_distance_m: 200,
      rom: "5–110°", fixed_flexion_deg: 5, deformity: "Severe valgus, only partly correctable",
      complaint: "Left knee pain and the knee collapsing inwards when she stands.",
      clinical_notes: "Stretched medial collateral ligament. Lateral osteophytes.",
      history: "Ten years of pain; now walks about 200 m with a frame.",
      past_management: "Physiotherapy, bracing, injections; declined surgery twice.",
    },
    objectives: [
      "Measure a severe valgus deformity and its MAD.",
      "Quantify the femoral deformity (mLDFA) and how far the joint lines converge.",
      "Choose the smallest sizes that fit and check overhang on both films.",
    ],
    notes: (m) =>
      `${answer(m)} Consider a constrained insert if the medial side cannot be balanced. Femoral cut perpendicular to the mechanical axis.`,
  },
  {
    key: "varus_steep_slope_right",
    caseId: "9ea7b7aa-dfa4-4e34-ae55-d82d55d6591b",
    versionId: "5d798741-2e3c-4213-9e82-8fd9f6a7052a",
    difficulty: "intermediate",
    pathology: "osteoarthritis",
    seed: 505,
    model: {
      side: "right", femurLength: 474, tibiaLength: 392, ldfa: 88.6, mpta: 84.1, jlca: 5, ama: 6, pts: 14,
      femur: { ml: 70.9, ap: 64.1, headRadius: 25.5, shaftHalf: 15.4 },
      tibia: { ml: 77.4, ap: 48.6, shaftHalf: 15 },
      wornGapMm: 1, osteophyteMm: 3, girth: 1.18, apMmPerPx: 0.32, latMmPerPx: 0.16,
    },
    expect: { alignment: "VARUS", tibialSize: 5, femoralSize: 6 },
    title: "Varus knee with a steep posterior slope (right knee)",
    pathologyLabel: "Medial osteoarthritis, varus with a steep tibial slope",
    description:
      "64-year-old man with a varus right knee that will not straighten fully. The lateral film shows a steeply sloping tibial plateau.",
    learningObjective: "Measure the posterior tibial slope on the lateral film and plan a large knee.",
    patient: {
      patient_id: "SYN-TKA-505",
      age: 64, gender: "Male", bmi: 31.8, occupation: "Truck driver", walking_distance_m: 500,
      rom: "10–110°", fixed_flexion_deg: 10, deformity: "Varus with a fixed flexion deformity",
      complaint: "Right knee pain and stiffness; cannot fully straighten the knee.",
      clinical_notes: "Fixed flexion deformity, medial joint line tenderness, posterior osteophytes.",
      history: "Six years of pain; stiffness worse over the last two years.",
      past_management: "Physiotherapy, analgesia, one arthroscopic washout (no lasting benefit).",
    },
    objectives: [
      "Measure PTS from the plateau line and the proximal tibial shaft axis on the lateral film.",
      "Measure the varus deformity on the full-length film.",
      "Size the large femur and tibia and check the anterior flange sits flush.",
    ],
    notes: (m) =>
      `${answer(m)} Reduce the slope to the implant's design slope with the tibial cut and clear posterior osteophytes to correct the flexion contracture.`,
  },
  {
    key: "post_traumatic_varus_left",
    caseId: "e067953e-4a77-4a6c-8346-61a64f5f9825",
    versionId: "54da424a-00b1-498e-9ad7-3e14d68ca912",
    difficulty: "expert",
    pathology: "post_traumatic",
    seed: 606,
    model: {
      side: "left", femurLength: 478, tibiaLength: 398, ldfa: 87.4, mpta: 87.2, jlca: 2.4, ama: 6, pts: 8,
      malunion: { at: 0.6, angleDeg: 15 },
      femur: { ml: 73.9, ap: 67.0, headRadius: 26, shaftHalf: 15.6 },
      tibia: { ml: 80.6, ap: 50.6, shaftHalf: 15.2 },
      wornGapMm: 1.2, osteophyteMm: 2.4, girth: 1.08, apMmPerPx: 0.32, latMmPerPx: 0.165,
    },
    expect: { alignment: "VARUS", tibialSize: 6, femoralSize: 7 },
    title: "Post-traumatic varus from a tibial malunion (left knee)",
    pathologyLabel: "Post-traumatic osteoarthritis, tibial shaft malunion",
    description:
      "58-year-old man whose left tibial shaft fracture healed bent 20 years ago. The leg is bowed below the knee and the medial compartment has worn out.",
    learningObjective: "Tell an extra-articular deformity from an intra-articular one and see how it changes the plan.",
    patient: {
      patient_id: "SYN-TKA-606",
      age: 58, gender: "Male", bmi: 27.3, occupation: "Farmer", walking_distance_m: 600,
      rom: "3–115°", fixed_flexion_deg: 3, deformity: "Varus, bowing below the knee",
      complaint: "Left knee pain and a visibly bowed shin.",
      clinical_notes: "Healed angulated mid-shaft tibial fracture with a bony bump at the old fracture site. Medial knee pain, stable ligaments.",
      history: "Tibial shaft fracture treated in a cast at 38; knee pain for the last five years.",
      past_management: "Analgesia, physiotherapy, lateral wedge insoles.",
    },
    objectives: [
      "Find the healed fracture and the bend in the tibial shaft on the full-length film.",
      "Measure the mechanical MPTA against the knee-to-ankle line, not the bent upper shaft.",
      "Measure the overall varus and decide whether the knee replacement alone can correct it.",
      "Size the large tibia and femur.",
    ],
    notes: (m) =>
      `${answer(m)} The deformity is mostly below the joint. A tibial cut square to the mechanical axis removes an uneven wedge; consider whether a corrective osteotomy is needed first.`,
  },
];
