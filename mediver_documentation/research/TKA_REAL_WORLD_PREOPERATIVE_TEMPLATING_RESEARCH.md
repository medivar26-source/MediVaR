# Real-World Preoperative 2-D TKA Templating — Research for the MediVeR-XR V1 Planner

| | |
|---|---|
| **Date** | 2026-10-07 |
| **Purpose** | Improve the *implementation quality* of the V1 planner (template realism, interaction, terminology, calibration practice). |
| **Governing rule** | `Mediver User Planning Workflow V1.pdf` (v1.0.0) is the product contract. **Nothing in this document overrides it.** Where practice differs from the PDF, the PDF is preserved and the difference is recorded in §12/§13. |
| **Companion documents** | `V1_PLANNER_COMPLIANCE_MATRIX.md` · `PLANNER_REDESIGN_PROPOSAL.md` · `../MEDIVER_XR_CURRENT_STATE_AUDIT_2026-10-07.md` |

## How reliable is this research? (read first)

* Searches were run on 2026-10-07 with a general web-search tool; only open-access pages could be read. **No paywalled full texts were read.** Every source below is tagged **FETCHED** (the page was retrieved and summarised by the tool; I relied on the summary and have not re-verified against the PDF/HTML myself) or **SNIPPET** (only a search-result excerpt was seen; treat as unverified until read in full).
* Manufacturer implant CAD, proprietary UI and implant libraries were **not** accessed and **must not** be copied.
* Several figures come from other joints (THA calibration) or other imaging (CT); they are labelled where used.
* No clinical claim here has been reviewed by a clinician. Section 15 lists what needs approval.

---

## 1. Real-world 2-D TKA templating workflow

Conventional digital templating (TraumaCad, mediCAD, OrthoView and similar) proceeds as follows (sources S3, S4, S5, S6, S7, S14):

1. Acquire **standardised standing AP and lateral knee radiographs** with a radio-opaque scaling marker in the field. In one large TraumaCad series the AP required the patella centred between the condyles with the knee in full extension and the lateral was taken at roughly 120° flexion (S3, FETCHED).
2. **Calibrate** the image from the marker (typically a 25 mm ball) so on-screen distances are in millimetres (S3, S6).
3. **Measure / annotate** anatomy (axes, joint lines, bone widths and depths).
4. **Select an implant family and a template size** from a manufacturer library and overlay it, semi-transparently, on the radiograph. Libraries are large (≈4 000 implant families in TraumaCad, S4; "119 manufacturers and over 100 000 templates" claimed by mediCAD, S14 SNIPPET).
5. **Position** the template (translate, rotate), judge fit against the bone, and **store/print a plan** for the theatre.
6. Several vendors automate steps 2-4 (automatic marker recognition, auto landmark detection, auto template placement and size estimate — S4, S5 SNIPPET).

MediVeR V1 mirrors this skeleton: MEASURE (assessment) → SIZE (tibial/femoral templating) → SEND (lock and export), with the export being a VR payload rather than a theatre printout.

## 2. Imaging

* Standing long-leg AP (full-length, "FLAP") is the standard source for mechanical-axis analysis (hip centre → knee centre → ankle centre). Mechanical axis deviation (MAD) is the perpendicular distance between the knee centre and the line from femoral-head centre to ankle centre; in a neutral limb that line passes roughly 8 mm medial to the knee centre (S16 SNIPPET).
* Lateral knee radiograph ("KLAT") is the usual source for posterior tibial slope, anterior-posterior bone dimensions, and anterior-cortex relationships (S10, S11).
* **Positioning sensitivity.** PTS measured on lateral radiographs changes with tibial rotation: external rotation raised the measured slope by 0.7-3.4° and internal rotation lowered it by 1.6-4.1° (cadaver study, S11 FETCHED). Lateral-view measurements are therefore only as good as the radiograph's rotation.

## 3. Calibration

