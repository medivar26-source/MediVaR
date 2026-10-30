import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { normalizeCalibration } from "../data/coordinates";
import { detectCalibrationMarker } from "../data/calibration_detect";
import { measureAssessment, type LandmarkSet } from "../data/assessment_geometry";
import { deriveBone, rankFemoralSizes, rankTibialSizes, seedMarkers } from "../data/fit_markers";
import { evaluateFemoralFit, evaluateTibialFit } from "../data/tkr_templates";

/**
 * The public case library (backend/scripts/case_library.json, written by
 * scripts/case-library/make_case_library.ts and read by the seed script). Every number a learner is scored
 * against must be what the planner itself measures on the case's own scans: the stored scale must be the
 * drawn marker's, the stored measurements must be the planner's reading of the stored landmarks, and the
 * stored implant sizes must be the planner's choice for the stored bone edges.
 */
const root = path.resolve(process.cwd(), "..");
type Scan = { file: string; width_px: number; height_px: number; mm_per_px: number; marker_mm: number; marker_px: number; calibration: Record<string, unknown> & { marker_centre_px: [number, number] } };
type Pt = { x: number; y: number };
type Component = { implant_size: number; position_2d: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number }; fit_status: string; fit_markers: Record<string, Pt>; bone_ml_mm: number; bone_ap_mm: number };
type LibraryCase = {
  key: string;
  case_id: string;
  version_id: string;
  side: "left" | "right";
  difficulty: string;
  pathology: string;
  title: string;
  description: string;
  pathology_label: string;
  objectives: string[];
  notes: string;
  patient: Record<string, string | number>;
  scans: { FLAP: Scan; KLAT: Scan };
  reference: { assessment: Record<string, number | string | boolean>; mad_direction: string | null; tibial_component: Component; femoral_component: Component };
  sizes: { tibial_size: number; femoral_size: number };
  landmarks: LandmarkSet;
};
const library = JSON.parse(readFileSync(path.join(root, "backend/scripts/case_library.json"), "utf8")) as { cases: LibraryCase[] };

/** Width and height from a JPEG header, without a library. */
function jpegSize(file: string): { width: number; height: number } {
  const d = readFileSync(file);
  let i = 2;
  while (i < d.length) {
    if (d[i] !== 0xff) {
      i++;
      continue;
    }
    const m = d[i + 1];
    if (m === 0xc0 || m === 0xc1 || m === 0xc2) return { height: d.readUInt16BE(i + 5), width: d.readUInt16BE(i + 7) };
    i += 2 + d.readUInt16BE(i + 2);
  }
  throw new Error("no size in " + file);
}

const geom = (s: Scan) => ({ widthPx: s.width_px, heightPx: s.height_px, mmPerPx: s.mm_per_px, calibrated: true });

