# V1 Planner Redesign — Implementation Proposal (Phase A output)

| | |
|---|---|
| **Date** | 2026-10-07 |
| **Contract** | `Mediver User Planning Workflow V1.pdf` (v1.0.0). This proposal changes the *implementation*, never the product contract. |
| **Inputs** | `MEDIVER_XR_CURRENT_STATE_AUDIT_2026-10-07.md` · `research/TKA_REAL_WORLD_PREOPERATIVE_TEMPLATING_RESEARCH.md` · `research/V1_PLANNER_COMPLIANCE_MATRIX.md` |
| **Scope guard** | Planner only. No auth redesign, no plan-persistence architecture, no VR backend, no analytics/CI/security remediation (documented, not done) — except the two smallest server-side lock guards that the PDF's "immutable" rule needs (matrix D-20). |

---

## 1. Findings that drive the design

1. **The overlay is not a template.** Tibial/femoral shapes are scaled polygons; the tibial axial tray is a scaled copy of the bone contour; the femoral fit uses a bounding box of an outline. The PDF requires a *semi-transparent blue vector* graphic of the *selected size*.
2. **Rotation means two different things.** PDF: rotate the AP overlay "to align with the MPTA axis line" (in-plane, minor). Previous code: axial rotation ±45° exposed only on a top-down "fit map". One payload scalar cannot be both.
3. **Radiographs do not contain an axial footprint.** Real 2-D templating judges ML width, AP depth and edge relationships; V1 additionally asks for an area "cortical coverage" by polygon intersection. This must be computed against an *estimated* outline and labelled as such.
4. **Assessment deviates from the PDF's card flow and from two landmark definitions (MPTA, PTS)** — a documented conflict, not to be silently changed (task rule 3.2); plus a few cheap, unambiguous V1 gaps (hard-lock after Continue, magnifier, header).
5. **Calibration "automatic detection" is absent**; the scale is manual or case-supplied.
6. **Two fit engines exist** (frontend runs; backend parametric engine is unused dead code with different conventions).

## 2. Implant-template abstraction (new module)

`dashboard/src/lib/data/implant_templates/`

```ts
type TemplateProvenance = "ENGINEERING_DERIVATION";            // never "manufacturer"
type TemplateValidation = "CLINICAL_APPROVAL_REQUIRED";

interface ImplantSystem {
  id: "GENERIC_TKA_TEMPLATE";
  geometryVersion: string;           // "1.0.0" — bump on any shape change
  provenance: TemplateProvenance;
  validation: TemplateValidation;
  tibialTemplates: TibialTemplate[]; // sizes 1..6 (V1)
  femoralTemplates: FemoralTemplate[]; // sizes 1..8 (V1)
}

interface ImplantTemplate {
  implantId: string;                 // e.g. "GENERIC_TKA_TEMPLATE/tibial/3"
  size: number;
  dimensionsMm: { ap: number; ml: number };
  views: { ap: ViewShape; lateral: ViewShape; footprint: Point2D[] };
  origin: string;                    // human-readable reference-origin statement
  coordinateSystem: string;          // axes, units, sign conventions
  constraints: { rotationLimitDeg: number; translationLimitMm: number };
  geometryVersion: string; provenance; validationStatus;
}
interface ViewShape {                // millimetres, template-local, y down, x per view
  layers: { role: "baseplate"|"insert"|"stem"|"keel"|"condyle"|"flange"|"box"|"detail"; path: Point2D[]; opacity: number }[];
  silhouette: Point2D[];             // union outline used for extents / overhang
  extents: { minX:number; maxX:number; minY:number; maxY:number };
}
```

* **Generators, not tables of numbers:** each size's shapes are produced by deterministic generator functions from the size's AP and ML (arcs/splines sampled to polygons), so the geometry is reproducible, testable and versioned. No hand-typed vertex lists, no copied CAD.
* **Tibial** — *AP view:* flat bevelled baseplate band, insert above it with dished medial/lateral plateaus and a central eminence, tapered central stem and keel wings; *lateral view:* plate with anterior bevel and posterior chamfer, insert with anterior lip / dish / posterior rise, conical stem; *footprint (axial):* asymmetric D-shaped baseplate outline with posterior notch — **deliberately not the same shape as the estimated bone outline**.
* **Femoral** — *AP view:* two condyles (medial slightly larger) joined by the anterior flange with trochlear groove, intercondylar box detail; *lateral view:* J-curve outer profile (anterior flange → anterior chamfer → distal arc → posterior chamfer → posterior arc) with the five bone-facing cut lines as the closing edge; *footprint:* two-lobe distal outline.
* **Dimensions:** the existing V1 size ladders (tibial 1-6, femoral 1-8) are kept so V1 sizes do not change. They are **ENGINEERING_DERIVATION / CLINICAL_APPROVAL_REQUIRED**; the PDF's 42.5×68.2 and 58.4×64.1 are *examples* and are not defaults anywhere in the new code.
* Backward-compatible adapters keep `TIBIAL_GEOMETRY_CATALOG`/`FEMORAL_GEOMETRY_CATALOG` consumers working until they are migrated; the duplicate catalogues (3× tibial, 3× femoral) collapse to one source.

