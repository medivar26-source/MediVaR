/**
 * The authored text `/help` and `/library` list.
 *
 * The directory lives here; the *content* of a reference does not. Every
 * library document is rendered from the catalogue the rest of the product
 * already runs on, so a reference cannot disagree with the thing it describes.
 */

export type HelpArticleSeed = {
  slug: string;
  topic: string;
  title: string;
  body: string;
  route?: string;
};

export const HELP_ARTICLES: HelpArticleSeed[] = [
  {
    slug: "pin-not-recognised",
    topic: "pairing",
    title: "The headset says the PIN is not valid",
    body: `A pairing PIN is four digits, single use, and lives for thirty minutes. The headset gives the same answer whether the code never existed, has expired, or has already been redeemed — telling the three apart is exactly what someone guessing at ten thousand codes would need to learn, so the product does not.

Check your own screen first. The plan's handoff page shows the PIN it issued and counts down to its expiry. If the countdown has finished, press Issue a new PIN there; the old one stops working the moment a new one is issued, so there is only ever one live code per plan.

If the code on screen is still live and the headset still refuses it, the digits were most likely mistyped — the keypad has no correction and a 1 and a 7 look alike on a visor.`,
  },
  {
    slug: "pairing-locked-out",
    topic: "pairing",
    title: "Pairing says to wait fifteen minutes",
    body: `Ten failed attempts from the same network address inside fifteen minutes stops that address pairing until the window rolls forward. A teaching lab is usually one address, so the limit is shared by the room.

A successful pairing clears the count for that address immediately. If somebody in the room can pair, the block lifts for everyone.

This is the one endpoint in the product that answers a caller holding no account, so it is the one that has to be defended by counting rather than by identity.`,
  },
  {
    slug: "wrong-case-on-headset",
    topic: "pairing",
    title: "The confirmation card shows the wrong case",
    body: `Do not accept it. What the headset reads back is the frozen plan — the exact contract the report will be scored against — so accepting the wrong one starts a session against somebody else's planning.

Take the headset out of pairing, then check which plan issued the code you keyed. Your own plans and their pairing status are listed under Plans.

Issue a new PIN from the correct plan and key that one in.`,
    route: "/plans",
  },
  {
    slug: "kiosk-locked",
    topic: "pairing",
    title: "The headset is locked into another app",
    body: `Kiosk locking is done over ADB by an administrator and is not recoverable from the dashboard. The headset has to be connected to the provisioning computer.

Wi-Fi must be provisioned before the kiosk lock is applied, because the user cannot reach Android settings afterwards. That is the most likely way a headset becomes unusable in the field.`,
  },
  {
    slug: "session-interrupted",
    topic: "session",
    title: "A session stopped part-way through",
    body: `Nothing is lost. Each scene is written as it completes, so the scenes already performed are recorded and visible on the session.

There is no resume. One plan backs exactly one session, and a plan freezes the moment its session starts — it is the record of what was performed, so it cannot be edited or run a second time. To attempt the case again, plan it again: the four planning pages are quick the second time and the new plan is a clean contract to be scored against.

An interrupted session keeps whatever it recorded. It is scored only when a headset reports it finished, so an abandoned run does not produce a report.`,
    route: "/sessions",
  },
  {
    slug: "report-not-appeared",
    topic: "session",
    title: "The session finished but there is no report",
    body: `A report is generated at the moment the headset reports the session complete, so the two happen together. If the headset showed its own summary but the desktop shows none, the completion has not reached the backend yet.

The headset's summary is rendered from data held on the device, which is why it can appear without a network. The desktop's report cannot: it is derived from the scene results that were recorded, so that no two versions of a score can exist.

A session with no report still shows everything it recorded — its scene timeline is readable while it waits.`,
    route: "/sessions",
  },
  {
    slug: "second-attempt",
    topic: "session",
    title: "Running the same case again",
    body: `Plan it again. Start planning on the case creates a new plan, and an unsealed draft for that case is picked up where you left it rather than replaced.

Your previous attempt is untouched. Case detail lists every attempt with its score, and Performance compares them over time.`,
    route: "/cases",
  },
  {
    slug: "score-differs",
    topic: "report",
    title: "Why a score differs from a colleague's",
    body: `Difficulty scales every authored tolerance band — wider at Beginner, narrower at Expert — and the pass mark moves with it: 60, 70 and 80. Two runs of the same case at different difficulties are not comparable and the report states which was in force.

An instructor may also have assigned a preset to a cohort, which changes tolerances further. A session run under one carries the preset's name on its report, so a result is never compared against a different rule set without the reader being told.`,
    route: "/performance",
  },
  {
    slug: "critical-error-cap",
    topic: "report",
    title: "The total says 59 but the categories add up to more",
    body: `Three or more critical errors cap the total at 59 and fail the session, whatever the categories earned.

The categories are still shown truthfully. A learner who cut accurately and damaged a named structure needs to see both facts — hiding the first would hide the thing being taught, and hiding the second would be worse.

Not every failed scene is a critical error. Failing a scene costs that scene's marks; a critical error is damage to a structure the scene is flagged for, and only those count towards the cap.`,
  },
  {
    slug: "percentile-missing",
    topic: "report",
    title: "The report shows no percentile",
    body: `A percentile is computed against your cohort, over completed sessions in the same mode, and it is withheld when fewer than three other people have one.

In a group of two, "you are in the 100th percentile" is one other person's score wearing a disguise. The report shows nothing rather than a number that identifies a classmate.`,
  },
  {
    slug: "no-self-signup",
    topic: "account",
    title: "Passwords and new accounts",
    body: `There is no self-service sign-up and no password reset email — no mail is sent by this product yet. Accounts are created by an administrator, and a forgotten password is reset the same way.

Your name and default difficulty are yours to change under Settings. Your role, your cohort and your email address are administered, because each of them decides what you can see or who your results are compared against.`,
    route: "/settings",
  },
];

