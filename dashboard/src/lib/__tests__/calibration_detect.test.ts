import test from "node:test";
import assert from "node:assert/strict";
import { detectCalibrationMarker, detectMarkerCandidates, scaleFromDetection } from "../data/calibration_detect";

/** A radiograph-like test image: smooth background gradient, a little noise, optional bright shapes. */
function makeImage(w: number, h: number, shapes: { cx: number; cy: number; rx: number; ry: number; value: number }[] = [], bg = 90) {
  const gray = new Uint8Array(w * h);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = bg + 30 * Math.sin(x / 140) * Math.cos(y / 210) + (rnd() - 0.5) * 8;
      for (const s of shapes) {
        const d = Math.sqrt(((x - s.cx) / s.rx) ** 2 + ((y - s.cy) / s.ry) ** 2); // 1 at the edge
        const edge = Math.min(s.rx, s.ry);
        const t = Math.max(0, Math.min(1, (1 - d) * edge + 0.5)); // ~1 px soft edge
        v = v * (1 - t) + s.value * t;
      }
      gray[y * w + x] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
  return gray;
}

const disc = (cx: number, cy: number, diameter: number, value = 245) => ({ cx, cy, rx: diameter / 2, ry: diameter / 2, value });

test("Assisted marker detection", async (t) => {
  await t.test("finds a round bright marker and measures its diameter", () => {
    const w = 800, h = 1000;
    const r = detectCalibrationMarker(makeImage(w, h, [disc(300, 420, 95)]), w, h);
    assert.equal(r.status, "found");
    if (r.status !== "found") return;
    assert.ok(Math.abs(r.candidate.diameterPx - 95) < 2, `diameter ${r.candidate.diameterPx}`);
    assert.ok(Math.abs(r.candidate.cx - 300) < 2 && Math.abs(r.candidate.cy - 420) < 2);
    assert.ok(r.candidate.confidence >= 0.8);
  });

  await t.test("works on a large radiograph (it is downscaled for the search, refined at full size)", () => {
    const w = 2000, h = 2600;
    const r = detectCalibrationMarker(makeImage(w, h, [disc(900, 1300, 220)]), w, h);
    assert.equal(r.status, "found");
    if (r.status !== "found") return;
    assert.ok(Math.abs(r.candidate.diameterPx - 220) < 3, `diameter ${r.candidate.diameterPx}`);
  });

  await t.test("the scale it implies is the marker's real size over its pixel diameter — a proposal only", () => {
    const w = 800, h = 1000;
    const r = detectCalibrationMarker(makeImage(w, h, [disc(300, 420, 95)]), w, h);
    assert.equal(r.status, "found");
    if (r.status !== "found") return;
    const scale = scaleFromDetection(r.candidate, 25)!;
    assert.ok(Math.abs(scale - 25 / 95) / (25 / 95) < 0.03);
    assert.equal(scaleFromDetection(r.candidate, 0), undefined);
  });

  await t.test("says nothing when there is no marker", () => {
    const w = 800, h = 1000;
    assert.equal(detectCalibrationMarker(makeImage(w, h), w, h).status, "none");
  });

  await t.test("does not mistake an oval or a bar (bone-like) for a sphere", () => {
    const w = 800, h = 1000;
    const oval = makeImage(w, h, [{ cx: 300, cy: 400, rx: 60, ry: 34, value: 245 }]);
    assert.equal(detectCalibrationMarker(oval, w, h).status, "none");
    const bar = makeImage(w, h, [{ cx: 400, cy: 500, rx: 110, ry: 9, value: 245 }]);
    assert.equal(detectCalibrationMarker(bar, w, h).status, "none");
  });

  await t.test("ignores blobs far too small or far too large to be the marker", () => {
    const w = 800, h = 1000;
    assert.equal(detectCalibrationMarker(makeImage(w, h, [disc(300, 400, 5)]), w, h).status, "none");
    assert.equal(detectCalibrationMarker(makeImage(w, h, [disc(400, 500, 520)]), w, h).status, "none");
  });

  await t.test("a marker with no contrast against its surroundings is not detected", () => {
    const w = 800, h = 1000;
    assert.equal(detectCalibrationMarker(makeImage(w, h, [disc(300, 420, 95, 100)]), w, h).status, "none");
  });

  await t.test("two equally good candidates are reported as ambiguous, never guessed", () => {
    const w = 800, h = 1000;
    const r = detectCalibrationMarker(makeImage(w, h, [disc(250, 300, 95), disc(550, 700, 95)]), w, h);
    assert.equal(r.status, "ambiguous");
    assert.ok(r.candidates.length >= 2);
  });

  await t.test("tiny or malformed input is refused rather than guessed at", () => {
    assert.deepEqual(detectMarkerCandidates(new Uint8Array(10), 10, 1), []);
    assert.deepEqual(detectMarkerCandidates(new Uint8Array(100), 100, 100), []);
  });
});
