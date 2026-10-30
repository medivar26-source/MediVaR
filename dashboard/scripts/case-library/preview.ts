/** Render one leg model to the scratch folder given on the command line, for looking at while tuning. */
import path from "node:path";
import sharp from "sharp";
import { buildAP, buildLateral, type LegModel } from "./anatomy";
import { renderFilm } from "./render";

const out = process.argv[2] ?? ".";
const model: LegModel = {
  side: "right",
  femurLength: 450,
  tibiaLength: 375,
  ldfa: 90,
  mpta: 83,
  jlca: 6,
  ama: 6,
  pts: 8,
  femur: { ml: 66, ap: 60, headRadius: 24, shaftHalf: 14.5 },
  tibia: { ml: 72.5, ap: 45.5, shaftHalf: 14 },
  wornGapMm: 1,
  osteophyteMm: 3,
  girth: 1,
  apMmPerPx: 0.31,
  latMmPerPx: 0.16,
};

(async () => {
  const ap = buildAP(model);
  const apFile = path.join(out, "preview_ap.jpg");
  await renderFilm(ap, apFile, 11);
  await renderFilm(buildLateral(model), path.join(out, "preview_lat.jpg"), 12);
  const meta = await sharp(apFile).metadata();
  await sharp(apFile).resize({ height: 1400 }).toFile(path.join(out, "ap_small.jpg"));
  const k = ap.landmarks.kneeCenter;
  const top = Math.max(0, Math.round((k.y - 110) / ap.mmPerPx));
  await sharp(apFile).extract({ left: 0, top, width: meta.width!, height: Math.round(220 / ap.mmPerPx) }).toFile(path.join(out, "ap_knee.jpg"));
  const h = ap.landmarks.hipCenter;
  await sharp(apFile).extract({ left: 0, top: 0, width: meta.width!, height: Math.round((h.y + 120) / ap.mmPerPx) }).toFile(path.join(out, "ap_hip.jpg"));
  console.log("written to", out);
})();