* The accepted clinical standard is a **spherical radio-opaque marker of known diameter (commonly 25 mm)**, ideally on an adjustable arm so it can be placed in the plane of the anatomy (S6 SNIPPET). Software measures the marker's on-screen diameter to derive magnification (S6, S7).
* **Placement error is the dominant weakness.** In a hip-templating context (S7 FETCHED) the marker-ball method showed mean magnification error of 8.4 % (range 5.2-12.5 %) and maxima up to 26.6 % because markers are often not in the bony plane. This is hip data; it shows the method's failure mode and should not be read as a measured knee error.
* A knee study compared a 25 mm marker "at the level of the joint" against a uniform 115 % default magnification (S8 SNIPPET) — i.e. the default-magnification alternative exists in practice and is *less* patient-specific.
* TraumaCad and OrthoView automatically recognise ball markers (S4 FETCHED, S6 SNIPPET).
* **Implication for MediVeR:** the V1 PDF's "markers are automatically detected" matches industry practice. A universal constant (e.g. 0.264 mm/px) is never a patient scale; it is only an example.

## 4. Tibial templating

* Tibial baseplates are sized chiefly on **mediolateral (ML)** and **anteroposterior (AP)** extent of the resected plateau. Oversizing in either direction is associated with worse outcomes: in a CT-based cohort, ML overhang was present in 61 % (81 % of women, 40 % of men) and patients with tibial oversizing had lower flexion (121° vs 124.7°) and smaller pain-score gains; the authors found no discrete threshold — the relationship was continuous (S9 FETCHED; single implant design; CT, not radiographs).
* "Cortical coverage" is an **axial (top-down) concept** — the fraction of the resected tibial rim covered by the baseplate. Plain AP and lateral radiographs show the cut level edge-on; they do **not** show the axial outline. Real 2-D templating therefore judges ML width, AP depth and the visible medial/lateral/anterior/posterior edge relationships, not area coverage.
* Template shape: a baseplate with an asymmetric (D-shaped) axial outline, a polyethylene insert above it, and a central stem/keel below; seen in AP the plate and insert present as a flat, slightly bevelled band over a tapering stem; seen laterally the posterior aspect typically has the posterior notch/cut-out and the insert shows the posterior-slope relationship. (General implant anatomy; no single source — this is an engineering description, not a measured geometry.)
* Positioning: translate to match the cut-level edges, rotate to match the plateau/MPTA line in the coronal view, and respect the slope in the sagittal view.

## 5. Femoral templating

* Femoral components are sized chiefly on **AP** dimension (anterior cortex to posterior condyles) measured on the lateral radiograph; ML width is then judged on the AP. Most designs tie ML to AP: "for a specific AP size one and only one ML size is available" (S10 FETCHED systematic review of 1 395 distal femora), producing 13-41 % underhang and 9-27 % overhang depending on the implant; ML mismatch > 3 mm was treated as clinically relevant and overhang ≥ 3 mm was associated with roughly doubled risk of knee pain at two years.
* **Anterior notching** — a defect in the anterior femoral cortex at the proximal edge of the anterior flange — is assessed on the **lateral** view as the distance between the anterior cortex line and the anterior cut line. Reported in 5.7 % of conventional and 16.7 % of navigated TKAs in one series, with mean depths ≈ 3 mm, and notches of ≥ 3 mm described as significantly reducing bone strength (S11b FETCHED; outcomes similar between groups). Anterior femoral bowing was a risk factor.
* Template shape: lateral view shows a J-shaped outer profile (anterior flange → anterior chamfer → distal condyle arc → posterior chamfer → posterior condyle arc); the AP view shows two condyles joined proximally by the trochlear flange, with a distal condylar outline wider on the lateral side. (General anatomy of CR femoral components; engineering description.)

## 6. Implant template representation

* Commercial systems store **vector template libraries per implant family and size**, with separate AP and lateral drawings and a defined reference origin/landmarks for placement (S4, S14 SNIPPET). Exact internal formats are proprietary and were not accessed.
* Good practice for an open implementation: scalable vector outlines in millimetre units with a documented origin, one geometry per **view**, size and geometry version, and explicit provenance (generic vs manufacturer-derived).