## 3. Patient anatomical representation (honest scope)

| Bone | V1 inputs available | Representation after the change | Label shown to the user |
|---|---|---|---|
| Tibia | two ML edge marks (AP view), two AP edge marks (lateral view) | Generic plateau outline **scaled to the measured ML and AP** (smoothed); used only to estimate area coverage | "Estimated outline from your ML/AP marks — not traced anatomy" |
| Femur | same | **Span-based**: coverage = overlap of template extents with the marked spans; no area claim, no rectangle presented as anatomy | "Based on the marked width and depth" |

A true anatomical boundary cannot be derived from the V1 inputs; an annotated border polyline (more clicks per view) is a recommended future V1.x change requiring product approval.

## 4. Fit engine (one canonical engine)

* **Canonical:** `dashboard/src/lib/data/tkr_templates.ts` (`evaluateTibialFit`, `evaluateFemoralFit`), re-based on the template module, with a single **threshold table that carries provenance**:

| Rule | Value | Class | Shown as |
|---|---|---|---|
| Tibial cortical coverage | ≥ 90.0 % | SOURCE_VERIFIED (PDF p4-5) | V1 |
| Medial / lateral overhang | ≤ 1.0 mm | SOURCE_VERIFIED | V1 |
| Overhang caution | > 1.5 mm → "CAUTION: Medial/Lateral Overhang > 1.5mm" | SOURCE_VERIFIED | V1 |
| Overall "ACCEPTABLE FIT" | all V1 thresholds met | SOURCE_VERIFIED | V1 |
| Coverage < 85 % = POOR | 85 % | PROJECT_RULE → CLINICAL_APPROVAL_REQUIRED | labelled "project rule" |
| Anterior/posterior tibial overhang | 1.0 / 1.5 mm reused | ENGINEERING_DERIVATION | labelled "extra" |
| Femoral AP/ML coverage "acceptable" | ≥ 90 % (reused from Page 2) | PROJECT_RULE | labelled |
| Femoral notching limit | 0.5 mm | PROJECT_RULE → CLINICAL_APPROVAL_REQUIRED | labelled |

* **Per-view geometry (new):** ML overhang/coverage from the AP-view silhouette (rotated by the in-plane `rotation_deg`); AP overhang/coverage and notching from the lateral-view silhouette; area coverage from the axial footprint ∩ estimated bone outline. `rotation_deg` no longer enters the axial computation.
* **Backend engine:** not deleted. Consumers found: none in routes (`cases_service` imports only). Action: mark `planning.py` fit/size functions **non-authoritative** in code and docs; keep its 7 tests; schedule removal only after a shared spec exists (out of scope here).
* **Public API of the frontend engine is preserved** so existing callers and tests continue to work; tests whose *meaning* changes (axial → in-plane rotation) are updated and listed in the final report — none deleted.

## 5. Rotation and positioning (decision D-ROT)

* `position_2d.rotation_deg` = **in-image-plane rotation of the AP overlay about its centre handle**, degrees, positive = clockwise on screen, range ±15° (engineering limit, "minor alignment"), default 0. `[`/`]` keys and a numeric field edit it; an **"Align to plateau line"** action sets it from the angle of the line through the two edge marks (the MPTA/plateau line available on that view).
* `x_offset_mm`: ML (AP view), `y_offset_mm`: AP positive posterior (lateral view); both measured from the middle of the marked bone edges, as before. `level_offset_mm` stays drawing-only (never in the payload; resection depth is excluded).
* On the **scan**: visible **centre handle** (drag to translate) and **rotation handle** (AP overlay). The top-down fit map keeps translation only.
* The meaning of `rotation_deg` is **flagged for clinical confirmation (C-03)**; the V1 payload field name and shape are unchanged.

## 6. UI changes (planner-local; no global styling)

