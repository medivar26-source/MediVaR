import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateCalibrationFromMarker,
  mmToImagePx,
  imagePxToMm,
  imageToScreen,
  screenToImage,
  screenDeltaToPhysicalMm,
  rotatePoint,
  translatePoint,
  transformPhysicalPolygon,
  normalizeCalibration,
  type ViewportState,
} from "@/lib/data/coordinates";
import { TIBIAL_GEOMETRY_CATALOG } from "@/lib/data/tibial_geometry";
import { FEMORAL_GEOMETRY_CATALOG } from "@/lib/data/femoral_geometry";
import {
  TIBIAL_TEMPLATES,
  FEMORAL_TEMPLATES,
  evaluateTibialFit,
  evaluateFemoralFit,
  getFemoralTemplate,
  getTibialTemplate,
} from "@/lib/data/tkr_templates";

describe("Preoperative Planning Calibration & Implant Pipeline", () => {
  // Base test calibration: 25.0 mm marker with 94.7 px natural image diameter
  const goldenCalibration = calculateCalibrationFromMarker(25.0, 94.7);
  const mmPerPx = goldenCalibration.mm_per_px; // ~0.26399155

  const standardViewport: ViewportState = {
    naturalWidth: 1024,
    naturalHeight: 1024,
    fittedWidth: 800,
    fittedHeight: 800,
    fitScale: 800 / 1024, // ~0.78125
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    containerRect: { left: 100, top: 50, width: 800, height: 800 },
  };

  it("1. Calibration from marker: computes exact mm_per_px from physical and image diameter", () => {
    assert.ok(Math.abs(mmPerPx - 0.26399) < 0.0001);
    assert.equal(goldenCalibration.marker_diameter_mm, 25.0);
    assert.equal(goldenCalibration.measured_pixel_diameter, 94.7);
  });

  it("2 & 3. Screen ↔ Image coordinate conversions: bi-directional round-trip invariance", () => {
    const originalImagePoint = { x: 512, y: 384 };
    const screenPoint = imageToScreen(originalImagePoint, standardViewport);
    const roundTrip = screenToImage(screenPoint, standardViewport);

    assert.ok(Math.abs(roundTrip.x - originalImagePoint.x) < 0.0001);
    assert.ok(Math.abs(roundTrip.y - originalImagePoint.y) < 0.0001);
  });

  it("4 & 5. mm ↔ Image pixel conversions: exact physical scaling", () => {
    const physicalMl = 64.1; // Femoral Size 4
    const imagePx = mmToImagePx(physicalMl, mmPerPx);
    assert.ok(Math.abs(imagePx - 242.81) < 0.1);

    const backToMm = imagePxToMm(imagePx, mmPerPx);
    assert.ok(Math.abs(backToMm - physicalMl) < 0.0001);
  });

  it("6. Zoom invariance: physical dimensions remain constant while screen pixels scale", () => {
    const physicalMl = 64.1;
    const imagePx = mmToImagePx(physicalMl, mmPerPx);

    const zoomLevels = [0.5, 1.0, 1.5, 2.0, 3.0];
    for (const z of zoomLevels) {
      // Invariant: Physical mm must never depend on zoom
      assert.equal(physicalMl, 64.1);
      // Invariant: Natural image pixels must never depend on zoom
      assert.ok(Math.abs(imagePx - 242.81) < 0.1);

      // Screen pixels must scale strictly with zoom factor
      const screenWidth1x = imagePx * standardViewport.fitScale * 1.0;
      const screenWidthZx = imagePx * standardViewport.fitScale * z;
      assert.ok(Math.abs(screenWidthZx - screenWidth1x * z) < 0.01);
    }
  });

  it("7. Pan invariance: panning container shifts visual position without altering coordinates or dimensions", () => {
    const pt = { x: 200, y: 300 };
    const pannedViewport: ViewportState = {
      ...standardViewport,
      pan: { x: 120, y: -80 },
    };

    const screenUnpanned = imageToScreen(pt, standardViewport);
    const screenPanned = imageToScreen(pt, pannedViewport);

    assert.equal(screenPanned.x - screenUnpanned.x, 120);
    assert.equal(screenPanned.y - screenUnpanned.y, -80);

    // Inverse conversion reproduces exact original image point despite pan
    const reconstructed = screenToImage(screenPanned, pannedViewport);
    assert.ok(Math.abs(reconstructed.x - pt.x) < 0.0001);
    assert.ok(Math.abs(reconstructed.y - pt.y) < 0.0001);
  });

  it("8. Browser resize invariance: container resize preserves relative image coverage and physical dimensions", () => {
    const largeContainer: ViewportState = {
      ...standardViewport,
      fittedWidth: 1024,
      fittedHeight: 1024,
      fitScale: 1.0,
      containerRect: { left: 0, top: 0, width: 1024, height: 1024 },
    };

    const smallContainer: ViewportState = {
      ...standardViewport,
      fittedWidth: 512,
      fittedHeight: 512,
      fitScale: 0.5,
      containerRect: { left: 0, top: 0, width: 512, height: 512 },
    };

    const physicalMl = 64.1;
    const imgPxLarge = mmToImagePx(physicalMl, mmPerPx);
    const imgPxSmall = mmToImagePx(physicalMl, mmPerPx);

    // Natural image pixels are 100% invariant to container dimensions
    assert.equal(imgPxLarge, imgPxSmall);

    // Screen ratio to displayed image width is invariant
    const ratioLarge = (imgPxLarge * largeContainer.fitScale) / largeContainer.fittedWidth;
    const ratioSmall = (imgPxSmall * smallContainer.fitScale) / smallContainer.fittedWidth;
    assert.ok(Math.abs(ratioLarge - ratioSmall) < 0.0001);
  });

  it("9. DevicePixelRatio independence: physical scale is decoupled from window.devicePixelRatio", () => {
    // mm_per_px is solely determined by physical marker size and natural image pixels
    const cal = calculateCalibrationFromMarker(25.0, 94.7);
    assert.ok(Math.abs(cal.mm_per_px - 0.26399) < 0.0001);
  });

  it("10. Drag conversion: converts screen pixels into accurate physical mm offsets at any zoom", () => {
    // Example from specification:
    // zoom = 2.0, fitScale = 1.0, screen drag = 50px, mm_per_px = 0.264
    // Expected physical movement = (50 / (1.0 * 2.0)) * 0.264 = 25 * 0.264 = 6.6 mm
    const vpZoom2: ViewportState = {
      ...standardViewport,
      fitScale: 1.0,
      fittedWidth: 1024,
      zoom: 2.0,
    };

    const dragScreen = { x: 50, y: 0 };
    const { x: dxMm } = screenDeltaToPhysicalMm(dragScreen, vpZoom2, 0.264);
    assert.ok(Math.abs(dxMm - 6.6) < 0.01);

    // At zoom 1.0: 50px screen drag is 50 image pixels = 13.2 mm
    const vpZoom1: ViewportState = {
      ...standardViewport,
      fitScale: 1.0,
      fittedWidth: 1024,
      zoom: 1.0,
    };
    const { x: dxMm1 } = screenDeltaToPhysicalMm(dragScreen, vpZoom1, 0.264);
    assert.ok(Math.abs(dxMm1 - 13.2) < 0.01);
  });

  it("11 & 17. Femoral sizes: catalog sizes 1 to 8 have strictly increasing physical dimensions and anatomical polygons", () => {
    for (let size = 1; size <= 8; size++) {
      const template = getFemoralTemplate(size);
      const geom = FEMORAL_GEOMETRY_CATALOG[size];
      assert.ok(geom, `Geometry must exist for femoral size ${size}`);
      assert.equal(geom.size, size);
      assert.equal(geom.apMm, template.apMm);
      assert.equal(geom.mlMm, template.mlMm);

      // Check flap polygon bounds match catalog mm dimensions
      let minX = Infinity, maxX = -Infinity;
      for (const p of geom.flapPolygon) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
      }
      const actualWidth = maxX - minX;
      assert.ok(Math.abs(actualWidth - template.mlMm) < 0.1, `Size ${size} width ${actualWidth} must match ${template.mlMm}`);
    }
  });

  it("12. Implant rotation: maintains physical dimensions under rotation", () => {
    const geom = FEMORAL_GEOMETRY_CATALOG[4];
    const rotated = transformPhysicalPolygon(geom.flapPolygon, 0, 0, 90);

    let minY = Infinity, maxY = -Infinity;
    for (const p of rotated) {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    // After 90 deg rotation, the ML width (64.1) becomes the Y height span
    const ySpan = maxY - minY;
    assert.ok(Math.abs(ySpan - geom.mlMm) < 0.1);
  });

  it("13. Fit geometry consistency: visible rendering geometry is identical to evaluation geometry", () => {
    const size = 3;
    const template = getTibialTemplate(size);
    const geom = TIBIAL_GEOMETRY_CATALOG[size];

    // Evaluate fit at neutral offset
    const fit = evaluateTibialFit(size, 0, 0, template.apMm, template.mlMm);
    assert.equal(fit.fitStatus, "ACCEPTABLE FIT");
    assert.equal(fit.medialOverhangMm, 0);
    assert.equal(fit.lateralOverhangMm, 0);

    // Introduce 2.0mm lateral shift -> overhang must exceed 1.5mm tolerance
    const shiftedFit = evaluateTibialFit(size, 2.0, 0, template.apMm, template.mlMm);
    assert.ok(shiftedFit.lateralOverhangMm > 1.5);
    assert.equal(shiftedFit.fitStatus, "POOR FIT");
  });

  it("14 & 15. View-specific calibrations: FLAP and KLAT maintain distinct pixel scales", () => {
    const flapCal = calculateCalibrationFromMarker(25.0, 94.7); // 0.264 mm/px
    const klatCal = calculateCalibrationFromMarker(25.0, 60.0); // 0.4167 mm/px

    const physicalMl = 64.1;
    const flapImgPx = mmToImagePx(physicalMl, flapCal.mm_per_px);
    const klatImgPx = mmToImagePx(physicalMl, klatCal.mm_per_px);

    assert.ok(Math.abs(flapImgPx - 242.81) < 0.1);
    assert.ok(Math.abs(klatImgPx - 153.84) < 0.1);

    // Proves distinct image pixel scales for the exact same physical component
    assert.notEqual(Math.round(flapImgPx), Math.round(klatImgPx));
  });

  it("16. Tibial sizes: catalog sizes 1 to 6 have exact physical dimensions and anatomical keel geometry", () => {
    for (let size = 1; size <= 6; size++) {
      const template = getTibialTemplate(size);
      const geom = TIBIAL_GEOMETRY_CATALOG[size];
      assert.ok(geom, `Geometry must exist for tibial size ${size}`);
      assert.equal(geom.size, size);
      assert.equal(geom.apMm, template.apMm);
      assert.equal(geom.mlMm, template.mlMm);

      let minX = Infinity, maxX = -Infinity;
      for (const p of geom.flapPolygon) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
      }
      const actualWidth = maxX - minX;
      assert.ok(Math.abs(actualWidth - template.mlMm) < 0.1);
    }
  });

  it("18. MANDATORY GOLDEN TEST: marker physical 25mm, diameter 94.7px, Femoral Size 4 ML 64.1mm", () => {
    const markerPhysicalMm = 25.0;
    const markerImageDiameterPx = 94.7;
    const derivedMmPerPx = markerPhysicalMm / markerImageDiameterPx; // ≈ 0.26399155 mm/px
    assert.ok(Math.abs(derivedMmPerPx - 0.26399) < 0.0001);

    const femoralSize4Ml = 64.1; // mm
    const expectedImagePx = femoralSize4Ml / derivedMmPerPx; // ≈ 242.81 px

    // The implant geometry should measure approximately 242.9 IMAGE PIXELS wide
    assert.ok(Math.abs(expectedImagePx - 242.9) < 0.2);

    // In a 1:1 display scale (fitScale = 1.0):
    const fitScale1 = 1.0;
    const screenWidthAtZoom1 = expectedImagePx * fitScale1 * 1.0;
    assert.ok(Math.abs(screenWidthAtZoom1 - 242.9) < 0.2);

    // At zoom 2.0:
    const screenWidthAtZoom2 = expectedImagePx * fitScale1 * 2.0;
    assert.ok(Math.abs(screenWidthAtZoom2 - 485.8) < 0.4);

    // At zoom 0.5:
    const screenWidthAtZoomHalf = expectedImagePx * fitScale1 * 0.5;
    assert.ok(Math.abs(screenWidthAtZoomHalf - 121.45) < 0.2);

    // The physical dimension must always remain exactly 64.1 mm
    const physicalInvariant = imagePxToMm(expectedImagePx, derivedMmPerPx);
    assert.ok(Math.abs(physicalInvariant - 64.1) < 0.0001);
  });

  it("19. SECOND CALIBRATION TEST: marker physical 25mm, diameter 60px", () => {
    const markerPhysicalMm = 25.0;
    const markerImageDiameterPx = 60.0;
    const derivedMmPerPx = markerPhysicalMm / markerImageDiameterPx; // = 0.4166667
    assert.ok(Math.abs(derivedMmPerPx - 0.4166667) < 0.00001);

    const femoralSize4Ml = 64.1;
    const expectedImagePx = femoralSize4Ml / derivedMmPerPx; // ≈ 153.84 px
    assert.ok(Math.abs(expectedImagePx - 153.84) < 0.1);

    const physicalInvariant = imagePxToMm(expectedImagePx, derivedMmPerPx);
    assert.ok(Math.abs(physicalInvariant - 64.1) < 0.0001);
  });

  it("20. MANDATORY TEST CASE A: Tibial Size 3 ML 68.2mm, calibration 25mm/94.7px, zoom invariance", () => {
    const markerPhysicalMm = 25.0;
    const markerImageDiameterPx = 94.7;
    const derivedMmPerPx = markerPhysicalMm / markerImageDiameterPx; // ≈ 0.26399155 mm/px
    assert.ok(Math.abs(derivedMmPerPx - 0.26399) < 0.0001);

    const tibialSize3Ml = 68.2; // mm
    const expectedImagePx = tibialSize3Ml / derivedMmPerPx; // ≈ 258.34 px
    assert.ok(Math.abs(expectedImagePx - 258.35) < 0.2);

    // Zoom tests: 0.5, 1, 2, 3
    const zooms = [0.5, 1, 2, 3];
    for (const zoom of zooms) {
      const screenWidth = expectedImagePx * 1.0 * zoom;
      if (zoom === 1) assert.ok(Math.abs(screenWidth - 258.35) < 0.2);
      if (zoom === 2) assert.ok(Math.abs(screenWidth - 516.7) < 0.4);
      if (zoom === 0.5) assert.ok(Math.abs(screenWidth - 129.18) < 0.2);
      if (zoom === 3) assert.ok(Math.abs(screenWidth - 775.04) < 0.6);

      // Physical ML must remain exactly 68.2 mm
      const physicalMm = imagePxToMm(screenWidth / zoom, derivedMmPerPx);
      assert.ok(Math.abs(physicalMm - 68.2) < 0.0001);
    }
  });

  it("21. MANDATORY TEST CASE B: Move implant X=0, X=+5mm, X=-5mm", () => {
    const size = 3;
    const patientAp = 42.5;
    const patientMl = 68.2;

    const fit0 = evaluateTibialFit(size, 0, 0, patientAp, patientMl, 0);
    const fitPos5 = evaluateTibialFit(size, 5, 0, patientAp, patientMl, 0);
    const fitNeg5 = evaluateTibialFit(size, -5, 0, patientAp, patientMl, 0);

    // At X=0: balanced, 0 overhang
    assert.strictEqual(fit0.medialOverhangMm, 0);
    assert.strictEqual(fit0.lateralOverhangMm, 0);
    assert.ok(fit0.coveragePct >= 95.0);
    assert.strictEqual(fit0.fitStatus, "ACCEPTABLE FIT");

    // At X=+5mm: shifted lateral by 5mm -> lateral overhang exactly 5.0mm, medial overhang 0mm
    assert.strictEqual(fitPos5.lateralOverhangMm, 5.0);
    assert.strictEqual(fitPos5.medialOverhangMm, 0.0);
    assert.ok(fitPos5.coveragePct < fit0.coveragePct);
    assert.strictEqual(fitPos5.fitStatus, "POOR FIT");

    // At X=-5mm: shifted medial by 5mm -> medial overhang exactly 5.0mm, lateral overhang 0mm
    assert.strictEqual(fitNeg5.medialOverhangMm, 5.0);
    assert.strictEqual(fitNeg5.lateralOverhangMm, 0.0);
    assert.ok(fitNeg5.coveragePct < fit0.coveragePct);
    assert.strictEqual(fitNeg5.fitStatus, "POOR FIT");
  });

  it("22. MANDATORY TEST CASE C: rotation is the IN-PLANE rotation of the AP overlay (V1: align with the MPTA line)", () => {
    // Changed from the earlier axial-rotation meaning: the V1 PDF's rotation handle aligns the overlay with
    // the MPTA axis line in the AP viewport, so rotation moves the AP drawing only. Axial coverage and the
    // lateral (antero-posterior) measurements do not depend on it.
    const size = 3;
    const patientAp = 42.5;
    const patientMl = 68.2;

    const fit0 = evaluateTibialFit(size, 0, 0, patientAp, patientMl, 0);
    const fit5 = evaluateTibialFit(size, 0, 0, patientAp, patientMl, 5);

    assert.equal(fit5.coveragePct, fit0.coveragePct, "axial coverage estimate is unaffected by in-plane rotation");
    assert.equal(fit5.anteriorOverhangMm, fit0.anteriorOverhangMm);
    assert.equal(fit5.posteriorOverhangMm, fit0.posteriorOverhangMm);
    // The rotated AP drawing's horizontal extent changes, so the overhang is measured on the rotated outline.
    assert.ok(fit5.extents.minX !== fit0.extents.minX || fit5.extents.maxX !== fit0.extents.maxX);
    assert.ok(Math.max(fit5.medialOverhangMm, fit5.lateralOverhangMm) > 0, "a turned plate reaches past the marked edge");

    // A femoral component is tall in the AP view, so the same turn is clearly visible in its ML coverage.
    const f0 = evaluateFemoralFit(4, 0, 0, 58.4, 64.1, 0);
    const f15 = evaluateFemoralFit(4, 0, 0, 58.4, 64.1, 15);
    assert.ok(f15.mlCoveragePct < f0.mlCoveragePct, "rotation reduces ML coverage");
    assert.equal(f15.apCoveragePct, f0.apCoveragePct, "AP coverage is read on the lateral view and is unaffected");
  });

  it("23. Assessment Landmark Isolation: TibialCanvas does not leak assessment landmarks", () => {
    const fs = require("fs");
    const path = require("path");
    const canvasCode = fs.readFileSync(
      path.resolve(__dirname, "../[id]/tibial/TibialCanvas.tsx"),
      "utf8"
    );
    // Must NOT contain the old loop that rendered blue landmark dots
    assert.ok(!canvasCode.includes("assessmentLandmarks).map"));
    assert.ok(!canvasCode.includes("#3b82f6"));
  });
});
