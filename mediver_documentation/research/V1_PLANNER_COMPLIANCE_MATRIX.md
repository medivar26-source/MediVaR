# V1 Planner Compliance Matrix

| | |
|---|---|
| **Specification (contract)** | `mediver_documentation/Mediver User Planning Workflow V1.pdf` — *V1 TKA Preoperative Planning Software, Detailed Software UI Workflow & Click-by-Click User Interaction Specification*, v1.0.0, 7 pages |
| **How the PDF was read** | Text extracted from all 7 pages (PyMuPDF) **and** pages 4 and 6 rendered and viewed. The PDF contains **no screenshots or diagrams** (0 embedded images) — only text and tables — so "verify against PDF screenshots" can only mean verify against its tables and interaction text. |
| **Code baseline** | Working tree at HEAD `f5732d3` + uncommitted planner rewrite (see current-state audit) |
| **Written** | 2026-10-07, **before** any Phase B implementation |

**Page map:** p1 overview/rules/header table · p2 header (cont.), Page 1 intro, Step 0, Step 1 table (MAD, AMA, mHKA, MPTA) · p3 LDFA, landmark-reuse note, click flow, Step 2 (PTS), Step 3 (continue) · p4 Page 2 tibial (table, steps 1-4 start) · p5 fit-metric table (cont.), Step 5, Page 3 femoral · p6 Page 4 review, lock, §4 payload start · p7 payload JSON.

**Status vocabulary — Current:** `COMPLIANT` · `PARTIAL` · `NON-COMPLIANT` (code contradicts the PDF) · `NOT IMPLEMENTED` · `PDF-AMBIGUOUS`.
**Planned change:** `KEEP` · `IMPLEMENT` (Phase B) · `DOCUMENT` (report only; no silent change) · `DECISION` (needs product/clinical owner).

---

## A. Workflow, scope and header

| ID | V1 requirement | PDF ref | Current code | Planned change | Current |
|---|---|---|---|---|---|
| A-01 | Four-page linear workflow: Assessment → Tibial → Femoral → Review & Send | p1 rule 1; p2-p6 | 4 routes under `/plan/[id]/…`; legacy 7-step routes redirect | KEEP | COMPLIANT |
| A-02 | MEASURE → SIZE → SEND mental model | p1 §1 | Shown in rail ("MEASURE → SIZE → SEND") | KEEP | COMPLIANT |
| A-03 | Unprocessed steps disabled; navigation locked until completion thresholds met | p1 rule 2 | Stepper disables future steps (`TkrPlanShell`); **URL access is not gated server-side** (a user can open `/tibial` directly) | IMPLEMENT: route-level redirect to the first incomplete step | PARTIAL |
| A-04 | Exactly 6 assessment + 4 sizing measurements = 10 steps; none added/removed | p1 rule 4 | 6 values + bone ML/AP from 4 edge marks (the 4 sizing dimensions). Extras exist as display only (plausibility notes, fit overhangs on 4 edges) | KEEP; label sizing dimensions explicitly as the 4 sizing measurements | PARTIAL |
| A-05 | No intraoperative variables, cuts, resections, slope control, polyethylene thickness, gap balancing, 3-D | p1 §1; Page 4 §4 | None present in UI or payload (an illustrative "insert height" is drawn only as part of the template, not a parameter) | KEEP; do not expose insert thickness as a setting | COMPLIANT |
| A-06 | Persistent, non-scrollable global header on all four pages | p1 §2 | Compact top bar of chips inside the scrolling surface; not a dedicated header bar | IMPLEMENT: persistent patient header bar | PARTIAL |
| A-07 | Header: Patient ID, Age, Sex (read-only; DICOM metadata "hard-coded for V1") | p1-p2 table | Chip shows `caseId · age, sex`; **when age/sex are missing the code substitutes "68" and "Male"** (`TkrPlanShell.tsx`) — fabricated values | IMPLEMENT: show real values or an explicit "not recorded"; never default | NON-COMPLIANT |
| A-08 | Header: Surgical side (Left/Right), hard-locked after session start | p2 table | Chip `RIGHT/LEFT KNEE` from the case; not editable in planner | KEEP | COMPLIANT |
| A-09 | Header: Procedure type "Primary TKA" (read-only) | p2 table | Not shown in header (only in review card) | IMPLEMENT | NON-COMPLIANT |
| A-10 | Header: Plan state **Draft / Locked & Sent**, updates with system state | p2 table | Chips "Draft" / "Locked". There is no transmission, so "Sent" cannot be truthful | IMPLEMENT `Draft` / `Locked`; add "Locked — not yet transmitted" until a transport exists. DOCUMENT deviation | PARTIAL (**deviation by necessity**) |

