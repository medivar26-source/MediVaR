/**
 * Build the public case library: the scans, their calibration, and the case data that goes with them.
 *
 *   npx tsx scripts/case-library/make_case_library.ts        (from dashboard/)
 *
 * For every case in cases.ts it
 *   1. builds the leg (anatomy.ts) and renders the full-length AP and knee lateral films into
 *      public/scans/<key>_flap.jpg and <key>_klat.jpg, each with a 25 mm sphere drawn at exactly 25 mm;
 *   2. checks the sphere on the saved JPEG twice: with the planner's own marker detector, and by measuring
 *      its edge directly. Both must agree with the drawn size, or the run stops;
 *   3. measures MAD, mHKA, mLDFA, MPTA, AMA and PTS from the constructed landmark positions with the
 *      planner's `measureAssessment`, so the reference values are exactly what a correct plan produces;
 *   4. derives the bone sizes from the constructed bone edges with the planner's `deriveBone`, ranks the
 *      implant sizes with `rankTibialSizes` / `rankFemoralSizes`, and fits the recommended size with the
 *      planner's auto-fit. The case's intended sizes must come out, with an acceptable fit;
 *   5. writes everything to backend/scripts/case_library.json, which the seed script reads.
 *
 * The images are synthetic and say so on the film.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { buildAP, buildLateral, type Film } from "./anatomy";
import { CASES, type CaseSpec, type Measured } from "./cases";
import type { P } from "./geometry";
import { measureDisc, readGrey, renderFilm } from "./render";
import { measureAssessment, toV1Assessment, type LandmarkSet } from "../../src/lib/data/assessment_geometry";
import { detectCalibrationMarker } from "../../src/lib/data/calibration_detect";
import { autoFitFemoral, autoFitTibial, deriveBone, rankFemoralSizes, rankTibialSizes, type ViewScale } from "../../src/lib/data/fit_markers";
import { evaluateFemoralFit, evaluateTibialFit, getFemoralTemplate, getTibialTemplate } from "../../src/lib/data/tkr_templates";

const DASHBOARD = path.resolve(__dirname, "../..");
const PUBLIC = path.join(DASHBOARD, "public");
const OUT_JSON = path.resolve(DASHBOARD, "../backend/scripts/case_library.json");

const round = (v: number, d = 1) => Number(v.toFixed(d));
const pct = (p: P, film: Film, widthPx: number, heightPx: number) => ({
  x: round(((p.x / film.mmPerPx) / widthPx) * 100, 4),
  y: round(((p.y / film.mmPerPx) / heightPx) * 100, 4),
});

type Rendered = { film: Film; file: string; widthPx: number; heightPx: number; markerPx: number; detectedPx: number; measuredPx: number };

async function renderAndCheck(film: Film, file: string, seed: number): Promise<Rendered> {
  const { widthPx, heightPx } = await renderFilm(film, path.join(PUBLIC, file), seed);
  const img = await readGrey(path.join(PUBLIC, file));
  if (img.width !== widthPx || img.height !== heightPx) throw new Error(`${file}: saved size differs from the drawn size`);
  const markerPx = film.marker.diameterMm / film.mmPerPx;
  const cx = film.marker.centre.x / film.mmPerPx;
  const cy = film.marker.centre.y / film.mmPerPx;
  const measuredPx = measureDisc(img, cx, cy, markerPx);
  const detection = detectCalibrationMarker(img.gray, img.width, img.height);
  if (detection.status !== "found") throw new Error(`${file}: the planner's marker detector did not find the sphere (${detection.status})`);
  const c = detection.candidate;
  if (Math.hypot(c.cx - cx, c.cy - cy) > markerPx * 0.1) throw new Error(`${file}: the detector found something else at ${c.cx.toFixed(0)},${c.cy.toFixed(0)}`);
  if (Math.abs(c.diameterPx - markerPx) / markerPx > 0.015) throw new Error(`${file}: detector reads ${c.diameterPx} px, drawn ${markerPx.toFixed(2)} px`);
  if (Math.abs(measuredPx - markerPx) > 0.6) throw new Error(`${file}: edge measurement ${measuredPx.toFixed(2)} px, drawn ${markerPx.toFixed(2)} px`);
  return { film, file, widthPx, heightPx, markerPx, detectedPx: c.diameterPx, measuredPx };
}

function calibration(r: Rendered, basis: string) {
  return {
    marker_type: "sphere_25mm",
    physical_marker_diameter_mm: r.film.marker.diameterMm,
    detected_marker_pixel_diameter: round(r.markerPx, 3),
    calculated_scale_mm_per_px: r.film.mmPerPx,
    unit: "mm/px",
    method: "radio_opaque_marker",
    version: "1.0.0",
    is_valid: true,
    validation_error: null,
    image_width_px: r.widthPx,
    image_height_px: r.heightPx,
    marker_centre_px: [round(r.film.marker.centre.x / r.film.mmPerPx, 1), round(r.film.marker.centre.y / r.film.mmPerPx, 1)],
    source: "marker_in_image",
    basis,
    verification: { planner_detector_px: r.detectedPx, edge_measurement_px: round(r.measuredPx, 2) },
  };
}

/** Degrees the component must turn (clockwise on screen) to sit square to the line from `a` down to `b`. */
const squareTo = (a: P, b: P) => round(-(Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI, 1);

async function buildCase(spec: CaseSpec) {
  const m = spec.model;
  const flap = await renderAndCheck(buildAP(m), `scans/${spec.key}_flap.jpg`, spec.seed);
  const klat = await renderAndCheck(buildLateral(m), `scans/${spec.key}_klat.jpg`, spec.seed + 1);

  // Landmarks as the planner stores them: percentages of each image.
  const landmarks: LandmarkSet = {};
  const put = (r: Rendered) => {
    for (const [k, p] of Object.entries(r.film.landmarks)) (landmarks as Record<string, P>)[k] = pct(p, r.film, r.widthPx, r.heightPx);
  };
  put(flap);
  put(klat);
  const geom = (r: Rendered) => ({ widthPx: r.widthPx, heightPx: r.heightPx, mmPerPx: r.film.mmPerPx, calibrated: true });
  const reading = measureAssessment(landmarks, geom(flap), geom(klat), m.side === "right" ? "RIGHT" : "LEFT");
  const assessment = toV1Assessment(reading);
  if (!assessment) throw new Error(`${spec.key}: the assessment is incomplete`);
  if (assessment.alignment_type !== spec.expect.alignment) throw new Error(`${spec.key}: built ${assessment.alignment_type}, meant ${spec.expect.alignment}`);
  if (reading.alignment_basis !== "points") throw new Error(`${spec.key}: varus/valgus was not decided from the points`);

  // Bone edges, bone size, implant sizes and fit, all through the planner's own functions.
  const scale = (r: Rendered): ViewScale => ({ widthPx: r.widthPx, heightPx: r.heightPx, mmPerPx: r.film.mmPerPx, calibrated: true });
  const markersFor = (kind: "tibial" | "femoral") => {
    const out: Record<string, { x: number; y: number }> = {};
    for (const [k, p] of Object.entries(flap.film.fitMarkers[kind])) out[k] = pct(p, flap.film, flap.widthPx, flap.heightPx);
    for (const [k, p] of Object.entries(klat.film.fitMarkers[kind])) out[k] = pct(p, klat.film, klat.widthPx, klat.heightPx);
    return out;
  };
  const tibMarkers = markersFor("tibial");
  const femMarkers = markersFor("femoral");
  const tibBone = deriveBone("tibial", tibMarkers, scale(flap), scale(klat));
  const femBone = deriveBone("femoral", femMarkers, scale(flap), scale(klat));
  if (tibBone.warnings.length || femBone.warnings.length) throw new Error(`${spec.key}: ${[...tibBone.warnings, ...femBone.warnings].join(" ")}`);

  const lm = flap.film.landmarks;
  const tibRotation = squareTo(lm.kneeCenter, lm.ankleCenter);
  const femRotation = squareTo(lm.hipCenter, lm.kneeCenter);
  const tibSize = rankTibialSizes(tibBone, tibRotation).recommended!;
  const femSize = rankFemoralSizes(femBone, femRotation).recommended!;
  if (tibSize !== spec.expect.tibialSize || femSize !== spec.expect.femoralSize) {
    throw new Error(`${spec.key}: sizes came out tibia ${tibSize} / femur ${femSize}, meant ${spec.expect.tibialSize} / ${spec.expect.femoralSize} (bone ${tibBone.mlMm!.toFixed(1)}x${tibBone.apMm!.toFixed(1)}, ${femBone.mlMm!.toFixed(1)}x${femBone.apMm!.toFixed(1)})`);
  }
  const tibOffset = autoFitTibial(tibSize, tibBone, tibRotation);
  const femOffset = autoFitFemoral(femSize, femBone, femRotation);
  const tibFit = evaluateTibialFit(tibSize, tibOffset.x, tibOffset.y, tibBone.apMm!, tibBone.mlMm!, tibRotation, undefined, undefined, tibBone.orientation);
  const femFit = evaluateFemoralFit(femSize, femOffset.x, femOffset.y, femBone.apMm!, femBone.mlMm!, femRotation, femBone.orientation, 0);
  if (tibFit.fitStatus !== "ACCEPTABLE FIT" || femFit.fitStatus !== "ACCEPTABLE FIT") {
    throw new Error(`${spec.key}: reference fit is ${tibFit.fitStatus} / ${femFit.fitStatus}`);
  }

  const measured: Measured = {
    mhka: assessment.mHKA_deg,
    alignment: assessment.alignment_type!,
    mad: assessment.MAD_mm,
    madSide: reading.mad_direction ?? "medial",
    mpta: assessment.MPTA_deg,
    ldfa: assessment.LDFA_deg,
    ama: assessment.AMA_deg,
    pts: assessment.PTS_deg,
    tibialSize: tibSize,
    femoralSize: femSize,
  };
  const scales = { FLAP: flap.film.mmPerPx, KLAT: klat.film.mmPerPx };
  const tTpl = getTibialTemplate(tibSize);
  const fTpl = getFemoralTemplate(femSize);

  const scanRecord = (r: Rendered, basis: string) => ({
    file: r.file,
    width_px: r.widthPx,
    height_px: r.heightPx,
    mm_per_px: r.film.mmPerPx,
    marker_mm: r.film.marker.diameterMm,
    marker_px: round(r.markerPx, 3),
    calibration: calibration(r, basis),
  });

  return {
    key: spec.key,
    case_id: spec.caseId,
    version_id: spec.versionId,
    title: spec.title,
    difficulty: spec.difficulty,
    side: m.side,
    pathology: spec.pathology,
    pathology_label: spec.pathologyLabel,
    description: spec.description,
    learning_objective: spec.learningObjective,
    patient: spec.patient,
    objectives: spec.objectives,
    notes: spec.notes(measured),
    scans: {
      FLAP: scanRecord(flap, `Synthetic full-length AP film drawn at ${flap.film.mmPerPx} mm/px; the 25 mm sphere is ${flap.markerPx.toFixed(2)} px across.`),
      KLAT: scanRecord(klat, `Synthetic knee lateral film drawn at ${klat.film.mmPerPx} mm/px; the 25 mm sphere is ${klat.markerPx.toFixed(2)} px across.`),
    },
    reference: {
      assessment: {
        ...assessment,
        patient_tibial_ml_mm: round(tibBone.mlMm!),
        patient_tibial_ap_mm: round(tibBone.apMm!),
        patient_femoral_ml_mm: round(femBone.mlMm!),
        patient_femoral_ap_mm: round(femBone.apMm!),
      },
      mad_direction: reading.mad_direction ?? null,
      tibial_component: {
        implant_size: tibSize,
        position_2d: { x_offset_mm: tibOffset.x, y_offset_mm: tibOffset.y, rotation_deg: tibRotation },
        ap_dimension_mm: tTpl.apMm,
        ml_dimension_mm: tTpl.mlMm,
        cortical_coverage_pct: tibFit.coveragePct,
        medial_overhang_mm: tibFit.medialOverhangMm,
        lateral_overhang_mm: tibFit.lateralOverhangMm,
        anterior_overhang_mm: tibFit.anteriorOverhangMm,
        posterior_overhang_mm: tibFit.posteriorOverhangMm,
        fit_status: tibFit.fitStatus,
        is_confirmed: true,
        fit_markers: { ...tibMarkers, confirmed: true },
        bone_ml_mm: round(tibBone.mlMm!),
        bone_ap_mm: round(tibBone.apMm!),
        scale_estimated: false,
        scales,
      },
      femoral_component: {
        implant_size: femSize,
        position_2d: { x_offset_mm: femOffset.x, y_offset_mm: femOffset.y, rotation_deg: femRotation, flexion_deg: 0 },
        ap_dimension_mm: fTpl.apMm,
        ml_dimension_mm: fTpl.mlMm,
        ap_coverage_pct: femFit.apCoveragePct,
        ml_coverage_pct: femFit.mlCoveragePct,
        notching_risk_mm: femFit.notchingRiskMm,
        medial_overhang_mm: femFit.medialOverhangMm,
        lateral_overhang_mm: femFit.lateralOverhangMm,
        posterior_overhang_mm: femFit.posteriorOverhangMm,
        fit_status: femFit.fitStatus,
        is_confirmed: true,
        fit_markers: { ...femMarkers, confirmed: true },
        bone_ml_mm: round(femBone.mlMm!),
        bone_ap_mm: round(femBone.apMm!),
        scale_estimated: false,
        scales,
      },
    },
    sizes: { tibial_size: tibSize, femoral_size: femSize },
    landmarks,
  };
}

(async () => {
  const cases = [];
  for (const spec of CASES) {
    const c = await buildCase(spec);
    cases.push(c);
    const a = c.reference.assessment;
    console.log(
      `${spec.key.padEnd(28)} ${a.alignment_type?.padEnd(6)} mHKA ${a.mHKA_deg.toFixed(1).padStart(5)}  MAD ${a.MAD_mm.toFixed(1).padStart(5)} ${String(c.reference.mad_direction).padEnd(7)}` +
        ` mLDFA ${a.LDFA_deg.toFixed(1)}  MPTA ${a.MPTA_deg.toFixed(1)}  AMA ${a.AMA_deg.toFixed(1)}  PTS ${a.PTS_deg.toFixed(1)}` +
        `  tibia ${c.sizes.tibial_size} (${c.reference.tibial_component.cortical_coverage_pct}%)  femur ${c.sizes.femoral_size}` +
        `  | sphere ${c.scans.FLAP.marker_px}px/${c.scans.FLAP.calibration.verification.planner_detector_px}, ${c.scans.KLAT.marker_px}px/${c.scans.KLAT.calibration.verification.planner_detector_px}`,
    );
  }
  const doc = {
    about:
      "The public case library. Written by dashboard/scripts/case-library/make_case_library.ts; read by backend/scripts/seed_case_library.py. Do not edit by hand: change cases.ts and run the generator.",
    images_are_synthetic: true,
    cases,
  };
  writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log("wrote", OUT_JSON);
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