| Area | Change |
|---|---|
| Global header | New persistent patient header bar on all four pages: Patient ID, Age, Sex (real values or "not recorded" — the 68/Male defaults are removed), Surgical side, Procedure "Primary TKA", Plan state Draft / Locked, scale-verification chip |
| Page 1 | Panel on the left, scan on the right; FLAP/KLAT tabs at top of panel; **magnifier loupe** while placing/dragging; assessment **hard-locked** after Continue (no unlock); Review "Back" reaches Tibial/Femoral only. Card-based flow and the MPTA/PTS landmark models are **not changed** (D-A1, C-05, C-06) and are reported |
| Calibration | **Assisted marker detection** (pure TS circle-candidate finder) proposes a scale; the user must confirm; falls back to two-click. Not described as automatic. Constant `0.264` removed from production code; seeds flagged unverified |
| Pages 2-3 | Template drawn **blue, semi-transparent**; verdict shown with an outline/badge instead of recolouring; centre + rotation handles; "Confirm Tibial Component"/"Confirm Femoral Component" labels; exact PDF caution tag; V1 metrics shown first, engineering extras under a "project rules" subhead |
| Page 4 | Card 2 grouped FLAP/KLAT in PDF order; "Back to Planning"; modal title/sentence per PDF; truthful button/banners (no false "transmitted" toast) |
| Server guards | `updatePlanPayload` rejects after lock; `sealTkrPlan` rejects a second seal; route-level redirect to first incomplete step |

## 7. Files expected to change

New: `lib/data/implant_templates/{index,types,tibial,femoral,geometry_util}.ts`, `lib/data/calibration_detect.ts`, `app/plan/[id]/components/{PlannerHeader,Loupe}.tsx`, tests `implant_templates.test.ts`, `calibration_detect.test.ts`, `fit_engine_v1.test.ts`, `planner_lock.test.ts`.
Changed: `tkr_templates.ts`, `tibial_geometry.ts` (adapter), `femoral_geometry.ts` (adapter), `fit_markers.ts`, `fit_map.ts`, `fit_advice.ts`, `calibration.ts`, `coordinates.ts` (fallback removal), `TkrPlanShell.tsx`, `AssessmentWorkspace.tsx`, `MeasurementPanel.tsx`, `ScanViewport.tsx`, `Tibial*`, `Femoral*`, `FitMap.tsx`, `FitPanels.tsx`, `ReviewWorkspace.tsx`, `actions/index.ts`, `plans.ts` (seed flags), `plan.ts` (types), backend `core/calculations/planning.py` (docstring only), affected tests and docs 04/09.
**Not touched:** `InstructorDashboard.tsx`, `dashboard.module.css`, auth, case authoring (except where a planner type is shared), backend routes.

## 8. Test plan (maps to the task's 25 test areas)

Existing 214 dashboard tests + 48 backend (safe) tests are the baseline (recorded before changes). New/updated suites cover: six measurements and four sizing dimensions; landmark reuse; calibration valid/invalid and detection; tibial sizes 1-6 and femoral 1-8 template existence, monotonic dimensions, AP/lateral/footprint presence, geometry version/provenance; overlay scale (px/mm) and zoom/pan invariance (pure transform tests); translation/rotation; coverage, medial/lateral overhang, 1.5 mm caution tag, femoral AP/ML coverage, anterior notching; confirmation + stale confirmation; review gating; lock behaviour (server guards); V1 payload serialisation (exact keys). Lint on changed files; `tsc`.

## 9. Visual verification plan

Run `next dev`, open the four pages with the synthetic cases, and capture screenshots to the scratchpad via a headless browser (if one can be driven locally); otherwise report that visual verification was limited to server-render/HTTP checks and unit-level geometry checks — **no claim of visual verification will be made that was not performed**.

## 10. Conflicts and approval items (carried into the final report)

C-01 implant tables/shapes · C-02 coverage definition · C-03 rotation meaning · C-04 mHKA convention · C-05 PTS landmarks · C-06 MPTA axis · C-07/C-08 extra thresholds · C-09 marker detection acceptance · C-10 "planning estimate" disclosure. Internal PDF issues IC-1…IC-12 are listed in the matrix.

## 11. Risks and rollback

* Largest risk: behaviour change in rotation semantics → mitigated by keeping the payload shape, documenting D-ROT, and migrating stored axial rotations by treating them as 0 in the new meaning (stored plans are in-memory only; seeded plans use ≤ 0.5°).
* All changes are in the uncommitted working tree on top of the existing uncommitted rewrite; nothing is committed. A reviewer can inspect with `git diff`/`git status`; no destructive git operation is used.

## 12. Phase A gate

Research document, compliance matrix and this proposal exist. Phase B starts with the template module (task Part 23 order). Final status will be one of V1 COMPLIANT / V1 COMPLIANT WITH DOCUMENTED LIMITATIONS / V1 BLOCKED BY CLINICAL/PRODUCT DECISION; based on the matrix, the expected outcome is **V1 COMPLIANT WITH DOCUMENTED LIMITATIONS**, with D-A1, C-05 and C-06 as the known deviations.
