# MediVeR XR

Virtual-reality surgical simulation for Total Knee Replacement.

A learner plans a case at the desk, performs it in the headset, and reviews
what happened against their own plan. This repository holds the web side of
that: the dashboard people plan and review in.

## Where things are

```
dashboard/    the web app — Next.js, TypeScript
wireframe/    low-fidelity screen sketches, static HTML
```

## Running it

```sh
cd dashboard
npm install
npm run dev
```

Then open <http://localhost:3000>.

There is no service to point it at yet, so the screens render from a local
seed and nothing you type is kept. Sign-in accepts anything.

## State of play

Early. The planning flow, the case library, sessions and the report are
walkable end to end; teaching and analytics are partly there; several
addresses in the navigation still land on a placeholder. Nothing is wired to
a backend, and the headset side is not in this repository.

Treat the numbers on screen as scaffolding. They are shaped like the real
thing so the layouts can be judged, but no score here was computed.

## Notes

- One font, one accent colour, light theme only.
- Screens read through `src/lib/data`; nothing queries from a component.
- Writes all funnel through `src/app/actions` so there is one place to change
  when there is somewhere to write to.
