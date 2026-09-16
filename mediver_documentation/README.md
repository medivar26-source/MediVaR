# Mediver Documentation Pack

Mediver is a medical VR training and assessment platform for Total Knee Arthroplasty (TKA) residency training.

This documentation pack is the shared source-of-truth for the product requirements, architecture, data model, API contracts, TKA planning, assessment, VR integration, security, testing, deployment, seed/demo content, open decisions, and definition of done.

## Documentation map

| File | Purpose |
|---|---|
| 01_PRODUCT_VISION.md | Product purpose, users, scope, MVP boundary |
| 02_REQUIREMENTS.md | Functional and non-functional requirements |
| 03_USER_JOURNEYS.md | End-to-end instructor and resident journeys |
| 04_UI_AND_NAVIGATION.md | Information architecture and screen behavior |
| 05_SYSTEM_ARCHITECTURE.md | Frontend, backend, Supabase/Postgres, assessment, VR and real-time architecture |
| 06_DATABASE_SCHEMA.md | Relational data model, relationships, constraints and indexing |
| 07_API_CONTRACTS.md | REST/API resources and VR/backend contract |
| 08_ASSESSMENT_ENGINE.md | Assessment lifecycle, scoring architecture, errors and recommendations |
| 09_TKA_PLANNING_AND_CLINICAL_DATA.md | TKA planning workflow and clinical data |
| 10_VR_INTEGRATION.md | VR event model, attempt lifecycle and synchronization |
| 11_REPORTING_ANALYTICS.md | Resident, cohort, case and skill analytics |
| 12_SECURITY_AUDIT_AND_COMPLIANCE.md | Authentication, authorization, audit and clinical-safety controls |
| 13_TESTING_STRATEGY.md | Unit, integration, E2E, VR integration and clinical validation |
| 14_DEPLOYMENT_AND_OPERATIONS.md | Environment, Supabase/database operations, observability and rollout |
| 17_SEED_DATA_AND_DEMO.md | Demo data and deterministic scenarios |
| 18_OPEN_DECISIONS.md | Questions that remain unresolved |
| 19_DEFINITION_OF_DONE.md | Completion and production gates |
| 20_CLINICAL_AND_ASSESSMENT_CALCULATIONS.md | Calculation and assessment specification |

## Team ownership

All three developers work from the same GitHub repository and the same documentation set.

### Person 1 — Database + Backend
- Supabase/PostgreSQL data layer, migrations, constraints, indexes and seed/update paths
- FastAPI/backend services, APIs, domain logic and persistence
- Authentication/authorization backend integration
- Assessment, reporting, VR contracts and TKA planning backend logic

### Person 2 — Resident/Learner Frontend
- Resident dashboard and learner navigation
- Resident cases, assigned sessions, planning, review and feedback views
- Interactive X-ray planning UI and learner interactions
- Resident-facing integration with backend APIs

### Person 3 — Instructor Frontend
- Instructor dashboard and instructor navigation
- Programs, cohorts, residents, assignments and session-management UI
- Instructor attempt review, feedback/corrections and reporting UI
- Instructor-facing integration with backend APIs

## Current technology direction

- Frontend: React + Next.js + TypeScript
- Backend: FastAPI / Python
- Database platform: Supabase, using PostgreSQL as the project database
- Real-time communication: WebSocket where required by live session functionality
- VR application: Unity or the selected VR stack defined by the VR integration contract
- Repository/deployment workflow: shared GitHub repository with containerized application services as required

Supabase provides a full PostgreSQL database and can integrate authentication, storage, realtime and other platform services. The project currently adopts Supabase as the database platform; the exact authentication provider/configuration remains an explicit implementation decision unless separately confirmed.

## Important source boundary

The supplied materials establish the TKA planning workflow, instructor application structure, resident learning loop, and example data. The implementation should preserve those concepts.

Clinical values, tolerances, score formulas, implant sizing rules and safety rules that are not explicitly defined in the source material must remain configurable or be marked as pending clinical approval. The application must not invent medical rules.

## Implementation planning status

A phase plan is intentionally **not included in this documentation package at this time**. The implementation order is being reconsidered, and authentication is intended to be addressed before the database/schema build sequence. The team will define and maintain the implementation order separately.

## Confirmed current model updates

- TKR pre-operative planning is performed on an interactive X-ray canvas.
- FLAP and KLAT remain switchable views with preserved per-view landmarks and measurements.
- Dependent measurements recalculate in real time when landmarks move.
- HKA, mLDFA, mPTA and VCA are independently confirmed/edited.
- Numeric and landmark-based editing are both supported, with original value, edited value and override reason retained.
- Femoral and tibial planning retain the established functions and visual implant overlays while using the existing MediVeR visual language.
- Review & Send retains the established summary content and transfers the locked plan to VR.
- After VR, MediVeR returns to post-operative review showing plan vs execution, match/adherence, deviations and mistakes. Both resident and instructor can view results.
- Instructors can attach corrections/comments to specific mistakes or procedural steps, and residents can revisit that feedback before a later practice attempt.
