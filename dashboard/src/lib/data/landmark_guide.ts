/**
 * What each assessment landmark is, where to put it, and what it is used for.
 *
 * Every landmark on the scans used to be an unlabelled dot, and some had no colour at all, so a new
 * user could not tell what each one was for. This is the one place that describes them; the scan
 * tags, the colours and the side-panel guide all read from it.
 */

export type LandmarkView = "FLAP" | "KLAT";

export type LandmarkInfo = {
  key: string;
  view: LandmarkView;
  /** Short tag shown beside the dot on the scan. */
  tag: string;
  /** Full name used in the guide. */
  name: string;
  color: string;
  /** Where to click, in plain words. */
  where: string;
  /** What the point feeds, in plain words. */
  feeds: string;
  /** Points that belong together are drawn joined and listed together. */
  pair: string;
};

const FEMUR = "#f59e0b";
const TIBIA_ML = "#8b5cf6";
const TIBIA_AP = "#06b6d4";

export const LANDMARK_GUIDE: LandmarkInfo[] = [
  // ---- AP (front) scan ----
  {
    key: "hipCenter",
    view: "FLAP",
    tag: "Hip",
    name: "Hip centre",
    color: "#ef4444",
    where: "The middle of the round head of the thigh bone (the ball of the hip joint).",
    feeds: "The leg's mechanical axis: MAD, mHKA and AMA.",
    pair: "axis",
  },
  {
    key: "kneeCenter",
    view: "FLAP",
    tag: "Knee",
    name: "Knee centre",
    color: "#3b82f6",
    where: "The middle of the knee joint, between the thigh bone and the shin bone.",
    feeds: "The mechanical axis: MAD, mHKA and AMA.",
    pair: "axis",
  },
  {
    key: "ankleCenter",
    view: "FLAP",
    tag: "Ankle",
    name: "Ankle centre",
    color: "#10b981",
    where: "The middle of the ankle joint.",
    feeds: "The mechanical axis: MAD, mHKA and AMA.",
    pair: "axis",
  },
  {
    key: "femurDistalLateral",
    view: "FLAP",
    tag: "Femur outer",
    name: "Femur, outer edge",
    color: FEMUR,
    where: "The outer edge of the bottom of the thigh bone, on the side away from the other leg.",
    feeds: "LDFA, and the femur's width (used to size the femoral component).",
    pair: "femur-width",
  },
  {
    key: "femurDistalMedial",
    view: "FLAP",
    tag: "Femur inner",
    name: "Femur, inner edge",
    color: FEMUR,
    where: "The inner edge of the bottom of the thigh bone, on the side facing the other leg.",
    feeds: "LDFA, and the femur's width (used to size the femoral component).",
    pair: "femur-width",
  },
  {
    key: "tibiaProximalLateral",
    view: "FLAP",
    tag: "Tibia outer",
    name: "Tibia, outer edge",
    color: TIBIA_ML,
    where: "The outer edge of the flat top of the shin bone, on the side away from the other leg.",
    feeds: "MPTA, and the tibia's width (used to size the tibial component).",
    pair: "tibia-width",
  },
  {
    key: "tibiaProximalMedial",
    view: "FLAP",
    tag: "Tibia inner",
    name: "Tibia, inner edge",
    color: TIBIA_ML,
    where: "The inner edge of the flat top of the shin bone, on the side facing the other leg.",
    feeds: "MPTA, and the tibia's width (used to size the tibial component).",
    pair: "tibia-width",
  },
  {
    key: "femurCanalProximal",
    view: "FLAP",
    tag: "Canal top",
    name: "Thigh-bone canal, upper point",
    color: "#ec4899",
    where: "A point in the middle of the thigh bone's hollow channel, higher up the thigh.",
    feeds: "AMA, the angle between the bone's own axis and the mechanical axis.",
    pair: "canal",
  },
  {
    key: "femurCanalDistal",
    view: "FLAP",
    tag: "Canal low",
    name: "Thigh-bone canal, lower point",
    color: "#ec4899",
    where: "A point in the middle of the same channel, closer to the knee.",
    feeds: "AMA, the angle between the bone's own axis and the mechanical axis.",
    pair: "canal",
  },

  // ---- Lateral (side) scan ----
  {
    key: "tibiaPlateauAnterior",
    view: "KLAT",
    tag: "Tibia front",
    name: "Tibia, front edge",
    color: TIBIA_AP,
    where: "The front edge of the flat top of the shin bone (towards the kneecap side).",
    feeds: "PTS, and the tibia's depth (used to size the tibial component).",
    pair: "tibia-depth",
  },
  {
    key: "tibiaPlateauPosterior",
    view: "KLAT",
    tag: "Tibia back",
    name: "Tibia, back edge",
    color: TIBIA_AP,
    where: "The back edge of the flat top of the shin bone (towards the back of the knee).",
    feeds: "PTS, and the tibia's depth (used to size the tibial component).",
    pair: "tibia-depth",
  },
  {
    key: "tibiaShaftProximal",
    view: "KLAT",
    tag: "Shin top",
    name: "Shin shaft, upper point",
    color: TIBIA_ML,
    where: "A point in the middle of the shin bone, just below the knee.",
    feeds: "PTS, the backwards slope of the top of the shin bone.",
    pair: "shaft",
  },
  {
    key: "tibiaShaftDistal",
    view: "KLAT",
    tag: "Shin low",
    name: "Shin shaft, lower point",
    color: TIBIA_ML,
    where: "A point in the middle of the same bone, further down the shin.",
    feeds: "PTS, the backwards slope of the top of the shin bone.",
    pair: "shaft",
  },
];

export const LANDMARK_INFO: Record<string, LandmarkInfo> = Object.fromEntries(
  LANDMARK_GUIDE.map((l) => [l.key, l]),
);

/** The order the points are asked for: the AP scan first, then the lateral scan. */
export const LANDMARK_ORDER: string[] = LANDMARK_GUIDE.map((l) => l.key);

/** The first point not yet placed, starting from `after` and wrapping round, or undefined when all are. */
export function nextMissing(placed: (key: string) => boolean, after?: string): string | undefined {
  const start = after ? LANDMARK_ORDER.indexOf(after) + 1 : 0;
  for (let i = 0; i < LANDMARK_ORDER.length; i++) {
    const key = LANDMARK_ORDER[(start + i) % LANDMARK_ORDER.length];
    if (!placed(key)) return key;
  }
  return undefined;
}

export function landmarksForView(view: LandmarkView): LandmarkInfo[] {
  return LANDMARK_GUIDE.filter((l) => l.view === view);
}

/** The landmarks of a view grouped by what they measure, in display order. */
export function landmarkGroups(view: LandmarkView): { pair: string; title: string; items: LandmarkInfo[] }[] {
  const titles: Record<string, string> = {
    axis: "Leg axis",
    "femur-width": "Femur width",
    "tibia-width": "Tibia width",
    canal: "Thigh-bone axis",
    "tibia-depth": "Tibia depth",
    shaft: "Shin axis",
  };
  const groups: { pair: string; title: string; items: LandmarkInfo[] }[] = [];
  for (const item of landmarksForView(view)) {
    const existing = groups.find((g) => g.pair === item.pair);
    if (existing) existing.items.push(item);
    else groups.push({ pair: item.pair, title: titles[item.pair] ?? item.pair, items: [item] });
  }
  return groups;
}