export type LibrarySeed = {
  slug: string;
  kind: string;
  title: string;
  summary: string;
  derivedFrom: string;
};

export const LIBRARY_RESOURCES: LibrarySeed[] = [
  {
    slug: "tkr-walkthrough",
    kind: "guide",
    title: "TKR walkthrough — every part and scene",
    summary:
      "The eleven operative parts in order, each scene inside them, which report category it contributes to, and the time it is expected to take.",
    derivedFrom: "procedure parts · procedure scenes",
  },
  {
    slug: "preoperative-planning",
    kind: "guide",
    title: "Pre-operative planning — the four pages",
    summary:
      "Assessment, Tibial Planning, Femoral Planning, then Review & Send to VR: what is measured on each page, the fit thresholds, and what unlocks the next page.",
    derivedFrom: "V1 planning workflow specification",
  },
  {
    slug: "scoring",
    kind: "reference",
    title: "How a session is scored",
    summary:
      "The seven report categories and their maxima, the accuracy and timing weighting, the pass mark at each difficulty, and what three critical errors do to a total.",
    derivedFrom: "report categories · scoring rules",
  },
  {
    slug: "tolerances",
    kind: "reference",
    title: "Time bands and tolerance scaling",
    summary:
      "Par and maximum time for every scene, and what each difficulty does to an authored tolerance band.",
    derivedFrom: "procedure scenes · tolerance rules",
  },
  {
    slug: "implant-variants",
    kind: "reference",
    title: "CR and PS, cemented and cementless",
    summary:
      "Which scenes each variant adds or removes from a run — read from the same fields the session running order is built from, so it cannot disagree with what a headset is handed.",
    derivedFrom: "scene variant gates",
  },
];

/**
 * The four V1 planning pages, as written in *Mediver User Planning Workflow V1*
 * (the authoritative specification). The wording of the measurements, thresholds and
 * gates is the specification's; nothing here is added to it. The page ids and titles
 * are `V1_TKR_STEPS`, so this article cannot name a page the planner does not have.
 * The operative sequence (P0–P11) is a different list and is not described here.
 */
export type PlanningMeasurement = {
  /** The abbreviation the planner shows, where the specification gives one. */
  abbreviation?: string;
  name: string;
  view: "FLAP" | "KLAT";
  /** What the surgeon clicks, in order. */
  points: string;
  /** What is calculated. */
  definition: string;
};

export type PlanningFitMetric = { metric: string; threshold: string };

export type PlanningPageDoc = {
  id: "assessment" | "tibial" | "femoral" | "review";
  objective: string;
  measurements: PlanningMeasurement[];
  /** Component sizes the page offers, when it sizes a component. */
  sizes?: string;
  fitMetrics?: PlanningFitMetric[];
  /** What the page asks of the surgeon before the next page opens. */
  gate: string;
  notes?: string[];
};