## B. Page 1 — Assessment

| ID | V1 requirement | PDF ref | Current code | Planned change | Current |
|---|---|---|---|---|---|
| B-01 | Two-panel layout: left measurement control panel, centre/right viewport | p2 Step 0 | Left viewport, **right** panel (flex 2 : 1) | IMPLEMENT: swap to panel-left | NON-COMPLIANT (layout) |
| B-02 | Segmented tabs `[● FLAP] [○ KLAT]`, FLAP default | p2 Step 0 | Segmented control "AP scan / Lateral scan", FLAP default; placed above the viewport, not at the top of the left panel | IMPLEMENT: labels FLAP/KLAT with full names; place at top of panel | PARTIAL |
| B-03 | FLAP view lists 5 measurement cards (MAD, AMA, mHKA, MPTA, LDFA); KLAT view lists PTS | p2 Step 1; p3 Step 2 | One list of 6 results for both views; per-view point lists in a collapsible | DECISION D-A1 (see §E): per-view card lists | PARTIAL |
| B-04 | Cards: ○ icon, abbreviation, title, "Not Measured" status | p2 | Result rows with abbreviation/name and "—" + "needs N points" | IMPLEMENT: "Not Measured" status text | PARTIAL |
| B-05 | Selecting a card highlights it (steel-blue border) and starts guided placement | p3 click flow 1-2 | **Not implemented**: placement is a fixed sequential 13-point queue ("Place the next point"); cards are not selectable | DECISION D-A1 | NOT IMPLEMENTED |
| B-06 | On-screen guidance prompt at the top of the viewport per point ("Place Point 1: Center of Femoral Head.") | p3 click flow 2-3 | Prompt present ("Point n of 13: click the …") | KEEP | COMPLIANT |
| B-07 | Vector node appears; **magnifying-lens hover assistance** | p3 click flow 3 | Dot appears; **no magnifier** | IMPLEMENT: pointer-following magnifier loupe while placing/dragging | NOT IMPLEMENTED |
| B-08 | Geometry computed instantly against calibrated DICOM pixel grid; value populates | p3 click flow 4 | Live computation in natural-image pixels | KEEP | COMPLIANT |
| B-09 | Completed card → green ✓, bold value (e.g. "12 mm Varus"), "Adjust Points" unlocks | p3 click flow 5 | Values listed; points draggable; no per-card ✓/"Adjust Points" | IMPLEMENT with D-A1 | PARTIAL |
| B-10 | Landmarks reused once placed; no repeated placement | p3 note | Shared hip/knee/ankle used by MAD, mHKA, MPTA, LDFA, AMA | KEEP | COMPLIANT |
| B-11 | **MAD**: Femoral Head Center, Knee Joint Center, Ankle Joint Center; perpendicular distance knee → mechanical axis (head → ankle) | p2 table | Same 3 points; perpendicular distance × FLAP scale | KEEP | COMPLIANT |
| B-12 | MAD click-by-click example prompts only **two** points ("Place Point 2: Center of Ankle Talus") | p3 click flow 3 | n/a | DOCUMENT as **IC-1** | PDF-AMBIGUOUS |
| B-13 | **AMA**: Proximal Femoral Shaft Point, Distal Femoral Shaft Point; angle between femoral anatomical axis and mechanical axis (head → knee) | p2 table | `femurCanalProximal/Distal` + hip + knee | KEEP | COMPLIANT |
| B-14 | **mHKA**: head, knee, ankle; "Included angle (°) between femoral mech axis (H→K) and tibial mech axis (K→A)"; display with Varus/Valgus | p2 table | Value is the **deviation from straight** (0° neutral) with VARUS/VALGUS/NEUTRAL. Backend dead code uses included angle (≈180°). PDF example shows "7.0° Varus" | DOCUMENT **IC-2 / C-04**; KEEP current (matches PDF example) | PDF-AMBIGUOUS |
| B-15 | **MPTA**: Medial Tibial Plateau Point, Lateral Tibial Plateau Point, **Proximal Tibial Shaft Point, Distal Tibial Shaft Point**; medial angle between plateau/joint line and tibial mechanical axis *defined by the two shaft points* | p2-p3 | Plateau medial/lateral + **knee centre → ankle centre** as tibial axis; **no shaft points** | DOCUMENT as **conflict C-06**; do **not** silently change (task rule 3.2). Keep landmark model; flag | NON-COMPLIANT (landmark model) |
| B-16 | **LDFA**: Medial Distal Femoral Point, Lateral Distal Femoral Point; lateral angle vs femoral mech axis (head → knee) | p3 table | Same | KEEP | COMPLIANT |
| B-17 | **PTS** (KLAT): "Place 2 points along proximal tibial anterior cortex, then 1 point along tibial plateau tangent line"; slope relative to longitudinal shaft line | p3 Step 2 | **4 points**: plateau anterior/posterior + shaft proximal/distal; signed slope = angle to perpendicular of shaft | DOCUMENT **conflict C-05**; do **not** silently replace. Recommend product decision | NON-COMPLIANT (landmark model) |
| B-18 | PTS output "✓ PTS 7°" | p3 | value shown | KEEP | COMPLIANT |
| B-19 | All 6 complete → `[ Continue to Tibial Planning → ]` becomes active (grey disabled → blue) | p3 Step 3 | Button disabled until complete; label matches | KEEP | COMPLIANT |
| B-20 | Clicking Continue **hard-locks** Assessment values and loads Page 2 | p3 Step 3 | After Continue the page can be re-opened and edited ("Unlock & adjust points") | IMPLEMENT: no unlock once saved; read-only assessment page (Review "Back" reaches pages 2/3 only) | NON-COMPLIANT |
| B-21 | Calibration markers automatically detected | p1 rule 3 | **Not implemented**; two-click manual scale / case-supplied scale | IMPLEMENT assisted detection (candidate proposal + user confirmation); never claim full automation. DOCUMENT | NOT IMPLEMENTED |
| B-22 | Implant overlays scale dynamically from patient px/mm | p1 rule 3 | Overlay uses resolved per-scan `mmPerPx` | KEEP | COMPLIANT |
| B-23 | No universal 0.264 mm/px | task Part 4 | `DEFAULT_MM_PER_PX = 0.264` still exists as a flagged-invalid placeholder; seeds use 0.264 on both views as "valid" | IMPLEMENT: remove constant from non-test code paths; seeds marked unverified | PARTIAL |