## 7. User interaction

Observed conventions (S4, S14 SNIPPET): semi-transparent overlay with adjustable image opacity; drag to translate; handle to rotate; numeric nudge; instant measurement read-out; auto-detected marker and landmarks with manual adjustment; printable plan. MediVeR V1's own prescriptions (drag centre handle, rotation handle, live FIT METRICS panel) are consistent with these.

## 8. Fit assessment

* Practitioners judge **ML overhang/underhang** (tibia and femur), **AP match** (femur), **posterolateral tibial overhang** (associated with pain: average 3.6 mm in patients with posterolateral pain — search-result excerpt of "Posterolateral overhang affects patient quality of life after total knee arthroplasty", SNIPPET, unverified), and **anterior flange relation to the anterior cortex** (notching).
* Thresholds in the literature are **not universal**: tibial overhang has no threshold in S9; femoral ML mismatch > 3 mm is a research definition (S10). The V1 PDF's own thresholds (≥ 90 % coverage, ≤ 1.0 mm overhang, caution > 1.5 mm) are **product rules**, not literature-derived values.

## 9. 2-D vs 3-D planning (and why V1 remains 2-D)

* Accuracy of 2-D digital templating (exact implant size): femoral 48 % / tibial 55 % in a 40-patient series (S1 FETCHED; "does not currently predict the correct size often enough to be of clinical benefit", although reproducible); 52 %/43 % exact and 92.7 %/88.7 % within ±1 size in 424 patients (S3 FETCHED); 44 % exact in a 10-patient *revision* series (S2 FETCHED); 3-D templating was reported as 96.6 %/93.1 % vs 2-D 52.9 %/28.7% in one comparison (S12 SNIPPET) and 2-D→3-D generated models improved tibial/femoral prediction (S15 SNIPPET).
* CT-based 3-D planning with robotic haptic boundaries (Stryker Mako, S13) is a different product class; V1 explicitly excludes CT-based 3-D planning and haptic boundaries.
* **Consequence for MediVeR:** the planner must present sizes as *planning estimates*, not predictions of the final implant, and the UI must not imply surgical-grade accuracy.

## 10. What MediVeR-XR can adopt (consistent with V1)

1. Semi-transparent vector overlay with size-specific geometry and a documented origin (PDF §Page 2 Step 3).
2. Separate **AP-view** and **lateral-view** template drawings per size (PDF assigns ML to FLAP and AP to KLAT).
3. Automatic ball-marker recognition **as an assisted proposal that the user must confirm** (PDF "automatically detected"); clear "verified / estimated" calibration state.
4. Template rotation **in the image plane** to align with the MPTA/plateau line (PDF Step 3).
5. Fit read-outs per view: ML overhang from the AP drawing; AP match and anterior-flange relationship from the lateral drawing.
6. Anterior-notching verification on the lateral view as distance between anterior cortex line and the flange's proximal edge (S11b).
7. Report every limitation in-product: 2-D only, rotation sensitivity (S11), marker-placement sensitivity (S7).

## 11. What MediVeR-XR must not adopt

* Any proprietary implant CAD, library, naming or UI.
* Manufacturer-specific claims ("fits Attune/Triathlon …"). The template must remain `GENERIC_TKA_TEMPLATE`.
* Literature thresholds (3 mm femoral mismatch etc.) as V1 clinical rules.
* Automatic size *recommendation* presented as clinical advice (the PDF only says "auto-highlights the best-matching size button").
* 3-D reconstruction, CT planning, bone-cut depths, slope setting, resection planes (V1 exclusions).
* The 25 mm marker "known size" as a constant for marker *diameter on screen* (it is the physical size; the scale is derived per image).

## 12. V1 compliance mapping (summary; full matrix in `V1_PLANNER_COMPLIANCE_MATRIX.md`)