export const PLANNING_PAGES: PlanningPageDoc[] = [
  {
    id: "assessment",
    objective:
      "Establish the baseline anatomical axes and joint geometry from calibrated 2D radiographs. Complete exactly six required measurements across two radiographic views.",
    measurements: [
      {
        abbreviation: "MAD",
        name: "Mechanical axis deviation",
        view: "FLAP",
        points: "Femoral head centre, knee joint centre, ankle joint centre",
        definition:
          "Perpendicular distance (mm) from the knee joint centre to the mechanical axis (femoral head to ankle centre).",
      },
      {
        abbreviation: "AMA",
        name: "Anatomical–mechanical angle",
        view: "FLAP",
        points: "Proximal femoral shaft point, distal femoral shaft point",
        definition:
          "Angle (°) between the femoral anatomical axis, defined by the two shaft points, and the femoral mechanical axis (femoral head to knee centre).",
      },
      {
        abbreviation: "mHKA",
        name: "Mechanical hip–knee–ankle angle",
        view: "FLAP",
        points: "Femoral head centre, knee joint centre, ankle joint centre",
        definition:
          "Included angle (°) between the femoral mechanical axis (hip to knee) and the tibial mechanical axis (knee to ankle). Shown with a Varus / Valgus designation.",
      },
      {
        abbreviation: "MPTA",
        name: "Medial proximal tibial angle",
        view: "FLAP",
        points:
          "Medial tibial plateau point, lateral tibial plateau point, proximal tibial shaft point, distal tibial shaft point",
        definition:
          "Medial angle (°) between the tibial plateau / joint line and the tibial mechanical axis defined by the two shaft points.",
      },
      {
        abbreviation: "LDFA",
        name: "Lateral distal femoral angle",
        view: "FLAP",
        points: "Medial distal femoral point, lateral distal femoral point",
        definition:
          "Lateral angle (°) between the distal femoral joint line and the femoral mechanical axis (femoral head to knee centre).",
      },
      {
        abbreviation: "PTS",
        name: "Posterior tibial slope",
        view: "KLAT",
        points:
          "Two points along the proximal tibial anterior cortex, then one point along the tibial plateau tangent line",
        definition: "Slope calculated relative to the longitudinal shaft line.",
      },
    ],
    gate:
      "When all six measurements show a green check, Continue to Tibial Planning becomes active. Continuing locks the assessment values.",
    notes: [
      "FLAP is the full-length standing anteroposterior radiograph (the default view); KLAT is the knee lateral radiograph.",
      "Anatomical landmarks can be reused once placed, so a point is not placed twice.",
      "Implant overlays scale from the radio-opaque calibration marker (pixels per millimetre).",
    ],
  },
  {
    id: "tibial",
    objective:
      "Determine the optimal tibial component size and verify 2D anatomical fit (coverage and overhang) using calibrated CAD template overlays on the AP and lateral radiographs.",
    measurements: [
      {
        name: "Tibial AP dimension",
        view: "KLAT",
        points: "Measured on the lateral radiograph",
        definition:
          "Anterior–posterior dimension of the proximal tibia, used for tibial component sizing.",
      },
      {
        name: "Tibial ML dimension",
        view: "FLAP",
        points: "Measured on the AP radiograph",
        definition:
          "Medial–lateral dimension of the proximal tibia, used for tibial component sizing.",
      },
    ],
    sizes:
      "Size 1 to Size 6. The size that best matches the measured dimensions is highlighted as suggested; choosing any size swaps the template overlay straight away.",
    fitMetrics: [
      { metric: "Cortical coverage", threshold: "90.0% or more" },
      { metric: "Medial overhang", threshold: "1.0 mm or less" },
      { metric: "Lateral overhang", threshold: "1.0 mm or less" },
      { metric: "Overall fit status", threshold: "Acceptable fit when all thresholds are met" },
    ],
    gate:
      "Confirm Tibial Component saves the selected size and the 2D X / Y offset, and enables Continue to Femoral Planning.",
    notes: [
      "The fit metrics update live as the template is dragged or the size changes.",
      "If overhang exceeds 1.5 mm the border turns amber or red with a caution tag.",
    ],
  },
  {
    id: "femoral",
    objective:
      "Select the femoral component size and verify anatomical fit, using the same interaction model as tibial planning.",
    measurements: [
      {
        name: "Femoral AP dimension",
        view: "KLAT",
        points: "Measured on the lateral radiograph",
        definition:
          "Anterior–posterior dimension of the distal femur, used for femoral component sizing.",
      },
      {
        name: "Femoral ML dimension",
        view: "FLAP",
        points: "Measured on the AP radiograph",
        definition:
          "Medial–lateral dimension of the distal femur, used for femoral component sizing.",
      },
    ],
    sizes: "Size 1 to Size 8, with a size suggested from the measured dimensions.",
    fitMetrics: [
      { metric: "AP coverage", threshold: "Reported live" },
      { metric: "ML coverage", threshold: "Reported live" },
      {
        metric: "Anterior notching risk",
        threshold: "Checked on the lateral view against the anterior condylar flush line",
      },
      { metric: "Fit status", threshold: "Acceptable fit or a caution" },
    ],
    gate: "Confirm Femoral Component saves the selection and enables Continue to Review.",
    notes: [
      "Toggle to the KLAT view to check the anterior condylar flush line and for anterior notching.",
    ],
  },
  {
    id: "review",
    objective:
      "A read-only summary of the completed assessment measurements and selected implants before the plan is locked and sent to the VR simulation.",
    measurements: [],
    gate:
      "Back to Planning returns to the tibial or femoral page to change a size. Lock Plan & Send to VR asks for confirmation (once locked, parameters cannot be modified in the 2D software), then serialises the patient data, measurements and implant sizes into the VR plan payload.",
    notes: [
      "Three cards are shown side by side: Patient & Radiographs, Assessment Measurements, Component Selections.",
      "In this version the plan is sealed and held for pairing; headset transfer itself is not connected yet.",
    ],
  },
];