## C. Page 2 — Tibial planning

| ID | V1 requirement | PDF ref | Current code | Planned change | Current |
|---|---|---|---|---|---|
| C-01 | Measurement **Tibial AP Dimension** (KLAT) | p4 table | Derived from anterior/posterior edge marks on KLAT | KEEP; show as "Tibial AP dimension" | COMPLIANT |
| C-02 | Measurement **Tibial ML Dimension** (FLAP) | p4 table | Derived from medial/lateral marks on FLAP | KEEP | COMPLIANT |
| C-03 | How AP/ML are measured is **not specified** ("User computes AP and ML dimensions on the Xray") | p4 Step 1 | Four edge points | DOCUMENT **IC-3** | PDF-AMBIGUOUS |
| C-04 | Left panel shows "Tibial Sizing Section" with radiographic AP/ML dimensions (42.5/68.2 are *examples*) | p4 Step 1 | Bone ML/AP shown once markers placed; no hard-coded defaults in the UI. Defaults 42.5/68.2 still appear as function default args in `evaluateTibialFit` | IMPLEMENT: remove example numbers as defaults | PARTIAL |
| C-05 | System auto-highlights best-matching size | p4 Step 1 | `rankTibialSizes` recommends and labels it | KEEP | COMPLIANT |
| C-06 | Size toolbar `[Size 1]…[Size 6]`, "Size 3 – Suggested" in example | p4 Step 2 | Size buttons 1-6 | KEEP | COMPLIANT |
| C-07 | Clicking a size immediately swaps the 2-D template | p4 Step 2 | Yes | KEEP | COMPLIANT |
| C-08 | Template = **semi-transparent blue vector** graphic of the selected tray over the proximal tibia in the AP viewport | p4 Step 3.1 | Vector polygons, but fill colour = verdict tone (green/amber/red), schematic shapes (generic keel/baseplate polygons, axial footprint is a scaled copy of the bone contour) | IMPLEMENT: blue template via new implant-template module; verdict shown by outline badge, not by recolouring the template | NON-COMPLIANT |
| C-09 | Realistic, size-specific, calibrated template; not a rectangle/ellipse/scaled generic polygon | task Part 5.4 | Per-size polygons derived by scaling; femoral outline is a bounding box in fit | IMPLEMENT | NON-COMPLIANT |
| C-10 | User drags the **centre handle** to translate (ML on AP; AP on KLAT) | p4 Step 3.2 | Whole-body drag; no explicit centre handle | IMPLEMENT: visible centre handle | PARTIAL |
| C-11 | **Rotational handle** for minor 2-D alignment with the MPTA axis line | p4 Step 3.2 | No rotation handle on the scans; rotation only via fit-map handle (±45°) and numeric field, defined as **axial** rotation | IMPLEMENT image-plane rotation handle on the AP overlay. **DECISION D-ROT** (meaning of `rotation_deg`); DOCUMENT | NON-COMPLIANT |
| C-12 | Fit calculated live by **polygon intersection** between implant outer geometry and annotated bone border | p4 Step 4 | Polygon intersection against a *generic* plateau outline scaled to the 4 marks (area coverage) + per-edge overhang | KEEP engine; label bone outline "estimated from ML/AP". DECISION D-FIT | PARTIAL |
| C-13 | FIT METRICS panel: Cortical Coverage, Medial Overhang, Lateral Overhang, Overall Fit Status | p4-p5 table | Panel shows coverage + 4 edge overhangs + status | KEEP; present the three V1 metrics first, anterior/posterior as engineering extras | PARTIAL |
| C-14 | Coverage threshold ≥ 90.0 % | p4-p5 table | `minCoveragePct = 90` | KEEP — SOURCE_VERIFIED | COMPLIANT |
| C-15 | Medial/Lateral overhang ≤ 1.0 mm | p5 table | `maxOverhangMm = 1.0` | KEEP — SOURCE_VERIFIED | COMPLIANT |
| C-16 | Green text/✓ indicators; ACCEPTABLE FIT badge "[✓ FIT ACCEPTABLE]" when all thresholds met | p5 | tones + "ACCEPTABLE FIT" | KEEP | COMPLIANT |
| C-17 | If overhang > 1.5 mm: amber/red border with tag **"CAUTION: Medial Overhang > 1.5mm"** | p5 | Verdict "POOR FIT" (red); the PDF caution text is not shown; legacy string only parsed | IMPLEMENT: exact caution tag for medial/lateral | NON-COMPLIANT |
| C-18 | Outcomes between thresholds (coverage <90 % or overhang 1.0-1.5 mm) are undefined | p4-p5 | Code adds `BORDERLINE FIT` and `POOR FIT` (85 % rule) | DOCUMENT **IC-4**; keep as ENGINEERING_DERIVATION, labelled | PDF-AMBIGUOUS |
| C-19 | `[ Confirm Tibial Component ]` saves size and 2-D X/Y offsets | p5 Step 5 | Button "Confirm tibial tray" saves size, offsets, rotation, fit | IMPLEMENT: PDF label | PARTIAL |
| C-20 | `[ Continue to Femoral Planning → ]` enabled only after confirmation | p5 Step 5 | Gated | KEEP | COMPLIANT |
| C-21 | Stale confirmation when anything changes | task Part 19 | Scale/marker/placement changes withdraw confirmation | KEEP + extend tests | COMPLIANT |