describe("public case library", () => {
  const cases = library.cases;

  it("has six distinct cases covering both sides, varus and valgus, and every difficulty", () => {
    assert.equal(cases.length, 6);
    assert.equal(new Set(cases.map((c) => c.case_id)).size, cases.length);
    assert.equal(new Set(cases.map((c) => c.version_id)).size, cases.length);
    assert.deepEqual([...new Set(cases.map((c) => c.side))].sort(), ["left", "right"]);
    assert.deepEqual([...new Set(cases.map((c) => c.reference.assessment.alignment_type))].sort(), ["VALGUS", "VARUS"]);
    assert.deepEqual([...new Set(cases.map((c) => c.difficulty))].sort(), ["beginner", "expert", "intermediate"]);
  });

  it("every deformity is visible: at least 8 degrees off straight", () => {
    for (const c of cases) assert.ok(Number(c.reference.assessment.mHKA_deg) >= 8, `${c.key}: ${c.reference.assessment.mHKA_deg}`);
  });

  for (const c of cases) {
    describe(c.key, () => {
      for (const view of ["FLAP", "KLAT"] as const) {
        const s = c.scans[view];
        it(`${view}: the file exists at the recorded size, and the scale is the 25 mm marker over its pixels`, () => {
          const file = path.join(root, "dashboard/public", s.file);
          assert.ok(existsSync(file), file);
          assert.deepEqual(jpegSize(file), { width: s.width_px, height: s.height_px });
          assert.equal(s.marker_mm, 25);
          assert.ok(Math.abs(s.mm_per_px - s.marker_mm / s.marker_px) < 1e-5);
          const cal = normalizeCalibration(s.calibration);
          assert.equal(cal.isValid, true);
          assert.equal(cal.mm_per_px, s.mm_per_px);
        });

        it(`${view}: the planner's marker detector finds the sphere at the recorded size`, async () => {
          const { data, info } = await sharp(path.join(root, "dashboard/public", s.file)).greyscale().raw().toBuffer({ resolveWithObject: true });
          const gray = new Uint8Array(info.width * info.height);
          for (let i = 0; i < gray.length; i++) gray[i] = data[i * info.channels];
          const found = detectCalibrationMarker(gray, info.width, info.height);
          assert.equal(found.status, "found");
          if (found.status !== "found") return;
          const [mx, my] = s.calibration.marker_centre_px;
          assert.ok(Math.hypot(found.candidate.cx - mx, found.candidate.cy - my) < 3, "found at the drawn place");
          assert.ok(Math.abs(found.candidate.diameterPx - s.marker_px) / s.marker_px < 0.01, `${found.candidate.diameterPx} vs ${s.marker_px}`);
        });
      }

      it("a full-length film is far coarser than the knee close-up", () => {
        assert.ok(c.scans.FLAP.mm_per_px > 1.8 * c.scans.KLAT.mm_per_px);
      });

      it("the stored measurements are exactly the planner's reading of the stored landmarks", () => {
        const r = measureAssessment(c.landmarks, geom(c.scans.FLAP), geom(c.scans.KLAT), c.side === "right" ? "RIGHT" : "LEFT");
        assert.equal(r.complete, true);
        const a = c.reference.assessment;
        assert.equal(r.measures.mad.value, a.MAD_mm);
        assert.equal(r.measures.mhka.value, a.mHKA_deg);
        assert.equal(r.measures.ldfa.value, a.LDFA_deg);
        assert.equal(r.measures.mpta.value, a.MPTA_deg);
        assert.equal(r.measures.ama.value, a.AMA_deg);
        assert.equal(r.measures.pts.value, a.PTS_deg);
        assert.equal(r.alignment_type, a.alignment_type);
        assert.equal(r.mad_direction, c.reference.mad_direction);
        assert.equal(r.alignment_basis, "points", "varus/valgus comes from the marked points, not the case's side");
        assert.equal(a.scale_estimated, false);
      });

      it("the stored implant sizes are the planner's choice for the stored bone edges, with an acceptable fit", () => {
        const flap = geom(c.scans.FLAP);
        const klat = geom(c.scans.KLAT);
        const tib = c.reference.tibial_component;
        const fem = c.reference.femoral_component;
        const tBone = deriveBone("tibial", tib.fit_markers, flap, klat);
        const fBone = deriveBone("femoral", fem.fit_markers, flap, klat);
        assert.deepEqual(tBone.warnings, []);
        assert.deepEqual(fBone.warnings, []);
        assert.equal(Number(tBone.mlMm!.toFixed(1)), tib.bone_ml_mm);
        assert.equal(Number(fBone.apMm!.toFixed(1)), fem.bone_ap_mm);
        assert.equal(rankTibialSizes(tBone, tib.position_2d.rotation_deg).recommended, c.sizes.tibial_size);
        assert.equal(rankFemoralSizes(fBone, fem.position_2d.rotation_deg).recommended, c.sizes.femoral_size);
        assert.equal(tib.implant_size, c.sizes.tibial_size);
        assert.equal(fem.implant_size, c.sizes.femoral_size);
        const p = tib.position_2d;
        assert.equal(evaluateTibialFit(tib.implant_size, p.x_offset_mm, p.y_offset_mm, tBone.apMm!, tBone.mlMm!, p.rotation_deg, undefined, undefined, tBone.orientation).fitStatus, "ACCEPTABLE FIT");
        const q = fem.position_2d;
        assert.equal(evaluateFemoralFit(fem.implant_size, q.x_offset_mm, q.y_offset_mm, fBone.apMm!, fBone.mlMm!, q.rotation_deg, fBone.orientation, 0).fitStatus, "ACCEPTABLE FIT");
      });

      it("the tibial step's first guess, taken from the assessment points, already picks the reference tray", () => {
        const seeded = seedMarkers("tibial", { assessment_landmarks: c.landmarks as Record<string, Pt>, v1_assessment: c.reference.assessment });
        const bone = deriveBone("tibial", seeded, geom(c.scans.FLAP), geom(c.scans.KLAT));
        assert.equal(bone.complete, true);
        assert.equal(rankTibialSizes(bone, c.reference.tibial_component.position_2d.rotation_deg).recommended, c.sizes.tibial_size);
      });

      it("what a learner reads agrees with the films and gives away no scored number", () => {
        const a = c.reference.assessment;
        const learnerText = [c.title, c.description, c.pathology_label, ...c.objectives, ...Object.values(c.patient).map(String)].join(" \n ");
        const scored = [a.MAD_mm, a.mHKA_deg, a.LDFA_deg, a.MPTA_deg, a.PTS_deg, a.AMA_deg].map((v) => Number(v).toFixed(1));
        for (const v of scored) assert.ok(!learnerText.includes(v), `${c.key} shows ${v} to learners`);
        assert.ok(!/\bsize \d\b/i.test(learnerText), `${c.key} names an implant size to learners`);
        const word = a.alignment_type === "VARUS" ? /varus/i : /valgus/i;
        assert.match(String(c.patient.deformity), word, "the clinical deformity matches the films");
        assert.match(c.title, new RegExp(`\\(${c.side} knee\\)`), "the title names the side the films show");
        assert.ok(["osteoarthritis", "post_traumatic"].includes(c.pathology));
      });

      it("the instructor notes carry the answer", () => {
        const a = c.reference.assessment;
        assert.match(c.notes, new RegExp(`mHKA ${Number(a.mHKA_deg).toFixed(1)}°`));
        assert.match(c.notes, new RegExp(`tibia size ${c.sizes.tibial_size}, femur size ${c.sizes.femoral_size}`));
      });
    });
  }
});
