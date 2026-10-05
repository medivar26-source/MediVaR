# MediVeR XR

Virtual-reality surgical simulation for Total Knee Replacement.

A learner plans a case at the desk, performs it in the headset, and reviews
what happened against their own plan. This repository holds the web side of
that: the dashboard people plan and review in.

## Where things are

```
dashboard/              the web app: Next.js, TypeScript
backend/                the API: FastAPI + Supabase (auth, storage, Postgres)
backend/migrations/     SQL migrations, applied in order
mediver_documentation/  product, API and clinical specs
wireframe/              low-fidelity screen sketches, static HTML
```

## Running it

```sh
cp .env.example .env            # fill in your Supabase values
cd backend && pip install -r requirements.txt && uvicorn main:app --reload
# in another terminal
cd dashboard && npm install && npm run dev
```

Then open <http://localhost:3000>. Sign-in is real (Supabase Auth through the backend).
Note that the backend reads `.env` from the repo root, so running it locally talks to
whichever Supabase project that file points at.

Tests: `cd dashboard && npm test` (planning geometry, calibration, case authoring).
Type-check: `npm run typecheck`.

## State of play

Accounts, programs, cohorts, sessions scheduling, the case library and personal cases are
backed by the API. Still on local seed data: parts of the performance, learners, sessions
and dashboard screens. Planning work (`/plan/...`) is held in server memory and is lost on
restart. Instructor presets, procedure steps, assessment criteria and headset pairing are
not built. The headset side is not in this repository.

## Notes

- One font, one accent colour, light theme only.
- Screens read through `src/lib/data`; nothing queries from a component.
- Writes funnel through `src/app/actions`.