## D. Page 3 — Femoral planning, Page 4 — Review & Send, payload

| ID | V1 requirement | PDF ref | Current code | Planned change | Current |
|---|---|---|---|---|---|
| D-01 | Measurement **Femoral AP Dimension** (KLAT) | p5 table | Anterior/posterior marks on KLAT | KEEP | COMPLIANT |
| D-02 | Measurement **Femoral ML Dimension** (FLAP) | p5 table | Medial/lateral marks on FLAP | KEEP | COMPLIANT |
| D-03 | Same interaction model as Page 2 | p5 | Shared `useFitSession` | KEEP | COMPLIANT |
| D-04 | Sizes 1-8; "Size 4" auto-suggested in example | p5 step 2 | 1-8 | KEEP | COMPLIANT |
| D-05 | Size click swaps the template | p5 | Yes | KEEP | COMPLIANT |
| D-06 | Realistic size-specific femoral template (condylar form, anterior flange, intercondylar, sagittal profile), separate AP and lateral geometry | task Part 6.3 | `flapPolygon` (68 pts) + crude 16-pt `klatPolygon`; fit uses a bounding box of the distal outline | IMPLEMENT: new template module (AP + lateral + footprint) | NON-COMPLIANT |
| D-07 | User overlays the template over the distal femur; toggles to KLAT to verify anterior flush and notching | p5 step 3 | View toggle exists | KEEP | COMPLIANT |
| D-08 | Dynamic fit: AP Coverage, ML Coverage, Anterior Notching Risk (mm), Fit Status | p5 step 4 | All four shown | KEEP | COMPLIANT |
| D-09 | **No femoral thresholds are given** (only example values 97.1 % / 95.8 % / 0.0 mm flush) | p5 | Code uses 90 %/85 % coverage and 0.5 mm notch limit | DOCUMENT **IC-5 / C-07**; keep as PROJECT_RULE/ENGINEERING, labelled | PDF-AMBIGUOUS |
| D-10 | Femoral AP from KLAT and ML from FLAP drive coverage | p5 table | Both derived from one footprint outline | IMPLEMENT: AP coverage/notching from lateral template, ML coverage from AP template | PARTIAL |
| D-11 | `[ Confirm Femoral Component ]` then `[ Continue to Review → ]` | p5 | "Confirm femoral component"; gated | IMPLEMENT label | PARTIAL |
| D-12 | Review: 3 side-by-side cards — Patient & Radiographs / Assessment Measurements / Component Selections | p6 | 3 cards present | KEEP | COMPLIANT |
| D-13 | Card 1: Patient ID, Operative Knee, Procedure, Calibration | p6 | Present; calibration shown per view (AP/Lateral) | KEEP; DOCUMENT **IC-6** (PDF shows one calibration value; there are two scans) | PARTIAL |
| D-14 | Card 2 grouped **FLAP:** MAD, AMA, mHKA, MPTA, LDFA; **KLAT:** PTS, with direction text ("12 mm Varus") | p6 | Flat list in order MAD, mHKA, MPTA, LDFA, AMA, PTS; direction in a footer line | IMPLEMENT: group and order per PDF | PARTIAL |
| D-15 | Card 3: Tibial and Femoral — Selected Size, Fit Status, Coverage | p6 | Present (femoral coverage shown) | KEEP | COMPLIANT |
| D-16 | Bottom toolbar: `[← Back to Planning]` (to page 2 or 3) and `[LOCK PLAN & SEND TO VR →]` (solid navy) | p6 | "Back to Femoral Planning" link; lock button navy | IMPLEMENT: "Back to Planning" with page-2/3 choice | PARTIAL |
| D-17 | Lock modal: "Lock Preoperative Plan? Once locked, parameters cannot be modified in 2D software." with `[ Confirm & Send ]` | p6 | Same question and sentence plus extra clause; buttons Cancel / "Confirm & Lock" | IMPLEMENT: exact title/sentence; button label stays truthful (see D-19) | PARTIAL |
| D-18 | System serialises patient data, measurements and sizes to standard VR JSON | p6 | `sealTkrPlan` builds the V1 payload | KEEP | COMPLIANT |
| D-19 | Success toast "Plan successfully transmitted to VR Suite. Session Completed." | p6 | No transmission exists; the page shows a truthful "not yet connected" banner | DOCUMENT as **deviation by necessity**: toast text would be false until transport exists | NON-COMPLIANT (deliberate) |
| D-20 | Plan immutable once locked | p6; p1 | UI read-only after lock; **server does not enforce** (audit S-03) | IMPLEMENT minimal: reject `updatePlanPayload` and re-seal after lock | PARTIAL |
| D-21 | Payload schema exactly: `patient_id`, `knee_side`, `assessment{MAD_mm,AMA_deg,mHKA_deg,MPTA_deg,LDFA_deg,PTS_deg}`, `tibial_component{implant_size,position_2d{x_offset_mm,y_offset_mm,rotation_deg}}`, `femoral_component{…}` | p6-p7 | `V1VrPayload` type and builder match | KEEP; add serialisation tests | COMPLIANT |
| D-22 | `patient_id` should be the case's patient | p7 | Hard-coded map for two synthetic cases, else the case id | IMPLEMENT: use the case's patient id if present | PARTIAL |
| D-23 | Payload carries no direction (Varus/Valgus), no calibration | p7 vs p6 card | Same | DOCUMENT **IC-7** (direction shown in review but not in payload) | PDF-AMBIGUOUS |
| D-24 | Non-V1 parameters (cuts, gap balancing) strictly omitted | p6 | Omitted | KEEP | COMPLIANT |