| Real-world practice | V1 position | Resolution |
|---|---|---|
| Area "cortical coverage" is axial and not observable on radiographs | V1 requires "Cortical Coverage ≥ 90 %" via "polygon intersection between implant outer geometry and annotated bone border" | **Keep V1.** Compute from the best available defensible geometry and label the bone outline *estimated from ML and AP and the annotated border*; flag for clinical review (§15 C-02) |
| Rotation of a tibial tray is clinically defined in axial/sagittal planes (rotation relative to tibial tubercle/AP axis, slope in sagittal) | V1 "Rotational handle allows minor 2-D alignment with MPTA axis line" = in-plane (coronal) rotation of the AP overlay; payload has a single `rotation_deg` | **Keep V1** (in-plane rotation). Current code used axial rotation ±45°; this is a conflict to resolve in implementation (§15 C-03) |
| PTS usually referenced to proximal tibial anatomical axis or anterior cortex (S11) | V1: 2 points on the anterior cortex + 1 plateau tangent point | Aligns with S11 (anterior-cortex method). Code uses 4 points → conflict reported (matrix row A-07) |
| Calibration marker should lie in the bony plane | V1 requires calibration marker; Review shows a single calibration value | Keep V1; show per-view scale state and flag marker-placement risk |
| Practitioners use size ±1 as acceptable agreement | V1 auto-highlights one size | Keep V1; do not claim exactness |

## 13. Clinical assumptions

C-A1. A 25 mm sphere is the calibration object (PDF).  
C-A2. Marker is assumed to be in the bony plane of interest; the system cannot verify this (S7).  
C-A3. Operative side and patient identity are supplied by the case (PDF: "hard-coded for V1").  
C-A4. The surgeon's annotated edges are the bone boundary for fit purposes.

## 14. Engineering assumptions (all `ENGINEERING_DERIVATION`)

E-1. Implant dimension ladder (tibial 1-6, femoral 1-8) inherited from the existing code; size 3/size 4 numbers equal the PDF's *example* radiographic dimensions, and the intermediate sizes are interpolated. Not manufacturer-sourced.  
E-2. Template silhouettes (AP, lateral, axial footprint) are parametric generic shapes defined in millimetres from the size's AP and ML.  
E-3. Estimated axial bone outline = a normalised generic plateau/condylar contour scaled to the two annotated spans.  
E-4. Thresholds beyond the PDF's (85 % poor coverage; 0.5 mm notching limit; anterior/posterior overhang limits; plausibility windows) are project/engineering rules; they must be configurable and visibly classified.  
E-5. Calibration plausibility range 0.05-1.5 mm/px.

## 15. Clinical approval requirements

| ID | Item | Why |
|---|---|---|
| C-01 | Implant dimension tables and template shapes (or replacement by licensed/manufacturer data) | Currently engineering-derived |
| C-02 | Definition of "cortical coverage" and "annotated bone border" derivable from 2-D views | Radiographs do not show the axial footprint |
| C-03 | Meaning of `rotation_deg` (in-plane vs axial) and its sign convention | PDF vs prior implementation; payload has one scalar |
| C-04 | mHKA convention (included angle vs deviation from 180°) and varus/valgus sign | PDF text ambiguous |
| C-05 | PTS landmark model and reference axis | PDF 3-click vs project 4-point |
| C-06 | MPTA tibial-axis definition (two shaft points vs knee→ankle) | PDF vs code |
| C-07 | Femoral thresholds (AP/ML coverage, notching) | PDF gives examples only |
| C-08 | "BORDERLINE" tier and any threshold beyond the PDF | Not in V1 |
| C-09 | Marker auto-detection acceptance criteria and failure handling | Safety of the scale |
| C-10 | Disclosure wording that sizes are planning estimates (2-D accuracy limits) | S1-S3 |

## 16. Sources

Tags: **F** = FETCHED (summarised by tool), **S** = SNIPPET only.

