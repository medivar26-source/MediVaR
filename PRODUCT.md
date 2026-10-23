# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Learners and instructors carry **equal weight** (confirmed); administrators are secondary.

- **Learners (residents):** orthopaedic residents training in Total Knee Arthroplasty. At a desk, they plan an assigned case on the patient's X-rays, then perform it in the VR headset, then come back to review what they did against their own plan.
- **Instructors:** surgeon faculty. They build programs and cohorts, author and publish cases, assign training, schedule and run sessions, review attempts, give feedback and produce reports.
- **Administrators:** they manage institutions, accounts and access.

## Product Purpose

MediVeR-XR is a training loop for TKA residents. The web dashboard is where planning, assignment, review and progress tracking happen. The resident VR application is a separate product and is not in this repository.

The loop: the instructor configures a curriculum and cases → assigns training → the resident plans pre-operatively on X-rays → performs the procedure in VR → the assessment engine evaluates the execution → the instructor reviews it → a recommendation is generated → the resident practises again → progression is tracked.

Success means a resident's skill measurably improves across attempts, and every score can be traced back to the raw attempt that produced it.

## Positioning

*Confirmed.*

The resident's own confirmed pre-operative plan, made on real X-rays, is carried into VR. Their execution is then compared against that plan. Scoring is explainable and deterministic, and is never presented as an autonomous clinical judgement.

## Operating Context

- **The planning workspace:** the pre-op planner is an interactive X-ray canvas. FLAP and KLAT are switchable views within one planning session, and the steps run Assessment → Femoral → Tibial → Review.
- **Assistive, not automatic:** MediVeR calculates and suggests values; the resident confirms or edits each one.
- **Handover to VR:** a confirmed plan is transferred to the headset through a pairing PIN.
- **Sessions:** instructors schedule them and run them live, and a session has its own report.
- **Device expectations:** today the planner is desktop-only below 1024px, and other pages also open at phone width. Neither desktop-first planning nor phone support for other pages has been made a binding requirement; both are undecided.

## Capabilities and Constraints

**Roles and screens.** There are three roles: learner, instructor and admin, each with its own home and navigation. The areas are Programs, Sessions, Procedures/Cases, Pre-op Plans, the planner, Progress (one consolidated area), Reports, the Library and Help.

**Clinical vocabulary:**
- TKA (also written TKR)
- Femoral and tibial components
- Resection, alignment, varus/valgus, laterality
- Calibration marker, implant sizing

Missing case metadata is shown as "Not recorded" and never filled with a default value.

**Out of scope for the MVP:**
- Automated clinical decision-making
- Production patient-data workflows
- AI-based assessment
- EHR integration
- Autonomous certification

**Technical constraints:**
- Identity comes from the backend's `/auth/me` endpoint, which is authoritative.
- Institution-level data isolation.
- Historical assessment results are immutable.
- Scoring is deterministic: identical inputs give identical results.

**Undecided:**
- The scope of phone navigation.
- What the VR department report should contain.
- Persistent plans, attempts and reports (designed in `mediver_documentation/22_PERSISTENT_PLANS_ATTEMPTS_REPORTS_DESIGN.md`, not yet applied).

## Brand Commitments

- **Name:** MediVeR XR (MediVeR-XR in code).
- **Visual rule (confirmed, binding):** light theme only, one font, one accent colour.

## Evidence on Hand

- **Case imaging:** `images(cases)/`, including a right-knee calibration and implant-scaling validation set and a demo patient export.
- **Wireframes:** low-fidelity screen sketches in `wireframe/` (static HTML).
- **Font files:** Placard Next in `fonts/`. Whether it is a brand commitment is undecided; the shipped UI uses a single different face.
- **Specifications:** product, clinical-calculation, assessment and API specs in `mediver_documentation/`.

**Absent, and must not be fabricated:**
- Testimonials, customer or institution names
- Outcome statistics, clinical validation claims
- Certification or regulatory claims
- Real patient data

## Product Principles

1. **The learner's plan is the reference.** Every review compares what they did with what they decided, not with an abstract ideal.
2. **Explain every number.** A score, gauge or verdict must trace back to its rule and its raw measurement.
3. **Assist, never decide.** Suggested values are offered for confirmation; the interface never implies clinical authority.
4. **Clinical calm.** A training tool for surgeons should read as precise and quiet, not alarming or gamified. *(Inferred from the code's own note in `LiveDial.module.css`. Not adopted as a binding constraint; treat it as guidance.)*
5. **Never invent clinical facts.** Unknown values say so; nothing is defaulted silently.

## Accessibility & Inclusion

No product-specific standard has been established yet. The current UI honours `prefers-reduced-motion`.