---

## E. Internal PDF inconsistencies and gaps (recorded, **not** silently resolved)

Priority applied when something had to be chosen: (1) explicit V1 architectural rule, (2) explicit page-level interaction sequence, (3) explicit payload structure, (4) detailed measurement table, (5) example values.

| ID | Inconsistency / gap | Where | Treatment |
|---|---|---|---|
| IC-1 | MAD table needs **3 points** (head, knee, ankle) but the click-by-click prompts name only **2** ("Center of Femoral Head", "Center of Ankle Talus") | p2 table vs p3 click flow | Priority 2 vs 4: implement 3 points (mathematically required for a knee-to-axis perpendicular distance); record |
| IC-2 | mHKA is an "included angle" between H→K and K→A (which would read ≈ 173°) but all examples are deviation-style ("7.0° Varus") | p2 table vs p6/p7 examples | Current code follows the examples (deviation). **Clinical decision C-04** |
| IC-3 | Sizing measurements (tibial/femoral AP and ML) have **no point definitions**; "User computes AP and ML dimensions on the Xray" | p4 Step 1; p5 | Four edge marks are the implementation choice; record |
| IC-4 | Fit status for values between thresholds is undefined (coverage < 90 % or overhang 1.0-1.5 mm) | p4-p5 | Engineering tiers kept but labelled; V1 text shown for ACCEPTABLE and for > 1.5 mm caution |
| IC-5 | Femoral page lists example values only — no thresholds | p5 | Thresholds are PROJECT_RULE/ENGINEERING; clinical decision C-07 |
| IC-6 | Review shows **one** "Calibration: 0.264 mm/px" although two radiographs (FLAP, KLAT) have independent scales | p6 | Show both; record |
| IC-7 | Review cards show direction ("12 mm Varus", "7.0° Varus"); payload has none | p6 vs p7 | Payload unchanged (contract); direction stays UI-only |
| IC-8 | Overview says "6 assessment + 4 sizing = 10 measurement steps" but Page 1 describes 5 FLAP cards + 1 KLAT card, and Pages 2-3 define sizing dimensions in tables, not as click flows | p1 vs p2-p5 | Consistent in count; click-level definitions missing for the 4 sizing measurements (see IC-3) |
| IC-9 | "Anatomical landmarks can be reused" does not say which landmarks are the same anatomical point (e.g. shaft points vs ankle centre) | p3 | Only identical-named landmarks are shared (hip/knee/ankle) |
| IC-10 | "Rotational handle allows minor 2-D alignment with MPTA axis line" does not define sign, range or the plane of rotation | p4 Step 3 | **Decision D-ROT** |
| IC-11 | "Continue … hard-locks Assessment values" vs Review "Back to Planning … Page 2 or 3" — consistent only if Page 1 is not re-enterable | p3, p6 | Implement hard-lock (B-20) |
| IC-12 | Header says patient/side data are "Hardcoded for V1" | p2 | Supplied by the case record, never defaulted |

