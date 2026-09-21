# Open Decisions

These items must be resolved before clinical production.

## 1. Final competency formula
The current examples do not establish a single formula that reproduces every displayed overall competency.

## 2. Criterion scoring
Define exactly how a measurement maps to criterion points.

Needed:
- target
- tolerance
- warning range
- severity
- point curve or pass/fail logic

## 3. Clinical tolerances
For each clinically meaningful parameter define acceptable, warning, major and critical ranges. Clinical approval is required.

## 4. Parameter conventions
Confirm units, sign conventions, planes, left/right conventions, coordinate system and rounding rules.

## 5. Procedure event vocabulary
Finalize stable event types from the actual VR implementation.

## 6. Case versioning
Confirm whether editing creates a new version. Historical attempts must remain tied to the version used.

## 7. Plan locking
**Resolved for V1**: A preoperative plan becomes immutable upon resident confirmation on Page 4 (Review & Send to VR). Sealing the plan creates an immutable snapshot with `versionId`, `sealedBy`, `sealedAt`, and formatting into the exact V1 VR Payload schema. Once sealed, all 2D editing on Assessment, Tibial, and Femoral pages is hard-locked into read-only mode. All intraoperative variables are deferred to VR.

## 8. Guidance policy
Define guidance for training, assessment, preview and any other modes.

## 9. Resident result visibility
Decide what assessment information a resident immediately sees.

## 10. Recommendation policy
Decide whether recommendations are advisory, instructor-approved, editable, automatic, or some combination.

## 11. VR artifact storage
Decide whether replay/video/3D artifacts are stored in object storage, on-device, or not stored.

## 12. Deployment constraints
Decide cloud/on-prem, institution network constraints, VR hardware, supported browsers, and offline behavior.

## 13. Clinical governance
Name product owner, clinical owner, assessment owner and release approver.

## Confirmed Current Model Updates (2026-09-15)

## 14. Confirmed current-model decisions

The following previously discussed product behaviors are now confirmed for the current model:
- TKR planning uses an interactive X-ray canvas.
- FLAP/KLAT are switchable views with preserved per-view work.
- Dependent measurements recalculate when landmarks move.
- HKA, mLDFA, mPTA and VCA are independently confirmed/edited.
- Numeric and landmark-based editing are both supported.
- Overrides retain original value, final value and reason.
- Femoral and tibial planning keep the established functions and show component fit on the X-ray.
- Review & Send retains the established summary content and transfers the locked plan to VR.
- Post-operative results are visible to both resident and instructor.
- Instructor feedback may target a specific mistake or step and remains available to the resident for subsequent practice.

All other open clinical decisions in this file remain open until explicitly resolved or clinically approved.

## 14. Authentication implementation

Authentication is an early implementation priority. Confirm the exact authentication provider and integration model before implementation is treated as final. This includes sign-in method, session/token handling, logout/revocation, password reset policy, account provisioning, and role/institution claims or lookup.

Supabase is confirmed as the project's database platform, but Supabase Auth has not been separately confirmed as the authentication provider.
