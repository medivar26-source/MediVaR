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

There is no resume. One plan backs exactly one session, and a plan freezes the moment its session starts — it is the record of what was performed, so it cannot be edited or run a second time. To attempt the case again, plan it again: the seven steps are quick the second time and the new plan is a clean contract to be scored against.

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
    title: "Pre-operative planning — the seven steps",
    summary:
      "What each planning step asks and the time budget it is measured against. The differentials are the same lists the planning screens offer.",
    derivedFrom: "plan steps · plan step options",
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

/** Par and maximum seconds for each of the seven planning steps. */
export const PLAN_STEP_META = [
  { step: 1, title: "Case history", budgetLabel: "45–60 s", parTimeS: 60, maxTimeS: 150 },
  { step: 2, title: "Imaging review", budgetLabel: "1.5–2 min", parTimeS: 120, maxTimeS: 300 },
  { step: 3, title: "Deformity measurement", budgetLabel: "1 min", parTimeS: 60, maxTimeS: 150 },
  { step: 4, title: "Alignment planning", budgetLabel: "1 min", parTimeS: 60, maxTimeS: 150 },
  { step: 5, title: "Implant selection", budgetLabel: "45–60 s", parTimeS: 60, maxTimeS: 150 },
  { step: 6, title: "Risk & strategy", budgetLabel: "30–45 s", parTimeS: 45, maxTimeS: 120 },
  { step: 7, title: "Plan summary", budgetLabel: "15–20 s", parTimeS: 20, maxTimeS: 60 },
];

/** Which planning step each option field belongs to. */
export const FIELD_STEP: Record<string, number> = {
  diagnosis: 1,
  kl_grade: 2,
  compartment: 2,
  design: 5,
  femoral_size: 5,
  tibial_tray_size: 5,
  pe_insert_mm: 5,
  tight_side: 6,
};