## F. Conflicts between the V1 PDF and other project documents / code (carried from the audit)

| ID | Conflict | Decision recorded |
|---|---|---|
| C-03/D-ROT | PDF: rotation aligns tray to MPTA line (in-plane); code (previous): axial rotation ±45° | PDF preserved; needs clinical confirmation |
| C-05 | PTS: PDF 3 clicks vs doc 09 / code 4 points | Reported, not changed |
| C-06 | MPTA tibial axis: PDF shaft points vs code knee→ankle | Reported, not changed |
| C-07/C-08 | Extra thresholds (85 %, 0.5 mm, A/P overhang) not in PDF | Retained, labelled `PROJECT_RULE`/`ENGINEERING_DERIVATION`, clinical approval required |
| DC-01 | Docs 02/03/04/09 present 0.264 mm/px as "the" calibration; doc 21 forbids it | Code derives per scan; docs to be corrected |
| DC-03 | Docs 02/05/07 say calculations are backend-authoritative; frontend engine actually runs | Frontend engine is canonical for V1 planner; backend engine flagged as unused (see proposal §6) |

## G. Decisions requested (blocking only where stated)

| ID | Question | Default used in Phase B | Blocks V1-compliant status? |
|---|---|---|---|
| D-A1 | Rebuild the Assessment panel as selectable per-measurement cards (B-03/B-05/B-09)? | **No** — task Part 23 says "Preserve Assessment"; documented as a limitation | Yes (limitation) |
| D-ROT | What is `rotation_deg`? | In-image-plane rotation of the AP overlay (PDF), sign positive = clockwise on screen | Needs clinical confirmation |
| D-FIT | Is area "cortical coverage" from an estimated axial outline acceptable for V1? | Yes, labelled "estimated" | Needs clinical confirmation |
| D-PTS / D-MPTA / D-mHKA | Landmark models and conventions (C-04/05/06) | Unchanged, reported | Yes (limitation) |