| ID | Source | URL | Tag |
|---|---|---|---|
| S1 | Digital templating in TKR — *J Bone Joint Surg Br* 2009;91-B(7) (48 % femoral / 55 % tibial; good inter/intra-observer agreement) | https://boneandjoint.org.uk/Article/10.1302/0301-620X.91B7.21476 | F |
| S2 | Pre-operative templating in revision TKA (n = 10; ball marker 2.54 cm; exact 44 %) | https://pmc.ncbi.nlm.nih.gov/articles/PMC4174261 | F |
| S3 | Consistently high accuracy of digital 2-D templating in TKA across training levels (n = 424, TraumaCad, 25 mm marker) | https://pmc.ncbi.nlm.nih.gov/articles/PMC12772012/ | F |
| S4 | Brainlab digital templating (marker recognition; ≈4 000 implant families) | https://www.brainlab.com/surgery-products/orthopedic-surgery-products/digital-templating | F |
| S5 | Brainlab press release — Auto-Knee automation (landmarks, AP resection lines, template positioning/size estimate) | https://www.brainlab.com/press-releases-landingpage/brainlab-increases-automation-orthopedic-digital-templating/ | S |
| S6 | Materialise OrthoView — image scaling (one-click marker detection; 25 mm ball on flexible arm) | https://reseller.materialise.com/en/medical/materialise-orthoview/customer-support-login/image-scaling | S |
| S7 | Bi-planar radiograph calibration (THA context; marker-ball mean error 8.4 %, max 26.6 %) | https://pmc.ncbi.nlm.nih.gov/articles/PMC9876910 | F |
| S8 | TKA digital templating magnification methods (25 mm marker vs 115 % default) | https://cdn.mdedge.com/files/s3fs-public/Document/September-2017/041110510.pdf | S |
| S9 | Oversizing the tibial component in TKA (CT; 61 % ML overhang; flexion 121° vs 124.7°) | https://pmc.ncbi.nlm.nih.gov/articles/PMC3777155 | F |
| S10 | Femoral component fit — systematic review (1 395 femora; 13-41 % underhang, 9-27 % overhang; > 3 mm ML mismatch) | https://pmc.ncbi.nlm.nih.gov/articles/PMC10086082/ | F |
| S11 | PTS measurement on lateral radiographs — reference axes and rotation (cadaver, n = 8) | https://pmc.ncbi.nlm.nih.gov/articles/PMC11632255/ | F |
| S11b | Anterior femoral notching conventional vs navigated TKA (5.7 % vs 16.7 %) | https://pmc.ncbi.nlm.nih.gov/articles/PMC4515463 | F |
| S12 | 2-D vs 3-D templating in TKA (femoral 52.9 %/96.6 %, tibial 28.7 %/93.1 %) | https://read.qxmd.com/read/26765862/2d-versus-3d-templating-in-total-knee-arthroplasty | S |
| S13 | Stryker Mako SmartRobotics overview (3-D CT planning, haptic boundaries) | https://www.stryker.com/br/en/joint-replacement/systems/Mako_SmartRobotics_Overview.html | S |
| S14 | mediCAD 2-D Classic (implant database size; image opacity) | https://medicad.eu/produkte/2d-classic/?lang=en | S |
| S15 | Increased accuracy in templating for TKA using 3-D models generated from radiographs | https://scholarlycommons.henryford.com/orthopaedics_articles/395 | S |
| S16 | MAD definition and normal offset (search-result excerpt; secondary) | https://pmc.ncbi.nlm.nih.gov/articles/PMC5106474 | S |
| S17 | Mechanical axis / joint-orientation normal values (mLDFA 87° [85-90°], MPTA 87° [85-90°]) — **educational secondary source**, not Paley's original | https://hutaifortho.com/en/abos-part-i-comprehensive-review-batch-72-1/ | S |

*No source in this list contains MediVeR-specific information; the V1 PDF is the only MediVeR authority.*