---

## H. Implementation status (end of Phase B, 2026-10-07)

| Area | Status |
|---|---|
| Patient header on all 4 pages | Done (Patient ID, age, sex, surgical side, procedure, plan state). Verified in browser. |
| Calibration | Per-scan scale; assisted marker finder (never auto-accepts) + two-click fallback; locking needs both scans verified. Verified in browser; the demo scan has no marker, so "none found" was the correct result. |
| Assessment (6 values, 13 points) | Preserved as built (D-A1). Continue locks the assessment (read-only, no unlock). Verified in browser. |
| Size-specific templates | Done: `implant_templates/` (tibial 1–6, femoral 1–8; AP view, lateral view, footprint). Engineering-derived, labelled generic. |
| Blue overlay + handles + loupe | Done on Tibial and Femoral, AP and lateral. Verified in browser. |
| Rotation | In-plane AP rotation ±15° (D-ROT). **Needs clinical confirmation.** |
| Fit engine | One canonical engine (`tkr_templates.ts`); coverage ≥90%, overhang ≤1.0 mm, caution >1.5 mm with the exact V1 wording; other rules tagged PROJECT_RULE / ENGINEERING_DERIVATION in `FIT_RULES`. Backend `planning.py` marked non-authoritative, not deleted. |
| Review + lock modal + V1 payload | Preserved; payload has exactly the V1 keys; no cuts/resections/gap data. Verified in browser. |
| VR transport | Not built (out of scope); the UI says so and shows no "transmitted" message. |

Open deviations are listed in the final report; none is hidden in this matrix.
