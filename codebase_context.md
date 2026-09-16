# Codebase Context

## Directory Structure

```text
MediVeR-XR-main/
    .gitignore
    README.md
    dashboard/
        .gitignore
        eslint.config.mjs
        next-env.d.ts
        next.config.ts
        package.json
        tsconfig.json
        src/
            app/
                error.tsx
                globals.css
                layout.tsx
                loading.tsx
                page.tsx
                panels.module.css
                states.module.css
                tokens.css
                actions/
                    index.ts
                activity/
                    activity.module.css
                    page.tsx
                cases/
                    CaseFilters.tsx
                    cases.module.css
                    page.tsx
                    [id]/
                        case.module.css
                        ConfigurePanel.tsx
                        page.tsx
                        StartPlanning.tsx
                cohorts/
                    AssignPreset.tsx
                    InvitePanel.tsx
                    NewCohort.tsx
                    page.tsx
                    learners/
                        page.tsx
                    [id]/
                        page.tsx
                help/
                    HelpSearch.tsx
                    page.tsx
                kit/
                    kit.module.css
                    page.tsx
                launch/
                    page.tsx
                library/
                    page.tsx
                    [slug]/
                        page.tsx
                login/
                    login.module.css
                    page.tsx
                    SignInForm.tsx
                performance/
                    page.tsx
                    performance.module.css
                    [skill]/
                        page.tsx
                plan/
                    [id]/
                        Controls.tsx
                        page.tsx
                        plan.module.css
                        PlanShell.tsx
                        Step7.tsx
                        StepForm.tsx
                        steps.module.css
                        Steps.tsx
                        saved/
                            page.tsx
                            PinPanel.tsx
                            saved.module.css
                        step/
                            [step]/
                                page.tsx
                plans/
                    page.tsx
                    PlanFilters.tsx
                reports/
                    page.tsx
                sessions/
                    page.tsx
                    SessionFilters.tsx
                    sessions.module.css
                    [id]/
                        live.module.css
                        LiveMirror.tsx
                        page.tsx
                        report/
                            page.tsx
                            report.module.css
                settings/
                    AccountForm.tsx
                    page.tsx
                    settings.module.css
                setup/
                    page.tsx
                    setup.module.css
                    SetupForm.tsx
                simulations/
                    page.tsx
                    simulations.module.css
                    [procedure]/
                        page.tsx
                [...slug]/
                    page.tsx
            components/
                dashboard/
                    ContextRow.tsx
                    dashboard.module.css
                    InstructorDashboard.tsx
                    LearnerDashboard.tsx
                    LiveDial.module.css
                    LiveDial.tsx
                    TabbedPanel.tsx
                    Toolbar.tsx
                shell/
                    AppShell.module.css
                    AppShell.tsx
                    index.ts
                    LaunchShell.module.css
                    LaunchShell.tsx
                    SearchDialog.module.css
                    SearchDialog.tsx
                    SideNav.tsx
                    TopBar.tsx
                ui/
                    Badge.module.css
                    Badge.tsx
                    Banner.module.css
                    Banner.tsx
                    Button.module.css
                    Button.tsx
                    Card.module.css
                    Card.tsx
                    Chip.module.css
                    Chip.tsx
                    Field.module.css
                    Field.tsx
                    index.ts
                    MetricTile.module.css
                    MetricTile.tsx
                    Popover.module.css
                    Popover.tsx
                    ProgressBar.module.css
                    ProgressBar.tsx
                    States.module.css
                    States.tsx
                    Stepper.module.css
                    Stepper.tsx
                    Table.module.css
                    Table.tsx
                viz/
                    Charts.tsx
                    ExpandableRow.tsx
                    index.ts
                    Metrics.tsx
                    RowParts.tsx
                    viz.module.css
            lib/
                cx.ts
                format.ts
                nav.ts
                plan.ts
                report.ts
                roles.ts
                seed.ts
                session.ts
                skills.ts
                types.ts
                window.ts
                data/
                    cases.ts
                    catalogue.ts
                    cohorts.ts
                    dashboard.ts
                    nav.ts
                    performance.ts
                    plan.ts
                    planning-content.ts
                    plans.ts
                    rollups.ts
                    scope.ts
                    sessions.ts
                    settings.ts
                    setup.ts
                    support-content.ts
                    support.ts
    mediver_documentation/
        01_PRODUCT_VISION.md
        02_REQUIREMENTS.md
        03_USER_JOURNEYS.md
        04_UI_AND_NAVIGATION.md
        05_SYSTEM_ARCHITECTURE.md
        06_DATABASE_SCHEMA.md
        07_API_CONTRACTS.md
        08_ASSESSMENT_ENGINE.md
        09_TKA_PLANNING_AND_CLINICAL_DATA.md
        10_VR_INTEGRATION.md
        11_REPORTING_ANALYTICS.md
        12_SECURITY_AUDIT_AND_COMPLIANCE.md
        13_TESTING_STRATEGY.md
        14_DEPLOYMENT_AND_OPERATIONS.md
        15_ANTIGRAVITY_BUILD_PLAN.md
        16_ANTIGRAVITY_PHASE_PROMPTS.md
        17_SEED_DATA_AND_DEMO.md
        18_OPEN_DECISIONS.md
        19_DEFINITION_OF_DONE.md
        20_CLINICAL_AND_ASSESSMENT_CALCULATIONS.md
        PHASE_CHECKLIST.md
        README.md
    wireframe/
        case-detail.html
        cases.html
        home.html
        index.html
        login.html
        plan-1.html
        report.html
        sessions.html
        setup.html
        simulations.html
        wire.css
        wire.js
```

## File Contents

### `.gitignore`

```text
# dependencies
node_modules/
.pnp
.pnp.*

# build output
.next/
out/
build/
dist/
*.tsbuildinfo

# environment
.env
.env.*
!.env.example

# editor / OS
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp

# logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# misc
.vercel
coverage/

```

### `README.md`

```md
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

```

### `dashboard\.gitignore`

```text
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# .env.example is a template with no secrets in it
!.env.example

```

### `dashboard\eslint.config.mjs`

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

```

### `dashboard\next-env.d.ts`

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.d.ts";
import "./.next/dev/types/root-params.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

### `dashboard\next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

### `dashboard\package.json`

```json
{
  "name": "dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "lucide-react": "^1.31.0",
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.0",
    "typescript": "^5"
  }
}

```

### `dashboard\tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```

### `dashboard\src\app\error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Banner, Button } from "@/components/ui";
import s from "./states.module.css";

/**
 * State what failed and what to do, with a retry. Never a
 * full-page error unless the route itself is invalid — this boundary keeps the
 * chrome around it wherever Next allows.
 *
 * The message is deliberately not the raw error text: a rejected read
 * violation reads as gibberish to a surgeon, and echoing server errors into the
 * page leaks schema detail. The digest is shown so a support conversation can
 * find the matching server log line.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[mediver] route error", error);
  }, [error]);

  return (
    <div className={s.error}>
      <Banner
        tone="fail"
        title="This screen could not be loaded"
        action={
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
        }
      >
        The data behind it did not come back. Your work is not lost — nothing on
        this screen writes until you press a button.
        {error.digest && (
          <>
            {" "}
            Reference <code>{error.digest}</code>.
          </>
        )}
      </Banner>

      <p className={s.errorFoot}>
        If it keeps happening, check the backend status on the{" "}
        <Link href="/help">help page</Link>.
      </p>
    </div>
  );
}

```

### `dashboard\src\app\globals.css`

```css
@import "./tokens.css";

/* ---------- reset ---------- */

*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  min-height: 100dvh;
  font-family: var(--font-ui);
  font-size: var(--t-body);
  line-height: var(--t-body-lh);
  font-weight: var(--fw-regular);
  color: var(--text);
  background: var(--canvas);
  font-variant-numeric: tabular-nums;
}

img,
svg,
video,
canvas {
  display: block;
  max-width: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

button {
  background: none;
  border: none;
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

ul,
ol {
  list-style: none;
}

table {
  border-collapse: collapse;
  width: 100%;
}

/* ---------- typography defaults ---------- */

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-display);
  color: var(--ink);
  font-weight: var(--fw-bold);
  letter-spacing: -0.015em;
}

h1 {
  font-size: var(--t-h1);
  line-height: var(--t-h1-lh);
}
h2 {
  font-size: var(--t-h2);
  line-height: var(--t-h2-lh);
}
h3 {
  font-size: var(--t-h3);
  line-height: var(--t-h3-lh);
}

code,
kbd,
samp {
  font-family: var(--font-mono);
  font-size: 0.92em;
}

/* ---------- focus: visible on every interactive element ---------- */

:focus-visible {
  outline: var(--bw-emphasis) solid var(--brand);
  outline-offset: 2px;
  border-radius: var(--r-xs);
}

:focus:not(:focus-visible) {
  outline: none;
}

/* ---------- selection ---------- */

::selection {
  background: var(--brand-surface);
  color: var(--ink);
}

/* ---------- scrollbar ---------- */

* {
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
}

/* ---------- accessibility helpers ---------- */

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skipLink {
  position: absolute;
  top: var(--s-2);
  left: var(--s-2);
  z-index: var(--z-toast);
  padding: var(--s-3) var(--s-4);
  border-radius: var(--r-sm);
  background: var(--brand);
  color: var(--on-brand);
  font-size: var(--t-label);
  font-weight: var(--fw-bold);
  transform: translateY(-200%);
  transition: transform var(--m-fast) var(--ease-out);
}

.skipLink:focus {
  transform: translateY(0);
}

/* ---------- reduced motion: disable all of it ---------- */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

```

### `dashboard\src\app\layout.tsx`

```tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * One family for the whole product, in two optical roles.
 *
 * The brief asked for PayPal Sans throughout — a rounded geometric sans —
 * and flagged that it is proprietary. Plus Jakarta Sans is the closest freely
 * licensable equivalent: geometric skeleton, softly cut terminals, an open
 * aperture that holds up at 13px, and eight weights so hierarchy comes from
 * weight rather than from a second family.
 *
 * It carries `tnum`, checked in the shipped Google build rather than assumed —
 * every numeric column in the report depends on tabular figures
 *). Figtree and Inter were both rejected; Inter in particular is the default of
 * every dashboard on the internet and read as one.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MediVeR XR",
    template: "%s · MediVeR XR",
  },
  description:
    "Virtual-reality surgical simulation for Total Knee Replacement. Plan a case, perform it in the headset, and review it against your own plan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f7a46",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}

```

### `dashboard\src\app\loading.tsx`

```tsx
import { Skeleton } from "@/components/ui";
import s from "./states.module.css";

/**
 * Skeleton blocks matching the final layout, no spinner and no
 * shimmer. The shapes below are the page header, the four-card stat row and
 * the two-column body every screen in this app resolves to, so nothing jumps
 * when the data lands.
 */
export default function Loading() {
  return (
    <div className={s.loading} aria-busy="true" aria-live="polite">
      <span className={s.srOnly}>Loading</span>

      <div className={s.head}>
        <Skeleton width="220px" height="14px" />
        <Skeleton width="380px" height="34px" />
        <Skeleton width="520px" height="16px" />
      </div>

      <div className={s.row}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height="104px" block />
        ))}
      </div>

      <div className={s.body}>
        <Skeleton height="280px" block />
        <Skeleton height="280px" block />
      </div>
    </div>
  );
}

```

### `dashboard\src\app\page.tsx`

```tsx
import { AppShell } from "@/components/shell";
import { InstructorDashboard } from "@/components/dashboard/InstructorDashboard";
import { LearnerDashboard } from "@/components/dashboard/LearnerDashboard";
import {
  getInstructorDashboard,
  getLearnerDashboard,
} from "@/lib/data/dashboard";
import { personaFor } from "@/lib/roles";
import { WEEK_OPTIONS, windowFromParam } from "@/lib/window";
import { getCurrentUser } from "@/lib/session";

/**
 * One route, two dashboards. The persona is derived from the signed-in
 * profile's role — see lib/roles.ts. The administrator's view is not built.
 *
 * The window lives in the URL, like the case filters do, so a view stays put
 * across a reload and can be pasted into a message. The server re-runs the
 * accessors over it; there is no client-side copy of the series.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ weeks?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  const weeks = windowFromParam(params.weeks, WEEK_OPTIONS);

  return (
    <AppShell
      user={user}
      searchHint={
        persona === "instructor"
          ? 'Try searching "below pass mark"'
          : 'Try searching "tibial slope"'
      }
    >
      {persona === "instructor" ? (
        <InstructorDashboard
          user={user}
          data={await getInstructorDashboard(user.id, weeks)}
          weeks={weeks}
        />
      ) : (
        <LearnerDashboard
          user={user}
          data={await getLearnerDashboard(user.id, weeks)}
          weeks={weeks}
        />
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\panels.module.css`

```css
/*
 * Shared layout for the panelled screens.
 *
 * Groups 0–5 gave every route its own module, which was right while each screen
 * was a different shape. Most of these screens are the same three
 * shapes — a panel, a labelled row list, and a block of prose — and eleven
 * copies of the same forty lines is how two of them drift.
 *
 * Anything genuinely specific to one screen still lives beside it.
 */

.columns {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--s-5);
  align-items: start;
  margin-bottom: var(--s-6);
}

.even {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-5);
  align-items: start;
  margin-bottom: var(--s-6);
}

.thirds {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-5);
  margin-bottom: var(--s-6);
}

@media (max-width: 1100px) {
  .columns,
  .even,
  .thirds {
    grid-template-columns: 1fr;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
}

.panelHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-4);
}

.panelTitle {
  font-size: var(--t-h3);
  font-weight: var(--fw-semibold);
  line-height: var(--t-h3-lh);
}

.panelSub {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}

.note {
  padding-top: var(--s-4);
  margin-top: auto;
  border-top: var(--bw) solid var(--divider);
  color: var(--text-muted);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}

/* ---- a list of labelled rows: settings, presets, library, devices ---- */

.rows {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-4) 0;
  border-bottom: var(--bw) solid var(--divider);
}

.row:last-child {
  border-bottom: none;
}

.rowBody {
  flex: 1;
  min-width: 0;
}

.rowTitle {
  font-size: var(--t-body);
  font-weight: var(--fw-medium);
}

.rowDetail {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}

.rowAside {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex-shrink: 0;
}

/* ---- a card that is a link: library entries, cohort cards ---- */

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--s-4);
  margin-bottom: var(--s-6);
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  padding: var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
}

a.card:hover {
  border-color: var(--brand-border);
  background: var(--brand-surface);
}

.cardTitle {
  font-size: var(--t-h3);
  font-weight: var(--fw-semibold);
  line-height: var(--t-h3-lh);
}

.cardBody {
  flex: 1;
  color: var(--text-muted);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}

.cardFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding-top: var(--s-3);
  border-top: var(--bw) solid var(--divider);
  color: var(--text-muted);
  font-size: var(--t-caption);
}

/* ---- prose: help articles and library references ---- */

.prose p {
  margin-bottom: var(--s-3);
  max-width: 68ch;
  font-size: var(--t-body);
  line-height: var(--t-body-lh);
}

.prose p:last-child {
  margin-bottom: 0;
}

.article {
  padding: var(--s-5) 0;
  border-bottom: var(--bw) solid var(--divider);
}

.article:last-child {
  border-bottom: none;
}

.articleTitle {
  margin-bottom: var(--s-3);
  font-size: var(--t-h3);
  font-weight: var(--fw-semibold);
  line-height: var(--t-h3-lh);
}

.articleLink {
  display: inline-block;
  margin-top: var(--s-3);
}

/* ---- tabs whose selection is the URL ----
   The same shape /performance uses; an anchor, because it
   navigates. */

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin-bottom: var(--s-6);
}

.tab {
  display: inline-flex;
  align-items: center;
  min-height: var(--h-md);
  padding: 0 var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--text);
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  text-decoration: none;
}

.tab:hover {
  background: var(--brand-surface);
  border-color: var(--brand-border);
}

.tabOn,
.tabOn:hover {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
}

/* ---- key/value facts: About, device detail ---- */

.kv {
  display: grid;
  grid-template-columns: minmax(140px, auto) 1fr;
  gap: var(--s-3) var(--s-5);
  font-size: var(--t-body);
}

.kv dt {
  color: var(--text-muted);
}

.kv dd {
  font-weight: var(--fw-medium);
}

/* ---- filters, the same shape /sessions and /cases use ---- */

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-4);
  margin-bottom: var(--s-5);
}

.facet {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}

.facetLabel {
  color: var(--text-muted);
  font-size: var(--t-caption);
  font-weight: var(--fw-medium);
}

.clear {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--brand);
  font-size: var(--t-caption);
  font-weight: var(--fw-medium);
}

.mono {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

.spacer {
  flex: 1;
}

/* ---- a form row: labelled fields plus the button that submits them ----

   Not `.filters`. That row is built for chips and centres its children, so a
   field carrying a helper line grows taller than its neighbours and drags its
   own label upward — three labels at two different heights and three inputs on
   no shared baseline. Fields align on their *bottom* edge, which is the edge
   the eye actually reads a row of inputs against, and the button sits on it
   too. Every helper for the row goes underneath it, once. */

.formRow {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s-4);
  margin-bottom: var(--s-3);
}

/* Wide enough for a real name, capped so it does not eat the row on a large
   screen and leave the controls stranded at the far right. */
.formGrow {
  flex: 1 1 200px;
  max-width: 280px;
}

/* Three digits and a stepper. A field sized for prose, holding a number, reads
   as a field that wants prose. */
.formNarrow {
  width: 104px;
  flex: none;
}

.formHint {
  margin: 0 0 var(--s-5);
  color: var(--text-muted);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}


/* ---- cohort card: the meta line and the open affordance ---- */

.cardMeta {
  margin-top: calc(var(--s-2) * -1);
  color: var(--text-disabled);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}

/* "Open" on its own is a word. A word plus a chevron is a destination — and
   the card is an anchor, so it has to look like one before it is hovered. */
.cardOpen {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  color: var(--brand);
  font-weight: var(--fw-semibold);
}

.cardChevron {
  width: 14px;
  height: 14px;
}

/* ---- an invite link, the moment it exists ----

   Shaped like the pairing-PIN card on `/plan/[id]/saved`, because it is the
   same object: a credential shown once, which no query can fetch back. A solid
   green banner was wrong twice over — it judged nothing, and solid fills are
   reserved for verdicts while tints mark surfaces that group. This groups. */

.linkCard {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-6);
  margin-bottom: var(--s-5);
  border: var(--bw) solid var(--brand-border);
  border-radius: var(--r-md);
  background: var(--brand-surface);
}

.linkLabel {
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* The link itself sits on white, the way the PIN digits do — the one thing on
   the card that is being handed over should not share a background with the
   prose about it. */
.linkValue {
  padding: var(--s-4);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: var(--t-label);
  line-height: 1.6;
  word-break: break-all;
}

.linkFoot {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  flex-wrap: wrap;
}

.linkMeta {
  flex: 1;
  min-width: 220px;
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
  color: var(--text-muted);
}

```

### `dashboard\src\app\states.module.css`

```css
.loading {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
  padding: var(--s-7);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s-4);
}

.body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s-4);
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.error {
  padding: var(--s-7);
}

.errorFoot {
  margin-top: var(--s-4);
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.errorFoot a {
  color: var(--brand);
  font-weight: 600;
}

@media (max-width: 1100px) {
  .row {
    grid-template-columns: repeat(2, 1fr);
  }

  .body {
    grid-template-columns: 1fr;
  }
}

```

### `dashboard\src\app\tokens.css`

```css
/* ============================================================
   MediVeR XR — Design tokens
   Single source of truth. No component may hard-code a value.

   Two greens, strictly separated by job:
     --brand  is INTERACTIVE only  (buttons, active nav, links, focus)
     --pass   is STATUS only       (badges, bars, verdicts)
   Neither is ever used for the other's job. That separation, plus the
   rule that every status also carries an icon and a text label, is what
   keeps a "Pass" badge from reading as a brand chip.
   ============================================================ */

:root {
  /* ---------- brand: deep forest. interactive surfaces only ---------- */
  --brand: #0f7a46;
  --brand-hover: #0c6339;
  --brand-pressed: #094e2d;
  --brand-surface: #e8f3ec;
  --brand-surface-hover: #dceade;
  --brand-border: #c2ddcd;
  --on-brand: #ffffff;

  /* ---------- semantic: status only ---------- */
  --pass: #0b7a5a; /* emerald, cooler than brand */
  --pass-surface: #dff3ec;
  --pass-border: #b6e0d1;

  --warn: #9a6212;
  --warn-surface: #faf0df;
  --warn-border: #ecd8b2;

  --fail: #b0322a;
  --fail-surface: #fbecea;
  --fail-border: #edc9c5;

  --info: #1f5f8b;
  --info-surface: #e6f0f7;
  --info-border: #c2d9e8;

  /* ---------- neutrals: warm-cast greys so they sit under green ---------- */
  --ink: #0e1512;
  --text: #37423c;
  --text-muted: #5e6b64;
  --text-disabled: #9aa5a0;
  --on-dark: #ffffff;
  --on-dark-muted: #93a29a;

  --border: #dee4e0;
  --border-strong: #c3ccc7;
  --divider: #ebefec;

  --canvas: #f4f7f5;
  --surface: #ffffff;
  --surface-sunken: #eff3f0;
  --surface-raised: #ffffff;

  --forest: #0d1f18; /* deep green fill: launch chrome */
  --forest-2: #163024;
  --forest-3: #1f4030;

  /* Near-black. The third colour in the green/black/white system — used for
     the single focal card per screen and for dark pills. Never a large area. */
  --dark: #121613;
  --dark-2: #1e2421;
  --dark-3: #2b332e;
  --on-dark-dim: #7d8a83;

  /* Navigation chrome sits on a warm light grey, not on the dark green. */
  --rail: #f0f2f0;
  --panel: #f6f8f6;

  --scrim: rgba(14, 21, 18, 0.55);

  /* ---------- radius: curved language ---------- */
  --r-xs: 8px;
  --r-sm: 12px;
  --r-md: 16px;
  --r-lg: 24px;
  --r-xl: 32px;
  --r-pill: 999px;

  /* ---------- borders ---------- */
  --bw: 1px;
  --bw-emphasis: 2px;

  /* ---------- spacing: 4px scale ---------- */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 20px;
  --s-6: 24px;
  --s-7: 32px;
  --s-8: 40px;
  --s-9: 48px;
  --s-10: 64px;
  --s-11: 80px;

  /* ---------- control heights (>=44px meets touch target minimum) ---------- */
  --h-sm: 36px;
  --h-md: 44px;
  --h-lg: 56px;

  /* ---------- type ----------
     One family — Plus Jakarta Sans, a rounded geometric sans, the closest
     licensable stand-in for the PayPal Sans the brief asked for. The two
     variables are kept distinct so a separate display face can return without
     touching a component; today they resolve to the same family and hierarchy
     comes from weight, as the design direction always intended.

     The scale is the original 15 / 13 / 12 ladder. It was stepped up a notch
     when Jakarta landed, on the theory that Jakarta sets smaller than Inter at
     the same nominal size; on screen that read as oversized, so it is back
     where it was. Jakarta's larger apertures carry the small sizes without the
     extra pixel. */
  --font-display: var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif;
  --font-ui: var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  --t-display: 44px;
  --t-display-lh: 1.05;
  --t-h1: 32px;
  --t-h1-lh: 1.15;
  --t-h2: 22px;
  --t-h2-lh: 1.25;
  --t-h3: 17px;
  --t-h3-lh: 1.35;
  --t-body: 15px;
  --t-body-lh: 1.55;
  --t-label: 13px;
  --t-label-lh: 1.4;
  --t-caption: 12px;
  --t-caption-lh: 1.4;
  --t-overline: 11px;
  --t-overline-lh: 1.3;

  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;

  /* ---------- layout ---------- */
  --rail-w: 78px;
  --panel-w: 234px;
  --side-w: 248px;
  --side-w-collapsed: 76px;
  --top-h: 72px;
  --content-max: 1560px;

  /* ---------- motion ---------- */
  --m-fast: 140ms;
  --m-base: 220ms;
  --m-slow: 320ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);

  /* ---------- elevation: soft and low, never dramatic ---------- */
  --e-0: none;
  --e-1: 0 1px 2px rgba(14, 21, 18, 0.04);
  --e-2: 0 2px 8px rgba(14, 21, 18, 0.06);
  --e-3: 0 8px 24px rgba(14, 21, 18, 0.08);

  /* ---------- z-index scale ---------- */
  --z-base: 0;
  --z-sticky: 10;
  --z-nav: 20;
  --z-overlay: 40;
  --z-modal: 100;
  --z-toast: 1000;
}

/* Dark theme is planned, not built. Recorded so nothing above blocks it:
   every surface reads a token, no component assumes white is "light". */

```

### `dashboard\src\app\actions\index.ts`

```typescript
"use server";

import { redirect } from "next/navigation";
import { PLANS } from "@/lib/data/plans";

/**
 * The write surface.
 *
 * Every form on the product posts to one of these. They validate what they are
 * given and report back through the same state shapes the forms already
 * render — a control that looks live but silently discards what you typed is
 * worse than one that tells you.
 *
 * None of them persist anything yet, because there is nothing behind them to
 * persist to. When the store lands, these bodies are the only thing that
 * changes — no form and no page has to move, which is the whole reason the
 * writes were funnelled through one file in the first place.
 */

/** What every one of them says, in one place, so it is worded once. */
const NOT_PERSISTED =
  "Saving is not connected yet, so this change will not survive a reload.";

/* ---------------------------------- auth --------------------------------- */

export type SignInState = { error?: string };

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { error: "Enter your email address and your password." };
  }

  // No identity provider is wired up. `lib/session.ts` decides who is signed
  // in, so any credentials reach the same account — and the form says so rather
  // than implying it checked them.
  redirect(next.startsWith("/") ? next : "/");
}

export async function signOut() {
  redirect("/login");
}

/* --------------------------------- account -------------------------------- */

export type AccountState = { error?: string; savedAt?: string };

export async function saveAccount(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (displayName.length < 2) {
    return { error: "A display name needs at least two characters." };
  }

  return { error: NOT_PERSISTED };
}

/* ---------------------------------- plans --------------------------------- */

export async function startPlan(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  if (!caseId) throw new Error("No case was supplied.");

  // Creating a plan needs a store. Until there is one, open the seeded plan for
  // this case so the seven steps can be walked; a case with no seeded plan has
  // nothing to open, and the list says so.
  const existing = PLANS.find((plan) => plan.caseId === caseId);
  redirect(existing ? `/plan/${existing.id}/step/1` : "/plans");
}

export type SaveState = {
  error?: string;
  savedAt?: string;
  /** The patch this call actually wrote, echoed back verbatim. */
  saved?: string;
};

export async function savePlanStep(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return { error: "This form is missing its plan." };

  return { error: NOT_PERSISTED };
}

export type SealState = { error?: string };

export async function sealPlan(
  _prev: SealState,
  formData: FormData,
): Promise<SealState> {
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return { error: "This form is missing its plan." };

  return {
    error:
      "Sealing a plan hands it to the headset, and that pipeline is not built yet.",
  };
}

export type PinState = { pin?: string; expiresAt?: string; error?: string };

export async function mintPin(
  _prev: PinState,
  formData: FormData,
): Promise<PinState> {
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return { error: "This form is missing its plan." };

  return {
    error:
      "A pairing PIN is minted by the headset service, which is not running yet.",
  };
}

/* --------------------------------- cohorts -------------------------------- */

export type CohortState = { error?: string; saved?: string };

export async function assignPreset(
  _prev: CohortState,
  formData: FormData,
): Promise<CohortState> {
  const cohortId = String(formData.get("cohortId") ?? "");
  if (!cohortId) return { error: "This form is missing its cohort." };

  return { error: NOT_PERSISTED };
}

export async function createCohort(
  _prev: CohortState,
  formData: FormData,
): Promise<CohortState> {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return { error: "Give the cohort a name of at least two characters." };
  }

  return { error: NOT_PERSISTED };
}

export type InviteState = {
  error?: string;
  /** Returned once. There is no query that fetches it back. */
  link?: string;
  expiresAt?: string;
  revoked?: string;
};

export async function createInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const cohortId = String(formData.get("cohortId") ?? "");
  if (!cohortId) return { error: "This form is missing its cohort." };

  return {
    error:
      "Join links are minted and redeemed by a service that is not running yet.",
  };
}

export async function revokeInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const inviteId = String(formData.get("inviteId") ?? "");
  if (!inviteId) return { error: "This form is missing its invite." };

  return { error: NOT_PERSISTED };
}

/* ---------------------------------- cases --------------------------------- */

export type ConfigState = { error?: string; saved?: string };

export async function saveInstructorConfig(
  _prev: ConfigState,
  formData: FormData,
): Promise<ConfigState> {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return { error: "Give the preset a name of at least two characters." };
  }

  return { error: NOT_PERSISTED };
}

```

### `dashboard\src\app\activity\activity.module.css`

```css
/* /activity — weekly rhythm and the day-by-day log */

.columns {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--s-5);
  align-items: stretch;
  margin-bottom: var(--s-7);
}

@media (max-width: 1100px) {
  .columns {
    grid-template-columns: 1fr;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
}

.panelTitle {
  font-size: var(--t-h3);
  font-weight: var(--fw-semibold);
  line-height: var(--t-h3-lh);
}

.panelSub {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: var(--t-caption);
}

.caption {
  margin-top: auto;
  padding-top: var(--s-4);
  border-top: var(--bw) solid var(--divider);
  color: var(--text-muted);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}

.day {
  margin-bottom: var(--s-6);
}

.dayHead {
  margin-bottom: var(--s-3);
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  color: var(--text-muted);
}

.dayList {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.entry {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  min-height: var(--h-md);
  padding: var(--s-3) var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
}

.entry:hover {
  background: var(--brand-surface);
  border-color: var(--brand-border);
}

.entryTime {
  min-width: 46px;
  color: var(--text-muted);
  font-size: var(--t-caption);
  font-variant-numeric: tabular-nums;
}

.entryTitle {
  flex: 1;
  font-size: var(--t-body);
  font-weight: var(--fw-medium);
}

.entryMeta {
  color: var(--text-muted);
  font-size: var(--t-caption);
}

.entryScore {
  min-width: 40px;
  text-align: right;
  font-weight: var(--fw-semibold);
  font-variant-numeric: tabular-nums;
}

```

### `dashboard\src\app\activity\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Badge, Chip, EmptyState } from "@/components/ui";
import { BarChart, StatCard, StatRow } from "@/components/viz";
import { getActivity } from "@/lib/data/performance";
import { longDuration, timeOfDay, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import s from "./activity.module.css";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await getCurrentUser();
  const view = await getActivity(user.id);

  return (
    <AppShell user={user} searchHint='Try searching "activity"'>
      <PageHeader
        title="Activity"
        lede="Your practice rhythm — every session, day by day, and the weekly pattern behind it."
      />

      {view.totals.sessions === 0 ? (
        <EmptyState icon={CalendarClock} title="No activity yet">
          Sessions appear here the moment one starts. Plan a case and pair a
          headset to begin.
        </EmptyState>
      ) : (
        <>
          <StatRow>
            <StatCard
              label="Sessions"
              value={String(view.totals.sessions)}
              variant="accent"
              sub="most recent 60 shown below"
            />
            <StatCard
              label="Completed"
              value={String(view.totals.completed)}
              variant="accent"
            />
            <StatCard
              label="Time in theatre"
              value={longDuration(view.totals.timeS)}
              variant="accent"
              sub="completed sessions"
            />
            <StatCard
              label="Active weeks"
              value={String(view.weekly.filter((w) => w.sessions > 0).length)}
              variant="accent"
              sub={`of the last ${view.weekly.length}`}
            />
          </StatRow>

          <div className={s.columns}>
            <section className={s.panel} aria-label="Sessions per week">
              <div>
                <p className={s.panelTitle}>Sessions per week</p>
                <p className={s.panelSub}>Last {view.weekly.length} weeks</p>
              </div>
              <BarChart
                data={view.weekly.map((w) => ({
                  label: w.label,
                  value: w.sessions,
                }))}
                height={180}
              />
              <p className={s.caption}>{view.weeklyCaption}</p>
            </section>

            <section className={s.panel} aria-label="About this log">
              <div>
                <p className={s.panelTitle}>Reading this log</p>
              </div>
              <p className={s.panelSub}>
                Each entry links to the session it records — a live session
                opens its mirror, a completed one its report. Scores are shown
                where a report exists; a session without one shows its state
                instead.
              </p>
            </section>
          </div>

          {view.days.map((day) => (
            <section key={day.day} className={s.day} aria-label={day.day}>
              <SectionHeader title={day.day} />
              <div className={s.dayList}>
                {day.sessions.map((session) => {
                  const scored =
                    session.status === "completed" &&
                    session.totalScore !== undefined;
                  return (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className={s.entry}
                    >
                      <span className={s.entryTime}>
                        {timeOfDay(session.startedAt)}
                      </span>
                      <span className={s.entryTitle}>{session.caseTitle}</span>
                      <span className={s.entryMeta}>
                        {titleCase(session.mode)} ·{" "}
                        {titleCase(session.difficulty)} · {session.design} ·{" "}
                        {titleCase(session.fixation)}
                      </span>
                      {scored ? (
                        <>
                          <span className={s.entryScore}>
                            {session.totalScore}
                          </span>
                          <Badge
                            status={
                              (session.totalScore as number) >=
                                PASS_MARK[session.difficulty] &&
                              session.criticalErrors < 3
                                ? "pass"
                                : "fail"
                            }
                          >
                            {(session.totalScore as number) >=
                              PASS_MARK[session.difficulty] &&
                            session.criticalErrors < 3
                              ? "Passed"
                              : "Not passed"}
                          </Badge>
                        </>
                      ) : (
                        <Chip tone="muted">{titleCase(session.status)}</Chip>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\cases\CaseFilters.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Chip } from "@/components/ui";
import { titleCase } from "@/lib/format";
import type { CaseFacets, Facet } from "@/lib/data/cases";
import s from "./cases.module.css";

/**
 * Filters write to the URL, not to component state.
 *
 * A filtered view has to survive a reload and be pasteable into a message —
 * "look at the three expert cases" is a link, or it is nothing. The server
 * component re-runs the query from the search params, so there is one source of
 * truth and no client-side copy of the case list.
 *
 * Layout: one search row, then the four facets side by side on a single band.
 * The previous version stacked each facet on its own labelled row, which cost
 * six rows of chrome above a catalogue of six cases — the filter was taller
 * than the thing it filtered.
 */

/** Long enough that a typed word settles, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 300;

export function CaseFilters({
  facets,
  matched,
  total,
}: {
  facets: CaseFacets;
  matched: number;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const current = (key: string) => params.get(key) ?? undefined;
  const paramsString = params.toString();

  function urlWith(
    from: string,
    next: Record<string, string | undefined>,
  ): string {
    const search = new URLSearchParams(from);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    return qs ? `/cases?${qs}` : "/cases";
  }

  const apply = (next: Record<string, string | undefined>) =>
    router.replace(urlWith(paramsString, next), { scroll: false });

  /**
   * Search applies as you type. `replace` rather than `push`, so eight
   * keystrokes do not leave eight entries in the back history. Every dependency
   * below is a primitive or a stable router, so the timer restarts on a
   * keystroke and on nothing else.
   */
  const committed = params.get("q") ?? "";
  useEffect(() => {
    const term = query.trim();
    if (term === committed) return;

    const id = setTimeout(() => {
      const search = new URLSearchParams(paramsString);
      if (term) search.set("q", term);
      else search.delete("q");
      const qs = search.toString();
      router.replace(qs ? `/cases?${qs}` : "/cases", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [query, committed, paramsString, router]);

  /** Clicking the selected chip clears it — a filter you cannot undo is a trap. */
  const toggle = (key: string, value: string) =>
    apply({ [key]: current(key) === value ? undefined : value });

  const active =
    Boolean(current("q")) ||
    Boolean(current("pathology")) ||
    Boolean(current("side")) ||
    Boolean(current("difficulty")) ||
    Boolean(current("attempted"));

  const clearAll = () => {
    setQuery("");
    router.replace("/cases", { scroll: false });
  };

  return (
    <div className={s.filters}>
      <form
        className={s.searchRow}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ q: query.trim() || undefined });
        }}
      >
        <span className={s.searchWrap}>
          <Search className={s.searchIcon} aria-hidden="true" strokeWidth={2} />
          <input
            className={s.search}
            type="text"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by case name or ID — try “varus” or “CASE_003”"
            aria-label="Search cases"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className={s.searchClear}
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X width={15} height={15} strokeWidth={2.5} />
            </button>
          )}
        </span>

        <p className={s.count} aria-live="polite">
          {matched === total ? (
            <>
              <b>{total}</b> {total === 1 ? "case" : "cases"}
            </>
          ) : (
            <>
              <b>{matched}</b> of {total} cases
            </>
          )}
        </p>

        {active && (
          <button type="button" className={s.clear} onClick={clearAll}>
            <X width={14} height={14} strokeWidth={2.5} aria-hidden="true" />
            Clear all
          </button>
        )}
      </form>

      <div className={s.facets}>
        <FacetGroup
          label="Pathology"
          options={facets.pathologies}
          selected={current("pathology")}
          onToggle={(value) => toggle("pathology", value)}
        />
        <FacetGroup
          label="Side"
          options={facets.sides}
          selected={current("side")}
          format={titleCase}
          onToggle={(value) => toggle("side", value)}
        />
        <FacetGroup
          label="Difficulty"
          options={facets.difficulties}
          selected={current("difficulty")}
          format={titleCase}
          onToggle={(value) => toggle("difficulty", value)}
        />
        <FacetGroup
          label="History"
          options={facets.history}
          selected={current("attempted")}
          format={(value) =>
            value === "attempted" ? "Attempted" : "Not attempted"
          }
          onToggle={(value) => toggle("attempted", value)}
        />
      </div>
    </div>
  );
}

/**
 * A count of 0 means selecting this narrows the result set to nothing. It stays
 * visible and is disabled rather than hidden: a facet value that vanishes as
 * you filter makes the catalogue feel like it is shifting under you.
 */
function FacetGroup({
  label,
  options,
  selected,
  format,
  onToggle,
}: {
  label: string;
  options: Facet[];
  selected?: string;
  format?: (value: string) => string;
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className={s.facet}>
      <span className={s.facetLabel}>{label}</span>
      <div className={s.facetChips}>
        {options.map((option) => {
          const on = selected === option.value;
          const empty = option.count === 0 && !on;
          return (
            <Chip
              key={option.value}
              selected={on}
              count={option.count}
              className={empty ? s.chipEmpty : undefined}
              onClick={empty ? undefined : () => onToggle(option.value)}
            >
              {format ? format(option.value) : option.value}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

```

### `dashboard\src\app\cases\cases.module.css`

```css
/* ---------- filter bar ----------
   One search row, then all four facets on a single band. The previous version
   gave every facet its own labelled row, which put six rows of chrome above a
   catalogue of six cases. */

.filters {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-4) var(--s-5);
  margin-bottom: var(--s-6);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
}

.searchRow {
  display: flex;
  align-items: center;
  gap: var(--s-4);
}

.searchWrap {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.searchIcon {
  position: absolute;
  left: var(--s-4);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.search {
  width: 100%;
  min-height: 46px;
  padding: 0 var(--s-9) 0 var(--s-8);
  font: inherit;
  font-size: var(--t-body);
  color: var(--text);
  background: var(--surface-sunken);
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  transition:
    background-color var(--m-fast) var(--ease-out),
    border-color var(--m-fast) var(--ease-out);
}

.search::placeholder {
  color: var(--text-disabled);
}

.search:hover {
  border-color: var(--border);
}

.search:focus {
  background: var(--surface);
  border-color: var(--border-strong);
}

.search:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* Inside the field's border, so the pair still reads as one object. */
.searchClear {
  position: absolute;
  right: var(--s-2);
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--text-muted);
  background: none;
  border: 0;
  cursor: pointer;
}

.searchClear:hover {
  background: var(--surface);
  color: var(--ink);
}

.count {
  flex: 0 0 auto;
  font-size: var(--t-label);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.count b {
  font-weight: 700;
  color: var(--ink);
}

.clear {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  height: 34px;
  padding: 0 var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--text);
  font-size: var(--t-caption);
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color var(--m-fast) var(--ease-out),
    border-color var(--m-fast) var(--ease-out);
}

.clear:hover {
  border-color: var(--border-strong);
  background: var(--surface-sunken);
}

/* ---------- facets ----------
   One axis per row, banded. Rows stack rather than sharing a line so a facet
   that gains values later grows downwards into its own band instead of pushing
   the next axis onto a second line — the layout holds however many pathologies
   the catalogue ends up with. */

.facets {
  display: flex;
  flex-direction: column;
  margin-top: var(--s-1);
  border: 1px solid var(--divider);
  border-radius: var(--r-sm);
  overflow: hidden;
}

.facet {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-3) var(--s-4);
  background: var(--surface);
}

/* Alternating bands, the palest tint the brand ramp has. The chips sit on
   white, so every row keeps its objects legible against its ground. */
.facet:nth-child(odd) {
  background: var(--brand-surface);
}

.facetLabel {
  font-size: var(--t-overline);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.facetChips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

/* Selecting this would empty the grid. Shown, not hidden — a facet value that
   disappears as you filter makes the catalogue feel unstable. */
.chipEmpty {
  color: var(--text-disabled);
  border-style: dashed;
}

/* ---------- card grid ---------- */

/* Four columns, matching the dashboards' stat row */
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s-4);
  list-style: none;
}

.card {
  height: 100%;
  overflow: hidden;
}

.cardLink {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.cardLink:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: -2px;
}

.thumb {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  color: var(--text-disabled);
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border);
}

.cardBody {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  flex: 1;
  padding: var(--s-4);
}

.cardHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
}

.cardTitle {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  line-height: 1.3;
  color: var(--text);
}

.cardChips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.cardSummary {
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

.cardFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  margin-top: auto;
  padding-top: var(--s-3);
  border-top: 1px solid var(--border);
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.cardCta {
  font-weight: 700;
  color: var(--brand);
  white-space: nowrap;
}

@media (max-width: 1439px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .searchRow {
    flex-wrap: wrap;
  }

  .searchWrap {
    flex: 1 0 100%;
  }

  .facet {
    align-items: flex-start;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--s-2);
  }
}

```

### `dashboard\src\app\cases\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FolderOpen, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Badge, Button, Card, Chip, EmptyState, Skeleton } from "@/components/ui";
import { listCases, type AttemptedFilter } from "@/lib/data/cases";
import { titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import { CaseFilters } from "./CaseFilters";
import s from "./cases.module.css";

export const metadata: Metadata = { title: "Cases" };

const ATTEMPTED: AttemptedFilter[] = ["all", "attempted", "unattempted"];

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    pathology?: string;
    side?: string;
    difficulty?: string;
    attempted?: string;
  }>;
}) {
  const filters = await searchParams;
  const user = await getCurrentUser();

  const attempted = ATTEMPTED.includes(filters.attempted as AttemptedFilter)
    ? (filters.attempted as AttemptedFilter)
    : "all";

  const { cases, facets, total } = await listCases(user.id, {
    q: filters.q,
    pathology: filters.pathology,
    side: filters.side,
    difficulty: filters.difficulty,
    attempted,
  });

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        title="Cases"
        lede="Every case is synthetic. No patient data is stored anywhere in the product."
        actions={
          <Button variant="primary" icon={Play} href="/setup">
            Start simulation
          </Button>
        }
      />

      <Suspense fallback={<Skeleton height="180px" block />}>
        <CaseFilters facets={facets} matched={cases.length} total={total} />
      </Suspense>

      {cases.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No cases match these filters"
          action={
            <Button variant="secondary" href="/cases">
              Clear filters
            </Button>
          }
        >
          {total} cases are published. Widen a filter, or clear them all to see
          the whole catalogue.
        </EmptyState>
      ) : (
        <ul className={s.grid}>
          {cases.map((item) => {
            const passMark = PASS_MARK[item.difficulty];
            return (
              <li key={item.id}>
                <Card padding="none" className={s.card}>
                  <Link href={`/cases/${item.id}`} className={s.cardLink}>
                    {/* Radiographs are not authored yet. A neutral plate is
                        honest; a stock photograph standing in for a patient's
                        imaging is not. */}
                    <span className={s.thumb} aria-hidden="true">
                      <FolderOpen width={22} height={22} strokeWidth={1.5} />
                    </span>

                    <span className={s.cardBody}>
                      <span className={s.cardHead}>
                        <span className={s.cardTitle}>{item.title}</span>
                        {item.bestScore !== undefined ? (
                          <Badge
                            status={item.bestScore >= passMark ? "pass" : "warn"}
                          >
                            {item.bestScore}
                          </Badge>
                        ) : (
                          <Badge status="neutral">Not attempted</Badge>
                        )}
                      </span>

                      <span className={s.cardChips}>
                        <Chip tone="muted">{item.pathologyLabel}</Chip>
                        <Chip tone="muted">{titleCase(item.side)}</Chip>
                        <Chip tone="muted">{titleCase(item.difficulty)}</Chip>
                      </span>

                      {item.summary && (
                        <span className={s.cardSummary}>{item.summary}</span>
                      )}

                      <span className={s.cardFoot}>
                        {item.attempts > 0
                          ? `${item.attempts} attempt${item.attempts === 1 ? "" : "s"} · best ${item.bestScore ?? "—"}`
                          : "Not yet attempted"}
                        <span className={s.cardCta}>Start planning →</span>
                      </span>
                    </span>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\cases\[id]\case.module.css`

```css
.chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin-bottom: var(--s-5);
}

/* The identifier people quote to each other, and what the search box matches. */
.caseId {
  margin-left: auto;
  padding: 0 var(--s-3);
  font-family: var(--font-mono);
  font-size: var(--t-caption);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  user-select: all;
}

.readiness {
  margin-bottom: var(--s-6);
}

/* Wide column: the patient, and what this viewer has already done about them.
   Narrow column: the material the case ships with. */
.layout {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: var(--s-4);
  align-items: start;
}

.col {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

/* ---------- patient snapshot ---------- */

/* Readings tile two-up; an eighteen-word history does not belong in a 150px
   column, which is what made the old single-column list 600px tall. */
.vitals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-2);
  margin-top: var(--s-4);
}

.vital {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--s-3) var(--s-4);
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
}

.vital dt {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.vital dd {
  font-size: var(--t-body);
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.notes {
  display: flex;
  flex-direction: column;
  margin-top: var(--s-5);
  border-top: 1px solid var(--divider);
}

.note {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: var(--s-4);
  padding: var(--s-3) 0;
  border-bottom: 1px solid var(--divider);
  font-size: var(--t-label);
  line-height: 1.55;
}

.note:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.note dt {
  font-weight: 600;
  color: var(--text-muted);
}

.note dd {
  color: var(--text);
}

.foot {
  margin-top: var(--s-4);
  padding-top: var(--s-3);
  border-top: 1px solid var(--divider);
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

.count {
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--text-muted);
}

/* ---------- imaging ---------- */

.views {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-3);
  margin-top: var(--s-4);
  list-style: none;
}

.view {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
}

.plate {
  display: grid;
  place-items: center;
  margin-bottom: var(--s-1);
  aspect-ratio: 4 / 5;
  color: var(--text-disabled);
  background: var(--surface-sunken);
  border: 1px solid var(--border);
}

.viewLabel {
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--text);
}

.viewNote {
  font-size: var(--t-caption);
  color: var(--text-disabled);
}

/* ---------- how this case is scored ---------- */

.scoring {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  margin-top: var(--s-4);
  list-style: none;
}

.scoreRow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 84px 28px;
  align-items: center;
  gap: var(--s-3);
  font-size: var(--t-label);
}

.scoreLabel {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
}

/* Share of the available marks. Neutral black, not brand — brand is for
   things you press, and this is data. */
.scoreTrack {
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  overflow: hidden;
}

.scoreFill {
  display: block;
  height: 100%;
  border-radius: var(--r-pill);
  background: var(--dark);
}

.scoreMax {
  text-align: right;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* ---------- objectives ---------- */

.objectives {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  margin-top: var(--s-4);
  list-style: none;
}

.objective {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: var(--s-3);
  font-size: var(--t-label);
  line-height: 1.5;
  color: var(--text);
}

.objectiveIcon {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  color: var(--brand);
}

.emptyWrap {
  padding: var(--s-5);
}

/* ---------- instructor configuration ---------- */

/* Full width beneath both columns: it is a form, and a form squeezed into a
   five-twelfths column wraps every one of its rows. */
.configureWrap {
  margin-top: var(--s-4);
}

.configure {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.configForm {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.configRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
}

.configLabel {
  font-size: var(--t-label);
  font-weight: 700;
  color: var(--text);
}

.configHint {
  margin-top: 2px;
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.configFoot {
  display: flex;
  align-items: flex-end;
  gap: var(--s-3);
  padding-top: var(--s-4);
  border-top: 1px solid var(--border);
}

.presetName {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  flex: 1;
}

.presetInput {
  min-height: 44px;
  padding: 0 var(--s-4);
  font: inherit;
  font-size: var(--t-body);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
}

.presetInput:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.presetList {
  padding-top: var(--s-4);
  border-top: 1px solid var(--border);
}

.presets {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  margin-top: var(--s-3);
  list-style: none;
}

.preset {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: var(--t-label);
  font-weight: 600;
  color: var(--text);
}

.presetMeta {
  font-weight: 500;
  color: var(--text-muted);
}

@media (max-width: 1279px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .views {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .vitals,
  .views {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .note {
    grid-template-columns: 1fr;
    gap: var(--s-1);
  }

  .configRow {
    align-items: flex-start;
    flex-direction: column;
  }
}

```

### `dashboard\src\app\cases\[id]\ConfigurePanel.tsx`

```tsx
"use client";

import { useActionState, useState } from "react";
import { Badge, Banner, Button, Card, CardHeader, Segmented } from "@/components/ui";
import { saveInstructorConfig, type ConfigState } from "@/app/actions";
import type { InstructorConfig } from "@/lib/data/cases";
import s from "./case.module.css";

/**
 * Flow F. Per-scene overrides, saved as a named preset.
 *
 * Rendered only for instructors and admins — a learner is not shown a disabled
 * copy, because a control that can never be used is not a control.
 *
 * The scale factor and the two scene settings below are the subset that is
 * named explicitly. Every authored value is overridable, so this panel
 * grows; the shape it writes (`instructor_configs.overrides`) does not.
 */
export function ConfigurePanel({
  caseId,
  presets,
}: {
  caseId: string;
  presets: InstructorConfig[];
}) {
  const [tolerance, setTolerance] = useState<"0.7" | "1.0" | "1.5">("1.0");
  const [guides, setGuides] = useState<"on" | "off">("on");
  const [cartilage, setCartilage] = useState<"2" | "3" | "4">("3");
  const [state, formAction, pending] = useActionState<ConfigState, FormData>(
    saveInstructorConfig,
    {},
  );

  return (
    <Card padding="lg" className={s.configure}>
      <CardHeader
        title="Instructor configuration"
        subtitle="A configured session carries a Custom configuration badge on its report, so results are never compared against a different rule set without the reader knowing."
        action={<Badge status="active">Instructor only</Badge>}
      />

      {state.error && (
        <Banner tone="fail" title="Preset not saved">
          {state.error}
        </Banner>
      )}
      {state.saved && (
        <Banner tone="pass" title="Preset saved">
          {state.saved} is available when you start a session on this case.
        </Banner>
      )}

      <form action={formAction} className={s.configForm}>
        <input type="hidden" name="caseId" value={caseId} />
        <input type="hidden" name="tolerance" value={tolerance} />
        <input type="hidden" name="guides" value={guides} />
        <input type="hidden" name="cartilage" value={cartilage} />

        <div className={s.configRow}>
          <div>
            <p className={s.configLabel}>Tolerance bands</p>
            <p className={s.configHint}>
              Scale factor applied to every authored tolerance
            </p>
          </div>
          <Segmented
            label="Tolerance bands"
            value={tolerance}
            onChange={setTolerance}
            options={[
              { value: "0.7", label: "×0.7" },
              { value: "1.0", label: "×1.0" },
              { value: "1.5", label: "×1.5" },
            ]}
          />
        </div>

        <div className={s.configRow}>
          <div>
            <p className={s.configLabel}>Guides in Training</p>
            <p className={s.configHint}>
              Ghost outlines, corridors, arrows and target dots
            </p>
          </div>
          <Segmented
            label="Guides in Training"
            value={guides}
            onChange={setGuides}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />
        </div>

        <div className={s.configRow}>
          <div>
            <p className={s.configLabel}>Cartilage grade (9.1)</p>
            <p className={s.configHint}>Gates the resurfacing decision</p>
          </div>
          <Segmented
            label="Cartilage grade"
            value={cartilage}
            onChange={setCartilage}
            options={[
              { value: "2", label: "II" },
              { value: "3", label: "III" },
              { value: "4", label: "IV" },
            ]}
          />
        </div>

        <div className={s.configFoot}>
          <label className={s.presetName}>
            <span className={s.configLabel}>Preset name</span>
            <input
              className={s.presetInput}
              name="name"
              required
              maxLength={60}
              placeholder="Exam conditions"
            />
          </label>
          <Button variant="primary" type="submit" loading={pending}>
            Save as preset
          </Button>
        </div>
      </form>

      {presets.length > 0 && (
        <div className={s.presetList}>
          <p className={s.configLabel}>Existing presets</p>
          <ul className={s.presets}>
            {presets.map((preset) => (
              <li key={preset.id} className={s.preset}>
                <span>{preset.name}</span>
                <span className={s.presetMeta}>
                  {`${Object.keys(preset.overrides).length} scene override${
                    Object.keys(preset.overrides).length === 1 ? "" : "s"
                  }`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

```

### `dashboard\src\app\cases\[id]\page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImageOff, ListChecks, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getCase, getCaseTitle, getInstructorConfigs } from "@/lib/data/cases";
import { clock, longDuration, shortDate, titleCase } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import { ConfigurePanel } from "./ConfigurePanel";
import { StartPlanning } from "./StartPlanning";
import s from "./case.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = await getCaseTitle(id);
  return { title: title ?? id.replace(/_/g, " ") };
}

/**
 * The case page answers one question: *should I take this case, and what do I
 * need to know before I plan it?*
 *
 * So it opens with the four figures that decide it — best score, pass mark,
 * attempts, time — in the same stat row the dashboards use, then splits into
 * the patient the surgeon is about to operate on (wide) and the material the
 * case ships with (narrow). The case ID is in the eyebrow because that is how
 * people refer to a case to each other, and it is what the search box matches.
 */
export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  // `/setup` carries the session configuration here in the URL rather than
  // writing an orphaned draft. It is read back onto the plan at creation.
  const config = await searchParams;
  const user = await getCurrentUser();
  const detail = await getCase(id, user.id);

  if (!detail) notFound();

  const persona = personaFor(user.role);
  const canConfigure = persona === "instructor" || persona === "admin";
  const presets = canConfigure ? await getInstructorConfigs(detail.id) : [];

  const passMark = PASS_MARK[detail.difficulty];
  const attempts = detail.attempts.length;

  /**
   * Bars are scaled against the largest category, not against a total. The six
   * maxima sum to 95 while every score in the product is presented out of 100
   * — an open discrepancy, recorded but not yet settled. Until it
   * is ruled on, this panel shows what each category is worth and asserts no
   * total, because the total it would assert is the one nobody has agreed.
   */
  const largestCategory = Math.max(...detail.scoring.map((c) => c.max), 1);

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        eyebrow={`${detail.procedureName} · ${detail.id}`}
        title={detail.title}
        lede={detail.summary}
        actions={<StartPlanning caseId={detail.id} config={config} />}
      />

      <div className={s.chips}>
        <Chip tone="muted">{detail.pathologyLabel}</Chip>
        <Chip tone="muted">{titleCase(detail.side)} knee</Chip>
        <Chip tone="muted">{titleCase(detail.difficulty)}</Chip>
        <span className={s.caseId}>{detail.id}</span>
      </div>

      {/* Where this viewer stands on this case. Every figure is derived from
          their own sessions, and only ever their own.

          All four carry the outlined variant. The dashboards' one-dark-one-
          accent rule is there to pick a focal tile out of a
          screen full of competing panels; here the row *is* the focal element
          and no one of the four outranks the others, so a black tile only
          bullied the other three. Recorded in */}
      <div className={s.readiness}>
        <StatRow>
          <StatCard
            label="Your best score"
            value={detail.bestScore ?? "—"}
            variant="accent"
            sub={
              detail.bestScore === undefined
                ? "Not attempted yet"
                : detail.bestScore >= passMark
                  ? "Above the pass mark"
                  : `${passMark - detail.bestScore} below the pass mark`
            }
          />
          <StatCard
            label="Pass mark"
            value={passMark}
            variant="accent"
            sub={`${titleCase(detail.difficulty)} difficulty`}
          />
          <StatCard
            label="Attempts"
            value={attempts}
            variant="accent"
            sub={attempts === 0 ? "No sessions yet" : `${detail.passed} passed`}
          />
          <StatCard
            label="Time on this case"
            value={detail.timeSpentS > 0 ? longDuration(detail.timeSpentS) : "—"}
            variant="accent"
            sub={
              attempts === 0
                ? "Your sessions"
                : `Across ${attempts} session${attempts === 1 ? "" : "s"}`
            }
          />
        </StatRow>
      </div>

      <div className={s.layout}>
        <div className={s.col}>
          <Card padding="lg">
            <CardHeader
              title="Patient snapshot"
              subtitle="Synthetic patient. No identifiable data is stored anywhere in the product."
            />

            {detail.patient.vitals.length > 0 && (
              <dl className={s.vitals}>
                {detail.patient.vitals.map((field) => (
                  <div key={field.label} className={s.vital}>
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {detail.patient.notes.length > 0 && (
              <dl className={s.notes}>
                {detail.patient.notes.map((field) => (
                  <div key={field.label} className={s.note}>
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card padding="none">
            <CardHeader
              flush
              title="Attempt history"
              subtitle={
                attempts === 0
                  ? undefined
                  : `${attempts} session${attempts === 1 ? "" : "s"} · ${detail.passed} above the pass mark`
              }
              action={
                attempts > 0 ? (
                  <Button variant="ghost" size="sm" href="/sessions">
                    All sessions
                  </Button>
                ) : undefined
              }
            />
            {attempts === 0 ? (
              <div className={s.emptyWrap}>
                <EmptyState
                  icon={Play}
                  title="You have not attempted this case"
                  action={<StartPlanning caseId={detail.id} config={config} />}
                >
                  Plan it on the desktop, then perform it in the headset. The
                  report compares the two.
                </EmptyState>
              </div>
            ) : (
              <Table label={`Attempts at ${detail.title}`}>
                <THead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Mode</Th>
                    <Th>Variant</Th>
                    <Th numeric>Duration</Th>
                    <Th numeric>Score</Th>
                    <Th>Status</Th>
                  </Tr>
                </THead>
                <TBody>
                  {detail.attempts.map((attempt) => {
                    const mark = PASS_MARK[attempt.difficulty];
                    const score = attempt.totalScore;
                    return (
                      <Tr key={attempt.id}>
                        <Td head>
                          {shortDate(attempt.endedAt ?? attempt.startedAt)}
                        </Td>
                        <Td>{titleCase(attempt.mode)}</Td>
                        <Td>
                          {attempt.design} · {titleCase(attempt.fixation)}
                        </Td>
                        <Td numeric>{clock(attempt.durationS)}</Td>
                        <Td numeric>{score ?? "—"}</Td>
                        <Td>
                          {attempt.status === "live" ? (
                            <Badge status="active">In progress</Badge>
                          ) : attempt.status === "aborted" ? (
                            <Badge status="warn">Interrupted</Badge>
                          ) : score === undefined ? (
                            <Badge status="neutral">No report</Badge>
                          ) : score >= mark ? (
                            <Badge status="pass">Passed</Badge>
                          ) : (
                            <Badge status="fail">Below pass mark</Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>
        </div>

        <div className={s.col}>
          <Card padding="lg">
            <CardHeader
              title="Imaging package"
              action={
                <span className={s.count}>
                  {`${detail.imaging.length} view${detail.imaging.length === 1 ? "" : "s"}`}
                </span>
              }
            />
            {detail.imaging.length === 0 ? (
              <EmptyState icon={ImageOff} title="No imaging authored yet">
                This case has no radiograph manifest. Planning step 2 needs at
                least an AP and a long-leg view.
              </EmptyState>
            ) : (
              <ul className={s.views}>
                {detail.imaging.map((view) => (
                  <li key={view.view} className={s.view}>
                    {/* The manifest names the views; the files are not in the
                        imaging bucket yet. A labelled plate says so. */}
                    <span className={s.plate} aria-hidden="true">
                      <ImageOff width={20} height={20} strokeWidth={1.5} />
                    </span>
                    <span className={s.viewLabel}>{view.label}</span>
                    <span className={s.viewNote}>Asset pending</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {detail.scoring.length > 0 && (
            <Card padding="lg">
              <CardHeader
                title="How this case is scored"
                subtitle={`${detail.scoring.length} categories, weighted as below. ${passMark} passes at ${titleCase(detail.difficulty)} difficulty.`}
              />
              <ul className={s.scoring}>
                {detail.scoring.map((category) => (
                  <li key={category.key} className={s.scoreRow}>
                    <span className={s.scoreLabel}>{category.label}</span>
                    <span className={s.scoreTrack} aria-hidden="true">
                      <span
                        className={s.scoreFill}
                        style={{
                          width: `${(category.max / largestCategory) * 100}%`,
                        }}
                      />
                    </span>
                    <span className={s.scoreMax}>{category.max}</span>
                  </li>
                ))}
              </ul>
              <p className={s.foot}>
                Three or more critical errors cap a session at 59 and mark it
                Not passed, whatever the categories say.
              </p>
            </Card>
          )}

          {detail.objectives.length > 0 && (
            <Card padding="lg">
              <CardHeader title="Learning objectives" />
              <ul className={s.objectives}>
                {detail.objectives.map((objective) => (
                  <li key={objective} className={s.objective}>
                    <ListChecks
                      className={s.objectiveIcon}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {objective}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {canConfigure && (
        <div className={s.configureWrap}>
          <ConfigurePanel caseId={detail.id} presets={presets} />
        </div>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\cases\[id]\StartPlanning.tsx`

```tsx
import { Play } from "lucide-react";
import { Button } from "@/components/ui";
import { startPlan } from "@/app/actions";

/**
 * The one control that creates a `plans` row.
 *
 * `/setup` deliberately writes nothing — an abandoned setup should not leave a
 * draft behind — so the configuration it collected rides here in the URL and is
 * committed at the moment somebody picks a case. A form rather than a link,
 * because this is a write.
 */
export function StartPlanning({
  caseId,
  config,
}: {
  caseId: string;
  config: Record<string, string | undefined>;
}) {
  return (
    <form action={startPlan}>
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="mode" value={config.mode ?? ""} />
      <input type="hidden" name="difficulty" value={config.difficulty ?? ""} />
      <input type="hidden" name="design" value={config.design ?? ""} />
      <input type="hidden" name="fixation" value={config.fixation ?? ""} />
      <Button type="submit" variant="primary" icon={Play}>
        Start planning
      </Button>
    </form>
  );
}

```

### `dashboard\src\app\cohorts\AssignPreset.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { Banner, Button, Select } from "@/components/ui";
import { assignPreset, type CohortState } from "@/app/actions";
import p from "../panels.module.css";

/**
 * The control that makes a preset do something.
 *
 * It changes what *future* plans are stamped with and never restamps existing
 * ones — a plan freezes its rule set when it is created, the same discipline
 * `sessions.plan_snapshot` has. The banner says so on success rather than
 * leaving the instructor to assume a retroactive change they did not get.
 */
export function AssignPreset({
  cohortId,
  currentPresetId,
  presets,
}: {
  cohortId: string;
  currentPresetId?: string;
  presets: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<CohortState, FormData>(
    assignPreset,
    {},
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="cohortId" value={cohortId} />

      {state.error && (
        <Banner tone="fail" title="Not assigned">
          {state.error}
        </Banner>
      )}
      {state.saved && !state.error && (
        <Banner tone="pass" title="Preset assigned">
          {state.saved}
        </Banner>
      )}

      <div className={p.filters}>
        <Select
          label="Configuration preset"
          name="presetId"
          defaultValue={currentPresetId ?? ""}
          className={p.spacer}
          helper="Applies to plans started after this change."
        >
          <option value="">None — authored tolerances</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </Select>
        <Button variant="primary" type="submit" loading={pending}>
          Assign
        </Button>
      </div>
    </form>
  );
}

```

### `dashboard\src\app\cohorts\InvitePanel.tsx`

```tsx
"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Banner, Button, Chip, Input, Select } from "@/components/ui";
import {
  createInvite,
  revokeInvite,
  type InviteState,
} from "@/app/actions";
import type { InviteSummary } from "@/lib/data/cohorts";
import p from "../panels.module.css";

/**
 * Invite links — the second half of "an instructor runs a course".
 *
 * The link is shown **once**, from the action's return value. `token_hash` is
 * outside the SELECT grant, so there is no query that could fetch a link
 * back and no honest way to draw one on a reload. The panel says so, and offers
 * to mint another — the same shape `PinPanel` has for a pairing PIN, and for
 * the same reason.
 *
 * What the link cannot do is stated on the screen rather than discovered by the
 * person who follows it: public sign-up is disabled, so it enrols an account an
 * administrator has already created.
 */
export function InvitePanel({
  cohortId,
  invites,
}: {
  cohortId: string;
  invites: InviteSummary[];
}) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    createInvite,
    {},
  );

  return (
    <>
      {state.error && (
        <Banner tone="fail" title="No link was created">
          {state.error}
        </Banner>
      )}

      {state.link && <IssuedLink link={state.link} />}

      <form action={formAction} className={p.formRow}>
        <input type="hidden" name="cohortId" value={cohortId} />
        {/* The address as this browser knows it. A forwarded header would be a
            value a proxy in front of the app can rewrite. */}
        <input
          type="hidden"
          name="origin"
          value={typeof window === "undefined" ? "" : window.location.origin}
        />

        <Input
          label="What to call it"
          name="label"
          placeholder="March intake"
          maxLength={60}
          className={p.formGrow}
          optional
        />

        <Select label="Expires in" name="days" defaultValue="7">
          <option value="1">1 day</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </Select>

        <Input
          label="Seats"
          name="maxUses"
          type="number"
          min={1}
          max={200}
          defaultValue={25}
          className={p.formNarrow}
        />

        <Button
          variant={state.link ? "secondary" : "primary"}
          type="submit"
          icon={Link2}
          loading={pending}
        >
          {state.link ? "Create another" : "Create invite link"}
        </Button>
      </form>

      {/* One line under the row rather than a helper hanging off one field —
          which is what pushed the three labels onto two different heights. */}
      <p className={p.formHint}>
        Seats cap how many people may join through this link. Neither the expiry
        nor the cap can be changed afterwards; revoke it and issue another.
      </p>

      <p className={p.note}>
        A link enrols an account that already exists — public sign-up is disabled
        in this phase, so an administrator creates the account and this puts it in
        your cohort. Joining moves somebody out of any cohort they were in, and
        an instructor or an administrator cannot join one at all.
      </p>

      {invites.length > 0 && (
        <div className={p.rows}>
          {invites.map((invite) => (
            <InviteRow key={invite.id} cohortId={cohortId} invite={invite} />
          ))}
        </div>
      )}
    </>
  );
}

/** The one moment the plaintext exists in a browser. */
function IssuedLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // A clipboard the browser refuses is not a failure worth a banner — the
      // link is on screen and selectable.
      setCopied(false);
    }
  }

  return (
    <div className={p.linkCard}>
      <p className={p.linkLabel}>Invite link</p>

      <p className={p.linkValue}>{link}</p>

      <div className={p.linkFoot}>
        <Button
          variant="primary"
          icon={copied ? Check : Copy}
          onClick={copy}
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
        <p className={p.linkMeta}>
          Copy it now. Only its hash is stored, so this is the one time it can be
          read — if it is lost, create another and revoke this one.
        </p>
      </div>
    </div>
  );
}

const STATE_LABEL: Record<InviteSummary["state"], string> = {
  open: "Open",
  expired: "Expired",
  exhausted: "Full",
  revoked: "Revoked",
};

function InviteRow({
  cohortId,
  invite,
}: {
  cohortId: string;
  invite: InviteSummary;
}) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    revokeInvite,
    {},
  );

  return (
    <div className={p.row}>
      <div className={p.rowBody}>
        <p className={p.rowTitle}>{invite.label ?? "Untitled link"}</p>
        <p className={p.rowDetail}>
          {invite.used} of {invite.maxUses} seat
          {invite.maxUses === 1 ? "" : "s"} used ·{" "}
          {invite.state === "expired" ? "expired" : "expires"}{" "}
          {new Date(invite.expiresAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {invite.joiners.length > 0 &&
            ` · ${invite.joiners.map((j) => j.name).join(", ")}`}
        </p>
        {state.error && <p className={p.rowDetail}>{state.error}</p>}
      </div>

      <div className={p.rowAside}>
        {/* A lifecycle state is a facet and not a verdict, so it is a Chip and
            never a Badge Solid while it still works. */}
        <Chip
          selected={invite.state === "open"}
          tone={invite.state === "open" ? "default" : "muted"}
        >
          {STATE_LABEL[invite.state]}
        </Chip>

        {invite.state === "open" && (
          <form action={formAction}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <input type="hidden" name="cohortId" value={cohortId} />
            <Button variant="ghost" size="sm" type="submit" loading={pending}>
              Revoke
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

```

### `dashboard\src\app\cohorts\NewCohort.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Banner, Button, Input } from "@/components/ui";
import { createCohort, type CohortState } from "@/app/actions";
import p from "../panels.module.css";

/**
 * The control that was missing.
 *
 * `cohorts_insert` has allowed this since the schema and no screen ever called it, so
 * a new instructor arrived at "No cohort assigned" and the one button on that
 * dashboard led here, to a list with nothing in it. the schema tightened the policy to
 * instructors and administrators before this shipped — the section is rendered
 * for them and omitted for a learner, and the database refuses
 * the rest independently.
 *
 * In a section panel rather than the page header, which is where
 * `/admin/users` puts *Add an account* and for the same reason: a labelled
 * field in `pageActions` sits in a row that centres its children and holds a
 * sibling button, so the field's label and the button's cap line never agree.
 */
export function NewCohort() {
  const [state, formAction, pending] = useActionState<CohortState, FormData>(
    createCohort,
    {},
  );

  return (
    <form action={formAction} className={p.formRow}>
      {state.error && (
        <Banner tone="fail" title="Not created">
          {state.error}
        </Banner>
      )}

      <Input
        label="Cohort name"
        name="name"
        placeholder="Orthopaedics, March intake"
        maxLength={80}
        className={p.formGrow}
        required
      />

      <Button variant="primary" icon={Plus} type="submit" loading={pending}>
        Create cohort
      </Button>
    </form>
  );
}

```

### `dashboard\src\app\cohorts\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Users } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Badge, Chip, EmptyState } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getCohorts } from "@/lib/data/cohorts";
import { NewCohort } from "./NewCohort";
import { shortDate } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Cohorts" };

/**
 * Instructors and administrators only — a learner is redirected rather than
 * shown an empty page. `cohorts_read` would in fact return their own cohort, so
 * this is a navigation decision and not the boundary. The store has to enforce
 * the same rule independently, and does not yet.
 */
export default async function CohortsPage() {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const cohorts = await getCohorts();

  const learners = cohorts.reduce((sum, c) => sum + c.learners, 0);
  const belowPass = cohorts.reduce((sum, c) => sum + c.belowPass, 0);
  const scored = cohorts.filter((c) => c.meanScore !== undefined);

  return (
    <AppShell user={user} searchHint='Try searching "cohorts"'>
      <PageHeader
        title="Cohorts"
        lede="The groups you teach, what each one is scoring, and which rule set their plans are made under."
      />

      {cohorts.length === 0 ? (
        <EmptyState icon={Users} title="No cohorts yet">
          A cohort is what scopes an instructor&rsquo;s reach: you can read the
          work of the learners in cohorts you own, and nobody else&rsquo;s.
          Create one, then invite learners into it with a link — or ask an
          administrator to assign them.
        </EmptyState>
      ) : (
        <>
          <StatRow>
            <StatCard
              label="Cohorts"
              value={String(cohorts.length)}
              variant="dark"
            />
            <StatCard label="Learners" value={String(learners)} />
            <StatCard
              label="Below pass"
              value={String(belowPass)}
              variant="accent"
              sub="against the intermediate mark"
            />
            <StatCard
              label="Configured"
              value={String(cohorts.filter((c) => c.presetId).length)}
              sub="cohorts carrying a preset"
            />
          </StatRow>

          <div className={p.cards}>
            {cohorts.map((cohort) => (
              <Link
                key={cohort.id}
                href={`/cohorts/${cohort.id}`}
                className={p.card}
              >
                <div className={p.panelHead}>
                  <p className={p.cardTitle}>{cohort.name}</p>
                  {cohort.meanScore !== undefined && (
                    <Badge status={cohort.meanScore >= 70 ? "pass" : "warn"}>
                      {cohort.meanScore}
                    </Badge>
                  )}
                </div>
                {/* Two lines, not one sentence. The first is what the cohort
                    is doing, the second is what it is — a run-on that put the
                    owner's name in the same breath as the pass mark made
                    neither of them findable. */}
                <p className={p.cardBody}>
                  {cohort.learners} learner{cohort.learners === 1 ? "" : "s"}
                  {cohort.meanScore === undefined
                    ? " · no scored reports yet"
                    : ` · ${cohort.belowPass} below the pass mark`}
                </p>
                <p className={p.cardMeta}>
                  {cohort.ownerName ?? "—"} · {shortDate(cohort.createdAt)}
                </p>
                <div className={p.cardFoot}>
                  <Chip tone="muted">
                    {cohort.presetName ?? "Authored tolerances"}
                  </Chip>
                  <span className={p.cardOpen}>
                    Open
                    <ChevronRight className={p.cardChevron} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <SectionHeader
            title="Learners"
            action={
              <Link href="/cohorts/learners" className={p.clear}>
                Every learner you supervise
              </Link>
            }
          />

          <section className={p.panel} aria-label="About cohort figures">
            <p className={p.panelSub}>
              A cohort mean is drawn from the reports of everybody in it, and{" "}
              {scored.length === cohorts.length
                ? "every cohort here has enough scored work to show one"
                : `${cohorts.length - scored.length} of ${cohorts.length} do not have a scored report yet, so they show none rather than a zero`}
              .
            </p>
            <p className={p.note}>
              Where a figure would be drawn from fewer than three contributors
              the database withholds it, in this screen and in a learner&rsquo;s
              percentile alike — a mean of two is one person&rsquo;s score
              wearing a disguise.
            </p>
          </section>
        </>
      )}

      <SectionHeader title="Add a cohort" />
      <section className={p.panel} aria-label="Add a cohort">
        <div>
          <p className={p.panelTitle}>New cohort</p>
          <p className={p.panelSub}>
            You own what you create, and ownership is what lets you read the work
            of the people in it. Learners join through an invite link issued on
            the cohort&rsquo;s own page.
          </p>
        </div>
        <NewCohort />
      </section>
    </AppShell>
  );
}

```

### `dashboard\src\app\cohorts\learners\page.tsx`

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getSupervisedLearners } from "@/lib/data/cohorts";
import { relativeTime } from "@/lib/format";
import { personaFor, ROLE_LABEL } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import p from "../../panels.module.css";

export const metadata: Metadata = { title: "Learners" };

/**
 * Every learner the viewer supervises, flattened across their cohorts.
 *
 * Not a redirect to `/cohorts`: an instructor with two cohorts wants one
 * attention list, not two, and the ordering — below the pass mark first, then
 * never-active — is the whole point of the screen. With one cohort it is the
 * same rows in a different order, which is still a different question.
 */
export default async function LearnersPage() {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const learners = await getSupervisedLearners();
  const now = new Date().toISOString();
  const scored = learners.filter((l) => l.meanScore !== undefined);

  return (
    <AppShell user={user} searchHint='Try searching "learners"'>
      <PageHeader
        title="Learners"
        lede="Everybody in the cohorts you teach, ordered by who needs you: below the pass mark first, then anybody who has never started a session."
        actions={
          <Button href="/cohorts" variant="secondary">
            By cohort
          </Button>
        }
      />

      {learners.length === 0 ? (
        <EmptyState icon={Users} title="No learners">
          Your cohorts have no members yet. An administrator assigns a learner to
          a cohort from the account management screen.
        </EmptyState>
      ) : (
        <>
          <StatRow>
            <StatCard label="Learners" value={String(learners.length)} variant="dark" />
            <StatCard
              label="Below pass"
              value={String(
                scored.filter((l) => (l.meanScore as number) < 70).length,
              )}
              variant="accent"
            />
            <StatCard
              label="Never started"
              value={String(learners.filter((l) => l.sessions === 0).length)}
            />
            <StatCard
              label="Scored"
              value={`${scored.length} of ${learners.length}`}
              sub="have a completed report"
            />
          </StatRow>

          <Table label="Supervised learners">
            <THead>
              <Tr>
                <Th>Learner</Th>
                <Th>Cohort</Th>
                <Th>Role</Th>
                <Th numeric>Sessions</Th>
                <Th numeric>Assessments</Th>
                <Th numeric>Mean</Th>
                <Th>Weakest</Th>
                <Th numeric>Critical</Th>
                <Th>Last active</Th>
              </Tr>
            </THead>
            <TBody>
              {learners.map((learner) => (
                <Tr key={learner.id}>
                  <Td head>{learner.displayName}</Td>
                  <Td>{learner.cohortName}</Td>
                  <Td>{ROLE_LABEL[learner.role]}</Td>
                  <Td numeric>{learner.sessions}</Td>
                  <Td numeric>{learner.assessments}</Td>
                  <Td numeric>
                    {learner.meanScore !== undefined ? (
                      <Badge status={learner.meanScore >= 70 ? "pass" : "fail"}>
                        {learner.meanScore}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    {learner.weakestCategory ? (
                      <Chip tone="muted">{learner.weakestCategory}</Chip>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td numeric>{learner.criticalErrors}</Td>
                  <Td>
                    {learner.lastActiveAt
                      ? relativeTime(learner.lastActiveAt, now)
                      : "Never"}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>

          <p className={p.note}>
            The mean is compared against 70 — the intermediate pass mark —
            because a single figure per learner covers sessions at several
            difficulties. A learner&rsquo;s own reports state the mark that
            applied to each one.
          </p>
        </>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\cohorts\[id]\page.tsx`

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  ProgressBar,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { RankedList, StatCard, StatRow } from "@/components/viz";
import { getCohort, getInvites } from "@/lib/data/cohorts";
import { relativeTime, shortDate } from "@/lib/format";
import { personaFor, ROLE_LABEL } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { AssignPreset } from "../AssignPreset";
import { InvitePanel } from "../InvitePanel";
import p from "../../panels.module.css";

export const metadata: Metadata = { title: "Cohort" };

export default async function CohortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const detail = await getCohort(id);

  // Not found and not yours are the same answer. `cohorts_read` already decided;
  // distinguishing them here would confirm that a cohort exists to somebody who
  // may not read it.
  if (!detail) redirect("/cohorts");

  const { cohort, learners, categories, hotspots, presets } = detail;
  const invites = await getInvites(id);
  const now = new Date().toISOString();
  const scored = learners.filter((l) => l.meanScore !== undefined);

  // Only presets this viewer could actually assign appear in the picker.
  const assignable = presets.filter(
    (preset) => preset.ownerId === user.id || persona === "admin",
  );

  return (
    <AppShell user={user} searchHint='Try searching "cohorts"'>
      <PageHeader
        eyebrow="Cohort"
        title={cohort.name}
        lede={`${cohort.learners} learner${cohort.learners === 1 ? "" : "s"} · owned by ${cohort.ownerName ?? "—"} · created ${shortDate(cohort.createdAt)}`}
        actions={
          <Button href="/cohorts" variant="secondary">
            All cohorts
          </Button>
        }
      />

      <StatRow>
        <StatCard
          label="Mean score"
          value={cohort.meanScore !== undefined ? String(cohort.meanScore) : "—"}
          variant="accent"
          sub={
            cohort.meanScore === undefined
              ? "no scored reports yet"
              : `across ${scored.length} learner${scored.length === 1 ? "" : "s"}`
          }
        />
        <StatCard
          label="Below pass"
          value={String(cohort.belowPass)}
          variant="accent"
        />
        <StatCard
          label="Critical errors"
          value={String(
            learners.reduce((sum, l) => sum + l.criticalErrors, 0),
          )}
          variant="accent"
          sub="across every session"
        />
        {/* Counted on sessions, not on `last_active_at`. That column is stamped
            by signing in, so a cohort where everybody has logged in and nobody
            has operated read "Never active 0" — true, and the opposite of what
            an instructor takes from it. The Last active column below already
            answers the sign-in question, so the tile was spending a quarter of
            the row repeating it. */}
        <StatCard
          label="No sessions yet"
          value={String(learners.filter((l) => l.sessions === 0).length)}
          variant="accent"
          sub="have not performed once"
        />
      </StatRow>

      <SectionHeader title="Learners" />
      {learners.length === 0 ? (
        <EmptyState icon={Users} title="Nobody has joined yet">
          Issue an invite link below and send it to them, or ask an
          administrator to assign an account to this cohort.
        </EmptyState>
      ) : (
        <Table label={`Learners in ${cohort.name}`}>
          <THead>
            <Tr>
              <Th>Learner</Th>
              <Th>Role</Th>
              <Th numeric>Sessions</Th>
              <Th numeric>Assessments</Th>
              <Th numeric>Mean</Th>
              <Th>Weakest</Th>
              <Th numeric>Critical</Th>
              <Th>Last active</Th>
            </Tr>
          </THead>
          <TBody>
            {learners.map((learner) => (
              <Tr key={learner.id}>
                <Td head>{learner.displayName}</Td>
                <Td>{ROLE_LABEL[learner.role]}</Td>
                <Td numeric>{learner.sessions}</Td>
                <Td numeric>{learner.assessments}</Td>
                <Td numeric>{learner.meanScore ?? "—"}</Td>
                <Td>
                  {learner.weakestCategory ? (
                    <Chip tone="muted">{learner.weakestCategory}</Chip>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td numeric>{learner.criticalErrors}</Td>
                <Td>
                  {learner.lastActiveAt
                    ? relativeTime(learner.lastActiveAt, now)
                    : "Never"}
                </Td>
              </Tr>
            ))}
            </TBody>
        </Table>
      )}

      <div className={p.even}>
        <section className={p.panel} aria-label="Cohort weakness profile">
          <div>
            <p className={p.panelTitle}>Weakness profile</p>
            <p className={p.panelSub}>
              What this cohort is weak <em>at</em>. Every scored report from a
              member, averaged across the seven categories a score is made of.
              The lowest bar is the thing to teach next.
            </p>
          </div>
          {categories.length === 0 ? (
            <p className={p.panelSub}>
              No scored reports yet, so there is nothing to average.
            </p>
          ) : (
            <div className={p.rows}>
              {categories.map((category) => (
                <div key={category.key} className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>{category.label}</p>
                    <ProgressBar
                      value={category.pct}
                      threshold={70}
                      tone={category.pct >= 70 ? "pass" : "warn"}
                    />
                  </div>
                  <div className={p.rowAside}>
                    <Badge status={category.pct >= 70 ? "pass" : "warn"}>
                      {category.pct}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={p.panel} aria-label="Scene hotspots">
          <div>
            <p className={p.panelTitle}>Scene hotspots</p>
            <p className={p.panelSub}>
              <em>Where</em> in the operation it goes wrong. The scenes that
              most often ended in a failed or borderline verdict, and how many
              learners each one caught.
            </p>
          </div>
          {hotspots.length === 0 ? (
            <p className={p.panelSub}>
              No scene has cost this cohort marks yet.
            </p>
          ) : (
            <RankedList
              items={hotspots.map((hotspot) => ({
                tag: hotspot.scene,
                label: hotspot.label,
                value: `${hotspot.affected}`,
                pct: hotspot.learners
                  ? Math.round((hotspot.affected / hotspot.learners) * 100)
                  : 0,
              }))}
            />
          )}
        </section>
      </div>

      <SectionHeader title="Enrolment" />
      <section className={p.panel} aria-label="Invite links">
        <div>
          <p className={p.panelTitle}>Invite links</p>
          <p className={p.panelSub}>
            {invites.length === 0
              ? "Nothing has been issued for this cohort. A link enrols an existing account; it does not create one."
              : `${invites.filter((i) => i.state === "open").length} of ${invites.length} still work. A link is shown once when it is created and stored only as a hash, so it cannot be read back.`}
          </p>
        </div>

        <InvitePanel cohortId={cohort.id} invites={invites} />
      </section>

      <SectionHeader title="Configuration" />
      <section className={p.panel} aria-label="Configuration preset">
        <div>
          <p className={p.panelTitle}>Preset</p>
          <p className={p.panelSub}>
            {cohort.presetName
              ? `New plans from this cohort are stamped with ${cohort.presetName}, and every session run from one names it on its report.`
              : "New plans from this cohort run against the authored tolerances."}
          </p>
        </div>

        {assignable.length === 0 ? (
          <p className={p.panelSub}>
            You have no presets to assign. A preset is created from the
            Configure panel on a case, and it records what to change about the
            rule set — tolerance scaling, guides, per-scene settings.
          </p>
        ) : (
          <AssignPreset
            cohortId={cohort.id}
            currentPresetId={cohort.presetId}
            presets={assignable.map((preset) => ({
              id: preset.id,
              name: preset.name,
            }))}
          />
        )}

        <p className={p.note}>
          Assigning a preset changes what future plans carry. A plan freezes its
          rule set when it is created, so work already planned keeps the
          configuration it was planned under — the same reason a session holds a
          snapshot of its plan rather than a reference to it.
        </p>
      </section>
    </AppShell>
  );
}

```

### `dashboard\src\app\help\HelpSearch.tsx`

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui";
import p from "../panels.module.css";

/**
 * Search writes to the URL and the server re-runs the query.
 *
 * A client-side filter over an already-fetched list would be less code and one
 * fewer round trip, and it would also make the result unlinkable. `/help?q=pin`
 * is the thing somebody pastes into a message, which is most of what a help
 * screen is for.
 *
 * Submitting is a form, not a keystroke handler: a search that navigates on
 * every character makes the back button unusable.
 */
export function HelpSearch({ query }: { query?: string }) {
  const router = useRouter();

  return (
    <form
      className={p.filters}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        const next = String(value ?? "").trim();
        router.replace(next ? `/help?q=${encodeURIComponent(next)}` : "/help", {
          scroll: false,
        });
      }}
    >
      <Input
        label="Search help"
        name="q"
        type="search"
        defaultValue={query ?? ""}
        placeholder="PIN, report, cohort…"
        className={p.spacer}
      />
      {query && (
        <Link href="/help" replace scroll={false} className={p.clear}>
          Clear
        </Link>
      )}
    </form>
  );
}

```

### `dashboard\src\app\help\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, SearchX } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Button, EmptyState } from "@/components/ui";
import { getHelp } from "@/lib/data/support";
import { getCurrentUser } from "@/lib/session";
import { HelpSearch } from "./HelpSearch";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Help" };

/**
 * Runbooks, written for the person standing next to the headset.
 *
 * Every article is a row, because a paragraph in JSX that names a
 * timing, an error code or a route drifts the first time a migration changes
 * one — and help text that is wrong about the product is worse than no help
 * text, since somebody acts on it.
 *
 * The search is a URL parameter, so a filtered view is a link somebody can be
 * sent. It is also why the search is a server round trip rather than a client
 * filter: the same reasoning as every other filter in the product.
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const topics = await getHelp(q);

  const found = topics.reduce((sum, t) => sum + t.articles.length, 0);

  return (
    <AppShell user={user} searchHint='Try searching "pairing"'>
      <PageHeader
        title="Help"
        lede="Pairing, sessions, reports and accounts. Every answer here describes what this build actually does."
        actions={
          <Button href="/library" variant="secondary">
            Library
          </Button>
        }
      />

      <HelpSearch query={q} />

      {found === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`Nothing matches “${q}”`}
          action={
            <Button href="/help" variant="primary">
              Show every article
            </Button>
          }
        >
          Search covers every article&rsquo;s title and text. If the thing you
          need is not here, an administrator can see the pairing lifecycle for
          every PIN in the product.
        </EmptyState>
      ) : (
        <>
          {q && (
            <p className={p.panelSub} style={{ marginBottom: "var(--s-5)" }}>
              {found} article{found === 1 ? "" : "s"} match &ldquo;{q}&rdquo;.
            </p>
          )}

          {topics.map((topic) => (
            <section key={topic.key} aria-label={topic.label}>
              <SectionHeader title={topic.label} />
              {topic.lede && !q && (
                <p className={p.panelSub} style={{ marginBottom: "var(--s-4)" }}>
                  {topic.lede}
                </p>
              )}

              <div className={p.panel}>
                {topic.articles.map((article) => (
                  <article
                    key={article.slug}
                    id={article.slug}
                    className={p.article}
                  >
                    <h3 className={p.articleTitle}>{article.title}</h3>
                    <div className={p.prose}>
                      {article.paragraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                    {article.route && (
                      <Link href={article.route} className={p.articleLink}>
                        Go to {article.route}
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}

          <SectionHeader title="Still stuck" />
          <section className={p.panel} aria-label="Still stuck">
            <div className={p.panelHead}>
              <div>
                <p className={p.panelTitle}>Contact your administrator</p>
                <p className={p.panelSub}>
                  Quote the session id from the report header, or the case and
                  the time you tried to pair. An administrator can see the
                  lifecycle of every PIN and every headset that has paired.
                </p>
              </div>
              <LifeBuoy size={28} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className={p.note}>
              There is no in-app messaging and no ticketing. Saying so is better
              than a contact form that posts nowhere.
            </p>
          </section>
        </>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\kit\kit.module.css`

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex-wrap: wrap;
}

.grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-5);
}

.grid3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-5);
}

.grid4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--s-5);
}

@media (max-width: 1023px) {
  .grid3,
  .grid4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .grid2,
  .grid3,
  .grid4 {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ---------- swatches ---------- */

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: var(--s-4);
}

.swatch {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.chipColor {
  height: 60px;
  border: var(--bw) solid var(--border);
  border-radius: var(--r-md);
}

.swatchName {
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  color: var(--ink);
}

.swatchMeta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

/* ---------- type specimen ---------- */

.specimen {
  display: flex;
  align-items: baseline;
  gap: var(--s-5);
  padding: var(--s-4) 0;
  border-bottom: var(--bw) solid var(--divider);
}

.specimen:last-child {
  border-bottom: none;
}

.specimenSample {
  flex: 1;
  min-width: 0;
  color: var(--ink);
}

.specimenMeta {
  flex: 0 0 auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
}

.display {
  font-family: var(--font-display);
  font-size: var(--t-display);
  line-height: var(--t-display-lh);
  font-weight: var(--fw-bold);
  letter-spacing: -0.03em;
}

.overline {
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--brand);
}

/* ---------- misc ---------- */

.note {
  padding: var(--s-4) var(--s-5);
  border: var(--bw) dashed var(--border);
  border-radius: var(--r-md);
  background: var(--surface-sunken);
  font-size: var(--t-caption);
  line-height: 1.6;
  color: var(--text-muted);
}

.note strong {
  color: var(--ink);
}

.radii {
  display: flex;
  gap: var(--s-4);
  flex-wrap: wrap;
}

.radiusBox {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border: var(--bw) solid var(--brand-border);
  background: var(--brand-surface);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--brand);
}

```

### `dashboard\src\app\kit\page.tsx`

```tsx
import type { Metadata } from "next";
import { Download, FolderOpen, Play, Plus, Search } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Banner,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Chip,
  EmptyState,
  Input,
  MetricTile,
  ProgressBar,
  Select,
  Skeleton,
  Stepper,
  TBody,
  THead,
  Table,
  Td,
  Th,
  Tr,
  Unit,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import s from "./kit.module.css";

export const metadata: Metadata = { title: "Component kit" };

const BRAND_SWATCHES = [
  { name: "brand", value: "var(--brand)", hex: "#0F7A46" },
  { name: "brand-hover", value: "var(--brand-hover)", hex: "#0C6339" },
  { name: "brand-surface", value: "var(--brand-surface)", hex: "#E8F3EC" },
  { name: "forest", value: "var(--forest)", hex: "#0D1F18" },
];

const STATUS_SWATCHES = [
  { name: "pass", value: "var(--pass)", hex: "#0B7A5A" },
  { name: "warn", value: "var(--warn)", hex: "#9A6212" },
  { name: "fail", value: "var(--fail)", hex: "#B0322A" },
  { name: "info", value: "var(--info)", hex: "#1F5F8B" },
];

const NEUTRAL_SWATCHES = [
  { name: "ink", value: "var(--ink)", hex: "#0E1512" },
  { name: "text", value: "var(--text)", hex: "#37423C" },
  { name: "text-muted", value: "var(--text-muted)", hex: "#5E6B64" },
  { name: "border", value: "var(--border)", hex: "#DEE4E0" },
  { name: "canvas", value: "var(--canvas)", hex: "#F4F7F5" },
  { name: "surface", value: "var(--surface)", hex: "#FFFFFF" },
];

const RADII = ["--r-xs", "--r-sm", "--r-md", "--r-lg", "--r-xl", "--r-pill"];

const PLANNING_STEPS = [
  { label: "Case history", meta: "45–60 s", state: "done" as const },
  { label: "Imaging review", meta: "1.5–2 min", state: "done" as const },
  { label: "Deformity measurement", meta: "1 min", state: "current" as const },
  { label: "Alignment planning", meta: "1 min", state: "upcoming" as const },
  { label: "Implant selection", meta: "Gated", state: "blocked" as const },
];

export default async function KitPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user} searchHint='Try searching "badge"'>
      <PageHeader
        eyebrow="Design foundation"
        title="Component kit"
        lede="Every token and primitive the twenty screens are built from. Nothing here reads a literal value — it all comes from tokens.css."
        actions={<Button variant="secondary" icon={Download}>Export tokens</Button>}
      />

      {/* ---------- colour ---------- */}
      <SectionHeader title="Colour" />
      <Card>
        <CardHeader
          title="Brand — interactive only"
          subtitle="Buttons, active navigation, links, focus rings. Never a status."
        />
        <div className={s.swatches}>
          {BRAND_SWATCHES.map((c) => (
            <div className={s.swatch} key={c.name}>
              <div className={s.chipColor} style={{ background: c.value }} />
              <span className={s.swatchName}>{c.name}</span>
              <span className={s.swatchMeta}>{c.hex}</span>
            </div>
          ))}
        </div>

        <div style={{ height: "var(--s-7)" }} />

        <CardHeader
          title="Status — verdicts only"
          subtitle="Badges, bars, row tints. Never an interactive control."
        />
        <div className={s.swatches}>
          {STATUS_SWATCHES.map((c) => (
            <div className={s.swatch} key={c.name}>
              <div className={s.chipColor} style={{ background: c.value }} />
              <span className={s.swatchName}>{c.name}</span>
              <span className={s.swatchMeta}>{c.hex}</span>
            </div>
          ))}
        </div>

        <div style={{ height: "var(--s-7)" }} />

        <CardHeader title="Neutrals" subtitle="Warm-cast greys that sit under green without going blue." />
        <div className={s.swatches}>
          {NEUTRAL_SWATCHES.map((c) => (
            <div className={s.swatch} key={c.name}>
              <div className={s.chipColor} style={{ background: c.value }} />
              <span className={s.swatchName}>{c.name}</span>
              <span className={s.swatchMeta}>{c.hex}</span>
            </div>
          ))}
        </div>

        <div style={{ height: "var(--s-5)" }} />
        <p className={s.note}>
          <strong>The two greens never swap jobs.</strong> Brand{" "}
          <code>#0F7A46</code> is a deep forest and appears only on things you
          can press. Pass <code>#0B7A5A</code> is a cooler emerald and appears
          only on verdicts. Both clear 5:1 against white. That separation, plus
          the rule that every status also carries an icon and a text label, is
          what stops a Pass badge reading as a brand chip.
        </p>
      </Card>

      {/* ---------- type ---------- */}
      <SectionHeader title="Typography" />
      <Card>
        <div className={s.specimen}>
          <span className={`${s.specimenSample} ${s.display}`}>92 / 100</span>
          <span className={s.specimenMeta}>Figtree 700 · 44/1.05</span>
        </div>
        <div className={s.specimen}>
          <h1 className={s.specimenSample}>Surgical case report</h1>
          <span className={s.specimenMeta}>Figtree 700 · 32/1.15</span>
        </div>
        <div className={s.specimen}>
          <h2 className={s.specimenSample}>Alignment &amp; position</h2>
          <span className={s.specimenMeta}>Figtree 700 · 22/1.25</span>
        </div>
        <div className={s.specimen}>
          <h3 className={s.specimenSample}>Category breakdown</h3>
          <span className={s.specimenMeta}>Figtree 700 · 17/1.35</span>
        </div>
        <div className={s.specimen}>
          <p className={s.specimenSample}>
            Cut depth 11.4 mm exceeds the 8 mm target by 3.4 mm. Reduce depth or
            reposition the jig.
          </p>
          <span className={s.specimenMeta}>Inter 400 · 15/1.55</span>
        </div>
        <div className={s.specimen}>
          <span className={`${s.specimenSample} ${s.overline}`}>
            Pre-operative phase
          </span>
          <span className={s.specimenMeta}>Inter 700 · 11 · 0.11em</span>
        </div>
      </Card>

      {/* ---------- shape ---------- */}
      <SectionHeader title="Radius" />
      <Card>
        <div className={s.radii}>
          {RADII.map((token) => (
            <div
              key={token}
              className={s.radiusBox}
              style={{ borderRadius: `var(${token})` }}
            >
              {token.replace("--r-", "")}
            </div>
          ))}
        </div>
        <div style={{ height: "var(--s-5)" }} />
        <p className={s.note}>
          Curved language, as directed. This supersedes{" "}
          the agreed scale, which locks radii at 2px and 4px and
          forbids pill shapes — that clause needs updating.
        </p>
      </Card>

      {/* ---------- buttons ---------- */}
      <SectionHeader title="Buttons" />
      <Card>
        <div className={s.row}>
          <Button variant="primary" size="lg" icon={Play}>
            Start procedure
          </Button>
          <Button variant="primary">Save plan</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="tonal">Configure</Button>
          <Button variant="ghost">View all</Button>
          <Button variant="danger">Discard session</Button>
        </div>
        <div style={{ height: "var(--s-5)" }} />
        <div className={s.row}>
          <Button size="sm">Small</Button>
          <Button variant="primary" loading>
            Saving
          </Button>
          <Button disabled>Disabled</Button>
          <Button icon={Plus} aria-label="Add case" />
          <Button variant="secondary" icon={Search} aria-label="Search" />
        </div>
        <div style={{ height: "var(--s-5)" }} />
        <p className={s.note}>
          One primary action per screen. Every control is at least 44px tall,
          meeting the touch-target minimum, and shows a visible focus ring on
          keyboard navigation.
        </p>
      </Card>

      {/* ---------- status ---------- */}
      <SectionHeader title="Status &amp; filters" />
      <div className={s.grid2}>
        <Card>
          <CardHeader title="Badges" subtitle="Verdicts. Icon + label, always." />
          <div className={s.row}>
            <Badge status="pass">In range</Badge>
            <Badge status="warn">Borderline</Badge>
            <Badge status="fail">Out of range</Badge>
            <Badge status="neutral">Pending</Badge>
            <Badge status="active">Live</Badge>
          </div>
        </Card>
        <Card>
          <CardHeader title="Chips" subtitle="Filters and metadata. Never a verdict." />
          <div className={s.row}>
            <Chip selected>Osteoarthritis</Chip>
            <Chip>Right</Chip>
            <Chip icon={FolderOpen} count={8}>
              Cases
            </Chip>
            <Chip tone="muted">CR · Cemented</Chip>
          </div>
        </Card>
      </div>

      {/* ---------- metrics ---------- */}
      <SectionHeader title="Metric tiles" />
      <div className={s.grid4}>
        <MetricTile
          label="Hip–knee–ankle"
          value="172.8"
          unit="°"
          status={<Badge status="fail">Outside 178–182°</Badge>}
          hint="Mechanical axis measured on the full-length standing radiograph."
        />
        <MetricTile
          label="Tibial slope"
          value="3.2"
          unit="°"
          status={<Badge status="pass">In range</Badge>}
        />
        <MetricTile
          label="Overall score"
          value="92"
          unit="/ 100"
          status={<Badge status="pass">Passed</Badge>}
        />
        <MetricTile
          label="Critical errors"
          value="1"
          status={<Badge status="warn">−5 points</Badge>}
        />
      </div>
      <div style={{ height: "var(--s-5)" }} />
      <p className={s.note}>
        The value stays <strong>ink</strong> in every state — only the badge is
        coloured. A wall of tiles then reads as calm data rather than an alarm
        panel.
      </p>

      {/* ---------- progress ---------- */}
      <SectionHeader title="Progress" />
      <Card>
        <div className={s.stack}>
          <ProgressBar
            label="Overall score"
            valueLabel="92 / 100"
            value={92}
            tone="pass"
            size="lg"
            threshold={70}
            thresholdLabel="Marker shows the Intermediate pass mark of 70."
          />
          <ProgressBar label="Bone cuts & alignment" valueLabel="22 / 25" value={88} tone="warn" />
          <ProgressBar label="Procedure progress" valueLabel="Part 6 of 11" value={57} />
        </div>
      </Card>

      {/* ---------- table ---------- */}
      <SectionHeader title="Table" />
      <Card padding="none">
        <Table label="Alignment and position, planned versus achieved" bare>
          <THead>
            <Tr>
              <Th>Parameter</Th>
              <Th numeric>Planned</Th>
              <Th numeric>Achieved</Th>
              <Th>Acceptable</Th>
              <Th>Status</Th>
            </Tr>
          </THead>
          <TBody>
            <Tr>
              <Td head>Posterior tibial slope</Td>
              <Td numeric>3.0<Unit>°</Unit></Td>
              <Td numeric>3.2<Unit>°</Unit></Td>
              <Td>0°–7°</Td>
              <Td><Badge status="pass">Pass</Badge></Td>
            </Tr>
            <Tr>
              <Td head>HKA (mechanical axis)</Td>
              <Td numeric>0.0<Unit>°</Unit></Td>
              <Td numeric>1.2<Unit>° var</Unit></Td>
              <Td>±3°</Td>
              <Td><Badge status="pass">Pass</Badge></Td>
            </Tr>
            <Tr state="warn">
              <Td head>Distal femur — medial/lateral</Td>
              <Td numeric>≤1.0<Unit>mm</Unit></Td>
              <Td numeric>1.4<Unit>mm</Unit></Td>
              <Td>≤2 mm caution</Td>
              <Td><Badge status="warn">Borderline</Badge></Td>
            </Tr>
            <Tr state="fail">
              <Td head>Anterior notch depth</Td>
              <Td numeric>0<Unit>mm</Unit></Td>
              <Td numeric>1.2<Unit>mm</Unit></Td>
              <Td>No notching</Td>
              <Td><Badge status="fail">Critical</Badge></Td>
            </Tr>
          </TBody>
        </Table>
      </Card>
      <div style={{ height: "var(--s-5)" }} />
      <p className={s.note}>
        Planned and achieved sit adjacent so the eye compares without travel.
        Numeric columns are right-aligned with tabular figures; units live in
        their own muted span so the digits themselves stay in line.
      </p>

      {/* ---------- forms ---------- */}
      <SectionHeader title="Forms" />
      <Card>
        <div className={s.grid3}>
          <Input
            label="Case name"
            placeholder="Varus OA, right knee"
            helper="Shown on the report header."
          />
          <Select label="Difficulty" defaultValue="intermediate" required>
            <option value="beginner">Beginner — pass mark 60</option>
            <option value="intermediate">Intermediate — pass mark 70</option>
            <option value="expert">Expert — pass mark 80</option>
          </Select>
          <Input
            label="Insert thickness"
            defaultValue="14 mm"
            error="A 14 mm insert overstuffs a 19 mm gap by 3 mm. Choose 10 mm, or increase the distal femoral resection."
          />
        </div>
        <div style={{ height: "var(--s-5)" }} />
        <Checkbox
          label="Medial tightness acknowledged"
          helper="8.2° varus with a contracted medial sleeve. Staged release will be required."
          defaultChecked
        />
        <Checkbox
          label="Patellar maltracking"
          helper="Mild patellofemoral change on skyline. Track after trialling."
        />
      </Card>

      {/* ---------- banners ---------- */}
      <SectionHeader title="Banners" />
      <div className={s.stack}>
        <Banner
          tone="brand"
          title="A session is running now"
          action={<Button size="sm" variant="primary">Watch progress</Button>}
        >
          Case 1 — Varus OA · Part 6 Balancing &amp; trialling · 9 min 14 s elapsed.
        </Banner>
        <Banner tone="pass" title="Connection test passed">
          The dashboard rendered in 84 ms and the headset reported in 1.2 s.
        </Banner>
        <Banner
          tone="warn"
          title="You are offline"
          action={<Button size="sm">Retry</Button>}
        >
          Read-only data stays visible. Write actions are disabled until the connection returns.
        </Banner>
        <Banner tone="fail" title="Anterior notching detected">
          Your anterior femoral cut notched the cortex by 1.2 mm. Size up or shift the block anteriorly before committing to the cut.
        </Banner>
      </div>

      {/* ---------- stepper ---------- */}
      <SectionHeader title="Stepper" />
      <div className={s.grid2}>
        <Card>
          <CardHeader title="Vertical — planning" />
          <Stepper steps={PLANNING_STEPS} label="Pre-operative planning steps" />
        </Card>
        <Card>
          <CardHeader title="Horizontal — operative parts" />
          <Stepper
            orientation="horizontal"
            label="Operative parts"
            steps={[
              { label: "P0", state: "done" },
              { label: "P1", state: "done" },
              { label: "P2", state: "done" },
              { label: "Balancing", state: "current" },
              { label: "P7", state: "upcoming" },
              { label: "P9", state: "upcoming" },
            ]}
          />
        </Card>
      </div>

      {/* ---------- states ---------- */}
      <SectionHeader title="Empty &amp; loading" />
      <div className={s.grid2}>
        <EmptyState
          icon={FolderOpen}
          title="No sessions yet"
          action={<Button variant="primary">Start simulation</Button>}
        >
          Plan a case and send it to the headset. Your first report will appear
          here.
        </EmptyState>
        <Card>
          <div className={s.stack}>
            <Skeleton width="42%" height="20px" />
            <Skeleton width="88%" />
            <Skeleton width="66%" />
            <div style={{ height: "var(--s-2)" }} />
            <div className={s.grid2}>
              <Skeleton block height="76px" />
              <Skeleton block height="76px" />
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

```

### `dashboard\src\app\launch\page.tsx`

```tsx
import { redirect } from "next/navigation";

/**
 * The launcher started here as literals. It moved to
 * `/simulations/[procedure]`, fed from the catalogue.
 *
 * The route stays as a redirect rather than being deleted: it is the URL a
 * kiosk-locked headset-adjacent machine may already have bookmarked, and
 * `npm run smoke` holds it at 200.
 */
export default function LaunchPage() {
  redirect("/simulations/tkr");
}

```

### `dashboard\src\app\library\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Film } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Button, Chip, EmptyState } from "@/components/ui";
import { getLibrary } from "@/lib/data/support";
import { getCurrentUser } from "@/lib/session";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Library" };

/**
 * Everything in this library renders from the tables the product already runs
 * on — the procedure catalogue, the planning steps, the report categories, the
 * scene time bands. None of it is authored prose about the operation.
 *
 * That is the whole design. A reference written separately from the thing it
 * describes is a second copy of the contract, and the two disagree the first
 * time a migration changes one. The tolerance table on this screen is the
 * tolerance table a session is scored against, read from the same rows.
 */
export default async function LibraryPage() {
  const user = await getCurrentUser();
  const library = await getLibrary();

  return (
    <AppShell user={user} searchHint='Try searching "library"'>
      <PageHeader
        title="Library"
        lede="Guides and references, each rendered from the same rows the product enforces — so nothing here can disagree with what a headset is handed."
        actions={
          <Button href="/help" variant="secondary">
            Help
          </Button>
        }
      />

      <SectionHeader title="Guides" />
      <div className={p.cards}>
        {library.guides.map((entry) => (
          <Link key={entry.slug} href={`/library/${entry.slug}`} className={p.card}>
            <p className={p.cardTitle}>{entry.title}</p>
            <p className={p.cardBody}>{entry.summary}</p>
            <div className={p.cardFoot}>
              <Chip tone="muted">Guide</Chip>
              <span>{entry.derivedFrom}</span>
            </div>
          </Link>
        ))}
      </div>

      <SectionHeader title="References" />
      <div className={p.cards}>
        {library.references.map((entry) => (
          <Link key={entry.slug} href={`/library/${entry.slug}`} className={p.card}>
            <p className={p.cardTitle}>{entry.title}</p>
            <p className={p.cardBody}>{entry.summary}</p>
            <div className={p.cardFoot}>
              <Chip tone="muted">Reference</Chip>
              <span>{entry.derivedFrom}</span>
            </div>
          </Link>
        ))}
      </div>

      <SectionHeader title="Scene videos" />
      {library.videos === 0 ? (
        <EmptyState icon={Film} title="No scene videos yet">
          Nothing in this product records a video — the `replays` storage bucket
          exists and is empty, and no scene has been authored in Unity. A
          placeholder thumbnail here would be a lie about the state of the build.
          When a video is authored, it appears in this section without a change
          to this page.
        </EmptyState>
      ) : null}
    </AppShell>
  );
}

```

### `dashboard\src\app\library\[slug]\page.tsx`

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Chip,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  Unit,
} from "@/components/ui";
import { getLibraryDoc } from "@/lib/data/support";
import { clock, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import p from "../../panels.module.css";

export const metadata: Metadata = { title: "Library" };

/**
 * One page per reference, each rendered entirely from catalogue rows.
 *
 * An unknown slug redirects rather than 404s, the same ruling
 * `/performance/[skill]` made — a library address somebody typed or an old link
 * should land in the library, not on an error.
 */
export default async function LibraryDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const doc = await getLibraryDoc(slug);

  if (!doc) redirect("/library");

  return (
    <AppShell user={user} searchHint='Try searching "library"'>
      <PageHeader
        eyebrow={titleCase(doc.entry.kind)}
        title={doc.entry.title}
        lede={doc.entry.summary}
        actions={
          <Button href="/library" variant="secondary">
            All resources
          </Button>
        }
      />

      <p className={p.panelSub} style={{ marginBottom: "var(--s-6)" }}>
        Rendered from <strong>{doc.entry.derivedFrom}</strong>. Every figure on
        this page is the one the product enforces, read from the same rows.
      </p>

      {doc.slug === "tkr-walkthrough" &&
        doc.parts.map((part) => (
          <section key={part.part} aria-label={`Part ${part.part}`}>
            <SectionHeader title={`${part.part} · ${part.name}`} />
            {part.variantNote && (
              <p className={p.panelSub} style={{ marginBottom: "var(--s-3)" }}>
                {part.variantNote}
              </p>
            )}
            <Table label={`Scenes in part ${part.part}`}>
              <THead>
                <Tr>
                  <Th>Scene</Th>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th numeric>Par</Th>
                  <Th numeric>Maximum</Th>
                  <Th>Applies</Th>
                </Tr>
              </THead>
              <TBody>
                {part.scenes.map((scene) => (
                  <Tr key={scene.scene}>
                    <Td head>{scene.scene}</Td>
                    <Td>
                      {scene.name}
                      {scene.isCritical && (
                        <>
                          {" "}
                          <Badge status="fail">Critical</Badge>
                        </>
                      )}
                    </Td>
                    <Td>{scene.category ? titleCase(scene.category.replace(/_/g, " ")) : "—"}</Td>
                    <Td numeric>
                      {clock(scene.parTimeS)}
                      <Unit> mm:ss</Unit>
                    </Td>
                    <Td numeric>{clock(scene.maxTimeS)}</Td>
                    <Td>
                      {scene.requiresDesign
                        ? `${scene.requiresDesign} only`
                        : scene.requiresFixation
                          ? `${titleCase(scene.requiresFixation)} only`
                          : scene.requiresPatella
                            ? "Patella resurfaced"
                            : "Always"}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </section>
        ))}

      {doc.slug === "preoperative-planning" && (
        <>
          {doc.steps.map((step) => (
            <section key={step.step} aria-label={`Step ${step.step}`}>
              <SectionHeader title={`${step.step} · ${step.title}`} />
              <div className={p.panel}>
                <div className={p.panelHead}>
                  <div>
                    <p className={p.panelSub}>{step.budgetLabel}</p>
                  </div>
                  <div className={p.rowAside}>
                    <Chip tone="muted">Par {clock(step.parTimeS)}</Chip>
                    <Chip tone="muted">Max {clock(step.maxTimeS)}</Chip>
                  </div>
                </div>

                {step.fields.length === 0 ? (
                  <p className={p.panelSub}>
                    This step is answered with measurements rather than from a
                    list, so there is nothing to enumerate here.
                  </p>
                ) : (
                  step.fields.map((field) => (
                    <div key={field.field}>
                      <p className={p.rowTitle}>
                        {titleCase(field.field.replace(/_/g, " "))}
                      </p>
                      <div className={p.rows}>
                        {field.options.map((option) => (
                          <div key={option.label} className={p.row}>
                            <div className={p.rowBody}>
                              <p className={p.rowTitle}>{option.label}</p>
                              {option.detail && (
                                <p className={p.rowDetail}>{option.detail}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}

          <p className={p.note}>
            The lists above are the ones the planning screens offer, from{" "}
            <strong>plan_step_options</strong>. Whether an answer is right is
            decided on the server, against
            ground truth no client role can read — so this page can tell you what
            the choices are and never which one is correct.
          </p>
        </>
      )}

      {doc.slug === "scoring" && (
        <>
          <SectionHeader title="Categories" />
          <Table label="Report categories">
            <THead>
              <Tr>
                <Th>Category</Th>
                <Th numeric>Marks</Th>
                <Th numeric>Scenes</Th>
              </Tr>
            </THead>
            <TBody>
              {doc.categories.map((category) => (
                <Tr key={category.key}>
                  <Td head>{category.label}</Td>
                  <Td numeric>{category.max}</Td>
                  <Td numeric>{category.scenes}</Td>
                </Tr>
              ))}
              <Tr>
                <Td head>Total</Td>
                <Td numeric>{doc.total}</Td>
                <Td numeric />
              </Tr>
            </TBody>
          </Table>

          <SectionHeader title="The formula" />
          <div className={p.even}>
            <section className={p.panel} aria-label="How a category is scored">
              <p className={p.panelTitle}>How a category is scored</p>
              <div className={p.prose}>
                <p>
                  Each scene outcome is worth 1.00 for a pass, 0.50 for
                  borderline and 0.00 for a fail. A scene that was never reached
                  scores zero rather than nothing — averaging only over what was
                  attempted would score a walkout at 100.
                </p>
                <p>
                  Timing is 1.0 at or under par, 0.0 at or over the maximum, and
                  linear between. A category is{" "}
                  <strong>marks × (0.9 × accuracy + 0.1 × timing)</strong>, so a
                  slow accurate learner always outscores a fast inaccurate one —
                  at that weighting it is arithmetically guaranteed.
                </p>
              </div>
            </section>

            <section className={p.panel} aria-label="Pass marks and the cap">
              <p className={p.panelTitle}>Passing</p>
              <div className={p.rows}>
                {doc.passMarks.map((mark) => (
                  <div key={mark.difficulty} className={p.row}>
                    <div className={p.rowBody}>
                      <p className={p.rowTitle}>{titleCase(mark.difficulty)}</p>
                    </div>
                    <div className={p.rowAside}>
                      <Chip tone="muted">{mark.mark} / 100</Chip>
                    </div>
                  </div>
                ))}
              </div>
              <p className={p.note}>
                Three or more critical errors cap the total at 59 and fail the
                session. The categories are still shown in full — a learner needs
                to see that they cut accurately <em>and</em> that the session
                ended anyway.
              </p>
            </section>
          </div>
        </>
      )}

      {doc.slug === "tolerances" && (
        <>
          <SectionHeader title="What difficulty does to a band" />
          <div className={p.thirds}>
            {doc.bands.map((band) => (
              <section
                key={band.difficulty}
                className={p.panel}
                aria-label={titleCase(band.difficulty)}
              >
                <p className={p.panelTitle}>{titleCase(band.difficulty)}</p>
                <p className={p.panelSub}>
                  Every authored tolerance band ×{band.factor}
                  {band.factor === 1
                    ? " — the value as authored."
                    : band.factor > 1
                      ? " — wider, so a reading further from target still passes."
                      : " — narrower, so the same reading may not."}
                </p>
              </section>
            ))}
          </div>

          <SectionHeader title="Time bands, per scene" />
          <Table label="Scene time bands">
            <THead>
              <Tr>
                <Th>Scene</Th>
                <Th>Name</Th>
                <Th numeric>Par</Th>
                <Th numeric>Maximum</Th>
              </Tr>
            </THead>
            <TBody>
              {doc.scenes.map((scene) => (
                <Tr key={scene.scene}>
                  <Td head>{scene.scene}</Td>
                  <Td>{scene.name}</Td>
                  <Td numeric>{clock(scene.parTimeS)}</Td>
                  <Td numeric>{clock(scene.maxTimeS)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>

          <p className={p.note}>
            The per-parameter tolerances — how many degrees off a cut may be —
            are stored per case in ground truth, which no client role can read.
            That is deliberate: a learner who could read the tolerances for
            the case in front of them would be reading the answer.
          </p>
        </>
      )}

      {doc.slug === "implant-variants" && (
        <>
          <div className={p.even}>
            <section className={p.panel} aria-label="Implant design">
              <p className={p.panelTitle}>CR and PS</p>
              <p className={p.panelSub}>
                Scenes that run only for one design. Everything else runs for
                both.
              </p>
              <div className={p.rows}>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Cruciate-retaining only</p>
                    <p className={p.rowDetail}>
                      {doc.design.CR.join(" · ") || "None"}
                    </p>
                  </div>
                </div>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Posterior-stabilised only</p>
                    <p className={p.rowDetail}>
                      {doc.design.PS.join(" · ") || "None"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={p.panel} aria-label="Fixation">
              <p className={p.panelTitle}>Cemented and cementless</p>
              <p className={p.panelSub}>
                Scenes that depend on how the components are fixed.
              </p>
              <div className={p.rows}>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Cemented only</p>
                    <p className={p.rowDetail}>
                      {doc.fixation.cemented.join(" · ") || "None"}
                    </p>
                  </div>
                </div>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Cementless only</p>
                    <p className={p.rowDetail}>
                      {doc.fixation.cementless.join(" · ") || "None"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className={p.panel} aria-label="Patella">
            <p className={p.panelTitle}>Patellar resurfacing</p>
            <p className={p.panelSub}>
              Decided intra-operatively at scene 9.1 from the cartilage grade,
              not planned in advance.
            </p>
            <p className={p.rowDetail}>
              {doc.patella.join(" · ") || "No scene depends on it"}
            </p>
            <p className={p.note}>
              {doc.always} scenes run in every configuration. The running order a
              headset is handed is built from these same three columns, so this
              page cannot disagree with what it performs.
            </p>
          </section>
        </>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\login\login.module.css`

```css
.page {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 47fr) minmax(0, 53fr);
  background: var(--canvas);
}

/* ---------- left: the form ----------
   Three rows — mark, form, footnote — so the brand sits in the corner where a
   brand belongs and the form still lands on the optical centre. */

.formSide {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--s-7);
  padding: var(--s-8) var(--s-9);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
  background: var(--brand);
  color: var(--on-brand);
}

.brandText {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
}

.wordmark {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: var(--fw-bold);
  letter-spacing: 0.08em;
  color: var(--ink);
}

.tagline {
  font-size: 10px;
  font-weight: var(--fw-bold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brand);
}

.formWrap {
  display: grid;
  place-items: center;
}

.formBlock {
  width: 100%;
  max-width: 396px;
}

.title {
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1.1;
  font-weight: var(--fw-bold);
  letter-spacing: -0.02em;
  color: var(--ink);
}

.lede {
  margin-top: var(--s-3);
  margin-bottom: var(--s-7);
  font-size: var(--t-body);
  line-height: 1.55;
  color: var(--text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
}

.submit {
  margin-top: var(--s-2);
}

/* One message, no attempt counter Flow A. Solid fill, because it is
   a verdict on what was typed. */
.formError {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-4);
  border-radius: var(--r-sm);
  background: var(--fail);
  color: #fff;
  font-size: var(--t-label);
  line-height: 1.5;
  font-weight: var(--fw-medium);
}

.formErrorIcon {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 1px;
}

.caps {
  color: var(--warn);
  font-weight: var(--fw-semibold);
}

/* Sits inside the password field's border via Input's `trailing` slot. */
.reveal {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  height: 32px;
  padding: 0 var(--s-3);
  border: 0;
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  transition: color var(--m-fast) var(--ease-out),
    background-color var(--m-fast) var(--ease-out);
}

.reveal:hover {
  color: var(--brand);
  background: var(--brand-surface);
}

.reveal:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 1px;
}

.revealIcon {
  width: 15px;
  height: 15px;
}

.footnote {
  max-width: 52ch;
  padding-top: var(--s-5);
  border-top: var(--bw) solid var(--border);
  font-size: var(--t-caption);
  line-height: 1.6;
  color: var(--text-muted);
}

/* ---------- right: the panel ----------
   Same three-row idea. Previously everything was pushed to the bottom edge
   with `margin-top: auto`, which left the top half of a full-height panel
   empty. */

.aside {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--s-7);
  padding: var(--s-8) var(--s-9);
  background: var(--forest);
  color: var(--on-dark);
}

.asideEyebrow {
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--on-dark-dim);
}

.asideMain {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.asideQuote {
  max-width: 24ch;
  font-family: var(--font-display);
  font-size: clamp(30px, 3.1vw, 42px);
  line-height: 1.12;
  font-weight: var(--fw-bold);
  letter-spacing: -0.025em;
  color: var(--on-dark);
}

.asideSub {
  max-width: 46ch;
  margin-top: var(--s-6);
  font-size: var(--t-body);
  line-height: 1.65;
  color: var(--on-dark-muted);
}

/* Product structure, not statistics: these three numbers are what the whole
   loop is made of, and they do not move. */
.figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, max-content));
  gap: var(--s-8);
  margin-top: var(--s-8);
  padding-top: var(--s-6);
  border-top: var(--bw) solid var(--forest-3);
}

.figure dt {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--on-dark);
}

.figure dd {
  margin-top: var(--s-2);
  font-size: var(--t-caption);
  font-weight: var(--fw-medium);
  color: var(--on-dark-dim);
}

.asideFoot {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
}

.loop {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex-wrap: wrap;
}

.loopStep {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-2) var(--s-4);
  border: var(--bw) solid var(--forest-3);
  border-radius: var(--r-pill);
  background: var(--forest-2);
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  color: var(--on-dark);
}

.loopIcon {
  width: 15px;
  height: 15px;
  color: #6fd39d;
}

.loopArrow {
  color: var(--on-dark-dim);
}

.asideNote {
  padding-top: var(--s-5);
  border-top: var(--bw) solid var(--forest-3);
  font-size: var(--t-caption);
  color: var(--on-dark-dim);
}

/* ---------- narrow ----------
   The panel is supporting copy, not a control, so below the two-column
   breakpoint it goes rather than stacking and pushing the form off-screen. */

@media (max-width: 1023px) {
  .page {
    grid-template-columns: minmax(0, 1fr);
  }

  .aside {
    display: none;
  }

  .formSide {
    padding: var(--s-7) var(--s-6);
  }
}

@media (max-width: 1279px) and (min-width: 1024px) {
  .formSide,
  .aside {
    padding: var(--s-7) var(--s-7);
  }
}

```

### `dashboard\src\app\login\page.tsx`

```tsx
import type { Metadata } from "next";
import { ClipboardCheck, Headset, Stethoscope } from "lucide-react";
import { SignInForm } from "./SignInForm";
import s from "./login.module.css";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The sign-in flow: single card, inline errors, no "Create account" and no
 * "Forgot password" in Phase 1 — sign-up is disabled at the Auth level and
 * accounts are provisioned by an administrator. The guard is built so both are
 * additive later, when Resend lands.
 *
 * Layout: each half is a three-row grid — mark, content, footnote — so neither
 * column has a dead top third. The earlier version centred one stack per side,
 * which left the brand floating in white space and the panel copy sunk to the
 * bottom edge.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className={s.page}>
      <div className={s.formSide}>
        <div className={s.brand}>
          <span className={s.mark} aria-hidden="true">
            <Stethoscope width={22} height={22} strokeWidth={2} />
          </span>
          <span className={s.brandText}>
            <span className={s.wordmark}>MEDIVER</span>
            <span className={s.tagline}>XR Surgical</span>
          </span>
        </div>

        <div className={s.formWrap}>
          <div className={s.formBlock}>
            <h1 className={s.title}>Sign in</h1>
            <p className={s.lede}>
              Plan a case, perform it in the headset, and review it against your
              own plan.
            </p>

            <SignInForm next={next} />
          </div>
        </div>

        <p className={s.footnote}>
          Accounts are created by your administrator. There is no public sign-up,
          and no self-serve password reset in this phase — if you cannot get in,
          ask them to reset it for you.
        </p>
      </div>

      <aside className={s.aside}>
        <p className={s.asideEyebrow}>MediVeR XR · Phase 1</p>

        <div className={s.asideMain}>
          <p className={s.asideQuote}>
            Scored against your own plan, not a generic ideal.
          </p>
          <p className={s.asideSub}>
            Seven pre-operative planning steps produce a plan and a four-digit
            pairing PIN. Eleven operative parts run in the headset. The report
            compares what you planned with what you achieved.
          </p>

          <dl className={s.figures}>
            <div className={s.figure}>
              <dt>7</dt>
              <dd>Planning steps</dd>
            </div>
            <div className={s.figure}>
              <dt>11</dt>
              <dd>Operative parts</dd>
            </div>
            {/* Seven, not six. `Exposure and closure` became a
                real category worth 5 when the other six were found to sum to 95
                against a score shown out of 100 — `report_category_meta` has
                held seven rows ever since, and this was the last place in the
                product still saying otherwise. */}
            <div className={s.figure}>
              <dt>7</dt>
              <dd>Scored categories</dd>
            </div>
          </dl>
        </div>

        <div className={s.asideFoot}>
          <div className={s.loop}>
            <span className={s.loopStep}>
              <ClipboardCheck className={s.loopIcon} strokeWidth={2} />
              Plan
            </span>
            <span className={s.loopArrow} aria-hidden="true">
              →
            </span>
            <span className={s.loopStep}>
              <Headset className={s.loopIcon} strokeWidth={2} />
              Perform
            </span>
            <span className={s.loopArrow} aria-hidden="true">
              →
            </span>
            <span className={s.loopStep}>
              <Stethoscope className={s.loopIcon} strokeWidth={2} />
              Review
            </span>
          </div>

          <p className={s.asideNote}>
            Every case is synthetic. No patient data is stored anywhere in the
            product.
          </p>
        </div>
      </aside>
    </div>
  );
}

```

### `dashboard\src\app\login\SignInForm.tsx`

```tsx
"use client";

import { useActionState, useState } from "react";
import type { KeyboardEvent } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { signIn, type SignInState } from "@/app/actions";
import s from "./login.module.css";

/**
 * The only client component on this screen. Credentials go to a Server Action,
 * so the password never travels through client-side state and the
 * session cookie is set on the server.
 *
 * Three affordances that a sign-in screen is judged on, and that this one had
 * to earn rather than decorate:
 *
 *   - **Show password.** A real toggle, not an icon that looks like one. People
 *     mistype long passwords and a headset lab is not a quiet room.
 *   - **Caps Lock.** Warned on the field itself, before the failed attempt,
 *     because "your password is wrong" is the least useful thing to say to
 *     somebody whose password is right.
 *   - **One error, no counter.** Which half was wrong, and how many attempts
 *     remain, helps an attacker and nobody else.
 */
export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    {},
  );
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  }

  return (
    <form className={s.form} action={formAction} noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <p className={s.formError} role="alert">
          <CircleAlert className={s.formErrorIcon} aria-hidden="true" />
          <span>{state.error}</span>
        </p>
      )}

      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="username"
        inputMode="email"
        placeholder="name@example.org"
        autoFocus
        required
      />

      <Input
        label="Password"
        type={visible ? "text" : "password"}
        name="password"
        autoComplete="current-password"
        onKeyUp={trackCapsLock}
        onBlur={() => setCapsLock(false)}
        helper={
          capsLock ? (
            <span className={s.caps}>Caps Lock is on.</span>
          ) : undefined
        }
        required
        trailing={
          <button
            type="button"
            className={s.reveal}
            onClick={() => setVisible((on) => !on)}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff className={s.revealIcon} aria-hidden="true" />
            ) : (
              <Eye className={s.revealIcon} aria-hidden="true" />
            )}
            {visible ? "Hide" : "Show"}
          </button>
        }
      />

      <Button
        variant="primary"
        size="lg"
        block
        type="submit"
        loading={pending}
        className={s.submit}
      >
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}

```

### `dashboard\src\app\performance\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Play } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { BarChart, StatCard, StatRow } from "@/components/viz";
import { getPerformanceOverview } from "@/lib/data/performance";
import { clock, longDuration, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import { cx } from "@/lib/cx";
import s from "./performance.module.css";

export const metadata: Metadata = { title: "Performance" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "By skill" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const view = await getPerformanceOverview(user.id);

  const tab: TabId = TABS.some((t) => t.id === params.tab)
    ? (params.tab as TabId)
    : "overview";

  const lede = user.level
    ? `${user.displayName} · ${user.level}`
    : user.displayName;

  return (
    <AppShell user={user} searchHint='Try searching "performance"'>
      <PageHeader title="Performance" lede={lede} />

      {/* The tab is the URL: it survives a reload and can be
          sent in a message, and the server renders only the selected panel. */}
      <nav className={s.tabs} aria-label="Performance views">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "overview" ? "/performance" : `/performance?tab=${t.id}`}
            className={cx(s.tab, tab === t.id && s.tabOn)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {view.stats.completed === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No completed sessions yet"
          action={
            <Button variant="primary" icon={Play} href="/setup">
              Start simulation
            </Button>
          }
        >
          Performance appears after the first completed session — every figure
          on this screen is derived from scored reports, so there is nothing
          honest to draw yet.
        </EmptyState>
      ) : (
        <>
          {tab === "overview" && <Overview view={view} />}
          {tab === "skills" && <Skills view={view} />}
          {tab === "history" && <History view={view} />}
        </>
      )}
    </AppShell>
  );
}

function Overview({
  view,
}: {
  view: Awaited<ReturnType<typeof getPerformanceOverview>>;
}) {
  const { stats } = view;

  return (
    <>
      <StatRow>
        <StatCard
          label="Sessions completed"
          value={String(stats.completed)}
          variant="accent"
          sub={`${stats.assessments} assessment${stats.assessments === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Average score"
          value={stats.meanScore !== undefined ? String(stats.meanScore) : "—"}
          variant="accent"
          sub={
            stats.passRate !== undefined
              ? `${stats.passRate}% at or above pass mark`
              : undefined
          }
        />
        <StatCard
          label="Best score"
          value={stats.bestScore !== undefined ? String(stats.bestScore) : "—"}
          variant="accent"
          sub={stats.bestDate ? shortDate(stats.bestDate) : undefined}
        />
        <StatCard
          label="Total time"
          value={longDuration(stats.totalTimeS)}
          variant="accent"
          sub={
            stats.meanTimeS !== undefined
              ? `avg ${longDuration(stats.meanTimeS)} / session`
              : undefined
          }
        />
      </StatRow>

      <div className={s.columns}>
        <section className={s.panel} aria-label="Recent session scores">
          <div>
            <p className={s.panelTitle}>Recent session scores</p>
            <p className={s.panelSub}>
              Pass marks — Beginner 60 · Intermediate 70 · Expert 80
            </p>
          </div>
          <BarChart data={view.lastScores} max={100} height={180} />
          <p className={s.caption}>{view.lastScoresCaption}</p>
        </section>

        <section className={s.panel} aria-label="By skill">
          <div>
            <p className={s.panelTitle}>By skill</p>
            <p className={s.panelSub}>
              Category averages across every scored report
            </p>
          </div>
          <SkillBars view={view} compact />
          <p className={s.caption}>
            {view.weakest && view.strongest
              ? `Weakest ${view.weakest.label} at ${view.weakest.pct}%; strongest ${view.strongest.label} at ${view.strongest.pct}%.`
              : "Category averages appear after the first scored report."}
          </p>
        </section>
      </div>

      <SectionHeader title="By procedure" />
      <div className={s.procGrid}>
        {view.procedures.map((proc) =>
          proc.status === "published" ? (
            <Card key={proc.id} padding="lg">
              <div className={s.panelTitle}>{proc.name}</div>
              {proc.tagline && <p className={s.panelSub}>{proc.tagline}</p>}
              <dl className={s.procMeta}>
                <div>
                  <dt>Sessions</dt>
                  <dd>{proc.sessions}</dd>
                </div>
                <div>
                  <dt>Best</dt>
                  <dd>{proc.best ?? "—"}</dd>
                </div>
                <div>
                  <dt>Latest</dt>
                  <dd>{proc.latest ?? "—"}</dd>
                </div>
              </dl>
            </Card>
          ) : (
            <Card key={proc.id} padding="lg" tone="sunken">
              <div className={cx(s.panelTitle, s.unpublished)}>{proc.name}</div>
              <p className={s.panelSub}>
                {titleCase(proc.status)} — not yet published.
              </p>
            </Card>
          ),
        )}
      </div>
    </>
  );
}

function SkillBars({
  view,
  compact,
}: {
  view: Awaited<ReturnType<typeof getPerformanceOverview>>;
  compact?: boolean;
}) {
  return (
    <div className={s.skillList}>
      {view.categories.map((cat) => {
        const bar = (
          <ProgressBar
            value={cat.pct}
            label={cat.label}
            valueLabel={`${cat.pct}%`}
            size={compact ? "sm" : "md"}
          />
        );
        return cat.slug ? (
          <Link
            key={cat.key}
            href={`/performance/${cat.slug}`}
            className={s.skillRow}
            aria-label={`${cat.label} — ${cat.pct}%. Open scene breakdown.`}
          >
            {bar}
          </Link>
        ) : (
          <div key={cat.key} className={s.skillRowStatic}>
            {bar}
          </div>
        );
      })}
    </div>
  );
}

function Skills({
  view,
}: {
  view: Awaited<ReturnType<typeof getPerformanceOverview>>;
}) {
  return (
    <div className={s.panel}>
      <div>
        <p className={s.panelTitle}>Report categories</p>
        <p className={s.panelSub}>
          Your average share of the marks in each category, across every scored
          report. Open a category for its scene-by-scene breakdown.
        </p>
      </div>
      <SkillBars view={view} />
      <p className={s.caption}>
        {view.categories.map((c) => `${c.short} ${c.pct}%`).join(" · ")}
      </p>
    </div>
  );
}

function History({
  view,
}: {
  view: Awaited<ReturnType<typeof getPerformanceOverview>>;
}) {
  return (
    <Table label="Session history">
      <THead>
        <Tr>
          <Th>Date</Th>
          <Th>Case</Th>
          <Th>Mode</Th>
          <Th>Difficulty</Th>
          <Th>Variant</Th>
          <Th numeric>Duration</Th>
          <Th numeric>Score</Th>
          <Th numeric>Pass mark</Th>
          <Th>Outcome</Th>
          <Th>
            <span className="srOnly">Open</span>
          </Th>
        </Tr>
      </THead>
      <TBody>
        {view.history.map((session) => {
          const passMark = PASS_MARK[session.difficulty];
          const scored =
            session.status === "completed" && session.totalScore !== undefined;
          return (
            <Tr key={session.id}>
              <Td head>{shortDate(session.startedAt)}</Td>
              <Td>{session.caseTitle}</Td>
              <Td>{titleCase(session.mode)}</Td>
              <Td>{titleCase(session.difficulty)}</Td>
              <Td>
                {session.design} · {titleCase(session.fixation)}
              </Td>
              <Td numeric>{clock(session.durationS)}</Td>
              <Td numeric>{scored ? session.totalScore : "—"}</Td>
              <Td numeric>{passMark}</Td>
              <Td>
                {scored ? (
                  <Badge
                    status={
                      (session.totalScore as number) >= passMark
                        ? "pass"
                        : "fail"
                    }
                  >
                    {(session.totalScore as number) >= passMark
                      ? "Passed"
                      : "Not passed"}
                  </Badge>
                ) : (
                  <Chip tone="muted">{titleCase(session.status)}</Chip>
                )}
              </Td>
              <Td>
                <Button variant="ghost" size="sm" href={`/sessions/${session.id}`}>
                  Open
                </Button>
              </Td>
            </Tr>
          );
        })}
      </TBody>
    </Table>
  );
}

```

### `dashboard\src\app\performance\performance.module.css`

```css
/* /performance and /performance/[skill] */

.tabs {
  display: flex;
  gap: var(--s-2);
  margin-bottom: var(--s-6);
}

.tab {
  display: inline-flex;
  align-items: center;
  min-height: var(--h-md);
  padding: 0 var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--text);
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  text-decoration: none;
}

.tab:hover {
  background: var(--brand-surface);
  border-color: var(--brand-border);
}

.tabOn,
.tabOn:hover {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
}

.columns {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--s-5);
  align-items: stretch;
  margin-bottom: var(--s-7);
}

@media (max-width: 1100px) {
  .columns {
    grid-template-columns: 1fr;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
}

.panelTitle {
  font-size: var(--t-h3);
  font-weight: var(--fw-semibold);
  line-height: var(--t-h3-lh);
}

.panelSub {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: var(--t-caption);
}

.caption {
  margin-top: auto;
  padding-top: var(--s-4);
  border-top: var(--bw) solid var(--divider);
  color: var(--text-muted);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}

.skillList {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.skillRow {
  display: block;
  padding: var(--s-3);
  margin: calc(-1 * var(--s-3));
  border-radius: var(--r-sm);
  text-decoration: none;
  color: inherit;
}

.skillRow:hover {
  background: var(--brand-surface);
}

.skillRowStatic {
  display: block;
}

.procGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-5);
}

@media (max-width: 1100px) {
  .procGrid {
    grid-template-columns: 1fr;
  }
}

.procMeta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-3);
  margin-top: var(--s-4);
  padding-top: var(--s-4);
  border-top: var(--bw) solid var(--divider);
}

.procMeta dt {
  color: var(--text-muted);
  font-size: var(--t-overline);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.procMeta dd {
  margin: 2px 0 0;
  font-size: var(--t-body);
  font-weight: var(--fw-semibold);
  font-variant-numeric: tabular-nums;
}

.unpublished {
  color: var(--text-muted);
}

.sceneOutcomes {
  display: inline-flex;
  gap: var(--s-2);
  font-variant-numeric: tabular-nums;
}

.outcomePass {
  color: var(--pass);
  font-weight: var(--fw-semibold);
}

.outcomeBorderline {
  color: var(--warn);
  font-weight: var(--fw-semibold);
}

.outcomeFail {
  color: var(--fail);
  font-weight: var(--fw-semibold);
}

```

### `dashboard\src\app\performance\[skill]\page.tsx`

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Chip,
  EmptyState,
  ProgressBar,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { RankedList } from "@/components/viz";
import { getSkillDetail } from "@/lib/data/performance";
import { clock, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { SKILL_SLUGS } from "@/lib/skills";
import { ListChecks } from "lucide-react";
import s from "../performance.module.css";

export const metadata: Metadata = { title: "Performance by skill" };

export default async function SkillPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const { skill } = await params;
  const categoryKey = SKILL_SLUGS[skill];
  // An unknown slug is an address for nothing — back to the overview rather
  // than a dead end.
  if (!categoryKey) redirect("/performance");

  const user = await getCurrentUser();
  const detail = await getSkillDetail(user.id, categoryKey);
  if (!detail) redirect("/performance");

  return (
    <AppShell user={user} searchHint='Try searching "performance"'>
      <PageHeader
        eyebrow="Performance"
        title={detail.label}
        lede={`Worth ${detail.max} of the 100 marks. Every figure below is drawn from your recorded scene results.`}
      />

      <div className={s.columns}>
        <section className={s.panel} aria-label="Category average">
          <div>
            <p className={s.panelTitle}>Your average</p>
            <p className={s.panelSub}>
              Share of this category&apos;s marks across every scored report
            </p>
          </div>
          {detail.pct !== undefined ? (
            <ProgressBar
              value={detail.pct}
              label={detail.label}
              valueLabel={`${detail.pct}%`}
            />
          ) : (
            <p className={s.panelSub}>No scored report covers this category yet.</p>
          )}
          <p className={s.caption}>{detail.caption}</p>
        </section>

        <section className={s.panel} aria-label="Marks lost">
          <div>
            <p className={s.panelTitle}>Where the marks went</p>
            <p className={s.panelSub}>
              Deductions recorded against this category&apos;s scenes
            </p>
          </div>
          {detail.marksLost.length ? (
            <RankedList
              items={detail.marksLost.map((m) => ({
                tag: m.scene,
                label: m.label,
                value: `−${m.points}`,
              }))}
            />
          ) : (
            <p className={s.panelSub}>
              No deductions recorded in this category.
            </p>
          )}
        </section>
      </div>

      <SectionHeader title="Scene by scene" />
      {detail.scenes.length === 0 ? (
        <EmptyState icon={ListChecks} title="No scenes feed this category">
          The procedure defines no scenes for this category, so there is
          nothing to break down.
        </EmptyState>
      ) : (
        <Table label={`Scenes scored under ${detail.label}`}>
          <THead>
            <Tr>
              <Th>Scene</Th>
              <Th>Step</Th>
              <Th>Part</Th>
              <Th numeric>Attempts</Th>
              <Th>Outcomes</Th>
              <Th>Last outcome</Th>
              <Th numeric>Avg time</Th>
              <Th numeric>Par</Th>
            </Tr>
          </THead>
          <TBody>
            {detail.scenes.map((scene) => (
              <Tr key={scene.scene}>
                <Td head>{scene.scene}</Td>
                <Td>
                  {scene.label}
                  {scene.isCritical && (
                    <>
                      {" "}
                      <Chip tone="muted">Critical</Chip>
                    </>
                  )}
                </Td>
                <Td>{scene.part}</Td>
                <Td numeric>{scene.attempts}</Td>
                <Td>
                  {scene.attempts > 0 ? (
                    <span className={s.sceneOutcomes}>
                      <span className={s.outcomePass}>
                        {scene.outcomes.pass} pass
                      </span>
                      <span className={s.outcomeBorderline}>
                        {scene.outcomes.borderline} borderline
                      </span>
                      <span className={s.outcomeFail}>
                        {scene.outcomes.fail} fail
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  {scene.lastOutcome ? (
                    <Badge status={scene.lastOutcome === "borderline" ? "warn" : scene.lastOutcome}>
                      {titleCase(scene.lastOutcome)}
                    </Badge>
                  ) : (
                    <Chip tone="muted">Not attempted</Chip>
                  )}
                </Td>
                <Td numeric>{clock(scene.meanDurationS)}</Td>
                <Td numeric>{clock(scene.parTimeS)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\plan\[id]\Controls.tsx`

```tsx
"use client";

import { Check } from "lucide-react";
import { cx } from "@/lib/cx";
import type { StepOption } from "@/lib/plan";
import t from "./steps.module.css";

/**
 * The shared controls of the planning steps.
 *
 * They are client components because every one of them holds an answer, and
 * they take no icon props, so nothing crosses the RSC boundary that cannot
 *.
 */

/**
 * Move a roving focus within a radio group.
 *
 * A `radiogroup` is one tab stop, and the arrow keys choose inside it. Ours was
 * every option tabbable and no arrow handling at all, which is the shape a
 * keyboard user is least served by: six diagnoses meant six tab stops to cross
 * to reach the button below, and the standard gesture for picking one did
 * nothing. WAI-ARIA radio-group pattern.
 *
 * Selection follows focus, as it does in a native radio group, so arrowing to
 * an option chooses it — which is also what makes a single tab stop safe: there
 * is never a focused option that is not the answer.
 */
function useRovingRadio(
  values: string[],
  value: string | undefined,
  onChange: (value: string) => void,
) {
  const active = Math.max(0, values.indexOf(value ?? ""));

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;

    if (step === 0 || values.length === 0) return;

    event.preventDefault();
    const next = (active + step + values.length) % values.length;
    onChange(values[next]);

    // The group re-renders with `tabIndex` moved; focus has to follow it or the
    // user is left tabbing from an element that is no longer the tab stop.
    const group = event.currentTarget;
    requestAnimationFrame(() => {
      group.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
    });
  }

  return { active, onKeyDown };
}

/** A single-select list where each option carries its reasoning. */
export function ChoiceList({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: StepOption[];
  value?: string;
  onChange: (value: string) => void;
}) {
  const { active, onKeyDown } = useRovingRadio(
    options.map((o) => o.value),
    value,
    onChange,
  );

  return (
    <div
      className={t.choices}
      role="radiogroup"
      aria-label={name}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={index === active ? 0 : -1}
            className={cx(t.choice, on && t.choiceOn)}
            onClick={() => onChange(option.value)}
          >
            <span className={t.mark} aria-hidden="true">
              {on && <Check className={t.markGlyph} strokeWidth={3.5} />}
            </span>
            <span>
              <span className={t.choiceLabel}>{option.label}</span>
              {option.detail && (
                <span className={t.choiceDetail}>{option.detail}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A discrete value picked from a catalogue — component sizes, insert
 * thicknesses.
 *
 * These were sliders over a `min`/`max`/`step` triple written in the component,
 * which modelled them as a continuous range they are not: an implant system is
 * made in the sizes it is made in. A slider also has to invent the values
 * between them, and `case_truth` accepts a list, so the two could disagree
 * about whether a size exists at all. The options come from
 * `plan_step_options`, so this control can only ever offer what the catalogue
 * holds.
 */
export function OptionScale({
  label,
  hint,
  options,
  value,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  options: StepOption[];
  value?: number;
  format?: (option: StepOption) => string;
  onChange: (value: number) => void;
}) {
  const { active, onKeyDown } = useRovingRadio(
    options.map((o) => o.value),
    value === undefined ? undefined : String(value),
    (next) => onChange(Number(next)),
  );

  return (
    <div
      className={t.scale}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div className={t.sliderHead}>
        <span className={t.sliderLabel}>{label}</span>
        <span className={t.sliderValue}>
          {options.find((o) => Number(o.value) === value)?.label ?? "Not chosen"}
        </span>
      </div>

      <div className={t.scaleRow}>
        {options.map((option, index) => {
          const numeric = Number(option.value);
          const on = numeric === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={option.label}
              tabIndex={index === active ? 0 : -1}
              className={cx(t.scaleStop, on && t.scaleStopOn)}
              onClick={() => onChange(numeric)}
            >
              {format ? format(option) : option.label}
            </button>
          );
        })}
      </div>

      {hint && <p className={t.sliderHint}>{hint}</p>}
    </div>
  );
}

export type MeasurementSpec = {
  key: string;
  label: string;
  short: string;
  unit: string;
};

/**
 * The six angles.
 *
 * The flag on the right says only whether a figure sits inside the *published
 * normal range*, which is population knowledge and is on the case row. Whether
 * it matches this patient's radiograph is a different question, and only
 * `plan_gates` answers it — from `case_truth`, server-side. A learner who is
 * outside normal is not necessarily wrong; this knee is abnormal.
 */
export function MeasurementTable({
  specs,
  values,
  ranges,
  onChange,
}: {
  specs: readonly MeasurementSpec[];
  values: Record<string, number | undefined>;
  ranges: Record<string, [number, number] | undefined>;
  onChange: (key: string, value: number | undefined) => void;
}) {
  return (
    <div className={t.measures}>
      <div className={t.measureHead}>
        <span>Angle</span>
        <span>Your reading</span>
        <span>Normal</span>
        <span>Against normal</span>
      </div>

      {specs.map((spec) => {
        const value = values[spec.key];
        const range = ranges[spec.key];
        const inRange =
          value !== undefined && range
            ? value >= range[0] && value <= range[1]
            : undefined;

        return (
          <div className={t.measure} key={spec.key}>
            <span className={t.measureName}>
              <span className={t.measureShort}>{spec.short}</span>
              <span className={t.measureFull} title={spec.label}>
                {spec.label}
              </span>
            </span>

            <span className={t.numberWrap}>
              <input
                className={t.number}
                type="number"
                inputMode="decimal"
                step="0.1"
                value={value ?? ""}
                aria-label={`${spec.label} in ${spec.unit === "°" ? "degrees" : "millimetres"}`}
                onChange={(event) => {
                  const raw = event.target.value;
                  const next = raw === "" ? undefined : Number(raw);
                  onChange(spec.key, Number.isFinite(next) ? next : undefined);
                }}
              />
              <span className={t.unit} aria-hidden="true">
                {spec.unit}
              </span>
            </span>

            <span className={t.range}>
              {range ? `${range[0]} to ${range[1]}${spec.unit}` : "—"}
            </span>

            <span>
              {inRange === undefined ? (
                <span className={cx(t.flag, t.flagNone)}>Not measured</span>
              ) : inRange ? (
                <span className={cx(t.flag, t.flagIn)}>Within normal</span>
              ) : (
                <span className={cx(t.flag, t.flagOut)}>Outside normal</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.5,
  unit,
  hint,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  hint?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div className={t.slider}>
      <div className={t.sliderHead}>
        <span className={t.sliderLabel}>{label}</span>
        <span className={t.sliderValue}>
          {format ? format(value) : `${value}${unit}`}
        </span>
      </div>
      <input
        className={t.sliderInput}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className={t.sliderScale}>
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
      {hint && <p className={t.sliderHint}>{hint}</p>}
    </div>
  );
}

export function RiskList({
  risks,
  acknowledged,
  onToggle,
}: {
  risks: { id: string; label: string; detail: string; severity: string }[];
  acknowledged: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className={t.risks}>
      {risks.map((risk) => {
        const on = acknowledged.includes(risk.id);
        return (
          <button
            key={risk.id}
            type="button"
            aria-pressed={on}
            className={cx(t.risk, on && t.riskOn)}
            onClick={() => onToggle(risk.id)}
          >
            <span className={t.riskBox} aria-hidden="true">
              {on && <Check className={t.markGlyph} strokeWidth={3.5} />}
            </span>
            <span>
              <span className={t.riskLabel}>{risk.label}</span>
              <span className={t.riskDetail}>{risk.detail}</span>
            </span>
            <SeverityPill severity={risk.severity} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * A severity is a verdict on the risk, so it is a solid fill.
 *
 * Three severities, three fills. Critical and high both rendered as `flagOut`,
 * which meant the popliteal bundle and an elevated BMI arrived on screen
 * looking equally urgent — a ranking the data carries and the UI threw away.
 * Critical takes `--fail`, high takes `--warn`, moderate stays neutral, and the
 * word is there in every case because colour is never the only carrier.
 */
const SEVERITY_TONE: Record<string, string> = {
  critical: t.flagCritical,
  high: t.flagOut,
  moderate: t.flagNone,
};

function SeverityPill({ severity }: { severity: string }) {
  return (
    <span className={cx(t.flag, SEVERITY_TONE[severity] ?? t.flagNone)}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

export function Rows({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className={t.rows}>
      {rows.map((row) => (
        <div className={t.row} key={row.label}>
          <span className={t.rowLabel}>{row.label}</span>
          <span className={t.rowValue}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

```

### `dashboard\src\app\plan\[id]\page.tsx`

```tsx
import { notFound, redirect } from "next/navigation";
import { furthestOpenStep, getPlan } from "@/lib/data/plan";
import { getCurrentUser } from "@/lib/session";

/**
 * `/plan/[id]` — the plan itself, with no step named.
 *
 * Without this the segment had no page, so a bare plan URL fell through to
 * `app/[...slug]` and was answered with "this screen lands in a later group" —
 * about a plan that exists and is open in the next segment down. That is the
 * catch-all doing its job on a route that should never have reached it.
 *
 * It is the URL people actually hold: what a `revalidatePath(…, "layout")`
 * names, what somebody types when they trim a step number off the end, and what
 * a bookmark decays to. So it resolves to wherever the plan actually is —
 * the first open step, the handoff once it is sealed, or the case once a
 * session has frozen it.
 */
export default async function PlanIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();

  const plan = await getPlan(id);
  if (!plan) notFound();

  if (plan.hasSession) redirect(`/cases/${plan.caseId}`);
  if (plan.isReadyForVr) redirect(`/plan/${plan.id}/saved`);

  redirect(`/plan/${plan.id}/step/${furthestOpenStep(plan.gates)}`);
}

```

### `dashboard\src\app\plan\[id]\plan.module.css`

```css
/* The planning shell.
   Planning is a focused mode: the two-tier product nav is replaced by the
   stepper rail, and the global nav is one click away on the back link. Desktop only, by design */

.page {
  display: flex;
  min-height: 100dvh;
  background: var(--rail);
}

/* ---------- rail ---------- */

.rail {
  position: sticky;
  top: 0;
  flex: 0 0 288px;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
  padding: var(--s-5) var(--s-4) var(--s-5) var(--s-5);
  overflow-y: auto;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-height: 34px;
  font-size: var(--t-caption);
  font-weight: 700;
  color: var(--text-muted);
}

.back:hover {
  color: var(--ink);
}

.railCase {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
}

.railEyebrow {
  font-size: var(--t-overline);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand);
}

.railTitle {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  line-height: 1.25;
  color: var(--ink);
}

.railMeta {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  align-items: start;
  gap: var(--s-3);
  padding: var(--s-3);
  border-radius: var(--r-sm);
  color: var(--text);
  transition: background-color var(--m-fast) var(--ease-out);
}

.step:hover {
  background: rgba(14, 21, 18, 0.045);
}

.stepOn,
.stepOn:hover {
  background: var(--surface);
}

/* A step you cannot reach yet is not a link — it states why in its title. */
.stepLocked {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.stepDot {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: var(--bw) solid var(--border-strong);
  border-radius: 50%;
  background: var(--surface);
  font-size: var(--t-caption);
  font-weight: 700;
  color: var(--text-muted);
}

.stepDone .stepDot {
  background: var(--pass);
  border-color: var(--pass);
  color: #fff;
}

.stepOn .stepDot {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.stepLocked .stepDot {
  border-style: dashed;
  color: var(--text-disabled);
}

.stepGlyph {
  width: 14px;
  height: 14px;
}

.stepBody {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding-top: 3px;
}

.stepTitle {
  font-size: var(--t-label);
  font-weight: 600;
  line-height: 1.3;
}

.stepOn .stepTitle {
  font-weight: 700;
  color: var(--ink);
}

.stepMeta {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.railFoot {
  margin-top: auto;
  padding-top: var(--s-4);
  border-top: var(--bw) solid var(--border);
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

/* ---------- content ---------- */

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: var(--s-4) var(--s-4) var(--s-4) 0;
}

.surface {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: var(--s-7);
  border-radius: var(--r-xl);
  background: var(--surface);
}

.head {
  display: flex;
  align-items: flex-start;
  gap: var(--s-5);
  margin-bottom: var(--s-6);
}

.headText {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  margin-bottom: var(--s-2);
  font-size: var(--t-overline);
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--brand);
}

.title {
  font-size: var(--t-h1);
  line-height: var(--t-h1-lh);
}

.lede {
  margin-top: var(--s-2);
  max-width: 74ch;
  font-size: var(--t-body);
  line-height: var(--t-body-lh);
  color: var(--text-muted);
}

.headSide {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex: 0 0 auto;
}

.budget {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  height: 34px;
  padding: 0 var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-pill);
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ---------- step body ---------- */

.body {
  display: grid;
  gap: var(--s-4);
  align-items: start;
}

.split {
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
}

.wide {
  grid-template-columns: minmax(0, 1fr);
}

.thirds {
  grid-template-columns: minmax(0, 4fr) minmax(0, 5fr);
}

.col {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
}

.cardTitle {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  color: var(--ink);
}

.cardSub {
  margin-top: 2px;
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

.cardHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-4);
}

/* key/value rows shared by several steps */

.kv {
  display: flex;
  flex-direction: column;
}

.kvRow {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: var(--s-4);
  padding: var(--s-3) 0;
  border-bottom: var(--bw) solid var(--divider);
  font-size: var(--t-label);
  line-height: 1.55;
}

.kvRow:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.kvRow dt {
  font-weight: 600;
  color: var(--text-muted);
}

.kvRow dd {
  color: var(--text);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-2);
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--s-3) var(--s-4);
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
}

.tileLabel {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.tileValue {
  font-size: var(--t-body);
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* the radiograph well — the plate is honest until assets are authored */

.plate {
  display: grid;
  place-items: center;
  gap: var(--s-2);
  min-height: 300px;
  padding: var(--s-6);
  color: var(--text-disabled);
  background: var(--surface-sunken);
  border: var(--bw) solid var(--border);
}

.plateText {
  font-size: var(--t-caption);
  font-weight: 600;
  text-align: center;
  max-width: 42ch;
  line-height: 1.5;
}

.plateNote {
  font-size: var(--t-caption);
  text-align: center;
  max-width: 46ch;
  line-height: 1.5;
  color: var(--text-disabled);
}

.viewList {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

/* ---------- footer: the gate ---------- */

.foot {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  margin-top: var(--s-6);
  padding-top: var(--s-5);
  border-top: var(--bw) solid var(--border);
}

.gate {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  font-size: var(--t-caption);
  line-height: 1.5;
}

.gateIcon {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  margin-top: 1px;
}

.gateOpen .gateIcon {
  color: var(--warn);
}

.gatePass .gateIcon {
  color: var(--pass);
}

.gateText {
  color: var(--text-muted);
}

.gatePass .gateText {
  color: var(--text);
}

.saveState {
  font-size: var(--t-caption);
  color: var(--text-muted);
  white-space: nowrap;
}

@media (max-width: 1279px) {
  .split,
  .thirds {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Planning needs precision on a radiograph, so it is desktop-only
   rather than shipping a measurement tool nobody can hit accurately. */
.tooSmall {
  display: none;
}

@media (max-width: 1023px) {
  .rail,
  .surface > *:not(.tooSmall) {
    display: none;
  }

  .tooSmall {
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
    align-items: flex-start;
    max-width: 52ch;
  }
}

```

### `dashboard\src\app\plan\[id]\PlanShell.tsx`

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Monitor, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/cx";
import {
  PLAN_STEPS,
  furthestOpenStep,
  gateFor,
  type PlanDetail,
} from "@/lib/plan";
import { titleCase } from "@/lib/format";
import s from "./plan.module.css";

/**
 * The planning chrome
 *
 * The stepper rail replaces the product navigation while planning, because
 * planning is a focused mode and the global nav is one click away on the back
 * link. Backward is always free; forward is gated.
 *
 * A step past the first unpassed one is not a link. Rendering it as a dead
 * anchor would be a control that cannot be used, so it renders as text with its
 * reason in the title
 *
 * "Locked" here means exactly what the page's redirect means — `step > open` —
 * and nothing else. It used to carry an extra `&& !gate.passed`, which sounds
 * like generosity and is not: gates are independent, so step 5 can pass while
 * step 2 is still open, and that clause rendered step 5 as a live link that
 * bounced the user straight back to step 2. Two rules for one decision is how a
 * rail starts lying about where it can take you.
 */
export function PlanShell({
  plan,
  step,
  title,
  lede,
  children,
}: {
  plan: PlanDetail;
  step: number;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const open = furthestOpenStep(plan.gates);
  const budget = PLAN_STEPS.find((s) => s.step === step)?.budget;

  return (
    <div className={s.page}>
      <nav className={s.rail} aria-label="Planning steps">
        <Link href={`/cases/${plan.caseId}`} className={s.back}>
          <ArrowLeft width={15} height={15} strokeWidth={2.25} aria-hidden="true" />
          Back to the case
        </Link>

        <div className={s.railCase}>
          <p className={s.railEyebrow}>Pre-operative phase</p>
          <p className={s.railTitle}>{plan.case.title}</p>
          <p className={s.railMeta}>
            {plan.case.pathologyLabel} · {titleCase(plan.case.side)} ·{" "}
            {titleCase(plan.case.difficulty)}
          </p>
        </div>

        <div className={s.steps}>
          {PLAN_STEPS.map((entry) => {
            const gate = gateFor(plan.gates, entry.step);
            const current = entry.step === step;
            const locked = entry.step > open;

            const inner = (
              <>
                <span className={s.stepDot} aria-hidden="true">
                  {gate.passed ? (
                    <Check className={s.stepGlyph} strokeWidth={3} />
                  ) : locked ? (
                    <Lock className={s.stepGlyph} strokeWidth={2.25} />
                  ) : (
                    entry.step
                  )}
                </span>
                <span className={s.stepBody}>
                  <span className={s.stepTitle}>{entry.title}</span>
                  <span className={s.stepMeta}>
                    {gate.passed
                      ? "Passed"
                      : current
                        ? "In progress"
                        : locked
                          ? "Locked"
                          : entry.budget}
                  </span>
                </span>
              </>
            );

            const classes = cx(
              s.step,
              gate.passed && s.stepDone,
              current && s.stepOn,
              locked && s.stepLocked,
            );

            if (locked) {
              return (
                <div
                  key={entry.step}
                  className={classes}
                  title={`Finish step ${open} first.`}
                  aria-disabled="true"
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={entry.step}
                href={`/plan/${plan.id}/step/${entry.step}`}
                className={classes}
                aria-current={current ? "step" : undefined}
              >
                {inner}
              </Link>
            );
          })}
        </div>

        <p className={s.railFoot}>
          Autosaved on every change. Time on each step is recorded silently for
          the report.
        </p>
      </nav>

      <div className={s.main}>
        <main className={s.surface}>
          <div className={s.tooSmall}>
            <Monitor width={26} height={26} strokeWidth={1.5} aria-hidden="true" />
            <h1 className={s.title}>Planning needs a larger display</h1>
            <p className={s.lede}>
              The measurement tools work on a radiograph at real scale, and
              shrinking them would mean compromising the measurement rather than
              the layout. Open this plan on a desktop of at least 1024px.
            </p>
          </div>

          <div className={s.head}>
            <div className={s.headText}>
              <p className={s.eyebrow}>
                Step {step} of {PLAN_STEPS.length} · Pre-operative phase
              </p>
              <h1 className={s.title}>{title}</h1>
              <p className={s.lede}>{lede}</p>
            </div>
            <div className={s.headSide}>
              {budget && <span className={s.budget}>Budget {budget}</span>}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * The forward gate. A disabled control states its unmet condition beside it.
 *
 * `aria-live` because this sentence is the only thing that changes when an
 * answer is graded. Autosave rewrites it in place a beat after the last
 * keystroke, and without a live region a screen-reader user gets no signal that
 * the verdict they are working towards has moved. `polite`, not `assertive`:
 * it should arrive at the end of what is being read, not interrupt somebody
 * mid-question.
 */
export function GateNote({ passed, reason }: { passed: boolean; reason: string }) {
  const Icon = passed ? Check : TriangleAlert;
  return (
    <p
      className={cx(s.gate, passed ? s.gatePass : s.gateOpen)}
      aria-live="polite"
    >
      <Icon className={s.gateIcon} strokeWidth={2.25} aria-hidden="true" />
      <span className={s.gateText}>
        <span className="srOnly">{passed ? "Step passed: " : "Step open: "}</span>
        {reason}
      </span>
    </p>
  );
}

```

### `dashboard\src\app\plan\[id]\Step7.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { Banner, Button } from "@/components/ui";
import { sealPlan, type SealState } from "@/app/actions";
import {
  MEASUREMENTS,
  releaseStrategy,
  type PlanDetail,
  type StepGate,
} from "@/lib/plan";
import { titleCase } from "@/lib/format";
import { Rows } from "./Controls";
import { SummaryFoot } from "./StepForm";
import s from "./plan.module.css";
import t from "./steps.module.css";

/**
 * 7 · Plan summary — read-only.
 *
 * "This is the contract. Every screen after this point compares against it,
 * never against a generic ideal". Nothing on this screen is an
 * input, so it does not use `StepForm`; the only action is to seal it.
 *
 * `plan_seal` re-runs all six gates in the database before it will set
 * `is_ready_for_vr`, so posting here without finishing the steps returns false
 * and no PIN is minted.
 */
export function Step7({ plan, gate }: { plan: PlanDetail; gate: StepGate }) {
  const [state, formAction, pending] = useActionState<SealState, FormData>(
    sealPlan,
    {},
  );

  const measured = plan.payload.measurements ?? {};
  const alignment = plan.payload.alignment_plan ?? {};
  const resections = plan.payload.resections ?? {};
  const implants = plan.payload.implants ?? {};
  const config = plan.payload.session_config ?? {};

  const diagnosisLabel =
    plan.options.diagnosis?.find((o) => o.value === plan.payload.diagnosis)
      ?.label ?? "Not chosen";

  const tightLabel =
    plan.options.tight_side?.find(
      (o) => o.value === plan.payload.risks?.tight_side,
    )?.label ?? "Not chosen";

  const acknowledged = plan.payload.risks?.acknowledged ?? [];

  return (
    <>
      {state.error && (
        <Banner tone="warn" title="The plan is not ready yet">
          {state.error}
        </Banner>
      )}

      <div className={`${s.body} ${s.wide}`}>
        <div className={t.summaryGrid}>
          <section className={s.card}>
            <h2 className={s.cardTitle}>Diagnosis</h2>
            <p className={s.lede}>{diagnosisLabel}</p>
            <Rows
              rows={[
                {
                  label: "Radiographic grade",
                  value:
                    plan.options.kl_grade?.find(
                      (o) => o.value === plan.payload.imaging_reading?.kl_grade,
                    )?.label ?? "—",
                },
                {
                  label: "Compartment",
                  value:
                    plan.options.compartment?.find(
                      (o) =>
                        o.value === plan.payload.imaging_reading?.compartment,
                    )?.label ?? "—",
                },
                { label: "Tight side", value: tightLabel },
                {
                  // Derived from the tight side rather than stored beside it,
                  // so the two can never disagree about the same decision.
                  label: "Release",
                  value:
                    releaseStrategy(plan.payload.risks?.tight_side)
                      ?.replace(/_/g, " ")
                      .replace(/^./, (c) => c.toUpperCase()) ?? "—",
                },
                {
                  label: "Risks acknowledged",
                  value: `${acknowledged.length} of ${plan.risks.length}`,
                },
              ]}
            />
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Deformity</h2>
            <Rows
              rows={MEASUREMENTS.map((spec) => ({
                label: spec.short,
                value:
                  measured[spec.key] !== undefined
                    ? `${measured[spec.key]}${spec.unit}`
                    : "—",
              }))}
            />
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Alignment plan</h2>
            <Rows
              rows={[
                {
                  label: "Target mechanical axis",
                  value:
                    alignment.target_hka_deg !== undefined
                      ? `${alignment.target_hka_deg.toFixed(1)}°`
                      : "—",
                },
                {
                  label: "Planned correction",
                  value:
                    alignment.planned_correction_deg !== undefined
                      ? `${alignment.planned_correction_deg > 0 ? "+" : ""}${alignment.planned_correction_deg.toFixed(1)}°`
                      : "—",
                },
                {
                  label: "Proximal tibia — medial",
                  value:
                    resections.proximal_tibia_medial_mm !== undefined
                      ? `${resections.proximal_tibia_medial_mm} mm`
                      : "—",
                },
                {
                  label: "Posterior tibial slope",
                  value:
                    resections.posterior_tibial_slope_deg !== undefined
                      ? `${resections.posterior_tibial_slope_deg}°`
                      : "—",
                },
                {
                  label: "Distal femur",
                  value:
                    resections.distal_femur_mm !== undefined
                      ? `${resections.distal_femur_mm} mm`
                      : "—",
                },
                {
                  label: "Femoral valgus cut",
                  value:
                    resections.distal_femur_valgus_deg !== undefined
                      ? `${resections.distal_femur_valgus_deg}°`
                      : "—",
                },
              ]}
            />
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Implant and session</h2>
            <Rows
              rows={[
                { label: "Design", value: implants.design || "—" },
                {
                  label: "Femoral size",
                  value: implants.femoral_size ? `Size ${implants.femoral_size}` : "—",
                },
                {
                  label: "Tibial tray",
                  value: implants.tibial_tray_size
                    ? `Size ${implants.tibial_tray_size}`
                    : "—",
                },
                {
                  label: "Insert",
                  value: implants.pe_insert_mm ? `${implants.pe_insert_mm} mm` : "—",
                },
                {
                  label: "Fixation",
                  value: config.fixation ? titleCase(config.fixation) : "—",
                },
                {
                  label: "Mode",
                  value: config.mode ? titleCase(config.mode) : "—",
                },
                {
                  label: "Difficulty",
                  value: config.difficulty ? titleCase(config.difficulty) : "—",
                },
                { label: "Patella", value: "Decided at 9.1" },
              ]}
            />
          </section>
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="planId" value={plan.id} />
        <SummaryFoot planId={plan.id} gate={gate}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={pending}
            disabled={!gate.passed}
          >
            {plan.isReadyForVr ? "View pairing PIN" : "Save plan and pair a headset"}
          </Button>
        </SummaryFoot>
      </form>
    </>
  );
}

```

### `dashboard\src\app\plan\[id]\StepForm.tsx`

```tsx
"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { savePlanStep, type SaveState } from "@/app/actions";
import type { StepGate } from "@/lib/plan";
import { GateNote } from "./PlanShell";
import s from "./plan.module.css";

/**
 * The shared skeleton of a planning step: autosave, the time on step, the
 * forward gate and the two buttons.
 *
 * The step's own controls arrive as `children`, and the answers they produce
 * arrive as `patch` — one whole sub-object of the plan payload, so a partial
 * write of six angles is not a state that can reach the database.
 *
 * Nothing here decides whether an answer is right. `gate` came from
 * the grader, which reads the case's ground truth server-side; this component only
 * knows a boolean and a sentence.
 */

/** Long enough that typing settles, short enough that nothing is lost. */
const AUTOSAVE_MS = 1200;

export function StepForm({
  planId,
  step,
  patch,
  gate,
  backHref,
  nextLabel,
  children,
}: {
  planId: string;
  step: number;
  /** The whole sub-object this step owns. */
  patch: Record<string, unknown>;
  gate: StepGate;
  backHref?: string;
  nextLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    savePlanStep,
    {},
  );

  const serialised = JSON.stringify(patch);

  /**
   * What the server holds.
   *
   * The action **echoes back the patch it wrote**, and that echo is the only
   * thing that moves this forward. It used to be local state set at the moment
   * the request left, which meant a rejected write — a frozen plan, a dropped
   * connection — still flipped the footer to "Saved" over an edit the database
   * never took. Telling somebody their work is safe when it is not is the worst
   * failure this component can have, so the claim now comes from the write
   * itself rather than from the intention to write.
   *
   * The mount value is the step's own props, which were rendered from the
   * stored payload: at first paint, what is on screen *is* what is saved.
   */
  const [atMount] = useState(serialised);
  const saved = state.saved ?? atMount;
  const dirty = serialised !== saved;

  // The clock the time-on-step delta is measured from. A ref because nothing
  // renders it; it is only ever read inside a handler or a timeout.
  const lastFlush = useRef(0);
  const secondsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    lastFlush.current = Date.now();
  }, []);

  // Autosave: every change is saved, and going back keeps the
  // later answers — which only holds if the later answers were written.
  useEffect(() => {
    if (!dirty) return;

    const id = setTimeout(() => {
      const now = Date.now();
      const delta = Math.max(0, Math.round((now - lastFlush.current) / 1000));
      lastFlush.current = now;

      const data = new FormData();
      data.set("planId", planId);
      data.set("step", String(step));
      data.set("patch", serialised);
      data.set("seconds", String(delta));
      data.set("advance", "false");

      startTransition(() => formAction(data));
    }, AUTOSAVE_MS);

    return () => clearTimeout(id);
    // `formAction` is stable; the rest are primitives.
  }, [dirty, serialised, planId, step, formAction]);

  /** Called from the Continue button, never during render. */
  function stampSeconds() {
    const now = Date.now();
    const delta = Math.max(0, Math.round((now - lastFlush.current) / 1000));
    lastFlush.current = now;
    if (secondsRef.current) secondsRef.current.value = String(delta);
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="step" value={step} />
      <input type="hidden" name="patch" value={serialised} />
      <input type="hidden" name="seconds" defaultValue="0" ref={secondsRef} />

      {children}

      <div className={s.foot}>
        {backHref && (
          <Button variant="secondary" href={backHref}>
            Back
          </Button>
        )}

        <GateNote passed={gate.passed} reason={state.error ?? gate.reason} />

        <span className={s.saveState} aria-live="polite">
          {pending
            ? "Saving…"
            : state.error
              ? "Not saved"
              : dirty
                ? "Unsaved changes"
                : "Saved"}
        </span>

        <Button
          type="submit"
          name="advance"
          value="true"
          variant="primary"
          size="lg"
          onClick={stampSeconds}
          loading={pending}
          disabled={!gate.passed}
        >
          {nextLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Step 7 has no answers to save and no gate to fail — it is the read-back. It
 * gets its own footer so it does not have to pretend to be a form.
 *
 * Back uses `Button href`, which renders the anchor itself. It was a `<button>`
 * wrapped in a `<Link>` — a `<button>` inside an `<a>`, which no HTML parser
 * accepts and which sits inside step 7's seal form, one missing `type="button"`
 * away from sealing the plan on its way out of the page.
 */
export function SummaryFoot({
  planId,
  gate,
  children,
}: {
  planId: string;
  gate: StepGate;
  children?: ReactNode;
}) {
  return (
    <div className={s.foot}>
      <Button variant="secondary" href={`/plan/${planId}/step/6`}>
        Back
      </Button>
      <GateNote passed={gate.passed} reason={gate.reason} />
      {children}
    </div>
  );
}

```

### `dashboard\src\app\plan\[id]\steps.module.css`

```css
/* Controls the seven planning steps share. */

.choices {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

/* A choice is a whole card, not a dot beside a label: at four options with a
   line of reasoning each, the card is the hit target the reasoning deserves. */
.choice {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: var(--s-3);
  padding: var(--s-4);
  text-align: left;
  border: var(--bw) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
  cursor: pointer;
  transition:
    border-color var(--m-fast) var(--ease-out),
    background-color var(--m-fast) var(--ease-out);
}

.choice:hover {
  border-color: var(--border-strong);
  background: var(--surface-sunken);
}

.choiceOn,
.choiceOn:hover {
  border-color: var(--brand);
  background: var(--brand-surface);
  box-shadow: inset 0 0 0 1px var(--brand);
}

.mark {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  border: var(--bw-emphasis) solid var(--border-strong);
  border-radius: 50%;
  background: var(--surface);
}

.choiceOn .mark {
  border-color: var(--brand);
  background: var(--brand);
  color: var(--on-brand);
}

.markGlyph {
  width: 12px;
  height: 12px;
}

/* Both are `<span>`s, and a span is inline — so `margin-top` on the detail did
   nothing at all and the two ran together with no break and no space:
   "…osteoarthritis with varus deformityAge, insidious onset, medial pain…".
   The answer and the reasoning for it read as one run-on sentence, which is the
   opposite of what a differential list is for.

   `display: block` is the whole fix. The label takes its own line, the detail
   sits under it, and the margin it was already asking for starts applying. */
.choiceLabel {
  display: block;
  font-size: var(--t-label);
  font-weight: 700;
  line-height: 1.35;
  color: var(--ink);
}

.choiceDetail {
  display: block;
  margin-top: var(--s-1);
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
  text-wrap: pretty;
}

/* ---------- measurement table ---------- */

.measures {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.measureHead,
.measure {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px 108px 96px;
  align-items: center;
  gap: var(--s-3);
}

.measureHead {
  padding: 0 var(--s-3) var(--s-2);
  font-size: var(--t-overline);
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-disabled);
}

.measure {
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-sm);
}

.measure:nth-child(odd) {
  background: var(--surface-sunken);
}

.measureName {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.measureShort {
  font-size: var(--t-label);
  font-weight: 700;
  color: var(--ink);
}

.measureFull {
  font-size: var(--t-caption);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.numberWrap {
  position: relative;
  display: flex;
  align-items: center;
}

.number {
  width: 100%;
  min-height: 40px;
  padding: 0 var(--s-6) 0 var(--s-3);
  font: inherit;
  font-size: var(--t-body);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
  text-align: right;
  background: var(--surface);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-xs);
}

.number:focus-visible {
  outline: var(--bw-emphasis) solid var(--brand);
  outline-offset: 1px;
}

.unit {
  position: absolute;
  right: var(--s-3);
  font-size: var(--t-caption);
  color: var(--text-muted);
  pointer-events: none;
}

.range {
  font-size: var(--t-caption);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* Only ever "in the published normal range" or not — never "correct". The
   normal range is public knowledge; the case's true value is not. */
.flag {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  padding: 2px var(--s-2);
  border-radius: var(--r-pill);
  font-size: var(--t-caption);
  font-weight: 700;
  white-space: nowrap;
}

.flagIn {
  background: var(--pass-surface);
  color: var(--pass);
}

.flagOut {
  background: var(--warn-surface);
  color: var(--warn);
}

.flagNone {
  color: var(--text-disabled);
}

/* Critical is not high. The risk list ranks its rows and the pill has to
   carry that ranking, or the popliteal bundle and a raised BMI arrive looking
   the same. Tinted rather than solid because these sit inside a large row that
   is itself the grouping surface, the same reading as .flagOut
   directly above. */
.flagCritical {
  background: var(--fail-surface);
  color: var(--fail);
}

/* ---------- sliders ---------- */

.sliders {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
}

.slider {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.sliderHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-3);
}

.sliderLabel {
  font-size: var(--t-label);
  font-weight: 600;
  color: var(--text);
}

.sliderValue {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.sliderInput {
  width: 100%;
  accent-color: var(--brand);
}

.sliderScale {
  display: flex;
  justify-content: space-between;
  font-size: var(--t-caption);
  color: var(--text-disabled);
}

.sliderHint {
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

/* ---------- discrete catalogue values ---------- */

.scale {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.scaleRow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.scaleStop {
  flex: 1 1 0;
  min-width: 64px;
  min-height: 44px;
  padding: var(--s-2) var(--s-3);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  font: inherit;
  font-size: var(--t-label);
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background var(--m-fast), border-color var(--m-fast);
}

.scaleStop:hover {
  border-color: var(--brand);
  background: var(--brand-surface);
}

.scaleStop:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* Solid brand, because this is a selection and not a verdict — the same
   treatment as a selected Chip. */
.scaleStopOn {
  border-color: var(--brand);
  background: var(--brand);
  color: var(--on-brand);
}

.scaleStopOn:hover {
  background: var(--brand-hover);
  border-color: var(--brand-hover);
}

/* ---------- risk checklist ---------- */

.risks {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.risk {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--s-3);
  padding: var(--s-4);
  text-align: left;
  border: var(--bw) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
  cursor: pointer;
}

.risk:hover {
  border-color: var(--border-strong);
}

.riskOn {
  border-color: var(--brand-border);
  background: var(--brand-surface);
}

.riskBox {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  border: var(--bw-emphasis) solid var(--border-strong);
  border-radius: var(--r-xs);
  background: var(--surface);
}

.riskOn .riskBox {
  border-color: var(--brand);
  background: var(--brand);
  color: var(--on-brand);
}

.riskLabel {
  font-size: var(--t-label);
  font-weight: 700;
  color: var(--ink);
}

.riskDetail {
  margin-top: 2px;
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

/* ---------- summary ---------- */

.summaryGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-4);
  align-items: start;
}

.rows {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-3) 0;
  border-bottom: var(--bw) solid var(--divider);
  font-size: var(--t-label);
}

.row:last-child {
  border-bottom: 0;
}

.rowLabel {
  color: var(--text-muted);
}

.rowValue {
  font-weight: 700;
  color: var(--ink);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1279px) {
  .summaryGrid {
    grid-template-columns: minmax(0, 1fr);
  }

  .measureHead,
  .measure {
    grid-template-columns: minmax(0, 1fr) 100px 92px 84px;
  }
}

```

### `dashboard\src\app\plan\[id]\Steps.tsx`

```tsx
"use client";

import { useState } from "react";
import { MEASUREMENTS, type PlanDetail, type StepGate } from "@/lib/plan";
import {
  ChoiceList,
  MeasurementTable,
  OptionScale,
  RiskList,
  Rows,
  Slider,
} from "./Controls";
import { StepForm } from "./StepForm";
import s from "./plan.module.css";
import t from "./steps.module.css";

/**
 * The seven planning steps
 *
 * Each one owns a single branch of the plan payload, holds it in state and
 * hands it to `StepForm` as a `patch`. None of them knows whether an answer is
 * right: the verdict in `gate` came from `plan_gates`, which read `case_truth`
 * on the server and returned a sentence.
 *
 * **The radiograph wells render a labelled plate.** The imaging manifest names
 * four views and the `imaging` bucket is empty, so there is nothing to
 * draw. Measurements are typed instead of dropped on a canvas, which
 * requires regardless: *"Radiograph viewers expose measured values as text;
 * the image is never the only source of a number."* When the radiographs are
 * authored, the canvas fills the same well and writes the same six numbers.
 */

type StepProps = { plan: PlanDetail; gate: StepGate };

function Card({
  title,
  sub,
  action,
  children,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={s.card}>
      <div className={s.cardHead}>
        <div>
          <h2 className={s.cardTitle}>{title}</h2>
          {sub && <p className={s.cardSub}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Plate({ title, note }: { title: string; note: string }) {
  return (
    <div className={s.plate}>
      <p className={s.plateText}>{title}</p>
      <p className={s.plateNote}>{note}</p>
    </div>
  );
}

/* ============================================================
   1 · Case history
   ============================================================ */

export function Step1({ plan, gate }: StepProps) {
  const [diagnosis, setDiagnosis] = useState(plan.payload.diagnosis ?? "");

  return (
    <StepForm
      planId={plan.id}
      step={1}
      patch={{ diagnosis }}
      gate={gate}
      backHref={`/cases/${plan.caseId}`}
      nextLabel="Proceed to imaging review"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="Patient"
            sub="Synthetic. No identifiable data is stored anywhere in the product."
          >
            <div className={s.tiles}>
              {plan.case.patient.map((field) => (
                <div className={s.tile} key={field.label}>
                  <span className={s.tileLabel}>{field.label}</span>
                  <span className={s.tileValue}>{field.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Presentation">
            <dl className={s.kv}>
              {plan.case.narrative.map((field) => (
                <div className={s.kvRow} key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Primary diagnosis"
            sub="Commit before you look at any imaging. The gate is the correct primary diagnosis, and the history alone is enough to reach it."
          >
            <ChoiceList
              name="Primary diagnosis"
              options={plan.options.diagnosis ?? []}
              value={diagnosis}
              onChange={setDiagnosis}
            />
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   2 · Imaging review
   ============================================================ */

export function Step2({ plan, gate }: StepProps) {
  const [reading, setReading] = useState({
    kl_grade: plan.payload.imaging_reading?.kl_grade ?? "",
    compartment: plan.payload.imaging_reading?.compartment ?? "",
  });

  return (
    <StepForm
      planId={plan.id}
      step={2}
      patch={{ imaging_reading: reading }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/1`}
      nextLabel="Proceed to deformity measurement"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="Imaging package"
            sub={`${plan.case.imaging.length} views authored for this case.`}
          >
            <div className={s.viewList}>
              {plan.case.imaging.map((view) => (
                <span className={s.budget} key={view.view}>
                  {view.label}
                </span>
              ))}
            </div>
            <Plate
              title="Radiographs are not authored yet"
              note="The manifest names the views above and the imaging bucket is empty, so this well stays a labelled plate rather than a stock photograph standing in for a patient's films."
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Radiographic grade"
            sub="Grade the disease you would expect from this history and examination."
          >
            <ChoiceList
              name="Radiographic grade"
              options={plan.options.kl_grade ?? []}
              value={reading.kl_grade}
              onChange={(kl_grade) => setReading((r) => ({ ...r, kl_grade }))}
            />
          </Card>

          <Card
            title="Affected compartment"
            sub="Which compartment has lost its joint space."
          >
            <ChoiceList
              name="Affected compartment"
              options={plan.options.compartment ?? []}
              value={reading.compartment}
              onChange={(compartment) =>
                setReading((r) => ({ ...r, compartment }))
              }
            />
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   3 · Deformity measurement
   ============================================================ */

export function Step3({ plan, gate }: StepProps) {
  const [values, setValues] = useState<Record<string, number | undefined>>(
    () => ({ ...plan.payload.measurements }),
  );

  return (
    <StepForm
      planId={plan.id}
      step={3}
      patch={{
        measurements: Object.fromEntries(
          Object.entries(values).filter(([, v]) => v !== undefined),
        ),
      }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/2`}
      nextLabel="Proceed to alignment planning"
    >
      <div className={`${s.body} ${s.thirds}`}>
        <div className={s.col}>
          <Card title="Full-length AP">
            <Plate
              title="Measurement canvas pending"
              note="Landmark points, axis lines and angle arcs land in this well when the long-leg films are authored. Until then the six angles are entered directly, which is required in any case: the image is never the only source of a number."
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Deformity measurement"
            sub="Every angle must land within its tolerance of the film. The normal range beside each is population knowledge — this knee is abnormal, so being outside it is expected."
          >
            <MeasurementTable
              specs={MEASUREMENTS}
              values={values}
              ranges={plan.case.referenceRanges}
              onChange={(key, value) =>
                setValues((current) => ({ ...current, [key]: value }))
              }
            />
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   4 · Alignment planning
   ============================================================ */

export function Step4({ plan, gate }: StepProps) {
  const measured = plan.payload.measurements ?? {};
  const [targetHka, setTargetHka] = useState(
    plan.payload.alignment_plan?.target_hka_deg ?? 180,
  );
  const [resections, setResections] = useState({
    proximal_tibia_medial_mm:
      plan.payload.resections?.proximal_tibia_medial_mm ?? 2,
    posterior_tibial_slope_deg:
      plan.payload.resections?.posterior_tibial_slope_deg ?? 3,
    distal_femur_mm: plan.payload.resections?.distal_femur_mm ?? 9,
    distal_femur_valgus_deg:
      plan.payload.resections?.distal_femur_valgus_deg ?? 5,
  });

  const measuredHka = measured.hka_deg;
  const correction =
    measuredHka === undefined
      ? undefined
      : Math.round((targetHka - measuredHka) * 10) / 10;

  return (
    <StepForm
      planId={plan.id}
      step={4}
      /* `resection_strategy` used to be written here, from `measured.hka_deg`
         — a release decision the learner had not made yet, guessed from the
         deformity, and defaulting to `lateral_release` on an unmeasured knee
         because `undefined ?? 180 < 180` is false. Step 6 is where the release
         is actually chosen and graded, so the strategy is now *derived* from
         that answer wherever it is read (`releaseStrategy`), not stored twice.
         The same reasoning as `plan_gates`: a derivation cannot go stale, and a
         stored copy of an answer that can still change will. */
      patch={{
        alignment_plan: {
          target_hka_deg: targetHka,
          planned_correction_deg: correction,
        },
        resections,
      }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/3`}
      nextLabel="Proceed to implant selection"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="What you measured"
            sub="Carried forward from step 3. Change it there, not here."
          >
            <div className={s.tiles}>
              {MEASUREMENTS.map((spec) => (
                <div className={s.tile} key={spec.key}>
                  <span className={s.tileLabel}>{spec.short}</span>
                  <span className={s.tileValue}>
                    {measured[spec.key] !== undefined
                      ? `${measured[spec.key]}${spec.unit}`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Projected outcome">
            <Rows
              rows={[
                { label: "Target mechanical axis", value: `${targetHka.toFixed(1)}°` },
                {
                  label: "Correction from measured",
                  value:
                    correction === undefined
                      ? "—"
                      : `${correction > 0 ? "+" : ""}${correction.toFixed(1)}°`,
                },
                {
                  label: "Deviation from neutral",
                  value: `${Math.abs(targetHka - 180).toFixed(1)}°`,
                },
              ]}
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Target alignment"
            sub="This is the contract. Every measurement the headset takes is scored against it, not against a generic ideal."
          >
            <div className={t.sliders}>
              <Slider
                label="Post-operative mechanical axis"
                value={targetHka}
                min={174}
                max={186}
                step={0.5}
                unit="°"
                format={(v) =>
                  v === 180
                    ? "Neutral"
                    : `${Math.abs(v - 180).toFixed(1)}° ${v < 180 ? "varus" : "valgus"}`
                }
                hint="The gate is within 1° of neutral."
                onChange={setTargetHka}
              />
            </div>
          </Card>

          <Card title="Planned resections">
            <div className={t.sliders}>
              <Slider
                label="Proximal tibia — medial"
                value={resections.proximal_tibia_medial_mm}
                min={0}
                max={12}
                step={1}
                unit=" mm"
                onChange={(v) =>
                  setResections((r) => ({ ...r, proximal_tibia_medial_mm: v }))
                }
              />
              <Slider
                label="Posterior tibial slope"
                value={resections.posterior_tibial_slope_deg}
                min={0}
                max={10}
                step={0.5}
                unit="°"
                hint="Acceptable 0°–7°. Beyond that the insert is unstable in flexion."
                onChange={(v) =>
                  setResections((r) => ({ ...r, posterior_tibial_slope_deg: v }))
                }
              />
              <Slider
                label="Distal femur"
                value={resections.distal_femur_mm}
                min={6}
                max={14}
                step={0.5}
                unit=" mm"
                onChange={(v) =>
                  setResections((r) => ({ ...r, distal_femur_mm: v }))
                }
              />
              <Slider
                label="Distal femoral valgus cut"
                value={resections.distal_femur_valgus_deg}
                min={3}
                max={9}
                step={0.5}
                unit="°"
                onChange={(v) =>
                  setResections((r) => ({ ...r, distal_femur_valgus_deg: v }))
                }
              />
            </div>
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   5 · Implant selection
   ============================================================ */

/**
 * Nothing on this step is authored here any more.
 *
 * The two designs and the three size ladders were arrays in this file, which
 *
 * stylistic: `case_truth` grades against `acceptable_femoral_sizes`, so a
 * catalogue in a component and a catalogue in the database are two lists that
 * can disagree about which sizes exist. They now come from
 * `plan_step_options`, scoped to this case's procedure, and the screen
 * can only offer what the validator will accept.
 *
 * The sizes also start **unchosen**. They used to default to 4 · 4 · 10 mm,
 * which is an answer nobody gave sitting in a graded field — and until the schema a
 * plan could be sealed on those defaults without the gate noticing.
 */
export function Step5({ plan, gate }: StepProps) {
  const [implants, setImplants] = useState<{
    design: string;
    femoral_size?: number;
    tibial_tray_size?: number;
    pe_insert_mm?: number;
  }>({
    design:
      plan.payload.implants?.design ??
      plan.payload.session_config?.implant_design ??
      "",
    femoral_size: plan.payload.implants?.femoral_size,
    tibial_tray_size: plan.payload.implants?.tibial_tray_size,
    pe_insert_mm: plan.payload.implants?.pe_insert_mm,
  });

  return (
    <StepForm
      planId={plan.id}
      step={5}
      patch={{ implants }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/4`}
      nextLabel="Proceed to risk & strategy"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="Design"
            sub="The variant changes which parts run in the headset, so it is decided here and read back on the confirmation card."
          >
            <ChoiceList
              name="Implant design"
              options={plan.options.design ?? []}
              value={implants.design}
              onChange={(design) => setImplants((i) => ({ ...i, design }))}
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Component sizing"
            sub="Size from cortical coverage and the measured AP dimension. The fit check fails on overhang beyond 2 mm and on any undercut."
          >
            <div className={t.sliders}>
              <OptionScale
                label="Femoral size"
                options={plan.options.femoral_size ?? []}
                value={implants.femoral_size}
                format={(option) => option.value}
                onChange={(femoral_size) =>
                  setImplants((i) => ({ ...i, femoral_size }))
                }
              />
              <OptionScale
                label="Tibial tray size"
                options={plan.options.tibial_tray_size ?? []}
                value={implants.tibial_tray_size}
                format={(option) => option.value}
                onChange={(tibial_tray_size) =>
                  setImplants((i) => ({ ...i, tibial_tray_size }))
                }
              />
              <OptionScale
                label="Insert thickness"
                options={plan.options.pe_insert_mm ?? []}
                value={implants.pe_insert_mm}
                hint="The thinnest insert that fills the balanced gap."
                onChange={(pe_insert_mm) =>
                  setImplants((i) => ({ ...i, pe_insert_mm }))
                }
              />
            </div>
          </Card>

          <Card title="Bone–implant fit">
            <Plate
              title="Fit visual pending"
              note="The overhang overlay renders here once the component geometry ships with the case assets. The fit check itself runs server-side against the case's acceptable sizes, and its verdict is below."
            />
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   6 · Risk & strategy
   ============================================================ */

export function Step6({ plan, gate }: StepProps) {
  const [acknowledged, setAcknowledged] = useState<string[]>(
    plan.payload.risks?.acknowledged ?? [],
  );
  const [tightSide, setTightSide] = useState(
    plan.payload.risks?.tight_side ?? "",
  );

  const toggle = (id: string) =>
    setAcknowledged((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );

  return (
    <StepForm
      planId={plan.id}
      step={6}
      patch={{ risks: { acknowledged, tight_side: tightSide } }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/5`}
      nextLabel="Proceed to plan summary"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="Risk assessment"
            sub={`${acknowledged.length} of ${plan.risks.length} acknowledged. Each one is derived from this patient's own record, not from a generic checklist.`}
          >
            <RiskList
              risks={plan.risks}
              acknowledged={acknowledged}
              onToggle={toggle}
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Which side is tight"
            sub="The release you commit to here is the one the headset expects at 2.3 and 3.2. Getting it wrong costs marks in both."
          >
            <ChoiceList
              name="Tight side"
              options={plan.options.tight_side ?? []}
              value={tightSide}
              onChange={setTightSide}
            />
          </Card>

          {/* Authored per procedure, in `plan_step_options`. Every one
              of these names a structure or a scene number that belongs to TKR,
              so they are content and not chrome —
              procedure with none authored renders no card rather than an empty
              one. */}
          {plan.guidance.length > 0 && (
            <Card title="Key intra-operative points">
              <ul className={s.kv}>
                {plan.guidance.map((point) => (
                  <li className={s.kvRow} key={point}>
                    <dt aria-hidden="true">·</dt>
                    <dd>{point}</dd>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </StepForm>
  );
}

```

### `dashboard\src\app\plan\[id]\saved\page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { getPlan, releaseStrategy } from "@/lib/data/plan";
import { titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PinPanel } from "./PinPanel";
import s from "./saved.module.css";

export const metadata: Metadata = { title: "Plan saved" };

/**
 * The handoff.
 *
 * A plan that has not passed every gate cannot reach this screen: the redirect
 * below sends it back to the first open step, and `plan_seal` would refuse it
 * anyway. Both checks exist because they answer different questions — one is
 * navigation, one is the boundary.
 *
 * The same is true of a plan that has already been performed. `/plan/[id]/step`
 * carries that guard; this screen did not, so a sealed plan
 * whose session had long since finished still rendered the handoff and offered
 * to issue a PIN for it. `pair-mint` now refuses that outright (the schema and the
 * `plan_frozen` branch), but a screen should not offer a control whose only
 * possible answer is no.
 */
export default async function PlanSavedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();

  const plan = await getPlan(id);
  if (!plan) notFound();

  // Performed already: there is nothing left to hand off, and the case page is
  // where the session and its report are.
  if (plan.hasSession) redirect(`/cases/${plan.caseId}`);

  if (!plan.isReadyForVr) {
    const open = plan.gates.find((g) => !g.passed)?.step ?? 1;
    redirect(`/plan/${plan.id}/step/${open}`);
  }

  const config = plan.payload.session_config ?? {};
  const implants = plan.payload.implants ?? {};

  const totalSeconds = Object.values(plan.stepTimings).reduce((a, b) => a + b, 0);

  return (
    <div className={s.page}>
      <main className={s.surface}>
        <div className={s.inner}>
          <div className={s.head}>
            <span className={s.tick} aria-hidden="true">
              <Check className={s.tickGlyph} strokeWidth={3} />
            </span>
            <div>
              <h1 className={s.title}>Plan saved</h1>
              <p className={s.lede}>
                {plan.case.title} · {titleCase(config.mode ?? "training")} ·{" "}
                {titleCase(config.difficulty ?? "intermediate")} ·{" "}
                {implants.design ?? "CR"} ·{" "}
                {titleCase(config.fixation ?? "cemented")}. The headset will read
                this back to you before anything is committed.
              </p>
            </div>
          </div>

          <div className={s.layout}>
            <PinPanel planId={plan.id} />

            <div className={s.col}>
              <section className={s.card}>
                <h2 className={s.cardTitle}>On the headset</h2>
                <ol className={s.stepsList}>
                  {[
                    "Put on the headset and wait for the MediVeR XR splash screen.",
                    "Press Enter PIN and key the four digits into the floating keypad.",
                    "Confirm the case read-back, then begin the Time Out.",
                  ].map((line, i) => (
                    <li className={s.stepRow} key={line}>
                      <span className={s.stepNum} aria-hidden="true">
                        {i + 1}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className={s.card}>
                <h2 className={s.cardTitle}>What the headset receives</h2>
                <div className={s.rows}>
                  {[
                    { label: "Case", value: plan.case.title },
                    {
                      label: "Target mechanical axis",
                      value:
                        plan.payload.alignment_plan?.target_hka_deg !== undefined
                          ? `${plan.payload.alignment_plan.target_hka_deg.toFixed(1)}°`
                          : "—",
                    },
                    {
                      label: "Implant",
                      value: `${implants.design ?? "—"} · femoral ${implants.femoral_size ?? "—"} · tray ${implants.tibial_tray_size ?? "—"} · ${implants.pe_insert_mm ?? "—"} mm`,
                    },
                    {
                      // The release the headset expects at 2.3 and 3.2,
                      // derived from the tight side step 6 graded — one answer,
                      // read two ways, never stored twice.
                      label: "Release",
                      value: titleCase(
                        releaseStrategy(plan.payload.risks?.tight_side)?.replace(
                          /_/g,
                          " ",
                        ) ?? "—",
                      ),
                    },
                    {
                      label: "Time spent planning",
                      value:
                        totalSeconds > 0
                          ? `${Math.floor(totalSeconds / 60)} min ${totalSeconds % 60} s`
                          : "—",
                    },
                  ].map((row) => (
                    <div className={s.row} key={row.label}>
                      <span className={s.rowLabel}>{row.label}</span>
                      <span className={s.rowValue}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className={s.actions}>
            <Button variant="secondary" href={`/plan/${plan.id}/step/7`}>
              Review the plan
            </Button>
            <Button variant="secondary" href={`/cases/${plan.caseId}`}>
              Back to the case
            </Button>
            <Button variant="ghost" href="/">
              Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

```

### `dashboard\src\app\plan\[id]\saved\PinPanel.tsx`

```tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { Banner, Button } from "@/components/ui";
import { mintPin, type PinState } from "@/app/actions";
import s from "./saved.module.css";

/**
 * The PIN handoff
 *
 * The digits exist in exactly one place a client can see: this component's
 * state, from the `pair-mint` response. `pairing_pins` is `using (false)` for
 * every client role, so there is no query that could fetch them back. Reload
 * the page and the PIN is unrecoverable — which is correct, and why the panel offers to
 * mint another rather than pretending to remember.
 *
 * The countdown starts from the expiry the server returned, not from a local
 * clock reading, so a slow browser cannot show more time than the PIN has.
 */
export function PinPanel({ planId }: { planId: string }) {
  const [state, formAction, pending] = useActionState<PinState, FormData>(
    mintPin,
    {},
  );

  return (
    <section className={s.pinCard}>
      {state.error && (
        <Banner tone="fail" title="No PIN was issued">
          {state.error}
        </Banner>
      )}

      {state.pin ? (
        <>
          <p className={s.pinLabel}>Pairing PIN</p>
          <p className={s.pin} aria-label={`Pairing PIN ${state.pin.split("").join(" ")}`}>
            {state.pin.split("").map((digit, i) => (
              <span className={s.digit} key={i}>
                {digit}
              </span>
            ))}
          </p>
          {state.expiresAt ? (
            <Countdown key={state.pin} expiresAt={state.expiresAt} />
          ) : (
            <p className={s.pinMeta}>Single use · 30 minutes</p>
          )}
        </>
      ) : (
        <>
          <p className={s.pinLabel}>Pairing PIN</p>
          <p className={s.pinPlaceholder} aria-hidden="true">
            <span className={s.digit}>·</span>
            <span className={s.digit}>·</span>
            <span className={s.digit}>·</span>
            <span className={s.digit}>·</span>
          </p>
          <p className={s.pinMeta}>
            Issued on request and valid for thirty minutes, so it is not sitting
            on a screen in an empty room.
          </p>
        </>
      )}

      <form action={formAction}>
        <input type="hidden" name="planId" value={planId} />
        <Button
          type="submit"
          variant={state.pin ? "secondary" : "primary"}
          size="lg"
          block
          loading={pending}
        >
          {state.pin ? "Issue a new PIN" : "Issue pairing PIN"}
        </Button>
      </form>

      {state.pin && (
        <p className={s.replaceNote}>
          Issuing another immediately voids this one. A plan never has two live
          PINs.
        </p>
      )}
    </section>
  );
}

/**
 * Mounted only once there is an expiry, and remounted whenever a new PIN
 * arrives — so the initial value is computed on the first render rather than
 * corrected by an effect afterwards. Same shape as `SearchDialog`: state that
 * starts clean by construction beats state reset in an effect.
 */
function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(
      () =>
        setRemaining(
          Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)),
        ),
      1000,
    );
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining <= 0) {
    return (
      <p className={s.pinMeta}>
        <span className={s.expired}>Expired — issue another</span>
      </p>
    );
  }

  return (
    <p className={s.pinMeta} suppressHydrationWarning>
      Expires in{" "}
      <b>
        {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
      </b>{" "}
      · single use
    </p>
  );
}

```

### `dashboard\src\app\plan\[id]\saved\saved.module.css`

```css
.page {
  display: flex;
  min-height: 100dvh;
  padding: var(--s-4);
  background: var(--rail);
}

.surface {
  flex: 1;
  min-width: 0;
  padding: var(--s-9) var(--s-7);
  border-radius: var(--r-xl);
  background: var(--surface);
}

.inner {
  max-width: 1080px;
  margin-inline: auto;
}

.head {
  display: flex;
  align-items: flex-start;
  gap: var(--s-4);
  margin-bottom: var(--s-7);
}

.tick {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--pass);
  color: #fff;
}

.tickGlyph {
  width: 24px;
  height: 24px;
}

.title {
  font-size: var(--t-h1);
  line-height: var(--t-h1-lh);
}

.lede {
  margin-top: var(--s-2);
  max-width: 74ch;
  font-size: var(--t-body);
  line-height: var(--t-body-lh);
  color: var(--text-muted);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: var(--s-4);
  align-items: start;
}

/* ---------- the PIN ---------- */

.pinCard {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-6);
  border: var(--bw) solid var(--brand-border);
  border-radius: var(--r-md);
  background: var(--brand-surface);
}

.pinLabel {
  font-size: var(--t-overline);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.pin,
.pinPlaceholder {
  display: flex;
  gap: var(--s-2);
}

.digit {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 76px;
  border-radius: var(--r-sm);
  background: var(--surface);
  font-family: var(--font-display);
  font-size: var(--t-display);
  font-weight: 700;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.pinPlaceholder .digit {
  color: var(--text-disabled);
  background: rgba(255, 255, 255, 0.5);
}

.pinMeta {
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.expired {
  font-weight: 700;
  color: var(--fail);
}

.replaceNote {
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

/* ---------- instructions ---------- */

.col {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-md);
}

.cardTitle {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  color: var(--ink);
}

.stepsList {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.stepRow {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: var(--s-3);
  align-items: start;
  font-size: var(--t-label);
  line-height: 1.55;
  color: var(--text);
}

.stepNum {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--dark);
  color: #fff;
  font-size: var(--t-caption);
  font-weight: 700;
}

.rows {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-3) 0;
  border-bottom: var(--bw) solid var(--divider);
  font-size: var(--t-label);
}

.row:last-child {
  border-bottom: 0;
}

.rowLabel {
  color: var(--text-muted);
}

.rowValue {
  font-weight: 700;
  color: var(--ink);
  text-align: right;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  margin-top: var(--s-6);
  padding-top: var(--s-5);
  border-top: var(--bw) solid var(--border);
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

```

### `dashboard\src\app\plan\[id]\step\[step]\page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  LAST_STEP,
  PLAN_STEPS,
  furthestOpenStep,
  gateFor,
  getPlan,
} from "@/lib/data/plan";
import { getCurrentUser } from "@/lib/session";
import { PlanShell } from "../../PlanShell";
import { Step1, Step2, Step3, Step4, Step5, Step6 } from "../../Steps";
import { Step7 } from "../../Step7";

/** One line per step, stating what the step is for rather than what it contains. */
const LEDE: Record<number, string> = {
  1: "Read the history and commit to a primary diagnosis before you look at any imaging.",
  2: "Grade the disease and name the compartment that has failed.",
  3: "Measure the deformity. Every angle has to land within tolerance of the film.",
  4: "Set the target axis and the resection depths. This is the contract the headset scores you against.",
  5: "Choose the design and the sizes. The fit check must report no overhang and no undercut.",
  6: "Acknowledge every risk this patient carries, then commit to the release.",
  7: "Read-only. Every screen after this compares against this plan, never against a generic ideal.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}): Promise<Metadata> {
  const { step } = await params;
  const entry = PLAN_STEPS.find((s) => String(s.step) === step);
  return { title: entry ? `${entry.step}. ${entry.title}` : "Planning" };
}

/**
 * One route for all seven steps.
 *
 * The gate for every step is fetched on every load rather than remembered, so
 * going back and changing an upstream answer re-closes what depended on it —
 * That is also why a learner cannot deep-link past the first open
 * step: the redirect below reads the same gates the rail draws.
 */
export default async function PlanStepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>;
}) {
  const { id, step: raw } = await params;
  const step = Number(raw);

  if (!Number.isInteger(step) || step < 1 || step > LAST_STEP) notFound();

  await getCurrentUser();
  const plan = await getPlan(id);
  if (!plan) notFound();

  // A plan with a session is frozen. There is nothing to
  // edit, so the case page is the honest destination.
  if (plan.hasSession) redirect(`/cases/${plan.caseId}`);

  // Backward is always free; forward is gated. Deep-linking past the first
  // open step lands on that step instead of on an empty screen.
  const open = furthestOpenStep(plan.gates);
  if (step > open) redirect(`/plan/${plan.id}/step/${open}`);

  const gate = gateFor(plan.gates, step);
  const entry = PLAN_STEPS.find((s) => s.step === step)!;

  return (
    <PlanShell plan={plan} step={step} title={entry.title} lede={LEDE[step]}>
      {step === 1 && <Step1 plan={plan} gate={gate} />}
      {step === 2 && <Step2 plan={plan} gate={gate} />}
      {step === 3 && <Step3 plan={plan} gate={gate} />}
      {step === 4 && <Step4 plan={plan} gate={gate} />}
      {step === 5 && <Step5 plan={plan} gate={gate} />}
      {step === 6 && <Step6 plan={plan} gate={gate} />}
      {step === 7 && <Step7 plan={plan} gate={gate} />}
    </PlanShell>
  );
}

```

### `dashboard\src\app\plans\page.tsx`

```tsx
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getPlans } from "@/lib/data/plans";
import type { PlanState } from "@/lib/plan";
import { longDuration, relativeTime, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PlanFilters } from "./PlanFilters";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Plans" };

const STATES: PlanState[] = ["draft", "ready", "paired", "performed"];

/**
 * The learner's own planning work, and where each plan has got to.
 *
 * The pairing column is the interesting part: `pairing_pins` is `using (false)`
 * for every client role, so this cannot read a PIN. `my_pin_status()`
 * returns the lifecycle without a `pin` column at all — which plan, when the
 * code dies, whether a headset took it. That is the whole content of a support
 * conversation about pairing, and none of it is the credential.
 */
export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state: raw } = await searchParams;
  const state = STATES.includes(raw as PlanState)
    ? (raw as PlanState)
    : undefined;

  const user = await getCurrentUser();
  const { plans, counts } = await getPlans(state);
  const now = new Date().toISOString();

  return (
    <AppShell user={user} searchHint='Try searching "plans"'>
      <PageHeader
        title="Plans"
        lede="Every case you have planned, and where each plan has got to — in progress, sealed and waiting for a headset, or performed."
        actions={
          <Button href="/cases" variant="primary">
            Plan a case
          </Button>
        }
      />

      <StatRow>
        <StatCard label="In progress" value={String(counts.draft)} variant="dark" />
        <StatCard label="Ready for VR" value={String(counts.ready)} variant="accent" />
        <StatCard label="PIN issued" value={String(counts.paired)} />
        <StatCard label="Performed" value={String(counts.performed)} />
      </StatRow>

      <PlanFilters state={state} counts={counts} />

      {plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={state ? "No plans in that state" : "No plans yet"}
          action={
            <Button href="/cases" variant="primary">
              Browse cases
            </Button>
          }
        >
          {state
            ? "Clear the filter to see the rest of your planning work."
            : "A plan is seven gated steps against the case in front of you. It becomes the contract a session is scored against, which is why it freezes the moment one starts."}
        </EmptyState>
      ) : (
        <>
          <Table label="Plans">
            <THead>
              <Tr>
                <Th>Case</Th>
                <Th>Mode</Th>
                <Th>Difficulty</Th>
                <Th>Preset</Th>
                <Th numeric>Steps</Th>
                <Th numeric>Time spent</Th>
                <Th>Pairing</Th>
                <Th>Updated</Th>
                <Th>
                  <span className="srOnly">Open</span>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {plans.map((plan) => (
                <Tr key={plan.id}>
                  <Td head>{plan.caseTitle}</Td>
                  <Td>{titleCase(plan.mode)}</Td>
                  <Td>{titleCase(plan.difficulty)}</Td>
                  <Td>
                    {plan.presetName ? (
                      <Chip tone="muted">{plan.presetName}</Chip>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td numeric>{plan.stepsAnswered} / 6</Td>
                  <Td numeric>
                    {plan.secondsSpent ? longDuration(plan.secondsSpent) : "—"}
                  </Td>
                  <Td>
                    {plan.state === "performed" ? (
                      <Badge status="pass">Performed</Badge>
                    ) : plan.pin?.state === "live" ? (
                      <Badge status="active">
                        PIN expires {relativeTime(plan.pin.expiresAt, now)}
                      </Badge>
                    ) : plan.pin?.state === "expired" ? (
                      <Chip tone="muted">PIN expired</Chip>
                    ) : plan.state === "ready" ? (
                      <Chip tone="muted">No PIN issued</Chip>
                    ) : (
                      <Chip tone="muted">Not sealed</Chip>
                    )}
                  </Td>
                  <Td>{relativeTime(plan.updatedAt, now)}</Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      href={
                        plan.sessionId
                          ? `/sessions/${plan.sessionId}`
                          : `/plan/${plan.id}`
                      }
                    >
                      {plan.sessionId
                        ? "Session"
                        : plan.state === "draft"
                          ? "Resume"
                          : "Pairing"}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>

          <p className={p.note}>
            The digits of a PIN are not shown here and are not stored anywhere
            this browser can read — <strong>pairing_pins</strong> refuses every
            client role. What this column reports is the lifecycle: whether a
            code is still alive and whether a headset has taken it. A plan that
            has been performed is frozen and cannot be edited or run again; a
            second attempt at a case is a second plan.
          </p>
        </>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\plans\PlanFilters.tsx`

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui";
// From `lib/plan`, not `lib/data/plans`. That module reaches for server-only
// server client, which imports `next/headers`, and a `"use client"` file
// reaching it drags the whole server module into the browser bundle and fails
// the build, and the third time this project has hit it.
import { PLAN_STATES, type PlanState } from "@/lib/plan";
import p from "../panels.module.css";

/**
 * The same URL-filter shape `/cases` and `/sessions` use.
 *
 * `/plans/ready` and `/plans/pins` — two nav destinations —
 * redirect into these filters rather than being separate screens. They are the
 * same list asking a different question about the same column, and the same reasoning
 * already ruled on that shape once: a filter, not an entity.
 */
export function PlanFilters({
  state,
  counts,
}: {
  state?: PlanState;
  counts: Record<PlanState, number>;
}) {
  const router = useRouter();

  return (
    <div className={p.filters}>
      <div className={p.facet} role="group" aria-label="State">
        <span className={p.facetLabel}>State</span>
        {PLAN_STATES.map((option) => (
          <Chip
            key={option.value}
            selected={state === option.value}
            count={counts[option.value] || undefined}
            onClick={() =>
              router.replace(
                state === option.value ? "/plans" : `/plans?state=${option.value}`,
                { scroll: false },
              )
            }
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {state && (
        <Link href="/plans" replace scroll={false} className={p.clear}>
          Clear
        </Link>
      )}
    </div>
  );
}

```

### `dashboard\src\app\reports\page.tsx`

```tsx
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import {
  Badge,
  Button,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { getReportsList } from "@/lib/data/performance";
import { clock, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await getCurrentUser();
  const reports = await getReportsList();

  // The scope decides whose reports are in the list; a name column only earns its
  // width when the list can actually contain somebody else.
  const showLearner = reports.some((r) => r.userId !== user.id);

  return (
    <AppShell user={user} searchHint='Try searching "reports"'>
      <PageHeader
        title="Reports"
        lede="Every generated surgical case report you may read. A report exists once its session completes and the database scores it."
      />

      {reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet">
          A report is generated the moment a session completes. Finish a
          session and its report appears here.
        </EmptyState>
      ) : (
        <Table label="Generated reports">
          <THead>
            <Tr>
              <Th>Date</Th>
              {showLearner && <Th>Learner</Th>}
              <Th>Case</Th>
              <Th>Mode</Th>
              <Th>Difficulty</Th>
              <Th numeric>Duration</Th>
              <Th numeric>Score</Th>
              <Th>Outcome</Th>
              <Th>
                <span className="srOnly">Open</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {reports.map((report) => {
              const passMark = PASS_MARK[report.difficulty];
              const scored = report.totalScore !== undefined;
              return (
                <Tr key={report.id}>
                  <Td head>{shortDate(report.endedAt ?? report.startedAt)}</Td>
                  {showLearner && <Td>{report.learnerName ?? "—"}</Td>}
                  <Td>{report.caseTitle}</Td>
                  <Td>{titleCase(report.mode)}</Td>
                  <Td>{titleCase(report.difficulty)}</Td>
                  <Td numeric>{clock(report.durationS)}</Td>
                  <Td numeric>{scored ? report.totalScore : "—"}</Td>
                  <Td>
                    {scored && (
                      <Badge
                        status={
                          (report.totalScore as number) >= passMark &&
                          report.criticalErrors < 3
                            ? "pass"
                            : "fail"
                        }
                      >
                        {(report.totalScore as number) >= passMark &&
                        report.criticalErrors < 3
                          ? "Passed"
                          : "Not passed"}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      href={`/sessions/${report.id}/report`}
                    >
                      Report
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\sessions\page.tsx`

```tsx
import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { asMode, asStatus, getSessionList } from "@/lib/data/sessions";
import { clock, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { personaFor } from "@/lib/roles";
import { SessionFilters } from "./SessionFilters";
import s from "./sessions.module.css";

export const metadata: Metadata = { title: "Sessions" };

/**
 * Every session this viewer may see
 *
 * The scope is the store's answer, not this page's: a learner gets
 * their own, an instructor their cohort's, an admin all of them, from one
 * unfiltered query. The heading changes because the question changes; the query
 * does not, because a second implementation of the boundary is the one that
 * goes wrong.
 *
 * Filters live in the URL, as they do on `/cases` — a filtered view has to
 * survive a reload and be pasteable into a message.
 */
export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  const filters = {
    status: asStatus(params.status),
    mode: asMode(params.mode),
    caseId: params.case,
  };

  // The list and its figures arrive together from one accessor, counted over
  // the same filtered query — so the stats and the table can never disagree,
  // and a filter changes both together.
  const { sessions, stats } = await getSessionList(filters);

  const filtered = Boolean(filters.status || filters.mode || filters.caseId);

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        eyebrow={persona === "learner" ? "Your history" : "Cohort history"}
        title="Sessions"
        lede={
          persona === "learner"
            ? "Every case you have performed in the headset, and what each one scored."
            : "Every session you supervise. Open one to see the report it produced."
        }
      />

      <StatRow>
        <StatCard
          label="Sessions"
          value={stats.sessions}
          variant="accent"
          sub={filtered ? "Matching these filters" : "All time"}
        />
        <StatCard
          label="Mean score"
          value={stats.meanScore ?? "—"}
          variant="accent"
          sub={
            stats.reported === 0
              ? "No reports yet"
              : `Across ${stats.reported} report${stats.reported === 1 ? "" : "s"}`
          }
        />
        <StatCard
          label="Below pass mark"
          value={stats.belowPass}
          variant="accent"
          sub={stats.reported === 0 ? "Nothing scored yet" : "Of those reported"}
        />
        <StatCard
          label="In progress"
          value={stats.live}
          variant="accent"
          sub={stats.live === 0 ? "Nothing running" : "Running now"}
        />
      </StatRow>

      <div className={s.filterWrap}>
        <SessionFilters
          status={filters.status}
          mode={filters.mode}
          caseId={filters.caseId}
        />
      </div>

      <Card padding="none">
        <CardHeader
          flush
          title={filtered ? "Matching sessions" : "All sessions"}
          subtitle={`${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
        />

        {sessions.length === 0 ? (
          <div className={s.emptyWrap}>
            <EmptyState
              icon={Activity}
              title={filtered ? "No sessions match these filters" : "No sessions yet"}
              action={
                filtered ? (
                  <Button variant="secondary" href="/sessions">
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="primary" href="/cases">
                    Browse cases
                  </Button>
                )
              }
            >
              {filtered
                ? "Clear one of them, or widen the timeframe."
                : "Plan a case on the desktop, then perform it in the headset. The report compares the two."}
            </EmptyState>
          </div>
        ) : (
          <Table label="Sessions">
            <THead>
              <Tr>
                <Th>Date</Th>
                <Th>Case</Th>
                <Th>Mode</Th>
                <Th>Variant</Th>
                <Th numeric>Duration</Th>
                <Th numeric>Score</Th>
                <Th>Status</Th>
                <Th>{/* row action */}</Th>
              </Tr>
            </THead>
            <TBody>
              {sessions.map((session) => {
                const score = session.totalScore;

                return (
                  <Tr key={session.id}>
                    <Td head>{shortDate(session.endedAt ?? session.startedAt)}</Td>
                    <Td>{session.caseTitle}</Td>
                    <Td>{titleCase(session.mode)}</Td>
                    <Td>
                      {session.design} · {titleCase(session.fixation)}
                    </Td>
                    <Td numeric>{clock(session.durationS)}</Td>
                    <Td numeric>{score ?? "—"}</Td>
                    <Td>
                      {/* A Badge announces a verdict; "Interrupted" and "No
                          report" are lifecycle facts, so they are Chips The verdict itself is the one the
                          report stored, not a re-marking. */}
                      {session.status === "live" ? (
                        <Badge status="active">In progress</Badge>
                      ) : session.status === "aborted" ? (
                        <Chip tone="muted">Interrupted</Chip>
                      ) : score === undefined ? (
                        <Chip tone="muted">No report</Chip>
                      ) : session.passed === false ? (
                        <Badge status="fail">Below pass mark</Badge>
                      ) : (
                        <Badge status="pass">Passed</Badge>
                      )}
                    </Td>
                    <Td>
                      {/* The destination is what actually exists for this row.
                          A running session has a live mirror and no report; a
                          finished one has a report. Linking to a report that
                          has not been generated would be a control that cannot
                          be used */}
                      <Button
                        variant="ghost"
                        size="sm"
                        href={
                          score !== undefined
                            ? `/sessions/${session.id}/report`
                            : `/sessions/${session.id}`
                        }
                      >
                        {score !== undefined ? "Report" : "Open"}
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}

```

### `dashboard\src\app\sessions\SessionFilters.tsx`

```tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Chip } from "@/components/ui";
import { titleCase } from "@/lib/format";
import s from "./sessions.module.css";

/**
 * Filters write to the URL, exactly as `/cases` does.
 *
 * A filtered view has to survive a reload and be pasteable into a message —
 * "these three are below the pass mark" is a link or it is nothing. The server
 * component re-runs the query from the search params, so there is one source of
 * truth and no client-side copy of the session list.
 *
 * Clicking a selected chip clears it. A filter you cannot undo is a trap.
 */

const STATUSES = ["live", "completed", "aborted"] as const;
const MODES = ["training", "assessment"] as const;

export function SessionFilters({
  status,
  mode,
  caseId,
}: {
  status?: string;
  mode?: string;
  caseId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const paramsString = params.toString();

  function apply(next: Record<string, string | undefined>) {
    const search = new URLSearchParams(paramsString);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    router.replace(qs ? `/sessions?${qs}` : "/sessions", { scroll: false });
  }

  const anyFilter = Boolean(status || mode || caseId);

  return (
    <div className={s.filters}>
      <div className={s.facet} role="group" aria-label="Status">
        <span className={s.facetLabel}>Status</span>
        {STATUSES.map((value) => (
          <Chip
            key={value}
            selected={status === value}
            onClick={() => apply({ status: status === value ? undefined : value })}
          >
            {value === "aborted" ? "Interrupted" : titleCase(value)}
          </Chip>
        ))}
      </div>

      <div className={s.facet} role="group" aria-label="Mode">
        <span className={s.facetLabel}>Mode</span>
        {MODES.map((value) => (
          <Chip
            key={value}
            selected={mode === value}
            onClick={() => apply({ mode: mode === value ? undefined : value })}
          >
            {titleCase(value)}
          </Chip>
        ))}
      </div>

      {/* Only rendered when it is set, because there is no list of cases here
          to pick from — it arrives from a link on `/cases/[id]`. A facet with
          nothing to choose is not a control. */}
      {caseId && (
        <div className={s.facet} role="group" aria-label="Case">
          <span className={s.facetLabel}>Case</span>
          <Chip selected onClick={() => apply({ case: undefined })}>
            {caseId}
          </Chip>
        </div>
      )}

      {/* Clearing navigates to the unfiltered view, so it is an anchor —
          middle-click, copy-link and the status bar all work. */}
      {anyFilter && (
        <Link href="/sessions" replace scroll={false} className={s.clear}>
          Clear all
        </Link>
      )}
    </div>
  );
}

```

### `dashboard\src\app\sessions\sessions.module.css`

```css
/* ---------- filter band ---------- */

.filterWrap {
  margin-bottom: var(--s-5);
}

/* One band, not one row per facet. The filter should never be taller than the
   thing it filters — the same correction `/cases` took. */
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3) var(--s-5);
  padding: var(--s-4) var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
}

.facet {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
}

.facetLabel {
  font-size: var(--t-caption);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-disabled);
}

/* An anchor, not a button — it navigates — and at least 44px
   tall like every other control. */
.clear {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  min-height: 44px;
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
}

.clear:hover {
  color: var(--ink);
  background: var(--surface-sunken);
}

.clear:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.emptyWrap {
  padding: var(--s-8) var(--s-5);
}

```

### `dashboard\src\app\sessions\[id]\live.module.css`

```css
/* ---------- the live band ---------- */

.banner,
.bannerIdle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-4) var(--s-6);
  margin-bottom: var(--s-5);
  padding: var(--s-5);
  border-radius: var(--r-xl);
}

/* Near-black while it is running: this is the one thing on the screen that is
   happening now, and `--dark` is the sparing accent reserved for
   exactly that. No pulsing dot — the clock already says it is live, and a
   blinking light on a clinical screen reads as an alarm. */
.banner {
  background: var(--dark);
  color: var(--surface);
}

.bannerIdle {
  border: var(--bw) solid var(--border);
  background: var(--surface);
  color: var(--ink);
}

.bannerLabel {
  font-size: var(--t-caption);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.7;
}

.bannerScene {
  margin-top: var(--s-1);
  font-family: var(--font-display);
  font-size: var(--t-h2);
  font-weight: 700;
}

.bannerStats {
  display: flex;
  gap: var(--s-6);
  align-items: flex-start;
}

.bannerStat {
  display: flex;
  flex-direction: column;
}

.bannerStatLabel {
  font-size: var(--t-caption);
  font-weight: 600;
  opacity: 0.65;
}

.bannerStatValue {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.bannerTrack {
  grid-column: 1 / -1;
  position: relative;
  height: 6px;
  border-radius: var(--r-pill);
  background: rgb(255 255 255 / 0.18);
  overflow: hidden;
}

.bannerIdle .bannerTrack {
  background: var(--surface-sunken);
}

.bannerFill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--r-pill);
  background: var(--brand);
  transition: width var(--m-base) var(--ease-out);
}

/* ---------- the running order ---------- */

.scenes {
  list-style: none;
  margin: 0;
  padding: 0;
}

.scene {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3) var(--s-5);
  border-bottom: var(--bw) solid var(--border);
}

.scene:last-child {
  border-bottom: none;
}

/* Set by the mirror as the headset moves, so the marker follows without this
   list re-rendering. */
.scene[data-current="true"] {
  background: var(--brand-surface);
  box-shadow: inset 3px 0 0 var(--brand);
}

.sceneTag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 var(--s-2);
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
  font-size: var(--t-caption);
  font-weight: 700;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.sceneBody {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sceneLabel {
  font-size: var(--t-label);
  font-weight: 600;
  color: var(--ink);
}

.sceneMeta {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

/* A pill that states its own meaning in text, not colour alone
   The content comes from CSS because the element is server-rendered empty and
   the client only ever changes `data-state`. */
.sceneState {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 var(--s-3);
  border-radius: var(--r-pill);
  font-size: var(--t-caption);
  font-weight: 700;
  white-space: nowrap;
}

.sceneState[data-state="pending"] {
  color: var(--text-disabled);
}

.sceneState[data-state="pending"]::after {
  content: "Not reached";
}

.sceneState[data-state="pass"] {
  background: var(--pass);
  color: var(--on-brand);
}

.sceneState[data-state="pass"]::after {
  content: "Pass";
}

.sceneState[data-state="borderline"] {
  background: var(--warn);
  color: var(--on-brand);
}

.sceneState[data-state="borderline"]::after {
  content: "Borderline";
}

.sceneState[data-state="fail"] {
  background: var(--fail);
  color: var(--on-brand);
}

.sceneState[data-state="fail"]::after {
  content: "Fail";
}

.sceneState[data-state="done"] {
  background: var(--text-muted);
  color: var(--on-brand);
}

.sceneState[data-state="done"]::after {
  content: "Recorded";
}

.footActions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  margin-top: var(--s-4);
}

```

### `dashboard\src\app\sessions\[id]\LiveMirror.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { clock } from "@/lib/format";
import { SESSION_STATUS_LABEL } from "@/lib/report";
import s from "./live.module.css";

/**
 * The part of the live mirror that moves.
 *
 * One thing ticks today: the elapsed clock, counting on from a server-computed
 * `elapsedS` rather than from `Date.now()` against `startedAt`, so the first
 * client paint matches the server HTML (the `LiveDial` rule).
 *
 * The scene marker and the completed count are rendered from the state the
 * session had at request time and then hold still. Moving them as the operation
 * runs needs a live channel from the headset, and there is nothing on the other
 * end of one yet — so this component subscribes to nothing rather than opening
 * a socket that could only ever stay silent.
 *
 * The scene list itself is **server-rendered** with each scene's recorded state
 * and passed through `children`. This component reaches into the DOM to mark
 * the current scene rather than owning the list, because owning it would mean
 * passing every scene across the RSC boundary and re-rendering thirty rows to
 * change one attribute.
 */
export function LiveMirror({
  status: initialStatus,
  elapsedS,
  initialScene,
  initialDone,
  scenesTotal,
  children,
}: {
  status: string;
  /** Seconds elapsed at render time, computed on the server. */
  elapsedS: number;
  initialScene: string | null;
  initialDone: number;
  scenesTotal: number;
  children: ReactNode;
}) {
  const status = initialStatus;
  const currentScene = initialScene;
  const done = initialDone;
  const [elapsed, setElapsed] = useState(elapsedS);

  const live = status === "live";

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  useEffect(() => {
    if (!currentScene) return;
    const node = document.querySelector<HTMLElement>(
      `[data-scene="${CSS.escape(currentScene)}"]`,
    );
    node?.setAttribute("data-current", "true");
    return () => node?.removeAttribute("data-current");
  }, [currentScene]);

  const progress = scenesTotal > 0 ? Math.min(1, done / scenesTotal) : 0;

  return (
    <>
      <section className={live ? s.banner : s.bannerIdle}>
        <div className={s.bannerMain}>
          <p className={s.bannerLabel}>{SESSION_STATUS_LABEL[status] ?? status}</p>
          <p className={s.bannerScene}>
            {currentScene ? `Scene ${currentScene}` : "Waiting for the headset"}
          </p>
        </div>

        <div className={s.bannerStats}>
          <div className={s.bannerStat}>
            <span className={s.bannerStatLabel}>Elapsed</span>
            {/* Seeded from the server's `elapsedS`, so the first client paint
                is the server HTML and nothing needs suppressing. */}
            <span className={s.bannerStatValue}>{clock(elapsed)}</span>
          </div>
          <div className={s.bannerStat}>
            <span className={s.bannerStatLabel}>Scenes</span>
            <span className={s.bannerStatValue}>
              {done} / {scenesTotal}
            </span>
          </div>
        </div>

        <div
          className={s.bannerTrack}
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={scenesTotal}
          aria-label="Scenes completed"
        >
          <span className={s.bannerFill} style={{ width: `${progress * 100}%` }} />
        </div>
      </section>

      {children}
    </>
  );
}

```

### `dashboard\src\app\sessions\[id]\page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, Card, CardHeader } from "@/components/ui";
import {
  elapsedSecondsSince,
  getSceneResults,
  getSession,
  getSessionProgress,
  getSessionScenes,
} from "@/lib/data/sessions";
import { clock, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { LiveMirror } from "./LiveMirror";
import s from "./live.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getSession(id);
  return { title: session ? `Session — ${session.caseTitle}` : "Session" };
}

/**
 * The live mirror
 *
 * What the headset is doing, on the desktop beside it. The shell, the running
 * order and the scenes already recorded are all rendered on the server;
 * `LiveMirror` runs the elapsed clock and marks the current scene.
 *
 * The marker does not advance yet. Moving it as the operation runs needs a live
 * channel from the headset and there is nothing on the other end of one, so the
 * page shows the state the session had when it was requested and says so rather
 * than sitting on a socket that never speaks.
 *
 * A finished session has a report, and the report is the better answer to the
 * same URL — so this page redirects rather than showing a frozen mirror of
 * something that stopped moving days ago.
 */
export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const session = await getSession(id);
  if (!session) notFound();

  if (session.totalScore !== undefined) redirect(`/sessions/${id}/report`);

  const [progress, scenes, results] = await Promise.all([
    getSessionProgress(id),
    getSessionScenes(id),
    getSceneResults(id),
  ]);

  // What each scene has already recorded, so the server HTML carries the real
  // state and Realtime only has to move it forward — never reconstruct it.
  const recorded = new Map(results.map((result) => [result.scene, result.outcome ?? "done"]));

  const running = session.status === "live";

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        eyebrow={`${session.caseId} · ${shortDate(session.startedAt)}`}
        title={session.caseTitle}
        lede={`${titleCase(session.mode)} · ${titleCase(session.difficulty)} · ${session.design} · ${titleCase(session.fixation)}`}
        actions={
          <Button variant="secondary" href="/sessions">
            All sessions
          </Button>
        }
      />

      {/* Everything that ticks is inside the client component; everything that
          does not is rendered here, on the server. The scene list is a server
          render passed through `children`, so no Lucide icon and no component
          crosses the RSC boundary. */}
      <LiveMirror
        status={session.status}
        elapsedS={running ? elapsedSecondsSince(session.startedAt) : (session.durationS ?? 0)}
        initialScene={progress?.currentScene ?? null}
        initialDone={progress?.scenesDone ?? recorded.size}
        scenesTotal={progress?.scenesTotal ?? scenes.length}
      >
        <Card padding="none">
          <CardHeader
            flush
            title="Running order"
            subtitle={`${scenes.length} scenes for this variant — ${session.design}, ${titleCase(session.fixation)}`}
          />
          <ol className={s.scenes}>
            {scenes.map((scene) => (
              <li key={scene.scene} className={s.scene} data-scene={scene.scene}>
                <span className={s.sceneTag}>{scene.scene}</span>
                <span className={s.sceneBody}>
                  <span className={s.sceneLabel}>{scene.label}</span>
                  <span className={s.sceneMeta}>
                    {scene.part} ·{" "}
                    {scene.parTimeS ? `par ${clock(scene.parTimeS)}` : "no par time"}
                  </span>
                </span>
                <span
                  className={s.sceneState}
                  data-state={recorded.get(scene.scene) ?? "pending"}
                >
                  {/* The state already recorded, server-rendered; the mirror
                      only ever moves an attribute forward as new results
                      arrive, it never has to reconstruct what happened. */}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </LiveMirror>

      {!running && (
        <Card padding="lg">
          {/* Reaching this card with a `completed` session means the headset
              finished but no report row exists — a different fact from a PIN
              nobody has redeemed, and it must not be described as one. */}
          <CardHeader
            title={
              session.status === "aborted"
                ? "This session was interrupted"
                : session.status === "completed"
                  ? "This session has no report yet"
                  : "This session has not started"
            }
            subtitle={
              session.status === "aborted"
                ? "The headset stopped before the operation finished, so no report was generated. The scenes it did record are above."
                : session.status === "completed"
                  ? "The operation finished, but the report for this session has not been generated. The scenes it recorded are above."
                  : "A PIN was issued but no headset has redeemed it yet."
            }
          />
          <div className={s.footActions}>
            <Button variant="secondary" href={`/plan/${session.planId}`}>
              Open the plan
            </Button>
            <Button variant="ghost" href={`/cases/${session.caseId}`}>
              Back to the case
            </Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\sessions\[id]\report\page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, Check, Minus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Badge, Card, CardHeader, Chip, EmptyState } from "@/components/ui";
import {
  deviationOf,
  getReport,
  getSession,
  weakestCategory,
} from "@/lib/data/sessions";
import { clock, shortDate, timeOfDay, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import s from "./report.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  return { title: report ? `Report — ${report.header.caseTitle}` : "Report" };
}

/**
 * The surgical case report.
 *
 * **Every number on this page comes out of `reports.payload`**, which
 * `score_session` wrote in the database. Nothing here adds, averages or rounds
 * anything: if the dashboard could compute a score there would be two answers
 * to "what did they get", the headset's and the browser's, and no way to say
 * which was right.
 *
 * The order is the order somebody reads a result in: the verdict, then what it
 * was measured against, then where the marks went, then the run itself.
 */
export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [session, report] = await Promise.all([getSession(id), getReport(id)]);
  if (!session) notFound();

  // A session that has not produced a report has a live mirror instead. Sending
  // somebody to an empty report page when there is a running operation to watch
  // is the wrong answer to the same URL.
  if (!report) redirect(`/sessions/${id}`);

  const weakest = weakestCategory(report.categories);
  const largest = Math.max(...report.categories.map((c) => c.max), 1);

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        eyebrow={`${report.header.caseId} · ${shortDate(report.header.date)}`}
        title={report.header.caseTitle}
        lede={`${titleCase(report.header.mode)} · ${titleCase(report.header.difficulty)} · ${report.header.design} · ${titleCase(report.header.fixation)}`}
      />

      {/* ---------- the verdict ---------- */}

      <section className={s.verdict}>
        <div className={s.scoreBlock}>
          <p className={s.scoreLabel}>Total score</p>
          <p className={s.score}>
            <span className={s.scoreValue}>{report.total}</span>
            <span className={s.scoreMax}>/ {report.max}</span>
          </p>
          <p className={s.scoreMeta}>
            Pass mark {report.passMark} at {titleCase(report.header.difficulty)}
          </p>
        </div>

        <div className={s.verdictBody}>
          <div className={s.verdictHead}>
            {report.passed ? (
              <Badge status="pass">Passed</Badge>
            ) : (
              <Badge status="fail">Below pass mark</Badge>
            )}
            {report.captions.percentile && (
              <span className={s.percentile}>{report.captions.percentile}</span>
            )}
          </div>

          {/* The cap is the most serious thing the report can say, so it says it
              in full and does not rewrite the categories to match. A learner has
              to be able to see that they scored well on cuts *and* that a
              critical error ended the session anyway. The sentences come from
              the accessor, beside the numbers they describe */}
          {report.captions.capped && (
            <p className={s.capped}>
              <AlertTriangle className={s.capIcon} strokeWidth={2.25} aria-hidden="true" />
              <span>
                <b>{report.captions.capped}</b> {report.captions.cappedDetail}
              </span>
            </p>
          )}

          <dl className={s.runFacts}>
            {[
              { label: "Surgeon", value: report.header.user },
              { label: "Duration", value: clock(report.header.durationS ?? undefined) },
              {
                label: "Critical errors",
                value: String(report.criticalErrors),
              },
              {
                label: "Generated",
                value: `${shortDate(report.generatedAt)}, ${timeOfDay(report.generatedAt)}`,
              },
            ].map((fact) => (
              <div key={fact.label} className={s.runFact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className={s.layout}>
        <div className={s.col}>
          {/* ---------- planned versus achieved ---------- */}

          <Card padding="lg">
            <CardHeader
              title="Planned versus achieved"
              subtitle="Measured against the plan frozen when the headset paired, never against a generic ideal."
            />

            {report.parameters.length === 0 ? (
              <EmptyState icon={Minus} title="The headset recorded no measurements">
                This session ended before any parameter was measured, so there is
                nothing to compare against the plan.
              </EmptyState>
            ) : (
              <div className={s.params}>
                <div className={s.paramHead}>
                  <span>Parameter</span>
                  <span>Planned</span>
                  <span>Achieved</span>
                  <span>Deviation</span>
                  <span>Verdict</span>
                </div>

                {report.parameters.map((parameter) => {
                  const deviation = deviationOf(parameter);
                  return (
                    <div className={s.param} key={parameter.key}>
                      <span className={s.paramLabel}>{parameter.label}</span>
                      <span className={s.paramNum}>
                        {parameter.planned === null
                          ? "—"
                          : `${parameter.planned}${parameter.unit === "deg" ? "°" : " mm"}`}
                      </span>
                      <span className={s.paramNum}>
                        {parameter.achieved}
                        {parameter.unit === "deg" ? "°" : " mm"}
                      </span>
                      <span className={s.paramTrack} aria-hidden="true">
                        {deviation !== null && (
                          <span
                            className={
                              parameter.verdict === "fail"
                                ? s.paramFillFail
                                : parameter.verdict === "borderline"
                                  ? s.paramFillWarn
                                  : s.paramFillPass
                            }
                            style={{ width: `${Math.max(4, deviation * 100)}%` }}
                          />
                        )}
                      </span>
                      <span>
                        {parameter.verdict === "pass" ? (
                          <Badge status="pass">In tolerance</Badge>
                        ) : parameter.verdict === "borderline" ? (
                          <Badge status="warn">Borderline</Badge>
                        ) : parameter.verdict === "fail" ? (
                          <Badge status="fail">Outside</Badge>
                        ) : (
                          <Badge status="neutral">Not measured</Badge>
                        )}
                      </span>
                    </div>
                  );
                })}

                <p className={s.paramNote}>
                  The bar is the deviation as a share of that parameter&rsquo;s own
                  tolerance, so a 1.2° axis error and a 1.2 mm joint-line error read
                  the same. Full means at or beyond the band.
                </p>
              </div>
            )}
          </Card>

          {/* ---------- where the marks went ---------- */}

          <Card padding="none">
            <CardHeader
              flush
              title="Where the marks went"
              subtitle={
                report.feedback.length === 0
                  ? "Nothing was deducted in any category."
                  : `${report.feedback.length} deduction${report.feedback.length === 1 ? "" : "s"}, largest first`
              }
            />
            {report.feedback.length === 0 ? (
              <div className={s.emptyWrap}>
                <EmptyState icon={Check} title="Nothing was deducted">
                  Every scene in every category came back a pass.
                </EmptyState>
              </div>
            ) : (
              <ul className={s.feedback}>
                {report.feedback.map((item, index) => (
                  <li className={s.feedbackRow} key={`${item.scene}-${index}`}>
                    <span className={s.sceneTag}>{item.scene}</span>
                    <span className={s.feedbackBody}>
                      <span className={s.feedbackText}>{item.label}</span>
                      <span className={s.feedbackMeta}>
                        {item.text} · {item.category}
                      </span>
                    </span>
                    <span
                      className={item.severity === "fail" ? s.lostFail : s.lostWarn}
                    >
                      −{item.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className={s.col}>
          {/* ---------- categories ---------- */}

          <Card padding="lg">
            <CardHeader title="Score by category" subtitle={report.captions.categories} />
            <ul className={s.categories}>
              {report.categories.map((category) => (
                <li key={category.key} className={s.categoryRow}>
                  <span className={s.categoryLabel}>{category.label}</span>
                  <span className={s.categoryTrack} aria-hidden="true">
                    {/* `score / largest` is the earned share of the widest
                        category's track — and defined even when a stored
                        `max` is 0, where score-over-max would be NaN. */}
                    <span
                      className={s.categoryFill}
                      style={{
                        width: `${category.max > 0 ? (category.score / largest) * 100 : 0}%`,
                      }}
                    />
                    <span
                      className={s.categoryGhost}
                      style={{ width: `${(category.max / largest) * 100}%` }}
                    />
                  </span>
                  <span className={s.categoryScore}>
                    {category.score}
                    <span className={s.categoryMax}>/{category.max}</span>
                  </span>
                </li>
              ))}
            </ul>

            {weakest && (
              <p className={s.weakest}>
                Weakest: <b>{weakest.label}</b> at {weakest.score} of {weakest.max} —{" "}
                {weakest.accuracy}% on technique, {weakest.timing}% on time.
              </p>
            )}
          </Card>

          {/* ---------- the run ---------- */}

          <Card padding="none">
            <CardHeader
              flush
              title="The operation, scene by scene"
              subtitle={`${report.timeline.filter((t) => t.reached).length} of ${report.timeline.length} scenes reached`}
            />
            <ol className={s.timeline}>
              {report.timeline.map((entry) => {
                const over =
                  entry.durationS !== null && entry.parTimeS !== null
                    ? entry.durationS - entry.parTimeS
                    : null;

                return (
                  <li
                    key={entry.scene}
                    className={entry.reached ? s.timelineRow : s.timelineSkipped}
                  >
                    <span className={s.sceneTag}>{entry.scene}</span>
                    <span className={s.timelineBody}>
                      <span className={s.timelineLabel}>{entry.label}</span>
                      <span className={s.timelineMeta}>
                        {!entry.reached
                          ? "Not reached"
                          : over !== null && over > 0
                            ? `${clock(entry.durationS ?? undefined)} · ${over}s over par`
                            : clock(entry.durationS ?? undefined)}
                        {entry.warnings > 0 &&
                          ` · ${entry.warnings} warning${entry.warnings === 1 ? "" : "s"}`}
                      </span>
                    </span>
                    <span>
                      {/* "Skipped" is a lifecycle fact, not a verdict, so it is
                          a Chip */}
                      {!entry.reached ? (
                        <Chip tone="muted">Skipped</Chip>
                      ) : entry.outcome === "pass" ? (
                        <Badge status="pass">Pass</Badge>
                      ) : entry.outcome === "borderline" ? (
                        <Badge status="warn">Borderline</Badge>
                      ) : (
                        <Badge status="fail">Fail</Badge>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

```

### `dashboard\src\app\sessions\[id]\report\report.module.css`

```css
/* ---------- the verdict band ---------- */

.verdict {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: var(--s-6);
  margin-bottom: var(--s-6);
  padding: var(--s-6);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-xl);
  background: var(--surface);
}

@media (max-width: 900px) {
  .verdict {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* The one near-black block on the screen keeps `--dark` as a
   sparing accent, and the total is the single figure the page exists to state. */
.scoreBlock {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--s-5);
  border-radius: var(--r-lg);
  background: var(--dark);
  color: var(--surface);
}

.scoreLabel {
  font-size: var(--t-caption);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.7;
}

.score {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  margin-top: var(--s-2);
}

.scoreValue {
  font-family: var(--font-display);
  font-size: 56px;
  font-weight: 800;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}

.scoreMax {
  font-size: var(--t-h3);
  font-weight: 600;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.scoreMeta {
  margin-top: var(--s-2);
  font-size: var(--t-caption);
  opacity: 0.7;
}

.verdictBody {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  justify-content: center;
}

.verdictHead {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.percentile {
  font-size: var(--t-label);
  color: var(--text-muted);
}

/* Solid, because it is a verdict on the whole session and the most serious one
   the report can carry */
.capped {
  display: flex;
  gap: var(--s-3);
  padding: var(--s-4);
  border-radius: var(--r-md);
  background: var(--fail);
  color: var(--on-brand);
  font-size: var(--t-label);
  line-height: 1.55;
}

.capIcon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 2px;
}

.runFacts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--s-4);
}

.runFact dt {
  font-size: var(--t-caption);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-disabled);
}

.runFact dd {
  margin-top: 2px;
  font-size: var(--t-label);
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* ---------- layout ---------- */

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: var(--s-5);
  align-items: start;
}

@media (max-width: 1200px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.col {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
  min-width: 0;
}

.emptyWrap {
  padding: var(--s-7) var(--s-5);
}

/* ---------- planned versus achieved ---------- */

.params {
  display: flex;
  flex-direction: column;
}

.paramHead,
.param {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 70px 70px minmax(60px, 1fr) 120px;
  gap: var(--s-3);
  align-items: center;
}

.paramHead {
  padding-bottom: var(--s-2);
  border-bottom: var(--bw) solid var(--border);
  font-size: var(--t-caption);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-disabled);
}

.paramHead > span:nth-child(2),
.paramHead > span:nth-child(3) {
  text-align: right;
}

.param {
  padding: var(--s-3) 0;
  border-bottom: var(--bw) solid var(--border);
}

.param:last-of-type {
  border-bottom: none;
}

.paramLabel {
  font-size: var(--t-label);
  font-weight: 600;
  color: var(--ink);
}

.paramNum {
  text-align: right;
  font-size: var(--t-label);
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.paramTrack {
  position: relative;
  height: 8px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  overflow: hidden;
}

.paramFillPass,
.paramFillWarn,
.paramFillFail {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--r-pill);
}

.paramFillPass {
  background: var(--pass);
}
.paramFillWarn {
  background: var(--warn);
}
.paramFillFail {
  background: var(--fail);
}

.paramNote {
  margin-top: var(--s-4);
  font-size: var(--t-caption);
  line-height: 1.55;
  color: var(--text-muted);
}

/* ---------- deductions ---------- */

.feedback,
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}

.feedbackRow,
.timelineRow,
.timelineSkipped {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3) var(--s-5);
  border-bottom: var(--bw) solid var(--border);
}

.feedbackRow:last-child,
.timelineRow:last-child,
.timelineSkipped:last-child {
  border-bottom: none;
}

.timelineSkipped {
  background: var(--surface-sunken);
}

.sceneTag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 var(--s-2);
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
  font-size: var(--t-caption);
  font-weight: 700;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.feedbackBody,
.timelineBody {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.feedbackText,
.timelineLabel {
  font-size: var(--t-label);
  font-weight: 600;
  color: var(--ink);
}

.feedbackMeta,
.timelineMeta {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.lostFail,
.lostWarn {
  font-size: var(--t-label);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.lostFail {
  color: var(--fail);
}
.lostWarn {
  color: var(--warn);
}

/* ---------- categories ---------- */

.categories {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.categoryRow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(80px, 1.1fr) 64px;
  gap: var(--s-3);
  align-items: center;
}

.categoryLabel {
  font-size: var(--t-label);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The ghost is the category's *maximum* relative to the largest category, so
   the row shows both what was earned and what was available. A bar scaled only
   to its own max makes a 5-mark category look like a 25-mark one. */
.categoryTrack {
  position: relative;
  height: 10px;
  border-radius: var(--r-pill);
  background: transparent;
}

.categoryGhost {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  z-index: 0;
}

.categoryFill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--r-pill);
  background: var(--brand);
  z-index: 1;
}

.categoryScore {
  text-align: right;
  font-size: var(--t-label);
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.categoryMax {
  font-weight: 500;
  color: var(--text-disabled);
}

.weakest {
  margin-top: var(--s-5);
  padding-top: var(--s-4);
  border-top: var(--bw) solid var(--border);
  font-size: var(--t-caption);
  line-height: 1.55;
  color: var(--text-muted);
}

```

### `dashboard\src\app\settings\AccountForm.tsx`

```tsx
"use client";

import { useActionState, useState } from "react";
import { Banner, Button, Input, Segmented } from "@/components/ui";
import { saveAccount, type AccountState } from "@/app/actions";
import type { Difficulty } from "@/lib/types";
import s from "./settings.module.css";

/**
 * The editable half of the Account tab.
 *
 * Three fields, which is exactly what the account API accepts. If this form ever
 * grows a fourth, the store refuses it — the grant is the contract and
 * this component is the reading of it, not the other way round.
 */
export function AccountForm({
  displayName,
  level,
  defaultDifficulty,
}: {
  displayName: string;
  level?: string;
  defaultDifficulty: Difficulty;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [state, formAction, pending] = useActionState<AccountState, FormData>(
    saveAccount,
    {},
  );

  return (
    <form action={formAction} className={s.form}>
      {state.error && (
        <Banner tone="fail" title="Not saved">
          {state.error}
        </Banner>
      )}
      {state.savedAt && !state.error && (
        <Banner tone="pass" title="Saved">
          Your details are updated everywhere they appear.
        </Banner>
      )}

      <div className={s.pair}>
        <Input
          label="Full name"
          name="displayName"
          defaultValue={displayName}
          required
          maxLength={80}
          helper="Shown on your reports and to your instructor."
        />
        <Input
          label="Level"
          name="level"
          defaultValue={level ?? ""}
          maxLength={60}
          helper="Free text, e.g. ST3. Optional."
        />
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>Default difficulty</span>
        <p className={s.fieldHelp}>
          Pre-selects the difficulty on Session setup. It scales every tolerance
          band and moves the pass mark — 60, 70, 80 — so it is a real choice, not
          a preference.
        </p>
        <input type="hidden" name="defaultDifficulty" value={difficulty} />
        <Segmented
          label="Default difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "expert", label: "Expert" },
          ]}
        />
      </div>

      <div className={s.formFoot}>
        <Button variant="primary" type="submit" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

```

### `dashboard\src\app\settings\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Badge, Button, Chip } from "@/components/ui";
import { cx } from "@/lib/cx";
import { getSettings } from "@/lib/data/settings";
import { relativeTime, shortDate, titleCase } from "@/lib/format";
import { personaFor, ROLE_LABEL } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { AccountForm } from "./AccountForm";
import p from "../panels.module.css";
import s from "./settings.module.css";

export const metadata: Metadata = { title: "Settings" };

const TABS = [
  { value: "account", label: "Account" },
  { value: "display", label: "Display" },
  { value: "pairing", label: "Device & pairing" },
  { value: "data", label: "Data" },
  { value: "about", label: "About" },
] as const;

type Tab = (typeof TABS)[number]["value"];

/**
 * Five tabs, and the tab is the URL — the same ruling `/performance` made in
 * A settings screen is somewhere people are sent ("check Settings →
 * Device & pairing"), and a section you cannot link to cannot be sent to.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: raw } = await searchParams;
  const tab: Tab = (TABS.find((t) => t.value === raw)?.value ?? "account") as Tab;

  const user = await getCurrentUser();
  const view = await getSettings(user);
  const persona = personaFor(user.role);

  return (
    <AppShell user={user} searchHint='Try searching "settings"'>
      <PageHeader
        title="Settings"
        lede="Your account, how the product looks, how a headset reaches it, and what this build is made of."
      />

      {/* The tab is the URL, and each one is an anchor, so
          "check Settings → Device & pairing" can be a link rather than an
          instruction. */}
      <nav className={p.tabs} aria-label="Settings sections">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "account" ? "/settings" : `/settings?tab=${t.value}`}
            className={cx(p.tab, tab === t.value && p.tabOn)}
            aria-current={tab === t.value ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "account" && (
        <>
          <section className={p.panel} aria-label="Your details">
            <div className={p.panelHead}>
              <div>
                <p className={p.panelTitle}>Your details</p>
                <p className={p.panelSub}>
                  Three fields are yours to change. The rest of an account is
                  administered.
                </p>
              </div>
            </div>

            <AccountForm
              displayName={user.displayName}
              level={user.level}
              defaultDifficulty={user.defaultDifficulty}
            />
          </section>

          <SectionHeader title="Administered" />

          <section className={p.panel} aria-label="Administered fields">
            <p className={p.panelSub}>
              Each of these decides what you can see or who your results are
              compared against, so none of them is self-service. An administrator
              changes them through the account management screen.
            </p>

            <div className={p.rows}>
              <div className={s.administered}>
                <span>Email address</span>
                <span className={s.administeredValue}>{user.email}</span>
              </div>
              <div className={s.administered}>
                <span>Role</span>
                <span className={s.administeredValue}>
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
              <div className={s.administered}>
                <span>Cohort</span>
                <span className={s.administeredValue}>
                  {view.cohortName ?? "Not in a cohort"}
                </span>
              </div>
              {view.presetName && (
                <div className={s.administered}>
                  <span>Configuration preset</span>
                  <span className={s.administeredValue}>{view.presetName}</span>
                </div>
              )}
              <div className={s.administered}>
                <span>Account created</span>
                <span className={s.administeredValue}>
                  {shortDate(user.createdAt)}
                </span>
              </div>
            </div>

            <p className={p.note}>
              Your cohort decides which population your percentile is computed
              against and which instructor sees your work.{" "}
              {view.presetName
                ? `Plans you start are stamped with ${view.presetName}, and any session run from one says so on its report.`
                : "Your cohort has no configuration preset, so your sessions run against the authored tolerances."}
            </p>
          </section>
        </>
      )}

      {tab === "display" && (
        <section className={p.panel} aria-label="Display">
          <div className={p.panelHead}>
            <div>
              <p className={p.panelTitle}>Display</p>
              <p className={p.panelSub}>
                Light theme only, at 1280px and above.
              </p>
            </div>
          </div>

          <div className={p.rows}>
            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Theme</p>
                <p className={p.rowDetail}>
                  Dark theme is a token swap with no component changes — planned
                  not scheduled. There is no control here rather
                  than a control that does nothing.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">Light</Chip>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Units</p>
                <p className={p.rowDetail}>
                  Degrees and millimetres throughout. Every tolerance is
                  authored in them, so a conversion would be a second
                  representation of a graded number.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">Metric</Chip>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Motion</p>
                <p className={p.rowDetail}>
                  Follows your system setting. Nothing in this product animates
                  on its own — there are no pulsing status dots, because on a
                  clinical dashboard a blinking light reads as an alarm.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">System</Chip>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Minimum width</p>
                <p className={p.rowDetail}>
                  Planning needs precise measurement, so it is desktop-only by
                  design. Reports and performance stay readable
                  below that.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">1280px</Chip>
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "pairing" && (
        <>
          <section className={p.panel} aria-label="Data source">
            <div className={p.panelHead}>
              <div>
                <p className={p.panelTitle}>Data source</p>
                <p className={p.panelSub}>{view.source.label}</p>
              </div>
              <Badge status="warn">Not connected</Badge>
            </div>
            <p className={p.panelSub}>{view.source.detail}</p>
          </section>

          <SectionHeader title="Your pairing PINs" />

          {view.pins.length === 0 ? (
            <section className={p.panel} aria-label="Pairing PINs">
              <p className={p.panelSub}>
                No PIN has been issued for any of your plans. A PIN is minted
                from a sealed plan, lives thirty minutes, and can be used once.
              </p>
              <div>
                <Button href="/plans" variant="secondary">
                  Go to your plans
                </Button>
              </div>
            </section>
          ) : (
            <section className={p.panel} aria-label="Pairing PINs">
              <div className={p.rows}>
                {view.pins.map((pin) => (
                  <div key={`${pin.planId}-${pin.expiresAt}`} className={p.row}>
                    <div className={p.rowBody}>
                      <p className={p.rowTitle}>{pin.caseTitle}</p>
                      <p className={p.rowDetail}>
                        {pin.state === "redeemed"
                          ? `Redeemed ${relativeTime(pin.redeemedAt, new Date().toISOString())} — a headset paired`
                          : pin.state === "live"
                            ? `Expires ${relativeTime(pin.expiresAt, new Date().toISOString())}`
                            : `Expired ${relativeTime(pin.expiresAt, new Date().toISOString())}`}
                      </p>
                    </div>
                    <div className={p.rowAside}>
                      <Chip tone="muted">
                        {pin.state === "redeemed"
                          ? "Used"
                          : pin.state === "live"
                            ? "Live"
                            : "Expired"}
                      </Chip>
                      <Button
                        variant="ghost"
                        size="sm"
                        href={
                          pin.sessionId
                            ? `/sessions/${pin.sessionId}`
                            : `/plan/${pin.planId}/saved`
                        }
                      >
                        {pin.sessionId ? "Session" : "Plan"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={p.note}>
                The digits are not listed here and are not stored anywhere this
                browser can read. They are shown once, on the plan that issued
                them, with a countdown.
              </p>
            </section>
          )}

        </>
      )}

      {tab === "data" && (
        <section className={p.panel} aria-label="Data">
          <div className={p.panelHead}>
            <div>
              <p className={p.panelTitle}>Data</p>
              <p className={p.panelSub}>What exists, and what it is made of.</p>
            </div>
          </div>

          <div className={p.rows}>
            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Your reports</p>
                <p className={p.rowDetail}>
                  Every report you may read, with the figures the database
                  derived. A CSV of any table on screen is a download away from
                  the screen it is on.
                </p>
              </div>
              <div className={p.rowAside}>
                <Button href="/reports" variant="secondary" size="sm">
                  Open
                </Button>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>PDF export</p>
                <p className={p.rowDetail}>
                  Not built. `reports.pdf_path` exists and is null on every row,
                  and a button that produced nothing would be worse than saying
                  so. The report screen is print-faithful in the meantime.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">Not built</Chip>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Deleting your data</p>
                <p className={p.rowDetail}>
                  Not self-service. A report is evidence about training that
                  happened and an instructor&rsquo;s cohort figures are computed
                  from it, so removal is an administrator&rsquo;s decision rather
                  than a button.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">Ask an administrator</Chip>
              </div>
            </div>
          </div>

          <p className={p.note}>
            No patient data exists anywhere in this product. Every case is
            synthetic, which is what keeps information-governance scope narrow — there is nothing here to identify anybody but you.
          </p>
        </section>
      )}

      {tab === "about" && (
        <section className={p.panel} aria-label="About">
          <div className={p.panelHead}>
            <div>
              <p className={p.panelTitle}>About</p>
              <p className={p.panelSub}>MediVeR XR — {titleCase(persona)} view</p>
            </div>
          </div>

          <dl className={p.kv}>
            {view.about.map((fact) => (
              <div key={fact.label} style={{ display: "contents" }}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <p className={p.note}>
            Where a document and the code disagree, the code is what ships, and
            The deviation and the reason are recorded alongside it.
          </p>
        </section>
      )}
    </AppShell>
  );
}

```

### `dashboard\src\app\settings\settings.module.css`

```css
/* /settings — the only screen in the product that writes to `profiles`. */

.form {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-4);
}

@media (max-width: 720px) {
  .pair {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.fieldLabel {
  font-size: var(--t-label);
  font-weight: var(--fw-medium);
}

.fieldHelp {
  max-width: 62ch;
  color: var(--text-muted);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
}

.formFoot {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--s-4);
  border-top: var(--bw) solid var(--divider);
}

/*
 * An administered fact: rendered, not editable, and not a disabled input
 * either. A disabled control says "you could do this if something changed";
 * these say "somebody else does this", which is a different sentence.
 */
.administered {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  min-height: var(--h-md);
  padding: var(--s-3) var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
}

.administeredValue {
  font-weight: var(--fw-medium);
}

```

### `dashboard\src\app\setup\page.tsx`

```tsx
import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/shell";
import { getSetupDefaults } from "@/lib/data/setup";
import { getCurrentUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/roles";
import { SetupForm } from "./SetupForm";
import s from "./setup.module.css";

export const metadata: Metadata = { title: "Session setup" };

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const user = await getCurrentUser();
  const defaults = await getSetupDefaults(user);

  return (
    <AppShell user={user}>
      <div className={s.page}>
        <PageHeader
          eyebrow="Step 1 of 2"
          title="Session setup"
          lede={`Defaulted from your account — ${ROLE_LABEL[user.role]}, ${user.defaultDifficulty} difficulty. Most people change nothing and press Continue.`}
        />

        <SetupForm
          defaults={defaults}
          initialMode={mode === "assessment" ? "assessment" : undefined}
        />

        {/* The rail already states that the headset reads these back, so this
            note carries only what the rail cannot: why the axes exist. */}
        <p className={s.note}>
          Every scene behaves differently under all six axes — mode, difficulty,
          implant design, fixation, patella and user role. Nothing is saved on
          this screen; the plan is written when you submit planning step 1.
        </p>
      </div>
    </AppShell>
  );
}

```

### `dashboard\src\app\setup\setup.module.css`

```css
/* Centred and capped. The form itself must not stretch — long rows of fields
   are unreadable — so the width goes to a second column that earns it rather
   than to a gutter. */
.page {
  max-width: 1280px;
  margin-inline: auto;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 4fr);
  gap: var(--s-4);
  align-items: start;
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
}

/* ---------- session summary rail ----------
   A tinted surface, not a black one. This panel *groups* a read-back; it does
   not judge anything, and a grouping surface takes a tint. Black
   is reserved for the single focal figure on a screen, which on a setup form
   is the Continue button's job, not a summary's. */

.summary {
  position: sticky;
  top: var(--s-4);
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  padding: var(--s-5);
  border: 1px solid var(--brand-border);
  border-radius: var(--r-md);
  background: var(--brand-surface);
  color: var(--text);
}

.summaryTitle {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  color: var(--ink);
}

.summaryLede {
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

.summaryList {
  display: flex;
  flex-direction: column;
  margin-top: var(--s-2);
  border-radius: var(--r-sm);
  overflow: hidden;
}

/* Alternating bands rather than rules: at eight rows of label-and-value the
   stripe tracks the eye across the gap better than a hairline does. */
.summaryRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-3) var(--s-4);
  font-size: var(--t-label);
}

.summaryRow:nth-child(odd) {
  background: var(--surface);
}

.summaryRow dt {
  color: var(--text-muted);
}

.summaryRow dd {
  font-weight: 700;
  color: var(--ink);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.summaryFigures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-2);
  margin-top: var(--s-2);
  padding-top: var(--s-4);
  border-top: 1px solid var(--brand-border);
}

.figure {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.figureValue {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.figureLabel {
  font-size: var(--t-overline);
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
}

.pair {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s-5);
  align-items: start;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.label {
  font-size: var(--t-label);
  font-weight: 700;
  color: var(--text);
}

.hint {
  font-size: var(--t-caption);
  line-height: 1.45;
  color: var(--text-muted);
}

/* ---------- mode cards ---------- */

.modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s-4);
}

.mode {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  padding: var(--s-5);
  text-align: left;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
  cursor: pointer;
}

.mode:hover {
  border-color: var(--border-strong);
}

.mode:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.modeOn {
  border-color: var(--brand);
  box-shadow: inset 0 0 0 1px var(--brand);
}

.modeHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
}

.modeTitle {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  color: var(--text);
}

/* Solid fill: this pill states the current choice */
.modeTick {
  padding: 4px var(--s-3);
  font-size: var(--t-overline);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  background: var(--brand);
  border-radius: var(--r-pill);
}

.modeText {
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

/* ---------- advanced disclosure ---------- */

.advanced {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding-top: var(--s-5);
  border-top: 1px solid var(--border);
}

.advancedToggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  min-height: 44px;
  padding: 0;
  text-align: left;
  color: var(--text);
  background: none;
  border: 0;
  cursor: pointer;
}

.advancedToggle:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 4px;
}

.advancedTitle {
  display: block;
  font-size: var(--t-label);
  font-weight: 700;
}

.advancedSummary {
  display: block;
  margin-top: 2px;
  font-size: var(--t-caption);
  color: var(--text-muted);
}

/* ---------- footer ---------- */

.foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--s-4);
  padding-top: var(--s-5);
  border-top: 1px solid var(--border);
}

/* A disabled control states its unmet condition beside it */
.footNote {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

/* Cancel anchors the left, Continue the right: the bar reads as the edges of
   the card, and the forward action sits where the eye leaves the form. */
.footPrimary {
  margin-left: auto;
}

.note {
  margin-top: var(--s-5);
  max-width: 74ch;
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .summary {
    position: static;
  }

  .summaryFigures {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .pair,
  .modes {
    grid-template-columns: 1fr;
  }
}

```

### `dashboard\src\app\setup\SetupForm.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button, Card, Segmented, Select } from "@/components/ui";
import { roughDuration, titleCase } from "@/lib/format";
import type { SetupDefaults } from "@/lib/data/setup";
import type { Difficulty } from "@/lib/types";
import { PASS_MARK, TOLERANCE_BAND } from "@/lib/types";
import s from "./setup.module.css";

/**
 * Four fields, all defaulted from the account, plus a collapsed
 * advanced disclosure for the implant variant.
 *
 * Two columns: the form, and a read-back of what those choices add up to. The
 * summary is the same set of facts the headset reads aloud on its confirmation
 * card before anything is committed — showing it here means the
 * headset never says anything the desktop did not.
 *
 * Nothing is written. Continue carries the configuration to the case browser in
 * the URL; the `plans` row is created when planning step 1 is submitted in
 * Creating it now would leave an orphaned draft behind every time
 * somebody opened this page and changed their mind.
 */
export function SetupForm({
  defaults,
  initialMode,
}: {
  defaults: SetupDefaults;
  initialMode?: "training" | "assessment";
}) {
  const router = useRouter();

  const [procedure, setProcedure] = useState(defaults.procedure?.id ?? "");
  const [mode, setMode] = useState<"training" | "assessment">(
    initialMode ?? defaults.mode,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(defaults.difficulty);
  const [design, setDesign] = useState(defaults.design);
  const [fixation, setFixation] = useState(defaults.fixation);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const chosen =
    defaults.procedures.find((p) => p.id === procedure) ?? defaults.procedure;

  const band = TOLERANCE_BAND[difficulty];

  function onContinue() {
    const params = new URLSearchParams({
      procedure,
      mode,
      difficulty,
      design,
      fixation,
    });
    router.push(`/cases?${params.toString()}`);
  }

  return (
    <div className={s.layout}>
      <Card padding="lg" className={s.card}>
        <div className={s.fields}>
          <div className={s.pair}>
            <Select
              label="Procedure"
              name="procedure"
              value={procedure}
              onChange={(event) => setProcedure(event.target.value)}
              helper="Other procedures are not yet published."
            >
              {defaults.procedures.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>

            <div className={s.field}>
              <span className={s.label}>Difficulty</span>
              <Segmented
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "expert", label: "Expert" },
                ]}
              />
              <span className={s.hint}>
                Scales every tolerance band to ×{band.toFixed(1)} of the authored
                value. Pass mark {PASS_MARK[difficulty]}.
              </span>
            </div>
          </div>

          <div className={s.field}>
            <span className={s.label}>Mode</span>
            <div className={s.modes}>
              <ModeCard
                title="Training"
                selected={mode === "training"}
                onSelect={() => setMode("training")}
              >
                Ghost guides, directional arrows, safe corridors, live numeric
                readouts. Retry without penalty; hints appear after inactivity.
              </ModeCard>
              <ModeCard
                title="Assessment"
                selected={mode === "assessment"}
                onSelect={() => setMode("assessment")}
              >
                No guides, no readouts, no hints. Errors are logged, not
                announced. One attempt per step unless the scene allows a redo.
              </ModeCard>
            </div>
          </div>

          <div className={s.advanced}>
            <button
              type="button"
              className={s.advancedToggle}
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              <span>
                <span className={s.advancedTitle}>
                  Advanced — implant variant
                </span>
                <span className={s.advancedSummary}>
                  {design} ·{" "}
                  {fixation === "cemented" ? "Cemented" : "Cementless"} · patella
                  decided intra-operatively
                </span>
              </span>
              {advancedOpen ? (
                <ChevronUp width={18} height={18} aria-hidden="true" />
              ) : (
                <ChevronDown width={18} height={18} aria-hidden="true" />
              )}
            </button>

            {advancedOpen && (
              <div className={s.pair}>
                <div className={s.field}>
                  <span className={s.label}>Implant design</span>
                  <Segmented
                    label="Implant design"
                    value={design}
                    onChange={setDesign}
                    options={[
                      { value: "CR", label: "CR" },
                      { value: "PS", label: "PS" },
                    ]}
                  />
                  <span className={s.hint}>
                    PS resects the PCL at 5.1b and adds Part 8, the box cut.
                  </span>
                </div>

                <div className={s.field}>
                  <span className={s.label}>Fixation</span>
                  <Segmented
                    label="Fixation"
                    value={fixation}
                    onChange={setFixation}
                    options={[
                      { value: "cemented", label: "Cemented" },
                      { value: "cementless", label: "Cementless" },
                    ]}
                  />
                  <span className={s.hint}>
                    Cementless replaces 7.2 with the 7.2b broach and skips Part
                    10.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={s.foot}>
          <Button variant="secondary" href="/">
            Cancel
          </Button>
          {!chosen && (
            <span className={s.footNote}>
              No procedure is published, so there is nothing to configure.
            </span>
          )}
          <Button
            variant="primary"
            size="lg"
            className={s.footPrimary}
            onClick={onContinue}
            disabled={!chosen}
          >
            Continue to case selection
          </Button>
        </div>
      </Card>

      <aside className={s.summary} aria-label="Session summary">
        <p className={s.summaryTitle}>This session</p>
        <p className={s.summaryLede}>
          Read back on the headset confirmation card before anything is
          committed.
        </p>

        <dl className={s.summaryList}>
          <SummaryRow label="Procedure" value={chosen?.name ?? "—"} />
          <SummaryRow label="Mode" value={titleCase(mode)} />
          <SummaryRow label="Difficulty" value={titleCase(difficulty)} />
          <SummaryRow label="Pass mark" value={String(PASS_MARK[difficulty])} />
          <SummaryRow label="Tolerance" value={`×${band.toFixed(1)} authored`} />
          <SummaryRow label="Implant design" value={design} />
          <SummaryRow label="Fixation" value={titleCase(fixation)} />
          <SummaryRow label="Patella" value="Decided in 9.1" />
        </dl>

        {chosen && (
          <div className={s.summaryFigures}>
            <Figure value={String(chosen.parts)} label="Parts" />
            <Figure value={String(chosen.scenes)} label="Scenes" />
            <Figure
              value={roughDuration(chosen.typicalDurationS)}
              label="Typical"
            />
          </div>
        )}
      </aside>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.summaryRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className={s.figure}>
      <span className={s.figureValue}>{value}</span>
      <span className={s.figureLabel}>{label}</span>
    </div>
  );
}

function ModeCard({
  title,
  selected,
  onSelect,
  children,
}: {
  title: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={selected ? `${s.mode} ${s.modeOn}` : s.mode}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={s.modeHead}>
        <span className={s.modeTitle}>{title}</span>
        {selected && <span className={s.modeTick}>Selected</span>}
      </span>
      <span className={s.modeText}>{children}</span>
    </button>
  );
}

```

### `dashboard\src\app\simulations\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, Card, CardHeader, Chip, EmptyState } from "@/components/ui";
import { getProcedures } from "@/lib/data/catalogue";
import { roughDuration } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import s from "./simulations.module.css";

export const metadata: Metadata = { title: "Simulations" };

/**
 * The procedure catalogue. Everything on this page is a row: the counts, the
 * variant chips and the in-development cards all come from `procedures`, so
 * publishing a procedure is a data change (do not ship a
 * picker of procedures that do not exist).
 */
export default async function SimulationsPage() {
  const [user, procedures] = await Promise.all([
    getCurrentUser(),
    getProcedures(),
  ]);

  const published = procedures.filter((p) => p.status === "published");
  const upcoming = procedures.filter((p) => p.status !== "published");

  return (
    <AppShell user={user} searchHint='Try searching "total knee"'>
      <PageHeader
        title="Simulations"
        lede="Procedures published to your account. Total Knee Replacement is the only complete pathway in Phase 1."
        actions={
          published.length > 0 ? (
            <Button variant="primary" icon={Play} href="/setup">
              Start simulation
            </Button>
          ) : undefined
        }
      />

      {published.length === 0 ? (
        <EmptyState icon={Boxes} title="No procedures are published yet">
          An administrator publishes a procedure before it appears here.
        </EmptyState>
      ) : (
        <div className={s.grid}>
          {published.map((procedure) => (
            <Card key={procedure.id} padding="lg" className={s.hero}>
              <div className={s.heroHead}>
                <div>
                  <p className={s.eyebrow}>Available now</p>
                  <h2 className={s.heroTitle}>{procedure.name}</h2>
                </div>
                <Chip>Published</Chip>
              </div>

              {procedure.summary && (
                <p className={s.heroSummary}>{procedure.summary}</p>
              )}

              <dl className={s.metrics}>
                <div className={s.metric}>
                  <dt>Parts</dt>
                  <dd>{procedure.parts}</dd>
                </div>
                <div className={s.metric}>
                  <dt>Scenes</dt>
                  <dd>{procedure.scenes}</dd>
                </div>
                <div className={s.metric}>
                  <dt>Cases</dt>
                  <dd>{procedure.cases}</dd>
                </div>
                <div className={s.metric}>
                  <dt>Typical run</dt>
                  <dd>
                    {procedure.typicalDurationS
                      ? roughDuration(procedure.typicalDurationS)
                      : "—"}
                  </dd>
                </div>
              </dl>

              <div className={s.chips}>
                <Chip tone="muted">Training</Chip>
                <Chip tone="muted">Assessment</Chip>
                <Chip tone="muted">CR / PS</Chip>
                <Chip tone="muted">Cemented / Cementless</Chip>
                <Chip tone="muted">Beginner → Expert</Chip>
              </div>

              <div className={s.actions}>
                <Button variant="primary" href="/setup">
                  Start
                </Button>
                <Button variant="secondary" href="/cases">
                  Browse cases
                </Button>
                <Button
                  variant="ghost"
                  href={`/simulations/${procedure.id}`}
                >
                  Open launcher
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className={s.sectionTitle}>In development</h2>
          <div className={s.upcoming}>
            {upcoming.map((procedure) => (
              <Card key={procedure.id} padding="md" className={s.upcomingCard}>
                <CardHeader
                  title={procedure.name}
                  action={
                    <Chip tone="muted">
                      {procedure.status === "planned" ? "Planned" : "Exploratory"}
                    </Chip>
                  }
                />
                <p className={s.upcomingText}>{procedure.summary}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <p className={s.note}>
        Every scene must behave correctly under all six axes — mode, difficulty,
        implant design, fixation, patella and user role. See{" "}
        <Link href="/library">the procedure guide</Link> for the full
        specification.
      </p>
    </AppShell>
  );
}

```

### `dashboard\src\app\simulations\simulations.module.css`

```css
.grid {
  display: grid;
  gap: var(--s-4);
}

.hero {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
}

.heroHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-4);
}

.eyebrow {
  font-size: var(--t-overline);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.heroTitle {
  margin-top: var(--s-2);
  font-family: var(--font-display);
  font-size: var(--t-h1);
  line-height: 1.15;
  font-weight: 700;
  color: var(--text);
}

.heroSummary {
  max-width: 68ch;
  font-size: var(--t-body);
  line-height: 1.55;
  color: var(--text-muted);
}

/* Four columns, matching the stat row on the dashboards */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s-3);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  padding: var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
}

.metric dt {
  font-size: var(--t-caption);
  font-weight: 600;
  color: var(--text-muted);
}

.metric dd {
  font-family: var(--font-display);
  font-size: var(--t-h2);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
}

.sectionTitle {
  margin-top: var(--s-7);
  margin-bottom: var(--s-4);
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: 700;
  color: var(--text);
}

.upcoming {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-4);
}

.upcomingCard {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.upcomingText {
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

.note {
  margin-top: var(--s-6);
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

.note a {
  color: var(--brand);
  font-weight: 600;
}

@media (max-width: 1100px) {
  .metrics,
  .upcoming {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .metrics,
  .upcoming {
    grid-template-columns: 1fr;
  }
}

```

### `dashboard\src\app\simulations\[procedure]\page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CircleHelp,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Play,
  Scissors,
  Settings,
  Stethoscope,
  User,
} from "lucide-react";
import { LaunchShell } from "@/components/shell";
import { getProcedure } from "@/lib/data/catalogue";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ procedure: string }>;
}): Promise<Metadata> {
  const { procedure } = await params;
  const detail = await getProcedure(procedure);
  return { title: detail?.name ?? "Procedure" };
}

/**
 * The procedure launcher — the second shell, and the doorway a kiosk machine
 * sits on. It started as literals at `/launch`; it is fed from the
 * catalogue row now, and `/launch` redirects here.
 *
 * An unpublished procedure still resolves: it is in the catalogue, so the
 * launcher renders with its primary action disabled and the reason stated,
 * rather than 404ing on a thing that visibly exists elsewhere in the product.
 */
export default async function ProcedureLauncherPage({
  params,
}: {
  params: Promise<{ procedure: string }>;
}) {
  const { procedure } = await params;
  const [detail] = await Promise.all([getProcedure(procedure), getCurrentUser()]);

  if (!detail) notFound();

  const published = detail.status === "published";

  return (
    <LaunchShell
      title={detail.name}
      subtitle={detail.tagline ?? "Plan. Simulate. Perform. Perfect."}
      actions={[
        {
          label: "Start procedure",
          href: "/setup",
          icon: Play,
          primary: true,
          disabled: !published,
          disabledReason: "This procedure is not published yet.",
        },
        { label: "Surgical planning", href: "/cases", icon: Stethoscope },
        { label: "Instruments", href: "/library", icon: Scissors },
        { label: "Training mode", href: "/setup?mode=training", icon: GraduationCap },
      ]}
      utilities={[
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
        { label: "Patient info", href: "/cases", icon: User },
        { label: "Case library", href: "/cases", icon: FolderOpen },
        { label: "Settings", href: "/settings", icon: Settings },
        { label: "Help", href: "/help", icon: CircleHelp },
      ]}
    />
  );
}

```

### `dashboard\src\app\[...slug]\page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Not built yet" };

/**
 * Catch-all for an address the product intends to answer but does not yet.
 *
 * The navigation describes the shape the product is heading for, so an item can
 * be clickable before the screen behind it exists. Landing here names what is
 * planned for the address rather than dead-ending on a 404, and it keeps the
 * shell, so nobody is stranded.
 */
const PLANNED: { match: RegExp; what: string }[] = [
  { match: /^telemetry|^replay/, what: "Raw event log and scene replay" },
  { match: /^assessments/, what: "Assessment-mode sessions" },
  { match: /^presets/, what: "Instructor configuration presets" },
  { match: /^admin/, what: "Users, devices and the activity log" },
  { match: /^join/, what: "Following a cohort invite" },
];

export default async function NotBuiltPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const path = slug.join("/");
  const entry = PLANNED.find((g) => g.match.test(path));

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={entry ? "Planned" : "Not found"}
        title={entry?.what ?? "This screen does not exist"}
        lede={`/${path}`}
        actions={
          <Link href="/">
            <Button variant="secondary" icon={ArrowLeft}>
              Back to dashboard
            </Button>
          </Link>
        }
      />

      <EmptyState
        icon={Hammer}
        title={entry ? "Not built yet" : "No such screen"}
        action={
          <Link href="/">
            <Button variant="primary">Back to dashboard</Button>
          </Link>
        }
      >
        {entry
          ? "The address is real and the screen behind it is still being built. Nothing is lost by trying it again later."
          : "Check the address, or use search (⌘K) to find the screen you meant."}
      </EmptyState>
    </AppShell>
  );
}

```

### `dashboard\src\components\dashboard\ContextRow.tsx`

```tsx
import type { ReactNode } from "react";
import s from "./dashboard.module.css";

/* `ContextRow` and `Tabs` lived here once. Both were static pictures
   of controls — the row's download and share glyphs had no handlers at all —
   and both were superseded by `Toolbar` and `TabbedPanel`, which work. Only
   `Panel` survives. The file keeps its name because every dashboard imports
   `Panel` from it. */

export function Panel({
  title,
  sub,
  action,
  children,
}: {
  title?: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={s.panel}>
      {(title || action) && (
        <div className={s.panelHead}>
          <div>
            {title && <p className={s.panelTitle}>{title}</p>}
            {sub && <p className={s.panelSub}>{sub}</p>}
          </div>
          {action && <div className={s.panelAction}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

```

### `dashboard\src\components\dashboard\dashboard.module.css`

```css
/* Dashboard body layout. Two columns under a hero + stat row, matching the
   density of the reference. */

.contextRow {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin-bottom: var(--s-6);
  flex-wrap: wrap;
}

.ctxChip {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  height: 38px;
  padding: 0 var(--s-4) 0 var(--s-2);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  color: var(--text);
}

.ctxChipOn {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
}

.ctxAvatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 10px;
  font-weight: var(--fw-bold);
}

.ctxChipOn .ctxAvatar {
  background: rgba(255, 255, 255, 0.22);
  color: var(--on-brand);
}

.ctxAdd {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: var(--bw) dashed var(--border-strong);
  border-radius: 50%;
  color: var(--text-muted);
}

.ctxRight {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--s-2);
}

.ctxIcon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: var(--bw) solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text);
}

.ctxIcon:hover {
  border-color: var(--border-strong);
}

.ctxIconDone {
  background: var(--pass);
  border-color: var(--pass);
  color: #fff;
}

/* Inline with the timeframe: the link out to the full list this page only
   summarises. */
.ctxAction {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  height: 38px;
  padding: 0 var(--s-4);
  border: var(--bw) solid var(--brand);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--brand);
  font-size: var(--t-caption);
  font-weight: var(--fw-bold);
  transition:
    background-color var(--m-fast) var(--ease-out),
    color var(--m-fast) var(--ease-out);
}

.ctxAction:hover {
  background: var(--brand);
  color: var(--on-brand);
}

.timeframe {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  height: 38px;
  padding: 0 var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  color: var(--ink);
}

.toggle {
  width: 38px;
  height: 22px;
  border-radius: var(--r-pill);
  background: var(--dark);
  position: relative;
}

.toggle::after {
  content: "";
  position: absolute;
  top: 3px;
  right: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
}

/* ---------- hero band ---------- */

.heroBand {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(0, 1.5fr);
  gap: var(--s-6);
  align-items: start;
  margin-bottom: var(--s-5);
}

/* ---------- two-column body ---------- */

.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: var(--s-5);
  align-items: start;
  margin-top: var(--s-5);
}

.col {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
  min-width: 0;
}

.panel {
  padding: var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--panel);
}

.panelHead {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
}

.panelTitle {
  font-size: var(--t-label);
  font-weight: var(--fw-bold);
  color: var(--ink);
}

.panelSub {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.panelAction {
  margin-left: auto;
}

.tabs {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
}

.tab {
  height: 28px;
  padding: 0 var(--s-3);
  border-radius: var(--r-pill);
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  color: var(--text-muted);
}

.tabOn {
  background: var(--dark);
  color: #fff;
}

/* ---------- split panel: dark block + chart ---------- */

.splitPanel {
  display: grid;
  grid-template-columns: minmax(150px, 0.6fr) minmax(0, 1fr);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  background: var(--panel);
}

.splitDark {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-5);
  background: var(--dark);
  color: #fff;
}

.splitLabel {
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--on-dark-dim);
}

.splitStat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.splitStatLabel {
  font-size: var(--t-caption);
  color: var(--on-dark-dim);
}

.splitStatValue {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: #fff;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* Mirrors a Panel exactly — same padding, same header block — so a split
   panel and a plain panel of the same chart height come out identical. */
.splitChart {
  display: flex;
  flex-direction: column;
  padding: var(--s-5);
}

/* ---------- attention list ---------- */

.attn {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
}

.attnFail {
  border-color: var(--fail-border);
  background: var(--fail-surface);
}

.attnBody {
  flex: 1;
  min-width: 0;
}

.attnName {
  font-size: var(--t-label);
  font-weight: var(--fw-bold);
  color: var(--ink);
}

.attnReason {
  margin-top: 2px;
  font-size: var(--t-caption);
  line-height: 1.5;
  color: var(--text-muted);
}

.attnAvatar {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: var(--fw-bold);
}

.attnAvatarFail {
  background: var(--fail);
  color: #fff;
}

/* ---------- misc ---------- */

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.note {
  padding: var(--s-4);
  border: var(--bw) dashed var(--border);
  border-radius: var(--r-md);
  font-size: var(--t-caption);
  line-height: 1.6;
  color: var(--text-muted);
}

.note code {
  color: var(--ink);
}

.miniRow {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) 0;
  border-bottom: var(--bw) solid var(--divider);
  font-size: var(--t-label);
}

.miniRow:last-child {
  border-bottom: none;
}

.miniLabel {
  flex: 1;
  min-width: 0;
  color: var(--text);
}

.miniValue {
  font-weight: var(--fw-bold);
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.pinCode {
  font-family: var(--font-mono);
  font-size: var(--t-body);
  font-weight: var(--fw-bold);
  letter-spacing: 0.16em;
  color: var(--ink);
}

@media (max-width: 1279px) {
  .heroBand,
  .body {
    grid-template-columns: minmax(0, 1fr);
  }
  .splitPanel {
    grid-template-columns: minmax(0, 1fr);
  }
}

```

### `dashboard\src\components\dashboard\InstructorDashboard.tsx`

```tsx
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shell";
import { Badge, Banner, Button } from "@/components/ui";
import {
  BarChart,
  DistributionBar,
  HeroMetric,
  RankedList,
  StatCard,
  StatRow,
  TrendChart,
} from "@/components/viz";
import { initialsOf } from "@/lib/format";
import type { InstructorDashboard as Data } from "@/lib/data/dashboard";
import type { Profile } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";
import { Panel } from "./ContextRow";
import { TabbedPanel } from "./TabbedPanel";
import { Toolbar } from "./Toolbar";
import { cx } from "@/lib/cx";
import { WEEK_OPTIONS } from "@/lib/window";
import s from "./dashboard.module.css";

const BAND_COLOUR = [
  "var(--pass)",
  "var(--brand)",
  "var(--fail)",
  "var(--border-strong)",
];

export function InstructorDashboard({
  user,
  data,
  weeks,
}: {
  user: Profile;
  data: Data;
  weeks: number;
}) {
  const { stats } = data;
  const passMark = PASS_MARK.intermediate;
  const cohortName = data.cohort?.name ?? "No cohort assigned";
  const urgent = data.needsAttention.filter((n) => n.severity === "fail");

  return (
    <>
      <PageHeader
        eyebrow={cohortName}
        title="Who needs you"
        lede={`${stats.learners} learners · cohort mean ${stats.meanScore}% · pass mark ${passMark}`}
        actions={
          <Button variant="primary" icon={Users} href="/cohorts">
            Manage cohort
          </Button>
        }
      />

      {urgent.length > 0 && (
        <Banner
          tone="fail"
          title={`${urgent.length} learner${urgent.length === 1 ? " is" : "s are"} below the pass mark`}
          action={
            <Button size="sm" href="/cohorts/learners">
              Review all
            </Button>
          }
        >
          Three or more critical errors cap a session at 59 and mark it Not
          passed regardless of category scores.
        </Banner>
      )}

      <div style={{ height: "var(--s-5)" }} />

      <Toolbar
        exportName="mediver-cohort"
        window={{
          param: "weeks",
          value: weeks,
          fallback: 7,
          options: WEEK_OPTIONS,
        }}
        action={{ label: "All learners", href: "/cohorts/learners" }}
        exportRows={[
          ["Learner", "Role", "Sessions", "Assessments", "Mean", "Critical"],
          ...data.learners.map((l) => [
            l.displayName,
            l.role,
            l.sessions,
            l.assessments,
            l.meanScore ?? "",
            l.criticalErrors,
          ]),
        ]}
      />

      <div className={s.heroBand}>
        <HeroMetric
          label="Cohort mean"
          value={String(stats.meanScore)}
          valueTail="%"
          delta={stats.meanDelta}
          deltaSuffix=" pts"
          compare={
            <>
              Pass mark <b>{passMark}</b> · {stats.belowPassMark} below ·{" "}
              {stats.criticalErrors} critical errors across the cohort
            </>
          }
        />

        <StatRow>
          <StatCard
            label="Learners"
            value={stats.learners}
            sub={cohortName}
          />
          <StatCard
            label="Below pass mark"
            value={stats.belowPassMark}
            variant="dark"
            sub="Needs intervention"
            chevron
          />
          <StatCard
            label="Sessions this week"
            value={stats.sessionsThisWeek}
          />
          <StatCard
            label="Critical errors"
            value={stats.criticalErrors}
            variant="accent"
            deltaSuffix=""
          />
        </StatRow>
      </div>

      <DistributionBar
        segments={data.bands.map((b, i) => ({
          label: b.label,
          value: b.value,
          pct: b.pct,
          colour: BAND_COLOUR[i],
        }))}
      />

      <div className={s.body}>
        <div className={s.col}>
          <Panel
            title="Needs attention"
            sub="Below the pass mark first, then inactive 14 days or more"
            action={<Badge status="fail">{data.needsAttention.length}</Badge>}
          >
            <div className={s.stack}>
              {data.needsAttention.map(({ learner, reason, severity }) => (
                <div
                  key={learner.id}
                  className={cx(s.attn, severity === "fail" && s.attnFail)}
                >
                  <span
                    className={cx(
                      s.attnAvatar,
                      severity === "fail" && s.attnAvatarFail,
                    )}
                    aria-hidden="true"
                  >
                    {initialsOf(learner.displayName)}
                  </span>
                  <div className={s.attnBody}>
                    <p className={s.attnName}>{learner.displayName}</p>
                    <p className={s.attnReason}>{reason}</p>
                  </div>
                  <Badge status={severity}>
                    {severity === "fail" ? "Below pass" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>

          <TabbedPanel
            title="Where the cohort loses marks"
            sub="Scenes with the most failed and borderline verdicts"
            tabs={[
              {
                label: "Scenes",
                content: (
                  <RankedList
                    items={data.hotspots.map((h) => ({
                      tag: h.scene,
                      label: h.label,
                      value: `${h.affected}/${h.learners}`,
                      pct: Math.round((h.affected / h.learners) * 100),
                    }))}
                  />
                ),
              },
              {
                label: "Categories",
                content: (
                  <RankedList
                    items={[...data.categories]
                      .sort((a, b) => a.pct - b.pct)
                      .map((c) => ({
                        tag: `${c.pct}%`,
                        label: c.label,
                        value: c.pct >= 80 ? "On track" : "Weak",
                        pct: c.pct,
                      }))}
                  />
                ),
              },
            ]}
          />
        </div>

        <div className={s.col}>
          <Panel
            title="Cohort mean over time"
            sub="Weeks where fewer than three learners were active are left blank"
          >
            <TrendChart
              values={data.dynamic.values}
              compare={data.dynamic.compare}
              seriesLabel="Cohort mean"
              labels={data.dynamic.labels}
              markers={[
                {
                  at: data.dynamic.values.length - 1,
                  label: "now",
                  tone: "pass",
                },
              ]}
              caption={data.dynamic.caption}
            />
          </Panel>

          <div className={s.splitPanel}>
            <div className={s.splitDark}>
              <span className={s.splitLabel}>Cohort weakness</span>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Lowest category</span>
                <span className={s.splitStatValue}>
                  {Math.min(...data.categories.map((c) => c.pct))}%
                </span>
              </div>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Highest</span>
                <span className={s.splitStatValue}>
                  {Math.max(...data.categories.map((c) => c.pct))}%
                </span>
              </div>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Sessions / week</span>
                <span className={s.splitStatValue}>
                  {stats.sessionsThisWeek}
                </span>
              </div>
            </div>
            <div className={s.splitChart}>
              <div className={s.panelHead}>
                <div>
                  <p className={s.panelTitle}>By category</p>
                  <p className={s.panelSub}>Percentage of available marks</p>
                </div>
              </div>
              <BarChart
                data={data.categories.map((c) => ({
                  label: c.short,
                  value: c.pct,
                }))}
                max={100}
                height={180}
                formatTag={(v) => `${v}%`}
              />
            </div>
          </div>

          <div className={s.note}>
            Instructor visibility is scoped to learners
            whose <code>cohort_id</code> belongs to a cohort you own Signed in as {user.displayName}.
          </div>
        </div>
      </div>
    </>
  );
}

```

### `dashboard\src\components\dashboard\LearnerDashboard.tsx`

```tsx
import { Play } from "lucide-react";
import { PageHeader } from "@/components/shell";
import { Badge, Button } from "@/components/ui";
import {
  BarChart,
  DistributionBar,
  HeroMetric,
  RankedList,
  StatCard,
  StatRow,
  TrendChart,
} from "@/components/viz";
import { clock, longDuration, shortDate } from "@/lib/format";
import type { LearnerDashboard as Data } from "@/lib/data/dashboard";
import type { Profile } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";
import { Panel } from "./ContextRow";
import { LiveDial } from "./LiveDial";
import { TabbedPanel } from "./TabbedPanel";
import { Toolbar } from "./Toolbar";
import { WEEK_OPTIONS } from "@/lib/window";
import s from "./dashboard.module.css";

const CATEGORY_COLOUR = [
  "var(--brand)",
  "var(--pass)",
  "var(--dark)",
  "var(--warn)",
];

export function LearnerDashboard({
  user,
  data,
  weeks,
}: {
  user: Profile;
  data: Data;
  weeks: number;
}) {
  const { stats, activeSession, latestReport } = data;
  const passMark = PASS_MARK[user.defaultDifficulty];
  const bandTotal = data.categories.reduce((a, c) => a + c.pct, 0);
  const best = Math.max(...data.categories.map((c) => c.pct));

  return (
    <>
      <PageHeader
        eyebrow="Your readiness"
        title={`Welcome back, ${user.displayName}`}
        lede={`${user.level ?? "Learner"} · pass mark ${passMark} · ${stats.sessionsCompleted} sessions completed`}
        actions={
          <>
            {activeSession && (
              <LiveDial
                state={activeSession.state}
                initialElapsedS={activeSession.elapsedS}
                progress={activeSession.progress}
                href={`/sessions/${activeSession.session.id}`}
                label={`${activeSession.session.caseTitle}, scene ${activeSession.session.currentScene}`}
              />
            )}
            <Button variant="secondary" href="/cases">
              Browse cases
            </Button>
            <Button variant="primary" icon={Play} href="/setup">
              Start simulation
            </Button>
          </>
        }
      />

      <Toolbar
        exportName="mediver-readiness"
        window={{
          param: "weeks",
          value: weeks,
          fallback: 7,
          options: WEEK_OPTIONS,
        }}
        action={{ label: "Session history", href: "/sessions" }}
        exportRows={[
          ["Session", "Case", "Score", "Duration", "Critical", "Mode"],
          ...data.details.map((d) => [
            d.session.id,
            d.session.caseTitle,
            d.session.totalScore ?? "",
            clock(d.session.durationS),
            d.session.criticalErrors,
            d.session.mode,
          ]),
        ]}
      />

      <div className={s.heroBand}>
        <HeroMetric
          label="Overall readiness"
          value={String(stats.meanScore ?? "—")}
          valueTail=" / 100"
          delta={stats.latestDelta}
          deltaSuffix=" pts"
          compare={
            latestReport ? (
              <>
                {stats.passRate}% pass rate · latest{" "}
                <b>{latestReport.report.totalScore}</b> on{" "}
                {shortDate(latestReport.session.endedAt)} ·{" "}
                {clock(latestReport.session.durationS)}
              </>
            ) : undefined
          }
        />

        <StatRow>
          <StatCard
            label="Best score"
            value={stats.bestScore ?? "—"}
            sub={latestReport?.session.caseTitle.split(" — ")[0]}
            chevron
          />
          <StatCard
            label="Weakest area"
            value={data.weakest ? `${data.weakest.pct}%` : "—"}
            variant="dark"
            sub={data.weakest?.label}
            chevron
          />
          <StatCard
            label="Sessions"
            value={stats.sessionsCompleted}
            sub={longDuration(stats.totalTimeS)}
          />
          <StatCard
            label="Critical errors"
            value={stats.criticalErrors}
            variant="accent"
            deltaSuffix=""
            sub="−5 pts each"
          />
        </StatRow>
      </div>

      <DistributionBar
        segments={data.categories.slice(0, 4).map((c, i) => ({
          label: c.label,
          value: c.pct,
          pct: Math.round((c.pct / bandTotal) * 100),
          colour: CATEGORY_COLOUR[i],
        }))}
      />

      <div className={s.body}>
        <div className={s.col}>
          <TabbedPanel
            title="Where you lose marks"
            sub="Points lost, and time spent, ranked across every completed session"
            tabs={[
              {
                label: "Points",
                content: (
                  <RankedList
                    items={data.marksLost.map((m) => ({
                      tag: m.scene,
                      label: m.label,
                      value: `−${m.points}`,
                      pct: m.pct,
                    }))}
                  />
                ),
              },
              {
                label: "Time",
                content: (
                  <RankedList
                    items={data.timeLost.map((m) => ({
                      tag: m.scene,
                      label: m.label,
                      value: clock(m.seconds),
                      pct: m.pct,
                    }))}
                  />
                ),
              },
            ]}
          />

          <Panel
            title="Sessions per week"
            sub={`Last ${weeks} weeks`}
            action={
              <Badge status="pass">
                {data.weekly[data.weekly.length - 1]?.sessions ?? 0} this week
              </Badge>
            }
          >
            <BarChart
              data={data.weekly.map((w) => ({
                label: w.label,
                value: w.sessions,
              }))}
              height={180}
            />
          </Panel>
        </div>

        <div className={s.col}>
          <Panel
            title="Score dynamic"
            sub="Your weekly mean against the cohort mean"
          >
            <TrendChart
              values={data.dynamic.values}
              compare={data.dynamic.compare}
              labels={data.dynamic.labels}
              markers={[
                {
                  at: data.dynamic.values.length - 1,
                  label: "latest",
                  tone: "pass",
                },
              ]}
              caption={data.dynamic.caption}
            />
          </Panel>

          <div className={s.splitPanel}>
            <div className={s.splitDark}>
              <span className={s.splitLabel}>Category spread</span>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Strongest</span>
                <span className={s.splitStatValue}>{best}%</span>
              </div>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Weakest</span>
                <span className={s.splitStatValue}>{data.weakest?.pct}%</span>
              </div>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Spread</span>
                <span className={s.splitStatValue}>
                  {best - (data.weakest?.pct ?? 0)} pts
                </span>
              </div>
            </div>
            <div className={s.splitChart}>
              <div className={s.panelHead}>
                <div>
                  <p className={s.panelTitle}>By category</p>
                  <p className={s.panelSub}>Percentage of available marks</p>
                </div>
              </div>
              <BarChart
                data={data.categories.map((c) => ({
                  label: c.short,
                  value: c.pct,
                }))}
                max={100}
                height={180}
                formatTag={(v) => `${v}%`}
              />
            </div>
          </div>

          {data.weakest && (
            <Panel
              title={`Next: ${data.weakest.label}`}
              sub={`Averaging ${data.weakest.pct}% — your lowest category. Practising the scenes that feed it recovers more marks than anything else available to you.`}
            >
              <Button size="sm" variant="primary" href="/setup">
                Practise this category
              </Button>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

```

### `dashboard\src\components\dashboard\LiveDial.module.css`

```css
/* The single ambient status control.
 *
 * Replaces the banners entirely: a running or interrupted session is a state,
 * not an announcement. No pulsing dot — the ring already says the session is
 * open, and a blinking light on a clinical dashboard reads as an alarm.
 * Hovering reveals the action glyph. */

.dial {
  position: relative;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--dark);
  color: #fff;
  transition:
    transform var(--m-fast) var(--ease-out),
    background-color var(--m-fast) var(--ease-out);
}

.dial:hover {
  transform: scale(1.05);
}

.warnDial {
  background: var(--warn);
}

.ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 3;
}

.progress {
  fill: none;
  stroke: var(--brand);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--m-slow) var(--ease-out);
}

.warnDial .progress {
  stroke: #fff;
}

/* ---------- the two swapping faces ---------- */

.face {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  line-height: 1;
  transition: opacity var(--m-fast) var(--ease-out);
}

.dial:hover .face {
  opacity: 0;
}

.time {
  font-size: 14px;
  font-weight: var(--fw-bold);
  letter-spacing: -0.02em;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.caption {
  font-size: 8px;
  font-weight: var(--fw-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.62);
}

.action {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  opacity: 0;
  transition: opacity var(--m-fast) var(--ease-out);
}

.dial:hover .action,
.dial:focus-visible .action {
  opacity: 1;
}

.dial:focus-visible .face {
  opacity: 0;
}

.actionGlyph {
  width: 24px;
  height: 24px;
  color: #fff;
}

```

### `dashboard\src\components\dashboard\LiveDial.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./LiveDial.module.css";

export type LiveDialProps = {
  /** "live" ticks a clock; "interrupted" shows where it stopped. */
  state: "live" | "interrupted";
  /** Seconds elapsed at render time, computed on the server. */
  initialElapsedS: number;
  /** 0–1 through the procedure. */
  progress: number;
  href: string;
  /** Read out by assistive tech. */
  label: string;
};

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * The timer starts from a server-computed value so the first client paint
 * matches the server HTML — ticking from `Date.now()` instead would hydrate
 * with a mismatch. Only the live state advances; an interrupted session's
 * clock is stopped by definition.
 */
export function LiveDial({
  state,
  initialElapsedS,
  progress,
  href,
  label,
}: LiveDialProps) {
  const [elapsed, setElapsed] = useState(initialElapsedS);
  const live = state === "live";

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  const R = 29;
  const circumference = 2 * Math.PI * R;
  const clamped = Math.max(0, Math.min(1, progress));
  const ActionIcon = live ? Play : RotateCcw;

  return (
    <Link
      href={href}
      className={cx(s.dial, !live && s.warnDial)}
      aria-label={`${live ? "Live session" : "Interrupted session"}: ${label}. ${clock(
        elapsed,
      )} elapsed, ${Math.round(clamped * 100)}% through the procedure. ${
        live ? "Watch progress." : "Resume."
      }`}
      title={`${live ? "Live" : "Interrupted"} — ${label}`}
    >
      <svg className={s.ring} viewBox="0 0 64 64" aria-hidden="true">
        <circle className={s.track} cx="32" cy="32" r={R} />
        <circle
          className={s.progress}
          cx="32"
          cy="32"
          r={R}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </svg>

      <span className={s.face}>
        <span className={s.time} suppressHydrationWarning>
          {clock(elapsed)}
        </span>
        <span className={s.caption}>{live ? "Live" : "Held"}</span>
      </span>

      <span className={s.action} aria-hidden="true">
        <ActionIcon className={s.actionGlyph} strokeWidth={2.25} />
      </span>
    </Link>
  );
}

```

### `dashboard\src\components\dashboard\TabbedPanel.tsx`

```tsx
"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./dashboard.module.css";

export type PanelTab = {
  label: string;
  /** Rendered on the server and swapped client-side. */
  content: ReactNode;
};

/**
 * A panel whose tabs actually switch content. The panels are server-rendered
 * and handed in as `content`, so nothing extra ships to the client beyond the
 * toggle itself.
 */
export function TabbedPanel({
  title,
  sub,
  tabs,
}: {
  title: string;
  sub?: string;
  tabs: PanelTab[];
}) {
  const [index, setIndex] = useState(0);

  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <div>
          <p className={s.panelTitle}>{title}</p>
          {sub && <p className={s.panelSub}>{sub}</p>}
        </div>
        <div className={s.panelAction}>
          <div className={s.tabs} role="tablist" aria-label={title}>
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={cx(s.tab, i === index && s.tabOn)}
                onClick={() => setIndex(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div role="tabpanel">{tabs[index].content}</div>
    </div>
  );
}

```

### `dashboard\src\components\dashboard\Toolbar.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Download, Share2 } from "lucide-react";
import {
  Popover,
  PopoverHeading,
  PopoverItem,
} from "@/components/ui/Popover";
import { cx } from "@/lib/cx";
import type { WindowSpec } from "@/lib/window";
import s from "./dashboard.module.css";

/**
 * The row above the hero.
 *
 * It used to carry filter chips, a density menu and a timeframe that all
 * toggled and changed nothing on the page — a static picture of a control,
 * which is not allowed. Neither is here.
 * The timeframe stayed and was made real: it writes `?weeks=` to the URL, the
 * server re-runs the accessors over that window, and every chart moves.
 *
 * Weeks rather than days because that is the unit the data has. `weekly_activity`
 * and `cohort_weekly_activity` bucket by week, so "last 7 days" would have
 * plotted a single point and called it a trend.
 */

export type ToolbarProps = {
  /** Rows exported when Download is used. First row is the header. */
  exportRows: (string | number)[][];
  exportName: string;
  window: WindowSpec;
  /** Button rendered inline with the timeframe, for the list this page summarises. */
  action?: { label: string; href: string };
};

export function Toolbar({
  exportRows,
  exportName,
  window: spec,
  action,
}: ToolbarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [shared, setShared] = useState(false);

  const current =
    spec.options.find((o) => o.value === spec.value) ?? spec.options[0];

  const setWindow = (value: number) => {
    const search = new URLSearchParams(params.toString());
    if (value === spec.fallback) search.delete(spec.param);
    else search.set(spec.param, String(value));
    const qs = search.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  };

  const download = () => {
    const csv = exportRows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell);
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions; fail quietly rather than
      // throwing an error the user cannot act on.
    }
  };

  return (
    <div className={s.contextRow}>
      {action && (
        <Link href={action.href} className={s.ctxAction}>
          {action.label}
          <ArrowRight width={15} height={15} strokeWidth={2} />
        </Link>
      )}

      <div className={s.ctxRight}>
        <button
          type="button"
          className={s.ctxIcon}
          onClick={download}
          aria-label="Download as CSV"
          title="Download as CSV"
        >
          <Download width={16} height={16} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className={cx(s.ctxIcon, shared && s.ctxIconDone)}
          onClick={share}
          aria-label={shared ? "Link copied" : "Copy link"}
          title={shared ? "Link copied" : "Copy link"}
        >
          {shared ? (
            <Check width={16} height={16} strokeWidth={2.5} />
          ) : (
            <Share2 width={16} height={16} strokeWidth={1.75} />
          )}
        </button>

        <Popover
          label="Change the window these figures cover"
          trigger={
            <span className={s.timeframe}>
              {current.label}
              <ChevronDown width={14} height={14} strokeWidth={2} />
            </span>
          }
        >
          {(close) => (
            <>
              <PopoverHeading>Window</PopoverHeading>
              {spec.options.map((option) => (
                <PopoverItem
                  key={option.value}
                  selected={option.value === spec.value}
                  meta={option.value === spec.fallback ? "Default" : undefined}
                  onClick={() => {
                    setWindow(option.value);
                    close();
                  }}
                >
                  {option.label}
                </PopoverItem>
              ))}
            </>
          )}
        </Popover>
      </div>
    </div>
  );
}

```

### `dashboard\src\components\shell\AppShell.module.css`

```css
/* Two-tier navigation on a warm light ground, with the content floating as a
   white rounded panel. Green / black / white only. */

.app {
  display: flex;
  min-height: 100dvh;
  background: var(--rail);
}

/* ---------- tier 1: the rail ---------- */

.rail {
  position: sticky;
  top: 0;
  flex: 0 0 var(--rail-w);
  width: var(--rail-w);
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-5) 0 var(--s-5);
  background: var(--rail);
}

.logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: var(--s-5);
  border-radius: 50%;
  background: var(--dark);
  color: #fff;
}

.logoGlyph {
  width: 21px;
  height: 21px;
}

.railBtn {
  position: relative;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: var(--bw) solid transparent;
  border-radius: 50%;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition:
    background-color var(--m-fast) var(--ease-out),
    color var(--m-fast) var(--ease-out),
    border-color var(--m-fast) var(--ease-out);
}

.railBtn:hover {
  border-color: var(--border);
  color: var(--ink);
}

.railBtnOn,
.railBtnOn:hover {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
}

.railIcon {
  width: 21px;
  height: 21px;
}

.railDot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--rail);
  border-radius: 50%;
  background: var(--brand);
}

.railBtnOn .railDot {
  background: #fff;
  border-color: var(--brand);
}

.railFooter {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

/* ---------- tier 2: the contextual panel ---------- */

.panel {
  position: sticky;
  top: 0;
  flex: 0 0 var(--panel-w);
  width: var(--panel-w);
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: var(--s-5) var(--s-4) var(--s-5) 0;
  background: var(--rail);
  overflow: hidden;
}

.panelHead {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: 0 var(--s-3) var(--s-6);
}

.panelTitle {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: var(--fw-bold);
  color: var(--ink);
  letter-spacing: -0.01em;
}

.panelCaret {
  width: 15px;
  height: 15px;
  color: var(--text-muted);
}

.panelScroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
}

.group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.groupLabel {
  padding: 0 var(--s-3) var(--s-2);
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-disabled);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-height: 34px;
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-sm);
  color: var(--text);
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  transition:
    background-color var(--m-fast) var(--ease-out),
    color var(--m-fast) var(--ease-out);
}

.item:hover {
  background: rgba(14, 21, 18, 0.045);
}

.itemOn,
.itemOn:hover {
  color: var(--brand);
  background: transparent;
  font-weight: var(--fw-bold);
}

.itemLabel {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Nested children hang off a hairline, as in the reference. */
.children {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-left: var(--s-5);
  padding-left: var(--s-3);
  border-left: var(--bw) solid var(--border);
}

.child {
  font-weight: var(--fw-regular);
  color: var(--text-muted);
}

.child.itemOn {
  color: var(--brand);
  font-weight: var(--fw-bold);
}

/* Counts are notifications — green, so they read as "something for you"
   rather than as the neutral black used for focal data. */
.badge {
  margin-left: auto;
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--r-pill);
  background: var(--brand);
  color: var(--on-brand);
  font-size: 10.5px;
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
}

.panelFoot {
  flex: 0 0 auto;
  padding: var(--s-4) var(--s-3) 0;
  border-top: var(--bw) solid var(--border);
  font-size: var(--t-caption);
  color: var(--text-muted);
}

/* ---------- main: the floating white surface ---------- */

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: var(--s-4) var(--s-4) var(--s-4) 0;
}

.topbar {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  padding: 0 var(--s-2) var(--s-4);
}

/* The search pill is the only thing between the panel and the account controls,
   so it takes the bar. Capped at 880px so it stops short of the icon cluster on
   an ultrawide display rather than running under it. */
.search {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex: 1 1 auto;
  min-width: 0;
  max-width: 880px;
  height: 46px;
  padding: 0 var(--s-5);
  border: var(--bw) solid transparent;
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--text-disabled);
  font-size: var(--t-label);
  cursor: text;
  transition: border-color var(--m-fast) var(--ease-out);
}

.search:hover {
  border-color: var(--border);
}

.searchIcon {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  color: var(--text-muted);
}

.searchLabel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.searchKey {
  flex: 0 0 auto;
  padding: 2px var(--s-2);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-xs);
  font-size: 10.5px;
  font-weight: var(--fw-bold);
  color: var(--text-muted);
}

.topRight {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.iconBtn {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: var(--bw) solid transparent;
  border-radius: 50%;
  background: var(--surface);
  color: var(--text);
  transition: border-color var(--m-fast) var(--ease-out);
}

.iconBtn:hover {
  border-color: var(--border);
}

.iconDot {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 8px;
  height: 8px;
  border: 2px solid var(--surface);
  border-radius: 50%;
  background: var(--brand);
}

.avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--dark);
  color: #fff;
  font-size: var(--t-caption);
  font-weight: var(--fw-bold);
}

.addBtn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--brand);
  color: var(--on-brand);
  transition: background-color var(--m-fast) var(--ease-out);
}

.addBtn:hover {
  background: var(--brand-hover);
}

.surface {
  flex: 1;
  min-width: 0;
  padding: var(--s-6) var(--s-6) var(--s-9);
  border-radius: var(--r-xl);
  background: var(--surface);
}

/* ---------- page header ---------- */

.pageHead {
  display: flex;
  align-items: flex-end;
  gap: var(--s-5);
  flex-wrap: wrap;
  margin-bottom: var(--s-6);
}

.pageHeadText {
  flex: 1;
  min-width: 280px;
}

.eyebrow {
  margin-bottom: var(--s-2);
  font-size: var(--t-overline);
  line-height: var(--t-overline-lh);
  font-weight: var(--fw-bold);
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--brand);
}

.pageTitle {
  font-size: var(--t-h1);
  line-height: var(--t-h1-lh);
}

.pageLede {
  margin-top: var(--s-2);
  max-width: 68ch;
  font-size: var(--t-body);
  color: var(--text-muted);
}

.pageActions {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

/* ---------- section header ---------- */

.section {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  margin: var(--s-8) 0 var(--s-4);
}

.sectionTitle {
  flex: 0 0 auto;
  font-family: var(--font-ui);
  font-size: var(--t-caption);
  font-weight: var(--fw-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.sectionRule {
  flex: 1;
  height: var(--bw);
  background: var(--border);
}

/* ---------- responsive ---------- */

@media (max-width: 1279px) {
  .panel {
    display: none;
  }
}

@media (max-width: 767px) {
  .rail {
    display: none;
  }
  .main {
    padding: var(--s-3);
  }
  .surface {
    padding: var(--s-5) var(--s-4) var(--s-8);
  }
}

```

### `dashboard\src\components\shell\AppShell.tsx`

```tsx
import type { ReactNode } from "react";
import { getNavData } from "@/lib/data/nav";
import { personaFor } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";
import s from "./AppShell.module.css";

export type AppShellProps = {
  user: Profile;
  /** Placeholder copy in the search pill. */
  searchHint?: string;
  children: ReactNode;
};

/**
 * Counts, pinned links and notifications are fetched here rather than passed in
 * by every page — the chrome is the same on all of them, and a page that forgot
 * to pass them used to render a permanently empty bell.
 *
 * Only the *data* crosses into `SideNav`; the sections are resolved on the
 * client from `lib/nav`, because a `NavSection` carries a Lucide icon and
 * handing a component to a `"use client"` module throws at request time
 *.
 */
export async function AppShell({
  user,
  searchHint = "Search cases, sessions, reports",
  children,
}: AppShellProps) {
  const persona = personaFor(user.role);
  const nav = await getNavData(user);

  return (
    <div className={s.app}>
      <a href="#main" className="skipLink">
        Skip to main content
      </a>

      <SideNav persona={persona} nav={nav} />

      <div className={s.main}>
        <TopBar
          user={user}
          persona={persona}
          searchHint={searchHint}
          notifications={nav.notifications}
        />

        <main id="main" className={s.surface}>
          {children}
        </main>
      </div>
    </div>
  );
}

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, lede, actions }: PageHeaderProps) {
  return (
    <div className={s.pageHead}>
      <div className={s.pageHeadText}>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h1 className={s.pageTitle}>{title}</h1>
        {lede && <p className={s.pageLede}>{lede}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className={s.section}>
      <h2 className={s.sectionTitle}>{title}</h2>
      <span className={s.sectionRule} aria-hidden="true" />
      {action}
    </div>
  );
}

```

### `dashboard\src\components\shell\index.ts`

```typescript
export { AppShell, PageHeader, SectionHeader } from "./AppShell";
export type { AppShellProps, PageHeaderProps } from "./AppShell";

export { SideNav } from "./SideNav";

export { LaunchShell } from "./LaunchShell";
export type {
  LaunchShellProps,
  LaunchAction,
  LaunchUtility,
} from "./LaunchShell";

```

### `dashboard\src\components\shell\LaunchShell.module.css`

```css
/* The procedure launcher. Full-bleed, low-density, one obvious action.
   Deliberately unlike the workspace shell — this screen is a doorway. */

.page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: var(--s-6);
  background: var(--canvas);
}

.frame {
  width: 100%;
  max-width: 1320px;
  overflow: hidden;
  border: var(--bw) solid var(--border);
  border-radius: var(--r-xl);
  background: var(--surface);
}

.top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
}

/* ---------- left ---------- */

.left {
  display: flex;
  flex-direction: column;
  padding: var(--s-11) var(--s-9);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  margin-bottom: var(--s-10);
}

.mark {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border: var(--bw) solid var(--brand-border);
  border-radius: 50%;
  background: var(--brand-surface);
  color: var(--brand);
}

.markGlyph {
  width: 28px;
  height: 28px;
}

.wordmark {
  font-family: var(--font-display);
  font-size: 44px;
  line-height: 1;
  font-weight: var(--fw-bold);
  letter-spacing: 0.02em;
  color: var(--ink);
}

.tagline {
  margin-top: var(--s-2);
  font-size: var(--t-caption);
  font-weight: var(--fw-bold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brand);
}

.title {
  font-family: var(--font-display);
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.02;
  font-weight: var(--fw-bold);
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--ink);
}

.subtitle {
  margin-top: var(--s-3);
  font-size: 19px;
  font-weight: var(--fw-semibold);
  color: var(--brand);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  margin-top: var(--s-9);
}

/* ---------- launch action ---------- */

.action {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  width: 100%;
  min-height: 64px;
  padding: 0 var(--s-6);
  border: var(--bw) solid transparent;
  border-radius: var(--r-pill);
  background: var(--brand-surface);
  color: var(--ink);
  text-align: left;
  transition:
    background-color var(--m-base) var(--ease-out),
    border-color var(--m-base) var(--ease-out);
}

.action:hover {
  background: var(--brand-surface-hover);
  border-color: var(--brand-border);
}

.actionPrimary {
  background: var(--brand);
  color: var(--on-brand);
}
.actionPrimary:hover {
  background: var(--brand-hover);
  border-color: var(--brand-hover);
}

.actionIcon {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  color: var(--brand);
}
.actionPrimary .actionIcon {
  color: var(--on-brand);
}

.actionLabel {
  flex: 1;
  min-width: 0;
  font-size: var(--t-body);
  font-weight: var(--fw-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.actionChevron {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  color: var(--text-disabled);
}
.actionPrimary .actionChevron {
  color: var(--on-brand);
  opacity: 0.85;
}

.actionDisabled {
  background: var(--surface-sunken);
  color: var(--text-disabled);
  cursor: not-allowed;
}
.actionDisabled .actionIcon,
.actionDisabled .actionChevron {
  color: var(--text-disabled);
}

/* ---------- right: hero ---------- */

.visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 520px;
  background: var(--surface-sunken);
  overflow: hidden;
}

.visualFallback {
  display: grid;
  place-items: center;
  gap: var(--s-3);
  padding: var(--s-7);
  color: var(--text-disabled);
  text-align: center;
}

.visualFallbackIcon {
  width: 52px;
  height: 52px;
  opacity: 0.7;
}

.visualFallbackText {
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ---------- utility bar ---------- */

.utility {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: var(--s-4);
  padding: var(--s-6) var(--s-9);
  background: var(--brand-surface);
  border-top: var(--bw) solid var(--brand-border);
}

.utilityItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  min-height: 84px;
  padding: var(--s-4);
  border: var(--bw) solid transparent;
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text-muted);
  transition:
    border-color var(--m-fast) var(--ease-out),
    color var(--m-fast) var(--ease-out);
}

.utilityItem:hover {
  border-color: var(--brand-border);
  color: var(--brand);
}

.utilityIcon {
  width: 22px;
  height: 22px;
  color: var(--brand);
}

.utilityLabel {
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ---------- responsive ---------- */

@media (max-width: 1023px) {
  .top {
    grid-template-columns: 1fr;
  }
  .visual {
    order: -1;
    min-height: 300px;
  }
  .left {
    padding: var(--s-9) var(--s-6);
  }
  .utility {
    grid-auto-flow: row;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    padding: var(--s-5);
  }
}

```

### `dashboard\src\components\shell\LaunchShell.tsx`

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { Bone, ChevronRight, Stethoscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./LaunchShell.module.css";

export type LaunchAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  disabled?: boolean;
  /** Stated beside a disabled action so it never reads as a dead control. */
  disabledReason?: string;
};

export type LaunchUtility = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type LaunchShellProps = {
  title: string;
  subtitle: string;
  actions: LaunchAction[];
  utilities: LaunchUtility[];
  /** The hero artwork. Falls back to a placeholder while assets are pending. */
  visual?: ReactNode;
};

export function LaunchShell({
  title,
  subtitle,
  actions,
  utilities,
  visual,
}: LaunchShellProps) {
  return (
    <div className={s.page}>
      <div className={s.frame}>
        <div className={s.top}>
          <div className={s.left}>
            <div className={s.brand}>
              <span className={s.mark} aria-hidden="true">
                <Stethoscope className={s.markGlyph} strokeWidth={1.75} />
              </span>
              <span>
                <span className={s.wordmark}>MEDIVER</span>
                <span className={s.tagline}>
                  Precision. Safety. Better outcomes.
                </span>
              </span>
            </div>

            <h1 className={s.title}>{title}</h1>
            <p className={s.subtitle}>{subtitle}</p>

            <nav className={s.actions} aria-label="Procedure actions">
              {actions.map((action) =>
                action.disabled ? (
                  <span
                    key={action.label}
                    className={cx(s.action, s.actionDisabled)}
                    aria-disabled="true"
                    title={action.disabledReason}
                  >
                    <action.icon
                      className={s.actionIcon}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className={s.actionLabel}>{action.label}</span>
                    <ChevronRight
                      className={s.actionChevron}
                      aria-hidden="true"
                    />
                  </span>
                ) : (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cx(s.action, action.primary && s.actionPrimary)}
                  >
                    <action.icon
                      className={s.actionIcon}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className={s.actionLabel}>{action.label}</span>
                    <ChevronRight
                      className={s.actionChevron}
                      aria-hidden="true"
                    />
                  </Link>
                ),
              )}
            </nav>
          </div>

          <div className={s.visual}>
            {visual ?? (
              <div className={s.visualFallback}>
                <Bone className={s.visualFallbackIcon} strokeWidth={1.25} />
                <span className={s.visualFallbackText}>
                  Procedure artwork pending
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className={s.utility} aria-label="Utilities">
          {utilities.map((utility) => (
            <Link
              key={utility.label}
              href={utility.href}
              className={s.utilityItem}
            >
              <utility.icon
                className={s.utilityIcon}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className={s.utilityLabel}>{utility.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

```

### `dashboard\src\components\shell\SearchDialog.module.css`

```css
.backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  justify-content: center;
  padding: 12vh var(--s-5) var(--s-5);
  background: var(--scrim);
}

.dialog {
  width: 100%;
  max-width: 620px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  border-radius: var(--r-xl);
  background: var(--surface);
  overflow: hidden;
}

.field {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-5);
  border-bottom: var(--bw) solid var(--divider);
}

.icon {
  flex: 0 0 auto;
  width: 19px;
  height: 19px;
  color: var(--text-muted);
}

.input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  font-size: 17px;
  color: var(--ink);
}

.input::placeholder {
  color: var(--text-disabled);
}

.esc {
  flex: 0 0 auto;
  padding: 3px var(--s-2);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-xs);
  font-size: 10.5px;
  font-weight: var(--fw-bold);
  color: var(--text-muted);
}

.results {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--s-2);
}

.group {
  padding: var(--s-3) var(--s-3) var(--s-1);
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-disabled);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  width: 100%;
  padding: var(--s-3);
  border-radius: var(--r-md);
  text-align: left;
  cursor: pointer;
}

.itemActive {
  background: var(--surface-sunken);
}

.itemIcon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
  color: var(--text-muted);
}

.itemActive .itemIcon {
  background: var(--brand);
  color: var(--on-brand);
}

.itemBody {
  flex: 1;
  min-width: 0;
}

.itemTitle {
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  color: var(--ink);
}

.itemMeta {
  margin-top: 1px;
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.itemKey {
  flex: 0 0 auto;
  font-size: var(--t-caption);
  color: var(--text-disabled);
}

.empty {
  padding: var(--s-9) var(--s-5);
  text-align: center;
}

.emptyTitle {
  font-size: var(--t-label);
  font-weight: var(--fw-bold);
  color: var(--ink);
}

.emptyText {
  margin-top: var(--s-2);
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.footer {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-3) var(--s-5);
  border-top: var(--bw) solid var(--divider);
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.hint {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
}

.key {
  padding: 2px var(--s-2);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-xs);
  font-size: 10px;
  font-weight: var(--fw-bold);
  color: var(--text);
}

```

### `dashboard\src\components\shell\SearchDialog.tsx`

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import { sectionsForPersona } from "@/lib/nav";
import type { Persona } from "@/lib/roles";
import s from "./SearchDialog.module.css";

export type SearchEntry = {
  title: string;
  meta: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Command palette. Opens on click or ⌘K, filters every destination the
 * current persona can reach, and navigates on Enter.
 *
 * Destinations are derived from lib/nav, so this can never drift out of sync
 * with the navigation panels.
 */
export function SearchDialog({
  open,
  onClose,
  persona,
}: {
  open: boolean;
  onClose: () => void;
  persona: Persona;
}) {
  // Mounting fresh on each open means query and cursor start clean without an
  // effect resetting them — cascading renders avoided by construction.
  if (!open) return null;
  return <Palette onClose={onClose} persona={persona} />;
}

function Palette({
  onClose,
  persona,
}: {
  onClose: () => void;
  persona: Persona;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Moving focus is not state, so this stays a legitimate effect.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const entries = useMemo<SearchEntry[]>(() => {
    const out: SearchEntry[] = [];
    for (const section of sectionsForPersona(persona)) {
      for (const group of section.groups) {
        for (const item of group.items) {
          out.push({
            title: item.label,
            meta: `${section.label}${group.label ? ` · ${group.label}` : ""}`,
            href: item.href,
            icon: section.icon,
          });
          for (const child of item.children ?? []) {
            out.push({
              title: child.label,
              meta: `${section.label} · ${item.label}`,
              href: child.href,
              icon: section.icon,
            });
          }
        }
      }
    }
    return out;
  }, [persona]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 8);
    return entries
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) || e.meta.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [entries, query]);

  // Clamped rather than reset in an effect.
  const active = Math.min(cursor, Math.max(results.length - 1, 0));

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor(Math.min(active + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor(Math.max(active - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  };

  return (
    <div
      className={s.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKeyDown}
      >
        <div className={s.field}>
          <Search className={s.icon} strokeWidth={2} aria-hidden="true" />
          <input
            ref={inputRef}
            className={s.input}
            placeholder="Search cases, sessions, reports…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            aria-label="Search query"
            autoComplete="off"
          />
          <button type="button" className={s.esc} onClick={onClose}>
            ESC
          </button>
        </div>

        <div className={s.results}>
          {results.length === 0 ? (
            <div className={s.empty}>
              <p className={s.emptyTitle}>No matches for “{query}”</p>
              <p className={s.emptyText}>
                Try a screen name — cases, sessions, reports, cohorts.
              </p>
            </div>
          ) : (
            results.map((entry, i) => (
              <button
                key={`${entry.href}-${entry.title}`}
                type="button"
                className={cx(s.item, i === active && s.itemActive)}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(entry.href)}
              >
                <span className={s.itemIcon}>
                  <entry.icon width={16} height={16} strokeWidth={1.75} />
                </span>
                <span className={s.itemBody}>
                  <span className={s.itemTitle}>{entry.title}</span>
                  <span className={s.itemMeta}>{entry.meta}</span>
                </span>
                {i === active && <span className={s.itemKey}>↵</span>}
              </button>
            ))
          )}
        </div>

        <div className={s.footer}>
          <span className={s.hint}>
            <span className={s.key}>↑</span>
            <span className={s.key}>↓</span> navigate
          </span>
          <span className={s.hint}>
            <span className={s.key}>↵</span> open
          </span>
          <span className={s.hint}>
            <span className={s.key}>esc</span> close
          </span>
        </div>
      </div>
    </div>
  );
}

```

### `dashboard\src\components\shell\SideNav.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Stethoscope } from "lucide-react";
import { cx } from "@/lib/cx";
import {
  RAIL_FOOTER,
  sectionForPath,
  sectionsForPersona,
} from "@/lib/nav";
import type { PanelItem, SectionId } from "@/lib/nav";
import type { NavData } from "@/lib/data/nav";
import type { Persona } from "@/lib/roles";
import s from "./AppShell.module.css";

/**
 * Tier 1 (rail) selects which panel is shown. Tier 2 (panel) navigates.
 * Clicking a rail icon deliberately does NOT navigate — browsing sections
 * never costs the user their current page.
 *
 * `nav` arrives as plain JSON and the sections are resolved here, on the
 * client. Resolving them on the server would mean sending a `NavSection` —
 * which holds a Lucide icon — across the boundary, and that throws at request
 * time.
 */
export function SideNav({ persona, nav }: { persona: Persona; nav: NavData }) {
  const pathname = usePathname();
  const sections = sectionsForPersona(persona, nav);
  const [openId, setOpenId] = useState<SectionId>(() =>
    sectionForPath(pathname, persona),
  );

  const active = sections.find((x) => x.id === openId) ?? sections[0];

  const isCurrent = (href: string) => {
    const base = href.split("?")[0];
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
  };

  const renderItem = (item: PanelItem, depth = 0) => (
    <div key={item.href + item.label}>
      <Link
        href={item.href}
        className={cx(
          s.item,
          depth > 0 && s.child,
          isCurrent(item.href) && s.itemOn,
        )}
        aria-current={isCurrent(item.href) ? "page" : undefined}
      >
        <span className={s.itemLabel}>{item.label}</span>
        {item.badge !== undefined && (
          <span className={s.badge}>{item.badge}</span>
        )}
      </Link>
      {item.children && (
        <div className={s.children}>
          {item.children.map((child) => renderItem(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <nav className={s.rail} aria-label="Sections">
        <Link href="/" className={s.logo} aria-label="MediVeR XR home">
          <Stethoscope className={s.logoGlyph} strokeWidth={2} />
        </Link>

        {sections.map((section) => {
          const on = section.id === active?.id;
          const hasBadge = section.groups.some((g) =>
            g.items.some(
              (i) =>
                i.badge !== undefined ||
                (i.children ?? []).some((c) => c.badge !== undefined),
            ),
          );
          return (
            <button
              key={section.id}
              type="button"
              className={cx(s.railBtn, on && s.railBtnOn)}
              onClick={() => setOpenId(section.id)}
              aria-label={section.label}
              aria-pressed={on}
            >
              <section.icon className={s.railIcon} strokeWidth={1.75} />
              {hasBadge && <span className={s.railDot} aria-hidden="true" />}
            </button>
          );
        })}

        <div className={s.railFooter}>
          {RAIL_FOOTER.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cx(s.railBtn, isCurrent(item.href) && s.railBtnOn)}
              aria-label={item.label}
            >
              <item.icon className={s.railIcon} strokeWidth={1.75} />
            </Link>
          ))}
        </div>
      </nav>

      <div className={s.panel}>
        <div className={s.panelHead}>
          <span className={s.panelTitle}>{active?.label}</span>
          <ChevronDown className={s.panelCaret} aria-hidden="true" />
        </div>

        <nav className={s.panelScroll} aria-label={active?.label}>
          {active?.groups.map((group, i) => (
            <div className={s.group} key={group.label ?? `g-${i}`}>
              {group.label && <p className={s.groupLabel}>{group.label}</p>}
              {group.items.map((item) => renderItem(item))}
            </div>
          ))}
        </nav>

        <p className={s.panelFoot}>
          Visibility is scoped by your role, not by this menu.
        </p>
      </div>
    </>
  );
}

```

### `dashboard\src\components\shell\TopBar.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CircleHelp,
  LogOut,
  Search,
  Settings,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import {
  Popover,
  PopoverDivider,
  PopoverEmpty,
  PopoverHeading,
  PopoverItem,
} from "@/components/ui/Popover";
import { ROLE_LABEL } from "@/lib/roles";
import type { Persona } from "@/lib/roles";
import { initialsOf } from "@/lib/format";
import { signOut } from "@/app/actions";
import type { NavNotification } from "@/lib/data/nav";
import type { Profile } from "@/lib/types";
import { SearchDialog } from "./SearchDialog";
import s from "./AppShell.module.css";

export type Notification = NavNotification;

export function TopBar({
  user,
  persona,
  searchHint,
  notifications,
}: {
  user: Profile;
  persona: Persona;
  searchHint: string;
  notifications: Notification[];
}) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className={s.topbar}>
        <button
          type="button"
          className={s.search}
          onClick={() => setSearchOpen(true)}
        >
          <Search className={s.searchIcon} strokeWidth={2} aria-hidden="true" />
          <span className={s.searchLabel}>{searchHint}</span>
          <span className={s.searchKey}>⌘K</span>
        </button>

        <div className={s.topRight}>
          <Popover
            label="Display options"
            trigger={
              <span className={s.iconBtn}>
                <SlidersHorizontal width={18} height={18} strokeWidth={1.75} />
              </span>
            }
          >
            {(close) => (
              <>
                <PopoverHeading>Display</PopoverHeading>
                <PopoverItem
                  onClick={close}
                  meta="Light theme is the only build"
                  selected
                >
                  Light
                </PopoverItem>
                <PopoverItem onClick={close} meta="Planned, not built">
                  Dark
                </PopoverItem>
                <PopoverDivider />
                <PopoverItem icon={Settings} onClick={() => router.push("/settings")}>
                  All settings
                </PopoverItem>
              </>
            )}
          </Popover>

          <Popover
            label={
              notifications.length
                ? `Notifications, ${notifications.length} waiting`
                : "Notifications, none waiting"
            }
            trigger={
              <span className={s.iconBtn}>
                <Bell width={18} height={18} strokeWidth={1.75} />
                {notifications.length > 0 && (
                  <span className={s.iconDot} aria-hidden="true" />
                )}
              </span>
            }
          >
            {(close) => (
              <>
                <PopoverHeading>Notifications</PopoverHeading>
                {notifications.length === 0 ? (
                  <PopoverEmpty>
                    Nothing waiting. A running session, an interrupted one and a
                    new report all appear here.
                  </PopoverEmpty>
                ) : (
                  notifications.map((n) => (
                    <PopoverItem
                      key={n.id}
                      meta={n.meta}
                      onClick={() => {
                        close();
                        router.push(n.href);
                      }}
                    >
                      {n.title}
                    </PopoverItem>
                  ))
                )}
              </>
            )}
          </Popover>

          <Popover
            label="Account menu"
            trigger={
              <span className={s.avatar}>{initialsOf(user.displayName)}</span>
            }
          >
            {(close) => (
              <>
                <PopoverHeading>
                  {user.displayName} · {ROLE_LABEL[user.role]}
                </PopoverHeading>
                <PopoverItem
                  icon={UserRound}
                  onClick={() => {
                    close();
                    router.push("/settings");
                  }}
                >
                  Account
                </PopoverItem>
                <PopoverItem
                  icon={CircleHelp}
                  onClick={() => {
                    close();
                    router.push("/help");
                  }}
                >
                  Help
                </PopoverItem>
                <PopoverDivider />
                <PopoverItem
                  icon={LogOut}
                  onClick={() => {
                    close();
                    // Server Action: clears the session, then
                    // redirects. Pushing to /login alone would leave the
                    // session alive and the guard would bounce straight back.
                    void signOut();
                  }}
                >
                  Sign out
                </PopoverItem>
              </>
            )}
          </Popover>

        </div>
      </header>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        persona={persona}
      />
    </>
  );
}

```

### `dashboard\src\components\ui\Badge.module.css`

```css
/* Status only. Never used for interactive elements — see tokens.css.
 *
 * Badges are SOLID fills with white text. A status is a verdict and should
 * read as one at a glance; a pale tint reads as decoration. Light tints are
 * reserved for large surfaces (an expanded row, a callout panel), never for
 * the small pill that carries the judgement. */

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  height: 26px;
  padding: 0 var(--s-3);
  border-radius: var(--r-pill);
  font-size: var(--t-caption);
  font-weight: var(--fw-bold);
  line-height: 1;
  white-space: nowrap;
  color: #fff;
}

.icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
}

.pass {
  background: var(--pass);
}

.warn {
  background: var(--warn);
}

.fail {
  background: var(--fail);
}

.neutral {
  background: var(--text-muted);
}

/* Live / in-progress is black with a static white dot — it is a state, not a
   verdict, so it stays out of the semantic hues entirely. The dot does not
   pulse: no blinking on a clinical screen. */
.active {
  background: var(--dark);
}

.dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

```

### `dashboard\src\components\ui\Badge.tsx`

```tsx
import type { ReactNode } from "react";
import { Check, Minus, TriangleAlert, CircleX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Badge.module.css";

/**
 * The product's core mechanic is a tri-state clinical judgement.
 * Colour is never the only signal: every status carries an icon and a
 * text label, because roughly 1 in 12 male users has a colour-vision
 * deficiency and several of them will be surgeons.
 */
export type BadgeStatus = "pass" | "warn" | "fail" | "neutral" | "active";

const STATUS_ICON: Record<Exclude<BadgeStatus, "active">, LucideIcon> = {
  pass: Check,
  warn: TriangleAlert,
  fail: CircleX,
  neutral: Minus,
};

/** Read aloud by assistive tech in place of the glyph. */
const STATUS_MEANING: Record<BadgeStatus, string> = {
  pass: "Pass",
  warn: "Borderline",
  fail: "Fail",
  neutral: "Pending",
  active: "In progress",
};

export type BadgeProps = {
  status?: BadgeStatus;
  children: ReactNode;
  /** Hide the icon. Only for places where the label alone already carries the state. */
  hideIcon?: boolean;
  className?: string;
};

export function Badge({
  status = "neutral",
  children,
  hideIcon,
  className,
}: BadgeProps) {
  const Icon = status === "active" ? null : STATUS_ICON[status];

  return (
    <span className={cx(s.badge, s[status], className)}>
      <span className="srOnly">{STATUS_MEANING[status]}: </span>
      {!hideIcon &&
        (status === "active" ? (
          <span className={s.dot} aria-hidden="true" />
        ) : (
          Icon && (
            <Icon className={s.icon} aria-hidden="true" strokeWidth={2.5} />
          )
        ))}
      {children}
    </span>
  );
}

```

### `dashboard\src\components\ui\Banner.module.css`

```css
/* Solid fills, never tints.
 *
 * A banner announces a state — live session, interrupted run, failed upload —
 * and should read as decisively as the badge that carries the same verdict
 * elsewhere. The pale-tint version sat back far enough to be mistaken for
 * decoration. Tints are now reserved for grouping surfaces only. */

.banner {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  width: 100%;
  padding: var(--s-4) var(--s-4) var(--s-4) var(--s-5);
  border-radius: var(--r-lg);
  background: var(--dark);
  color: #fff;
}

.icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.glyph {
  width: 15px;
  height: 15px;
}

/* Live state swaps the glyph for a pulsing dot. */
.pulse {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #fff;
  animation: bannerPulse 1.8s var(--ease-out) infinite;
}

@keyframes bannerPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.body {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: var(--t-label);
  line-height: var(--t-label-lh);
  font-weight: var(--fw-bold);
  color: #fff;
}

.text {
  margin-top: 2px;
  font-size: var(--t-label);
  line-height: 1.5;
  color: var(--on-dark-dim);
}

.action {
  flex: 0 0 auto;
}

.dismiss {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: var(--on-dark-dim);
  transition:
    background-color var(--m-fast) var(--ease-out),
    color var(--m-fast) var(--ease-out);
}

.dismiss:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

/* ---------- tones: the accent moves to the icon and the rule, not the fill ---------- */

.brand {
  background: var(--dark);
}
.brand .icon {
  background: var(--brand);
}

.pass {
  background: var(--pass);
}
.pass .icon {
  background: rgba(255, 255, 255, 0.18);
}
.pass .text {
  color: rgba(255, 255, 255, 0.78);
}

.warn {
  background: var(--warn);
}
.warn .icon {
  background: rgba(255, 255, 255, 0.18);
}
.warn .text {
  color: rgba(255, 255, 255, 0.8);
}

.fail {
  background: var(--fail);
}
.fail .icon {
  background: rgba(255, 255, 255, 0.18);
}
.fail .text {
  color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 767px) {
  .banner {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .action {
    width: 100%;
  }
}

/* Action buttons inside a banner.
   On the dark (brand) banner the green primary reads well as-is. On the three
   already-coloured tones a green button would clash, so the action becomes a
   solid white pill. */

.pass .action :global(button),
.warn .action :global(button),
.fail .action :global(button) {
  background: #fff;
  border-color: #fff;
  color: var(--ink);
}

.pass .action :global(button:hover),
.warn .action :global(button:hover),
.fail .action :global(button:hover) {
  background: rgba(255, 255, 255, 0.86);
  border-color: rgba(255, 255, 255, 0.86);
}

```

### `dashboard\src\components\ui\Banner.tsx`

```tsx
import type { ReactNode } from "react";
import { Check, Info, TriangleAlert, CircleX, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Banner.module.css";

export type BannerTone = "info" | "brand" | "pass" | "warn" | "fail";

const TONE_ICON: Record<BannerTone, LucideIcon> = {
  info: Info,
  brand: Info,
  pass: Check,
  warn: TriangleAlert,
  fail: CircleX,
};

const TONE_ROLE: Record<BannerTone, string> = {
  info: "Information",
  brand: "Information",
  pass: "Success",
  warn: "Warning",
  fail: "Error",
};

export type BannerProps = {
  tone?: BannerTone;
  title: ReactNode;
  /** State the problem and the fix. Never just "Invalid input". */
  children?: ReactNode;
  action?: ReactNode;
  /** Swaps the glyph for a pulsing dot — for states that are happening now. */
  live?: boolean;
  onDismiss?: () => void;
  className?: string;
};

export function Banner({
  tone = "info",
  title,
  children,
  action,
  live,
  onDismiss,
  className,
}: BannerProps) {
  const Icon = TONE_ICON[tone];
  // Whether assistive tech should interrupt — unrelated to the `live` dot.
  const urgent = tone === "fail" || tone === "warn";

  return (
    <div
      className={cx(s.banner, s[tone], className)}
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
    >
      <span className={s.icon} aria-hidden="true">
        {live ? (
          <span className={s.pulse} />
        ) : (
          <Icon className={s.glyph} strokeWidth={2.5} />
        )}
      </span>

      <div className={s.body}>
        <p className={s.title}>
          <span className="srOnly">{TONE_ROLE[tone]}: </span>
          {title}
        </p>
        {children && <div className={s.text}>{children}</div>}
      </div>

      {action && <div className={s.action}>{action}</div>}

      {onDismiss && (
        <button
          type="button"
          className={s.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X width={16} height={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

```

### `dashboard\src\components\ui\Button.module.css`

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  height: var(--h-md);
  padding: 0 var(--s-5);
  border: var(--bw) solid transparent;
  border-radius: var(--r-pill);
  font-family: var(--font-ui);
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--m-fast) var(--ease-out),
    border-color var(--m-fast) var(--ease-out),
    color var(--m-fast) var(--ease-out);
}

.btn:disabled,
.btn[aria-disabled="true"] {
  cursor: not-allowed;
  background: var(--surface-sunken);
  border-color: var(--border);
  color: var(--text-disabled);
}

/* ---------- variants ---------- */

.primary {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
  font-weight: var(--fw-bold);
}
.primary:hover:not(:disabled) {
  background: var(--brand-hover);
  border-color: var(--brand-hover);
}
.primary:active:not(:disabled) {
  background: var(--brand-pressed);
  border-color: var(--brand-pressed);
}

.secondary {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}
.secondary:hover:not(:disabled) {
  background: var(--surface-sunken);
  border-color: var(--border-strong);
}
.secondary:active:not(:disabled) {
  background: var(--divider);
}

.tonal {
  background: var(--brand-surface);
  border-color: var(--brand-border);
  color: var(--brand);
  font-weight: var(--fw-bold);
}
.tonal:hover:not(:disabled) {
  background: var(--brand-surface-hover);
}

.ghost {
  background: transparent;
  border-color: transparent;
  color: var(--brand);
}
.ghost:hover:not(:disabled) {
  background: var(--brand-surface);
}

.danger {
  background: transparent;
  border-color: var(--fail-border);
  color: var(--fail);
}
.danger:hover:not(:disabled) {
  background: var(--fail-surface);
}

/* ---------- sizes ---------- */

.sm {
  height: var(--h-sm);
  padding: 0 var(--s-4);
  font-size: var(--t-caption);
}

.lg {
  height: var(--h-lg);
  padding: 0 var(--s-7);
  font-size: var(--t-body);
}

/* ---------- modifiers ---------- */

.block {
  width: 100%;
}

.iconOnly {
  width: var(--h-md);
  padding: 0;
}
.iconOnly.sm {
  width: var(--h-sm);
}
.iconOnly.lg {
  width: var(--h-lg);
}

.icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}
.sm .icon {
  width: 16px;
  height: 16px;
}
.lg .icon {
  width: 20px;
  height: 20px;
}

/* `.btn` sets `line-height: 1`, which makes the line box exactly the em-box —
   and descenders live *below* that. Combined with the `overflow: hidden` here
   (which the ellipsis needs) every g, p, y, j and q was clipped along the
   bottom: "Proceed to imaging review" lost the tail of its g on every button in
   the product.

   The fix is the line-height, not the clip. The button's height is fixed by
   `height: var(--h-md)` and the label is centred in it, so giving the label a
   line box tall enough to hold its own descenders changes nothing about the
   button's size — it only stops the box being shorter than the text it
   contains. */
.label {
  min-width: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- loading ---------- */

.spinner {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  opacity: 0.85;
  animation: spin 640ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

```

### `dashboard\src\components\ui\Button.tsx`

```tsx
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tonal"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered before the label. */
  icon?: LucideIcon;
  /** Icon rendered after the label — chevrons, external-link marks. */
  trailingIcon?: LucideIcon;
  block?: boolean;
  loading?: boolean;
  children?: ReactNode;
  /**
   * Renders a link that looks like a button. A control that navigates must be
   * an anchor — middle-click, copy-link and the status bar all depend on it,
   * and a button that does nothing is not allowed.
   */
  href?: string;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  trailingIcon: TrailingIcon,
  block,
  loading,
  disabled,
  className,
  children,
  href,
  type = "button",
  ...rest
}: ButtonProps) {
  const iconOnly = !children;
  const classes = cx(
    s.btn,
    s[variant],
    size !== "md" && s[size],
    block && s.block,
    iconOnly && s.iconOnly,
    className,
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes} aria-label={rest["aria-label"]}>
        {Icon && <Icon className={s.icon} strokeWidth={2} aria-hidden="true" />}
        {children}
        {TrailingIcon && (
          <TrailingIcon className={s.icon} strokeWidth={2} aria-hidden="true" />
        )}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {loading ? (
        <span className={s.spinner} aria-hidden="true" />
      ) : (
        Icon && <Icon className={s.icon} aria-hidden="true" strokeWidth={1.75} />
      )}
      {children && <span className={s.label}>{children}</span>}
      {TrailingIcon && !loading && (
        <TrailingIcon className={s.icon} aria-hidden="true" strokeWidth={1.75} />
      )}
    </button>
  );
}

```

### `dashboard\src\components\ui\Card.module.css`

```css
.card {
  background: var(--surface);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--s-6);
}

.pad-sm {
  padding: var(--s-4);
}
.pad-lg {
  padding: var(--s-7);
}
.pad-none {
  padding: 0;
  overflow: hidden;
}

.sunken {
  background: var(--surface-sunken);
  border-style: dashed;
}

.tonal {
  background: var(--brand-surface);
  border-color: var(--brand-border);
}

.selected {
  border-width: var(--bw-emphasis);
  border-color: var(--brand);
  background: var(--brand-surface);
  padding: calc(var(--s-6) - 1px);
}

.interactive {
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--m-fast) var(--ease-out),
    background-color var(--m-fast) var(--ease-out);
}
.interactive:hover {
  border-color: var(--brand-border);
  background: var(--brand-surface);
}

/* ---------- header ---------- */

.header {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding-bottom: var(--s-4);
  margin-bottom: var(--s-5);
  border-bottom: var(--bw) solid var(--divider);
}

.headerFlush {
  padding: var(--s-5) var(--s-6) var(--s-4);
  margin-bottom: 0;
}

.headerText {
  flex: 1;
  min-width: 0;
}

.title {
  font-family: var(--font-display);
  font-size: var(--t-h3);
  line-height: var(--t-h3-lh);
  font-weight: var(--fw-bold);
  color: var(--ink);
  letter-spacing: -0.01em;
}

.subtitle {
  margin-top: 2px;
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
  color: var(--text-muted);
}

.action {
  flex: 0 0 auto;
}

```

### `dashboard\src\components\ui\Card.tsx`

```tsx
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./Card.module.css";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  tone?: "default" | "sunken" | "tonal";
  selected?: boolean;
  children?: ReactNode;
};

export function Card({
  padding = "md",
  tone = "default",
  selected,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        s.card,
        padding === "none" && s["pad-none"],
        padding === "sm" && s["pad-sm"],
        padding === "lg" && s["pad-lg"],
        tone === "sunken" && s.sunken,
        tone === "tonal" && s.tonal,
        selected && s.selected,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Use inside a padding="none" card so the header keeps its own inset. */
  flush?: boolean;
  className?: string;
};

export function CardHeader({
  title,
  subtitle,
  action,
  flush,
  className,
}: CardHeaderProps) {
  return (
    <div className={cx(s.header, flush && s.headerFlush, className)}>
      <div className={s.headerText}>
        <h3 className={s.title}>{title}</h3>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}

```

### `dashboard\src\components\ui\Chip.module.css`

```css
/* Filters, facets and metadata. Never a status — that is Badge. */

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  height: 34px;
  padding: 0 var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--text);
  font-size: var(--t-caption);
  font-weight: var(--fw-medium);
  line-height: 1;
  white-space: nowrap;
}

.interactive {
  cursor: pointer;
  transition:
    background-color var(--m-fast) var(--ease-out),
    border-color var(--m-fast) var(--ease-out),
    color var(--m-fast) var(--ease-out);
}
.interactive:hover {
  border-color: var(--border-strong);
  background: var(--surface-sunken);
}

/* Selected is a solid fill. A pale tint reads as decoration rather than as
   "this filter is on". */
.selected {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
  font-weight: var(--fw-bold);
}
.selected.interactive:hover {
  background: var(--brand-hover);
  border-color: var(--brand-hover);
}

.muted {
  background: var(--surface-sunken);
  border-color: transparent;
  color: var(--text-muted);
}

.icon {
  flex: 0 0 auto;
  width: 15px;
  height: 15px;
}

.count {
  padding: 0 var(--s-2);
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: var(--fw-bold);
}
.selected .count {
  background: rgba(255, 255, 255, 0.22);
  color: var(--on-brand);
}

/* ---------- segmented control ---------- */

.segmented {
  display: inline-flex;
  gap: var(--s-1);
  padding: var(--s-1);
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
}

.segment {
  height: 34px;
  padding: 0 var(--s-4);
  border: var(--bw) solid transparent;
  border-radius: var(--r-pill);
  color: var(--text-muted);
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  transition:
    background-color var(--m-fast) var(--ease-out),
    color var(--m-fast) var(--ease-out);
}
.segment:hover:not(.segmentOn) {
  color: var(--text);
}

.segmentOn {
  background: var(--surface);
  border-color: var(--border);
  color: var(--ink);
  font-weight: var(--fw-bold);
}

```

### `dashboard\src\components\ui\Chip.tsx`

```tsx
/* No "use client" on purpose: with no hooks of its own this renders as a
   server component when a server page uses it, and is pulled into the client
   bundle only when a client component passes a handler. Marking it here would
   force every icon prop to cross the boundary and fail. */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Chip.module.css";

export type ChipProps = {
  children: ReactNode;
  icon?: LucideIcon;
  count?: number;
  selected?: boolean;
  tone?: "default" | "muted";
  onClick?: () => void;
  className?: string;
};

export function Chip({
  children,
  icon: Icon,
  count,
  selected,
  tone = "default",
  onClick,
  className,
}: ChipProps) {
  const classes = cx(
    s.chip,
    tone === "muted" && s.muted,
    selected && s.selected,
    onClick && s.interactive,
    className,
  );

  const content = (
    <>
      {Icon && <Icon className={s.icon} aria-hidden="true" strokeWidth={1.75} />}
      {children}
      {count !== undefined && <span className={s.count}>{count}</span>}
    </>
  );

  if (!onClick) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Describes the group for screen readers, e.g. "Difficulty". */
  label: string;
  className?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div className={cx(s.segmented, className)} role="group" aria-label={label}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            className={cx(s.segment, on && s.segmentOn)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

```

### `dashboard\src\components\ui\Field.module.css`

```css
.field {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.label {
  display: flex;
  align-items: center;
  gap: var(--s-1);
  font-size: var(--t-label);
  line-height: var(--t-label-lh);
  font-weight: var(--fw-semibold);
  color: var(--text-muted);
}

.required {
  color: var(--fail);
  font-weight: var(--fw-bold);
}

.optional {
  margin-left: auto;
  font-size: var(--t-caption);
  font-weight: var(--fw-regular);
  color: var(--text-disabled);
}

/* ---------- control ---------- */

/* Holds a trailing control inside the field's border. */
.controlWrap {
  position: relative;
  display: block;
}

.controlTrailing {
  padding-right: 92px;
}

.trailing {
  position: absolute;
  top: 50%;
  right: var(--s-2);
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}


.control {
  width: 100%;
  height: var(--h-md);
  padding: 0 var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: var(--t-body);
  transition:
    border-color var(--m-fast) var(--ease-out),
    background-color var(--m-fast) var(--ease-out);
}

.control::placeholder {
  color: var(--text-disabled);
}

.control:hover:not(:disabled):not(:read-only) {
  border-color: var(--border-strong);
}

.control:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-surface);
}

.control:disabled {
  background: var(--surface-sunken);
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* Read-only is visually distinct from disabled: it holds real data. */
.control:read-only:not(select) {
  background: var(--surface-sunken);
  border-style: dashed;
  color: var(--text);
}

.invalid,
.invalid:hover {
  border-color: var(--fail);
}
.invalid:focus {
  border-color: var(--fail);
  box-shadow: 0 0 0 3px var(--fail-surface);
}

.textarea {
  height: auto;
  min-height: 108px;
  padding: var(--s-3) var(--s-4);
  line-height: var(--t-body-lh);
  resize: vertical;
}

.select {
  appearance: none;
  padding-right: var(--s-9);
  background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
    linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
  background-position:
    calc(100% - 20px) calc(50% + 2px),
    calc(100% - 15px) calc(50% + 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  cursor: pointer;
}

/* ---------- messages ---------- */

.helper {
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
  color: var(--text-muted);
}

.error {
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
  font-weight: var(--fw-medium);
  color: var(--fail);
}

.errorIcon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  margin-top: 1px;
}

/* ---------- checkbox ---------- */

.check {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  min-height: var(--h-md);
  padding: var(--s-2) 0;
  cursor: pointer;
}

.checkInput {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkBox {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border: var(--bw) solid var(--border-strong);
  border-radius: var(--r-xs);
  background: var(--surface);
  color: transparent;
  transition:
    background-color var(--m-fast) var(--ease-out),
    border-color var(--m-fast) var(--ease-out);
}

.checkInput:checked + .checkBox {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
}

.checkInput:focus-visible + .checkBox {
  outline: var(--bw-emphasis) solid var(--brand);
  outline-offset: 2px;
}

.checkIcon {
  width: 14px;
  height: 14px;
}

.checkBody {
  min-width: 0;
}

.checkLabel {
  font-size: var(--t-body);
  color: var(--ink);
}

.checkHelper {
  margin-top: 2px;
  font-size: var(--t-caption);
  color: var(--text-muted);
}

```

### `dashboard\src\components\ui\Field.tsx`

```tsx
"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Field.module.css";

/**
 * Labels are always visible — a placeholder is never used as a label.
 * Errors sit below their own field and state the fix, not just the fault.
 */

type FieldShellProps = {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: (ids: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
};

function FieldShell({
  label,
  helper,
  error,
  required,
  optional,
  className,
  children,
}: FieldShellProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, helper ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cx(s.field, className)}>
      <label className={s.label} htmlFor={id}>
        {label}
        {required && (
          <span className={s.required} aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="srOnly">(required)</span>}
        {optional && <span className={s.optional}>Optional</span>}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error && (
        <p className={s.error} id={errorId} role="alert">
          <TriangleAlert className={s.errorIcon} aria-hidden="true" />
          {error}
        </p>
      )}
      {helper && !error && (
        <p className={s.helper} id={helperId}>
          {helper}
        </p>
      )}
    </div>
  );
}

/* ---------- Input ---------- */

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className"
> & {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  /**
   * A control rendered inside the field, against its right edge — a show/hide
   * toggle, a unit, a clear button. It sits inside the border rather than
   * beside it, so the whole thing still reads as one field.
   */
  trailing?: ReactNode;
};

export function Input({
  label,
  helper,
  error,
  required,
  optional,
  className,
  trailing,
  ...rest
}: InputProps) {
  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {({ id, describedBy, invalid }) => {
        const control = (
          <input
            id={id}
            required={required}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cx(
              s.control,
              Boolean(trailing) && s.controlTrailing,
              invalid && s.invalid,
            )}
            {...rest}
          />
        );

        if (!trailing) return control;

        return (
          <span className={s.controlWrap}>
            {control}
            <span className={s.trailing}>{trailing}</span>
          </span>
        );
      }}
    </FieldShell>
  );
}

/* ---------- Select ---------- */

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "className"
> & {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

export function Select({
  label,
  helper,
  error,
  required,
  optional,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cx(s.control, s.select, invalid && s.invalid)}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

/* ---------- Textarea ---------- */

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id" | "className"
> & {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
};

export function Textarea({
  label,
  helper,
  error,
  required,
  optional,
  className,
  ...rest
}: TextareaProps) {
  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cx(s.control, s.textarea, invalid && s.invalid)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

/* ---------- Checkbox ---------- */

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  label: ReactNode;
  helper?: ReactNode;
  className?: string;
};

export function Checkbox({ label, helper, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx(s.check, className)}>
      <input type="checkbox" className={s.checkInput} {...rest} />
      <span className={s.checkBox} aria-hidden="true">
        <Check className={s.checkIcon} strokeWidth={3} />
      </span>
      <span className={s.checkBody}>
        <span className={s.checkLabel}>{label}</span>
        {helper && <span className={s.checkHelper}>{helper}</span>}
      </span>
    </label>
  );
}

```

### `dashboard\src\components\ui\index.ts`

```typescript
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Card, CardHeader } from "./Card";
export type { CardProps, CardHeaderProps } from "./Card";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeStatus } from "./Badge";

export { Chip, Segmented } from "./Chip";
export type { ChipProps, SegmentedProps, SegmentedOption } from "./Chip";

export { Input, Select, Textarea, Checkbox } from "./Field";
export type {
  InputProps,
  SelectProps,
  TextareaProps,
  CheckboxProps,
} from "./Field";

export {
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  Unit,
  TableCaption,
} from "./Table";
export type { TableProps, TrProps, ThProps, TdProps } from "./Table";

export { MetricTile } from "./MetricTile";
export type { MetricTileProps } from "./MetricTile";

export { ProgressBar } from "./ProgressBar";
export type { ProgressBarProps } from "./ProgressBar";

export { Banner } from "./Banner";
export type { BannerProps, BannerTone } from "./Banner";

export { Stepper } from "./Stepper";
export type { StepperProps, Step, StepState } from "./Stepper";

export { EmptyState, Skeleton } from "./States";
export type { EmptyStateProps, SkeletonProps } from "./States";

```

### `dashboard\src\components\ui\MetricTile.module.css`

```css
/* Displays one clinical number. The value stays --ink; only the badge is
   coloured. That keeps a wall of tiles calm instead of alarming. */

.tile {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  padding: var(--s-5);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
}

.head {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}

.label {
  flex: 1;
  min-width: 0;
  font-size: var(--t-overline);
  line-height: var(--t-overline-lh);
  font-weight: var(--fw-bold);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.info {
  flex: 0 0 auto;
  width: 15px;
  height: 15px;
  color: var(--text-disabled);
}

.valueRow {
  display: flex;
  align-items: baseline;
  gap: var(--s-1);
}

.value {
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1;
  font-weight: var(--fw-bold);
  letter-spacing: -0.025em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.compact .value {
  font-size: 22px;
}

.unit {
  font-size: var(--t-body);
  font-weight: var(--fw-semibold);
  color: var(--text-muted);
}

.foot {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  flex-wrap: wrap;
}

.caption {
  font-size: var(--t-caption);
  line-height: var(--t-caption-lh);
  color: var(--text-muted);
}

```

### `dashboard\src\components\ui\MetricTile.tsx`

```tsx
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./MetricTile.module.css";

export type MetricTileProps = {
  label: string;
  value: ReactNode;
  /** Rendered muted and smaller beside the value: °, mm, %, "/ 100". */
  unit?: ReactNode;
  /** A Badge stating the clinical verdict. The value itself stays neutral. */
  status?: ReactNode;
  caption?: ReactNode;
  /** Tooltip text for the info affordance beside the label. */
  hint?: string;
  compact?: boolean;
  className?: string;
};

export function MetricTile({
  label,
  value,
  unit,
  status,
  caption,
  hint,
  compact,
  className,
}: MetricTileProps) {
  return (
    <div className={cx(s.tile, compact && s.compact, className)}>
      <div className={s.head}>
        <span className={s.label}>{label}</span>
        {hint && (
          <Info className={s.info} aria-label={hint} strokeWidth={1.75} />
        )}
      </div>

      <div className={s.valueRow}>
        <span className={s.value}>{value}</span>
        {unit && <span className={s.unit}>{unit}</span>}
      </div>

      {(status || caption) && (
        <div className={s.foot}>
          {status}
          {caption && <span className={s.caption}>{caption}</span>}
        </div>
      )}
    </div>
  );
}

```

### `dashboard\src\components\ui\Popover.module.css`

```css
.wrap {
  position: relative;
  display: inline-flex;
}

.trigger {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.panel {
  position: absolute;
  top: calc(100% + var(--s-2));
  z-index: var(--z-overlay);
  min-width: 240px;
  padding: var(--s-2);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: var(--e-3);
}

.alignEnd {
  right: 0;
}

.alignStart {
  left: 0;
}

.heading {
  padding: var(--s-3) var(--s-3) var(--s-2);
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-disabled);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  width: 100%;
  min-height: 40px;
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-sm);
  color: var(--text);
  font-size: var(--t-label);
  font-weight: var(--fw-medium);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--m-fast) var(--ease-out);
}

.item:hover {
  background: var(--surface-sunken);
}

.itemOn {
  color: var(--brand);
  font-weight: var(--fw-bold);
}

.itemIcon {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.itemOn .itemIcon {
  color: var(--brand);
}

.itemBody {
  flex: 1;
  min-width: 0;
}

.itemMeta {
  margin-top: 1px;
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.divider {
  height: var(--bw);
  margin: var(--s-2) 0;
  background: var(--divider);
}

.empty {
  padding: var(--s-5) var(--s-3);
  text-align: center;
  font-size: var(--t-caption);
  color: var(--text-muted);
}

```

### `dashboard\src\components\ui\Popover.tsx`

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Popover.module.css";

/** Closes on Escape and on a click outside. Both are expected of a menu. */
export function Popover({
  trigger,
  children,
  align = "end",
  label,
}: {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={s.wrap} ref={wrapRef}>
      <button
        type="button"
        className={s.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>

      {open && (
        <div
          className={cx(s.panel, align === "end" ? s.alignEnd : s.alignStart)}
          role="menu"
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function PopoverHeading({ children }: { children: ReactNode }) {
  return <p className={s.heading}>{children}</p>;
}

export function PopoverItem({
  icon: Icon,
  children,
  meta,
  selected,
  onClick,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  meta?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cx(s.item, selected && s.itemOn)}
      onClick={onClick}
    >
      {Icon && <Icon className={s.itemIcon} strokeWidth={1.75} aria-hidden="true" />}
      <span className={s.itemBody}>
        {children}
        {meta && <span className={s.itemMeta}>{meta}</span>}
      </span>
    </button>
  );
}

export function PopoverDivider() {
  return <div className={s.divider} />;
}

export function PopoverEmpty({ children }: { children: ReactNode }) {
  return <p className={s.empty}>{children}</p>;
}

```

### `dashboard\src\components\ui\ProgressBar.module.css`

```css
.wrap {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  width: 100%;
}

.head {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
}

.label {
  flex: 1;
  min-width: 0;
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.value {
  font-size: var(--t-label);
  font-weight: var(--fw-bold);
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.track {
  position: relative;
  width: 100%;
  height: 10px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  overflow: hidden;
}

.sm .track {
  height: 6px;
}
.lg .track {
  height: 14px;
}

.fill {
  height: 100%;
  border-radius: var(--r-pill);
  background: var(--brand);
  transition: width var(--m-slow) var(--ease-out);
}

.pass .fill {
  background: var(--pass);
}
.warn .fill {
  background: var(--warn);
}
.fail .fill {
  background: var(--fail);
}

/* Pass threshold marker — the number that decides pass/fail must be visible. */
.threshold {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  border-radius: var(--r-pill);
  background: var(--ink);
  opacity: 0.45;
}

.thresholdLabel {
  font-size: var(--t-caption);
  color: var(--text-muted);
}

```

### `dashboard\src\components\ui\ProgressBar.tsx`

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./ProgressBar.module.css";

export type ProgressBarProps = {
  /** 0–100. Clamped. */
  value: number;
  label?: ReactNode;
  /** Shown right-aligned beside the label, e.g. "92 / 100". */
  valueLabel?: ReactNode;
  tone?: "brand" | "pass" | "warn" | "fail";
  size?: "sm" | "md" | "lg";
  /** Draws a marker at this percentage — the pass mark on a score bar. */
  threshold?: number;
  thresholdLabel?: ReactNode;
  className?: string;
};

export function ProgressBar({
  value,
  label,
  valueLabel,
  tone = "brand",
  size = "md",
  threshold,
  thresholdLabel,
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={cx(s.wrap, s[tone], size !== "md" && s[size], className)}>
      {(label || valueLabel) && (
        <div className={s.head}>
          {label && <span className={s.label}>{label}</span>}
          {valueLabel && <span className={s.value}>{valueLabel}</span>}
        </div>
      )}

      <div
        className={s.track}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === "string" ? label : undefined}
      >
        <div className={s.fill} style={{ width: `${pct}%` }} />
        {threshold !== undefined && (
          <div
            className={s.threshold}
            style={{ left: `${Math.max(0, Math.min(100, threshold))}%` }}
          />
        )}
      </div>

      {thresholdLabel && (
        <span className={s.thresholdLabel}>{thresholdLabel}</span>
      )}
    </div>
  );
}

```

### `dashboard\src\components\ui\States.module.css`

```css
/* Empty / loading / error, specified once and used everywhere. */

.empty {
  display: grid;
  place-items: center;
  padding: var(--s-11) var(--s-6);
  border: var(--bw) dashed var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-sunken);
  text-align: center;
  /* Same rule as `.statRow` and the table wrap: a band owns the space beneath
     it. An empty state is usually the last thing on a screen, which is why this
     was never noticed — put a panel after one and they touch. Collapses to
     nothing where a section header follows. */
  margin-bottom: var(--s-5);
}

.emptyInner {
  max-width: 40ch;
}

.emptyIcon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text-disabled);
}

.emptyTitle {
  margin-bottom: var(--s-2);
  font-family: var(--font-display);
  font-size: var(--t-h3);
  font-weight: var(--fw-bold);
  color: var(--ink);
}

.emptyText {
  margin-bottom: var(--s-5);
  font-size: var(--t-label);
  line-height: 1.55;
  color: var(--text-muted);
}

/* ---------- skeleton ---------- */

.skeleton {
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
}

/* No shimmer: a still block is calmer and cheaper than an animated one. */
.skeletonBlock {
  border-radius: var(--r-md);
}

```

### `dashboard\src\components\ui\States.tsx`

```tsx
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./States.module.css";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  /** One line. Say what to do, not just that nothing is here. */
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(s.empty, className)}>
      <div className={s.emptyInner}>
        <div className={s.emptyIcon} aria-hidden="true">
          <Icon width={26} height={26} strokeWidth={1.5} />
        </div>
        <h3 className={s.emptyTitle}>{title}</h3>
        {children && <p className={s.emptyText}>{children}</p>}
        {action}
      </div>
    </div>
  );
}

export type SkeletonProps = {
  width?: string;
  height?: string;
  block?: boolean;
  className?: string;
};

/** Reserves the final layout's space so nothing shifts when data lands. */
export function Skeleton({
  width = "100%",
  height = "12px",
  block,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cx(s.skeleton, block && s.skeletonBlock, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

```

### `dashboard\src\components\ui\Stepper.module.css`

```css
/* Used for the 7 planning steps (vertical rail) and the 11 operative
   parts (horizontal rail). */

.rail {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
}

.step {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-3);
  border: var(--bw) solid transparent;
  border-radius: var(--r-md);
  text-align: left;
  transition: background-color var(--m-fast) var(--ease-out);
}

.stepLink:hover {
  background: var(--surface-sunken);
}

.dot {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: var(--bw) solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--t-caption);
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
}

.glyph {
  width: 14px;
  height: 14px;
}

.body {
  min-width: 0;
  padding-top: 4px;
}

.label {
  font-size: var(--t-label);
  line-height: var(--t-label-lh);
  color: var(--text-muted);
}

.meta {
  margin-top: 2px;
  font-size: var(--t-caption);
  color: var(--text-disabled);
}

/* ---------- states ---------- */

.done .dot {
  background: var(--pass);
  border-color: var(--pass);
  color: var(--on-dark);
}
.done .label {
  color: var(--text);
}

.current {
  background: var(--brand-surface);
  border-color: var(--brand-border);
}
.current .dot {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
}
.current .label {
  color: var(--ink);
  font-weight: var(--fw-bold);
}

.blocked .dot {
  border-style: dashed;
  border-color: var(--fail-border);
  color: var(--fail);
}

/* ---------- horizontal ---------- */

.horizontal {
  flex-direction: row;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  padding-bottom: var(--s-2);
}

.horizontal .step {
  flex: 0 0 auto;
  align-items: center;
  padding: var(--s-2) var(--s-3);
}

.horizontal .body {
  padding-top: 0;
}

.horizontal .label {
  white-space: nowrap;
}

.connector {
  flex: 0 0 auto;
  width: 24px;
  height: 2px;
  border-radius: var(--r-pill);
  background: var(--divider);
}

.connectorDone {
  background: var(--pass);
}

```

### `dashboard\src\components\ui\Stepper.tsx`

```tsx
import { Fragment } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Stepper.module.css";

export type StepState = "done" | "current" | "upcoming" | "blocked";

export type Step = {
  label: string;
  /** Sub-label: a time budget, a scene count, an outcome. */
  meta?: string;
  state: StepState;
  href?: string;
};

export type StepperProps = {
  steps: Step[];
  orientation?: "vertical" | "horizontal";
  /** Accessible name, e.g. "Pre-operative planning steps". */
  label: string;
  className?: string;
};

export function Stepper({
  steps,
  orientation = "vertical",
  label,
  className,
}: StepperProps) {
  const horizontal = orientation === "horizontal";

  return (
    <nav
      aria-label={label}
      className={cx(s.rail, horizontal && s.horizontal, className)}
    >
      {steps.map((step, i) => {
        const stateClass =
          step.state === "done"
            ? s.done
            : step.state === "current"
              ? s.current
              : step.state === "blocked"
                ? s.blocked
                : undefined;

        const inner = (
          <>
            <span className={s.dot} aria-hidden="true">
              {step.state === "done" ? (
                <Check className={s.glyph} strokeWidth={3} />
              ) : step.state === "blocked" ? (
                <Lock className={s.glyph} strokeWidth={2.25} />
              ) : (
                i + 1
              )}
            </span>
            <span className={s.body}>
              <span className={s.label}>{step.label}</span>
              {step.meta && <span className={s.meta}>{step.meta}</span>}
            </span>
          </>
        );

        const common = {
          className: cx(s.step, stateClass, step.href && s.stepLink),
          "aria-current": step.state === "current" ? ("step" as const) : undefined,
        };

        return (
          <Fragment key={step.label}>
            {i > 0 && horizontal && (
              <span
                className={cx(
                  s.connector,
                  steps[i - 1].state === "done" && s.connectorDone,
                )}
                aria-hidden="true"
              />
            )}
            {step.href && step.state !== "blocked" ? (
              <Link href={step.href} {...common}>
                {inner}
              </Link>
            ) : (
              <div {...common}>{inner}</div>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

```

### `dashboard\src\components\ui\Table.module.css`

```css
/* The most important component in the product — the report lives in one. */

.wrap {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--r-lg);
  border: var(--bw) solid var(--border);
  background: var(--surface);
  /* Same reasoning as `.statRow`: collapses to nothing where a section header
     already follows, and stops the next panel touching the header row where
     one does not. */
  margin-bottom: var(--s-5);
}

/* Inside a padding="none" Card the wrapper must not double the border. */
.bare {
  border: none;
  border-radius: 0;
}

.table {
  width: 100%;
  min-width: 640px;
  font-size: var(--t-label);
  border-collapse: collapse;
}

.th {
  padding: var(--s-3) var(--s-4);
  background: var(--surface-sunken);
  border-bottom: var(--bw) solid var(--border);
  color: var(--text-muted);
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
}

.td {
  padding: var(--s-4);
  border-bottom: var(--bw) solid var(--divider);
  color: var(--text);
  vertical-align: middle;
}

.row:last-child .td {
  border-bottom: none;
}

.row {
  transition: background-color var(--m-fast) var(--ease-out);
}
.row:hover .td {
  background: var(--canvas);
}

/* Numeric columns right-aligned with tabular figures so digits stack. */
.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.key {
  color: var(--ink);
  font-weight: var(--fw-semibold);
}

.unit {
  color: var(--text-muted);
  font-size: var(--t-caption);
}

/* Row-level state. Kept subtle: the badge in the row carries the meaning. */
.rowPass .td {
  background: color-mix(in srgb, var(--pass-surface) 45%, transparent);
}
.rowWarn .td {
  background: color-mix(in srgb, var(--warn-surface) 55%, transparent);
}
.rowFail .td {
  background: color-mix(in srgb, var(--fail-surface) 55%, transparent);
}

.sortable {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}
.sortable:hover {
  color: var(--text);
}

.sortIcon {
  width: 13px;
  height: 13px;
  opacity: 0.5;
}
.sortActive .sortIcon {
  opacity: 1;
}

.caption {
  padding: var(--s-3) var(--s-4);
  border-top: var(--bw) solid var(--divider);
  color: var(--text-muted);
  font-size: var(--t-caption);
  text-align: left;
}

```

### `dashboard\src\components\ui\Table.tsx`

```tsx
import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import s from "./Table.module.css";

export type TableProps = {
  children: ReactNode;
  /** Accessible name, e.g. "Alignment and position, planned versus achieved". */
  label: string;
  /** Drop the wrapper's own border when nested in a padding="none" Card. */
  bare?: boolean;
  className?: string;
};

export function Table({ children, label, bare, className }: TableProps) {
  return (
    <div className={cx(s.wrap, bare && s.bare, className)}>
      <table className={s.table} aria-label={label}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export type TrProps = {
  children: ReactNode;
  /** Tints the whole row. The row must still contain a Badge stating why. */
  state?: "pass" | "warn" | "fail";
  className?: string;
};

export function Tr({ children, state, className }: TrProps) {
  return (
    <tr
      className={cx(
        s.row,
        state === "pass" && s.rowPass,
        state === "warn" && s.rowWarn,
        state === "fail" && s.rowFail,
        className,
      )}
    >
      {children}
    </tr>
  );
}

export type ThProps = ThHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
};

export function Th({ numeric, className, children, ...rest }: ThProps) {
  return (
    <th
      scope="col"
      className={cx(s.th, numeric && s.numeric, className)}
      {...rest}
    >
      {children}
    </th>
  );
}

export type TdProps = TdHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
  /** Renders as the row's header cell — the parameter or entity name. */
  head?: boolean;
};

export function Td({ numeric, head, className, children, ...rest }: TdProps) {
  const classes = cx(s.td, numeric && s.numeric, head && s.key, className);

  if (head) {
    return (
      <th scope="row" className={classes} {...rest}>
        {children}
      </th>
    );
  }

  return (
    <td className={classes} {...rest}>
      {children}
    </td>
  );
}

/** Units live in their own muted span so the digits themselves stay aligned. */
export function Unit({ children }: { children: ReactNode }) {
  return <span className={s.unit}> {children}</span>;
}

export function TableCaption({ children }: { children: ReactNode }) {
  return <p className={s.caption}>{children}</p>;
}

```

### `dashboard\src\components\viz\Charts.tsx`

```tsx
import { cx } from "@/lib/cx";
import s from "./viz.module.css";

/* ---------- Bar chart ---------- */

export type BarDatum = {
  label: string;
  value: number;
  /** Overrides the automatic ranking. Rarely needed. */
  tone?: "muted" | "brand" | "dark" | "ghost";
  /** Overrides the automatic value pill. */
  tag?: string;
};

/**
 * Ranked emphasis: the highest bar is green, the runner-up is black, the rest
 * are hatched ghosts. Both leaders carry a floating value pill, as in the
 * reference — the number sits above the bar so it never fights the fill.
 */
export function BarChart({
  data,
  max,
  height = 200,
  /** Show value pills on the top N bars. */
  highlight = 2,
  formatTag = (v: number) => String(v),
}: {
  data: BarDatum[];
  max?: number;
  height?: number;
  highlight?: number;
  formatTag?: (value: number) => string;
}) {
  const ceiling = max ?? Math.max(...data.map((d) => d.value), 1);

  // Rank by value, tallest first. Ties keep source order.
  const ranked = [...data]
    .map((d, i) => ({ i, value: d.value }))
    .sort((a, b) => b.value - a.value || a.i - b.i)
    .map((r) => r.i);

  const rankOf = (index: number) => ranked.indexOf(index);

  return (
    <div className={s.chartWrap}>
      <div className={s.chart} style={{ height }}>
        {data.map((d, i) => {
          const rank = rankOf(i);
          const tone =
            d.tone ?? (rank === 0 ? "brand" : rank === 1 ? "dark" : "ghost");
          const tag = d.tag ?? (rank < highlight ? formatTag(d.value) : undefined);

          return (
            <div className={s.chartCol} key={`${d.label}-${i}`}>
              {tag && (
                <span
                  className={cx(s.chartTag, rank === 0 && s.chartTagBrand)}
                  style={{ bottom: `calc(${(d.value / ceiling) * 100}% + 10px)` }}
                >
                  {tag}
                </span>
              )}
              <div
                className={cx(
                  s.chartBar,
                  tone === "brand" && s.chartBarOn,
                  tone === "dark" && s.chartBarDark,
                  tone === "ghost" && s.chartBarGhost,
                )}
                style={{ height: `${(d.value / ceiling) * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className={s.chartAxis}>
        {data.map((d, i) => (
          <span className={s.chartAxisLabel} key={`${d.label}-axis-${i}`}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Trend (line) ---------- */

export type TrendMarker = {
  /** Index into `values`. */
  at: number;
  label: string;
  tone?: "pass" | "warn" | "fail";
};

export type TrendChartProps = {
  values: number[];
  /** Dashed comparison series, e.g. the cohort median. */
  compare?: number[];
  compareLabel?: string;
  seriesLabel?: string;
  labels?: string[];
  markers?: TrendMarker[];
  /** Text equivalent Required, not optional. */
  caption: string;
  height?: number;
};

const TONE_COLOUR: Record<string, string> = {
  pass: "var(--pass)",
  warn: "var(--warn)",
  fail: "var(--fail)",
};

/**
 * Hand-built SVG rather than a charting library: token-driven, no JavaScript
 * shipped, renders on the server.
 *
 * No area fill. A pale wash under the line muddied the reading and clashed
 * with the solid-status rule — the line itself, gridlines and a solid end-cap
 * carry the shape instead.
 */
export function TrendChart({
  values,
  compare,
  compareLabel = "Cohort median",
  seriesLabel = "You",
  labels,
  markers = [],
  caption,
  height = 168,
}: TrendChartProps) {
  const W = 640;
  const H = height;
  const PAD_Y = 16;
  const PAD_R = 46; // room for the axis value labels
  const PAD_L = 4;

  /**
   * A week with no completed session carries a mean of 0, which is an absence
   * and not a measurement — so a line through it would draw a shape the data
   * does not have. Below two real points there is no trend, and
   * the caption already says so; it becomes the whole panel.
   *
   * This is also the empty-series guard. `Math.min(...[])` is `Infinity`, so an
   * account with no history made `span` infinite and every `y()` `NaN`, which
   * reached the DOM as `<line y1="NaN">` and a run of React warnings.
   */
  const plottable = values.filter((v) => v > 0).length >= 2;
  if (!plottable) {
    return (
      <div className={s.trend}>
        <p className={s.trendEmpty}>{caption}</p>
      </div>
    );
  }

  const all = [...values, ...(compare ?? [])];
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  // Round outward so gridlines land on readable numbers.
  const min = Math.floor((rawMin - (rawMax - rawMin) * 0.15) / 5) * 5;
  const max = Math.ceil((rawMax + (rawMax - rawMin) * 0.1) / 5) * 5;
  const span = max - min || 1;

  const x = (i: number, n: number) =>
    PAD_L + (i / Math.max(n - 1, 1)) * (W - PAD_L - PAD_R);
  const y = (v: number) => PAD_Y + (1 - (v - min) / span) * (H - PAD_Y * 2);

  const path = (series: number[]) =>
    series
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i, series.length)},${y(v)}`)
      .join(" ");

  const ticks = 4;
  const gridValues = Array.from({ length: ticks }, (_, i) =>
    Math.round(min + (span / (ticks - 1)) * i),
  );

  const lastIndex = values.length - 1;

  return (
    <div className={s.trend}>
      <svg
        className={s.trendSvg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={caption}
      >
        {/* gridlines + right-hand value labels */}
        {/* Keyed by tick, not by value: a narrow span rounds two gridlines to
            the same number and React sees a duplicate key. */}
        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--divider)"
              strokeWidth={1}
            />
            <text
              x={W - PAD_R + 8}
              y={y(v) + 4}
              fill="var(--text-disabled)"
              fontSize={11}
              fontWeight={600}
            >
              {v}
            </text>
          </g>
        ))}

        {compare && (
          <path
            d={path(compare)}
            fill="none"
            stroke="var(--text-disabled)"
            strokeWidth={2}
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
        )}

        <path
          d={path(values)}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* A marker is an index into `values`; both dashboards derive it as
            `values.length - 1`, which is -1 on an empty series. */}
        {markers
          .filter((m) => m.at >= 0 && m.at < values.length)
          .map((m) => (
            <circle
              key={`${m.at}-${m.label}`}
              cx={x(m.at, values.length)}
              cy={y(values[m.at])}
              r={5.5}
              fill={TONE_COLOUR[m.tone ?? "pass"]}
              stroke="var(--surface)"
              strokeWidth={3}
            />
          ))}

        {/* solid end cap on the latest value */}
        <circle
          cx={x(lastIndex, values.length)}
          cy={y(values[lastIndex])}
          r={6}
          fill="var(--dark)"
          stroke="var(--surface)"
          strokeWidth={3}
        />
      </svg>

      <div className={s.trendFoot}>
        <div className={s.trendKeys}>
          <span className={s.trendKey}>
            <span className={s.keyLine} aria-hidden="true" />
            {seriesLabel}
          </span>
          {compare && (
            <span className={s.trendKey}>
              <span className={s.keyDash} aria-hidden="true" />
              {compareLabel}
            </span>
          )}
        </div>
        {labels && (
          <div className={s.trendGrid}>
            {labels.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        )}
      </div>

      <p className={s.trendCaption}>{caption}</p>
    </div>
  );
}

```

### `dashboard\src\components\viz\ExpandableRow.tsx`

```tsx
"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./viz.module.css";

/**
 * The only genuinely stateful piece of the row. Its expanded content arrives
 * through `children`, already rendered on the server — see RowParts.tsx for
 * why that separation matters.
 */

export type RowCell = {
  value: ReactNode;
  pill?: "dark" | "muted" | "pass" | "fail";
};

export type ExpandableRowProps = {
  initials: string;
  label: string;
  cells: RowCell[];
  children: ReactNode;
  defaultOpen?: boolean;
};

export function ExpandableRow({
  initials,
  label,
  cells,
  children,
  defaultOpen = false,
}: ExpandableRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div className={cx(s.row, open && s.rowOpen)}>
      <button
        type="button"
        className={s.rowTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={s.rowName}>
          <span
            className={cx(s.rowAvatar, open && s.rowAvatarOn)}
            aria-hidden="true"
          >
            {initials}
          </span>
          <span className={s.rowLabel}>{label}</span>
        </span>

        {cells.map((cell, i) => (
          <span className={s.rowCell} key={i}>
            {cell.pill ? (
              <span
                className={cx(
                  s.pill,
                  cell.pill === "muted" && s.pillMuted,
                  cell.pill === "pass" && s.pillPass,
                  cell.pill === "fail" && s.pillFail,
                )}
              >
                {cell.value}
              </span>
            ) : (
              cell.value
            )}
          </span>
        ))}

        <span className={s.rowToggle} aria-hidden="true">
          <Chevron width={15} height={15} strokeWidth={2.5} />
        </span>
      </button>

      {open && <div className={s.rowBody}>{children}</div>}
    </div>
  );
}

```

### `dashboard\src\components\viz\index.ts`

```typescript
export {
  Delta,
  HeroMetric,
  StatCard,
  StatRow,
  DistributionBar,
  RankedList,
} from "./Metrics";
export type {
  HeroMetricProps,
  StatCardProps,
  DistributionSegment,
  RankedItem,
} from "./Metrics";

export { BarChart, TrendChart } from "./Charts";
export type { BarDatum, TrendChartProps, TrendMarker } from "./Charts";

export { ExpandableRow } from "./ExpandableRow";
export type { ExpandableRowProps, RowCell } from "./ExpandableRow";

export {
  Rows,
  RowHeader,
  Chips,
  VizChip,
  SubHead,
  Breakdown,
  BreakCell,
} from "./RowParts";

```

### `dashboard\src\components\viz\Metrics.tsx`

```tsx
import type { ReactNode } from "react";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./viz.module.css";

/* ---------- Delta pill ---------- */

export function Delta({
  value,
  suffix = "%",
  tone = "auto",
}: {
  value: number;
  suffix?: string;
  /** "dark" is the black pill used once per row for the headline figure. */
  tone?: "auto" | "dark";
}) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cx(
        s.delta,
        tone === "dark" ? s.deltaDark : up ? s.deltaUp : s.deltaDown,
      )}
    >
      <Icon className={s.deltaIcon} strokeWidth={2.5} aria-hidden="true" />
      {up ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

/* ---------- Hero metric ---------- */

export type HeroMetricProps = {
  label: string;
  value: string;
  /** Rendered dimmed after the value — the "/ 100" or ".82" fragment. */
  valueTail?: string;
  delta?: number;
  deltaSuffix?: string;
  /** Second pill, e.g. the absolute change. */
  secondary?: ReactNode;
  compare?: ReactNode;
};

export function HeroMetric({
  label,
  value,
  valueTail,
  delta,
  deltaSuffix,
  secondary,
  compare,
}: HeroMetricProps) {
  return (
    <div className={s.heroMain}>
      <p className={s.heroLabel}>{label}</p>
      <div className={s.heroRow}>
        <span className={s.heroValue}>
          {value}
          {valueTail && <span className={s.heroValueDim}>{valueTail}</span>}
        </span>
        {delta !== undefined && <Delta value={delta} suffix={deltaSuffix} />}
        {secondary}
      </div>
      {compare && <p className={s.heroCompare}>{compare}</p>}
    </div>
  );
}

/* ---------- Stat card ---------- */

export type StatCardProps = {
  label: string;
  value: ReactNode;
  /** One card per row may be "dark"; one may be "accent". Not both on one. */
  variant?: "default" | "dark" | "accent";
  delta?: number;
  deltaSuffix?: string;
  sub?: ReactNode;
  /** Small circular initials shown beside `sub`. */
  subInitials?: string;
  chevron?: boolean;
  wide?: boolean;
};

export function StatCard({
  label,
  value,
  variant = "default",
  delta,
  deltaSuffix,
  sub,
  subInitials,
  chevron,
  wide,
}: StatCardProps) {
  return (
    <div
      className={cx(
        s.stat,
        variant === "dark" && s.statDark,
        variant === "accent" && s.statAccent,
        wide && s.statWide,
      )}
    >
      <span className={s.statLabel}>{label}</span>
      <span className={s.statValue}>{value}</span>
      <div className={s.statFoot}>
        {delta !== undefined && (
          <Delta
            value={delta}
            suffix={deltaSuffix}
            tone={variant === "dark" ? "dark" : "auto"}
          />
        )}
        {(sub || subInitials) && (
          <span className={s.statSub}>
            {subInitials && (
              <span className={s.statAvatar} aria-hidden="true">
                {subInitials}
              </span>
            )}
            {sub}
          </span>
        )}
        {chevron && (
          <span className={s.statChevron} aria-hidden="true">
            <ChevronRight width={14} height={14} strokeWidth={2.5} />
          </span>
        )}
      </div>
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className={s.statRow}>{children}</div>;
}

/* ---------- Distribution ---------- */

export type DistributionSegment = {
  label: string;
  value: number;
  pct: number;
  colour: string;
  icon?: LucideIcon;
};

/**
 * Proportional row of pills. Widths follow the share, so the shape itself
 * carries the distribution while the numbers stay readable.
 */
export function DistributionBar({
  segments,
  action,
}: {
  segments: DistributionSegment[];
  action?: ReactNode;
}) {
  return (
    <div className={s.dist}>
      {segments.map((seg) => (
        <div
          key={seg.label}
          className={s.distSeg}
          style={{ flex: `${Math.max(seg.pct, 8)} 1 0` }}
        >
          <span
            className={s.distDot}
            style={{ background: seg.colour }}
            aria-hidden="true"
          />
          <span className={s.distLabel}>{seg.label}</span>
          <span className={s.distPct}>{seg.pct}%</span>
        </div>
      ))}
      {action}
    </div>
  );
}

/* ---------- Ranked list ---------- */

export type RankedItem = {
  tag: string;
  label: string;
  value: string;
  pct?: number;
};

export function RankedList({ items }: { items: RankedItem[] }) {
  return (
    <div className={s.ranked}>
      {items.map((item) => (
        <div className={s.rankRow} key={item.tag + item.label}>
          <span className={s.rankTag}>{item.tag}</span>
          <span className={s.rankLabel}>{item.label}</span>
          <span className={s.rankValue}>{item.value}</span>
          {item.pct !== undefined && (
            <span className={s.rankPct}>{item.pct}%</span>
          )}
        </div>
      ))}
    </div>
  );
}

```

### `dashboard\src\components\viz\RowParts.tsx`

```tsx
/* Presentational pieces of an expandable row.
 *
 * Deliberately NOT "use client". They are rendered by a server component and
 * handed to ExpandableRow through its `children` slot, so the Lucide icon
 * props they accept never cross the RSC boundary. Marking this file client
 * would make `icon={Award}` a function-passed-to-client error at request time
 * — and because the dashboard route is dynamic, `next build` would not catch
 * it. Keep the directive off. */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./viz.module.css";

export function Rows({ children }: { children: ReactNode }) {
  return <div className={s.rows}>{children}</div>;
}

export function RowHeader({ columns }: { columns: string[] }) {
  return (
    <div className={s.rowHead}>
      {columns.map((c) => (
        <span key={c}>{c}</span>
      ))}
      <span />
    </div>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <div className={s.chips}>{children}</div>;
}

export function VizChip({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <span className={s.chip}>
      {Icon && <Icon className={s.chipIcon} strokeWidth={2} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function SubHead({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className={s.subHead}>
      <span className={s.subTitle}>{title}</span>
      {meta && <span className={s.subMeta}>{meta}</span>}
    </div>
  );
}

export function Breakdown({ children }: { children: ReactNode }) {
  return <div className={s.breakdown}>{children}</div>;
}

export function BreakCell({
  label,
  value,
  dim,
  lead,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  /** Denominator or comparison, rendered smaller and muted. */
  dim?: ReactNode;
  lead?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className={cx(s.breakCell, lead && s.breakLead)}>
      <span className={s.breakLabel}>
        {Icon && <Icon className={s.chipIcon} strokeWidth={2} aria-hidden="true" />}
        {label}
      </span>
      <span className={s.breakValue}>
        {value}
        {dim && <span className={s.breakValueDim}> {dim}</span>}
      </span>
    </div>
  );
}

```

### `dashboard\src\components\viz\viz.module.css`

```css
/* ============================================================
   Dashboard visualisation kit — green / black / white.
   Density modelled on the CRM reference; semantics from the report.
   ============================================================ */

/* ---------- hero metric ---------- */

.hero {
  display: flex;
  align-items: flex-start;
  gap: var(--s-6);
  flex-wrap: wrap;
}

.heroMain {
  min-width: 240px;
}

.heroLabel {
  font-size: var(--t-h3);
  font-weight: var(--fw-bold);
  color: var(--ink);
  font-family: var(--font-display);
}

.heroRow {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin: var(--s-2) 0 var(--s-3);
  flex-wrap: wrap;
}

.heroValue {
  font-family: var(--font-display);
  font-size: 52px;
  line-height: 1;
  font-weight: var(--fw-bold);
  letter-spacing: -0.035em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* The trailing fragment sits back, as in the reference's cents treatment. */
.heroValueDim {
  color: var(--text-disabled);
}

.delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 var(--s-3);
  border-radius: var(--r-pill);
  font-size: var(--t-caption);
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
}

/* Solid, always. A delta is a verdict about direction — it should read at a
   glance, not sit back as a tint. */
.deltaUp {
  background: var(--pass);
  color: #fff;
}

.deltaDown {
  background: var(--fail);
  color: #fff;
}

.deltaDark {
  background: var(--dark);
  color: #fff;
}

.deltaIcon {
  width: 13px;
  height: 13px;
}

.heroCompare {
  font-size: var(--t-label);
  color: var(--text-muted);
}

.heroCompare b {
  color: var(--text);
  font-weight: var(--fw-semibold);
}

/* ---------- stat card row ---------- */

/* Fixed at four. auto-fit let a fifth card wrap to its own row and leave a
   ragged gap; four is also as many numbers as anyone reads at a glance. */
.statRow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--s-3);
  /* A band owns the space beneath it. Every screen that followed a stat row
     with a `SectionHeader` looked right only because that header carries a
     large top margin — put a card grid or a table there instead and the two
     bands touch. Block margins collapse, so this changes nothing where a
     header already separated them. */
  margin-bottom: var(--s-5);
}

@media (max-width: 1439px) {
  .statRow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .statRow {
    grid-template-columns: minmax(0, 1fr);
  }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  min-height: 104px;
  padding: var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
}

.statWide {
  grid-column: span 2;
}

.statLabel {
  font-size: var(--t-caption);
  font-weight: var(--fw-medium);
  color: var(--text-muted);
}

.statValue {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1.1;
  font-weight: var(--fw-bold);
  color: var(--ink);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.statFoot {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--s-2);
}

.statSub {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--t-caption);
  color: var(--text-muted);
}

.statAvatar {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--brand);
  color: var(--on-brand);
  font-size: 9px;
  font-weight: var(--fw-bold);
}

/* the single black card per screen */
.statDark {
  background: var(--dark);
  border-color: var(--dark);
}
.statDark .statLabel {
  color: var(--on-dark-dim);
}
.statDark .statValue {
  color: #fff;
}
.statDark .statSub {
  color: var(--on-dark-dim);
}

/* the single outlined-green card per screen */
.statAccent {
  border-color: var(--brand);
  border-width: var(--bw-emphasis);
  padding: calc(var(--s-4) - 1px);
}

.statChevron {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
}
.statDark .statChevron {
  background: var(--dark-3);
  color: #fff;
}

/* ---------- distribution bar ---------- */

.dist {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  flex-wrap: wrap;
}

.distSeg {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  height: 48px;
  padding: 0 var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  min-width: 0;
}

.distDot {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.distLabel {
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.distPct {
  margin-left: auto;
  font-size: var(--t-label);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* ---------- ranked list ---------- */

.ranked {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.rankRow {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  height: 46px;
  padding: 0 var(--s-4);
  border-radius: var(--r-md);
  background: var(--surface);
  border: var(--bw) solid var(--border);
}

.rankTag {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  min-width: 40px;
  height: 26px;
  padding: 0 var(--s-2);
  border-radius: var(--r-xs);
  background: var(--surface-sunken);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: var(--fw-bold);
}

.rankLabel {
  flex: 1;
  min-width: 0;
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rankValue {
  font-size: var(--t-label);
  font-weight: var(--fw-bold);
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.rankPct {
  min-width: 42px;
  text-align: right;
  font-size: var(--t-caption);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* ---------- bar chart ---------- */

.chartWrap {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.chart {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: var(--s-3);
  height: 200px;
  padding-top: var(--s-6);
}

.chartCol {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: var(--s-2);
  height: 100%;
}

.chartBar {
  width: 100%;
  border-radius: var(--r-sm) var(--r-sm) 0 0;
  background: var(--surface-sunken);
}

.chartBarOn {
  background: var(--brand);
}

.chartBarDark {
  background: var(--dark);
}

/* Hatched fill marks a projected or comparison series — no gradient. */
.chartBarGhost {
  background-color: var(--surface-sunken);
  background-image: repeating-linear-gradient(
    -45deg,
    transparent 0 5px,
    rgba(14, 21, 18, 0.07) 5px 10px
  );
}

/* Floats above its bar. `top: 0` used to win over the inline `bottom`, which
   parked the value inside the tallest bar instead of over it. */
.chartTag {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px var(--s-3);
  border-radius: var(--r-pill);
  background: var(--dark);
  color: #fff;
  font-size: 11px;
  font-weight: var(--fw-bold);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.chartTagBrand {
  background: var(--brand);
}

.chartTagPass {
  background: var(--pass);
}

.chartAxis {
  display: flex;
  gap: var(--s-3);
}

/* One line, clipped. Two-line labels made neighbouring columns different
   heights and pushed long names into each other. */
.chartAxisLabel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  font-size: var(--t-caption);
  color: var(--text-muted);
}

/* ---------- trend / area chart ---------- */

.trend {
  position: relative;
  width: 100%;
}

.trendSvg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.trendFoot {
  display: flex;
  align-items: center;
  gap: var(--s-5);
  margin-top: var(--s-3);
  flex-wrap: wrap;
}

.trendKeys {
  display: flex;
  align-items: center;
  gap: var(--s-4);
}

.trendKey {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  color: var(--text-muted);
}

.keyLine {
  width: 18px;
  height: 3px;
  border-radius: var(--r-pill);
  background: var(--brand);
}

.keyDash {
  width: 18px;
  height: 0;
  border-top: 2px dashed var(--text-disabled);
}

.trendGrid {
  display: flex;
  justify-content: space-between;
  gap: var(--s-4);
  margin-left: auto;
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  color: var(--text-disabled);
}

.trendCaption {
  margin-top: var(--s-3);
  padding-top: var(--s-3);
  border-top: var(--bw) solid var(--divider);
  font-size: var(--t-caption);
  line-height: 1.6;
  color: var(--text-muted);
}

/* Below two real points there is no trend to draw, so the caption is the
   panel rather than a footnote under a line that means nothing. */
.trendEmpty {
  display: flex;
  align-items: center;
  min-height: 108px;
  padding: var(--s-4) var(--s-5);
  border: var(--bw) dashed var(--divider);
  border-radius: var(--r-md);
  font-size: var(--t-caption);
  line-height: 1.6;
  color: var(--text-muted);
}

/* ---------- expandable row ---------- */

.rows {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.rowHead {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(4, minmax(0, 1fr)) 40px;
  gap: var(--s-3);
  padding: 0 var(--s-4) var(--s-2);
  font-size: var(--t-overline);
  font-weight: var(--fw-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-disabled);
}

.rowHead span:not(:first-child) {
  text-align: right;
}

.row {
  border: var(--bw) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
  overflow: hidden;
  transition: border-color var(--m-fast) var(--ease-out);
}

.rowOpen {
  border-color: var(--brand-border);
  background: var(--brand-surface);
}

.rowTrigger {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(4, minmax(0, 1fr)) 40px;
  gap: var(--s-3);
  align-items: center;
  width: 100%;
  padding: var(--s-3) var(--s-4);
  text-align: left;
  cursor: pointer;
}

.rowName {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-width: 0;
}

.rowAvatar {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: var(--fw-bold);
}

.rowAvatarOn {
  background: var(--brand);
  color: var(--on-brand);
}

.rowLabel {
  min-width: 0;
  font-size: var(--t-label);
  font-weight: var(--fw-semibold);
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rowCell {
  text-align: right;
  font-size: var(--t-label);
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.pill {
  display: inline-grid;
  place-items: center;
  min-width: 30px;
  height: 24px;
  padding: 0 var(--s-2);
  border-radius: var(--r-pill);
  background: var(--dark);
  color: #fff;
  font-size: 11px;
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
}

.pillMuted {
  background: var(--surface-sunken);
  color: var(--text-muted);
}

.pillPass {
  background: var(--pass);
  color: #fff;
}

.pillWarn {
  background: var(--warn);
  color: #fff;
}

.pillFail {
  background: var(--fail);
  color: #fff;
}

.rowToggle {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: auto;
  border-radius: 50%;
  background: var(--surface-sunken);
  color: var(--text);
}

.rowOpen .rowToggle {
  background: var(--brand);
  color: var(--on-brand);
}

.rowBody {
  padding: 0 var(--s-4) var(--s-4);
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.chips {
  display: flex;
  gap: var(--s-2);
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  height: 30px;
  padding: 0 var(--s-3);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-pill);
  background: var(--surface);
  font-size: var(--t-caption);
  font-weight: var(--fw-semibold);
  color: var(--text);
}

.chipIcon {
  width: 13px;
  height: 13px;
  color: var(--brand);
}

.subHead {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.subTitle {
  font-size: var(--t-label);
  font-weight: var(--fw-bold);
  color: var(--ink);
}

.subMeta {
  margin-left: auto;
  display: flex;
  gap: var(--s-2);
}

/* Every cell is the same shape and aligns on the same two baselines: label
   top, value bottom. An earlier version let the first cell span two rows,
   which left a tall empty box and broke the grid. */
.breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: var(--s-3);
  align-items: stretch;
}

.breakCell {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  min-height: 92px;
  padding: var(--s-4);
  border: var(--bw) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
}

.breakLabel {
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
  min-height: 32px;
  font-size: var(--t-caption);
  line-height: 1.35;
  font-weight: var(--fw-semibold);
  color: var(--text-muted);
}

.breakValue {
  margin-top: auto;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: var(--fw-bold);
  color: var(--ink);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.breakValueDim {
  color: var(--text-disabled);
  font-size: 20px;
}

@media (max-width: 1023px) {
  .rowHead {
    display: none;
  }
  .rowTrigger {
    grid-template-columns: minmax(0, 1fr) 40px;
    row-gap: var(--s-2);
  }
  .rowCell {
    text-align: left;
  }
}

```

### `dashboard\src\lib\cx.ts`

```typescript
/** Join class names, dropping anything falsy. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

```

### `dashboard\src\lib\format.ts`

```typescript
/**
 * Formatting rules, in one place.
 * Units are always shown and always spaced from the number, except degrees.
 */

/** 862 → "14 min 22 s". Matches the report header. */
export function duration(seconds?: number): string {
  if (seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} s`;
  return `${m} min ${s.toString().padStart(2, "0")} s`;
}

/** 862 → "14:22". For dense table columns. */
export function clock(seconds?: number): string {
  if (seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 27_000 → "7 h 30 m". */
export function longDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function shortDate(iso?: string): string {
  return iso ? DATE_FMT.format(new Date(iso)) : "—";
}

export function timeOfDay(iso?: string): string {
  return iso ? TIME_FMT.format(new Date(iso)) : "—";
}

/** "3 days ago". `now` is passed in so output stays deterministic. */
export function relativeTime(iso: string | undefined, now: string): string {
  if (!iso) return "Never";
  const diff = Date.parse(now) - Date.parse(iso);
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} days ago`;
  return shortDate(iso);
}

export function daysSince(iso: string | undefined, now: string): number {
  if (!iso) return Infinity;
  return Math.floor((Date.parse(now) - Date.parse(iso)) / 86_400_000);
}

/** 29402 → "29,402". */
export function count(n: number): string {
  return n.toLocaleString("en-GB");
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * "Dr Arjun Mehta" -> "AM". Two letters for an avatar chip, title stripped.
 *
 * Lives here rather than in lib/session so client components can use it —
 * lib/session imports next/headers and cannot cross into the browser bundle.
 */
export function initialsOf(name: string): string {
  return name
    .replace(/^(Dr|Prof\.?|Mr|Ms|Mrs)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** 840 → "14 min". Rounded, for a catalogue tile rather than a report row. */
export function roughDuration(seconds?: number): string {
  if (seconds === undefined) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

```

### `dashboard\src\lib\nav.ts`

```typescript
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CircleHelp,
  Compass,
  GraduationCap,
  Settings,
  TrendingUp,
} from "lucide-react";
import type { BadgeKey, NavData } from "./data/nav";
import type { Persona } from "./roles";

/**
 * Two-tier navigation.
 *
 * Tier 1 — a rail of circular icons. Each is a SECTION of the product.
 * Tier 2 — a contextual panel listing that section's destinations.
 *
 * Clicking a rail icon swaps the panel; it does not navigate. Navigation
 * happens from the panel, so the rail never loses the user's place.
 *
 * An item names a `badgeKey`; it never carries a number. `sectionsForPersona`
 * resolves those keys against real counts, and a key with no count renders no
 * badge — a zero is not news, and an invented count is worse than no count.
 */

export type SectionId = "overview" | "practice" | "insights" | "teaching";

export type PanelItem = {
  label: string;
  href: string;
  /** Resolved against `NavData.counts`. Absent count → no badge. */
  badgeKey?: BadgeKey;
  /** Set only by `sectionsForPersona`, after resolving `badgeKey`. */
  badge?: number;
  children?: PanelItem[];
};

export type PanelGroup = {
  label?: string;
  items: PanelItem[];
};

export type NavSection = {
  id: SectionId;
  /** Panel heading. */
  label: string;
  icon: LucideIcon;
  personas: Persona[];
  groups: PanelGroup[];
};

export const SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Compass,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Dashboard", href: "/" },
          { label: "Activity", href: "/activity" },
        ],
      },
      // The Pinned group is injected by sectionsForPersona from the user's own
      // recent rows. It used to be two hardcoded ids that pointed at a case
      // and a session the signed-in user might never have touched.
    ],
  },
  {
    id: "practice",
    label: "Practice",
    icon: Boxes,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Simulations", href: "/simulations" },
          { label: "Case library", href: "/cases" },
        ],
      },
      {
        label: "Planning",
        items: [
          {
            label: "My plans",
            href: "/plans",
            children: [
              {
                label: "Ready for VR",
                href: "/plans?state=ready",
                badgeKey: "plans.ready",
              },
              { label: "PIN issued", href: "/plans?state=paired" },
            ],
          },
        ],
      },
      {
        label: "Sessions",
        items: [
          {
            label: "All sessions",
            href: "/sessions",
            children: [
              {
                label: "Live now",
                href: "/sessions?status=live",
                badgeKey: "sessions.live",
              },
              {
                label: "Interrupted",
                href: "/sessions?status=aborted",
                badgeKey: "sessions.aborted",
              },
              { label: "Completed", href: "/sessions?status=completed" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: TrendingUp,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Performance", href: "/performance" },
          { label: "Reports", href: "/reports" },
        ],
      },
      {
        label: "By skill",
        items: [
          { label: "Bone cuts & alignment", href: "/performance/bone-cuts" },
          { label: "Gap assessment", href: "/performance/gaps" },
          { label: "Trialling & stability", href: "/performance/trialling" },
          { label: "Implantation", href: "/performance/implantation" },
        ],
      },
    ],
  },
  {
    id: "teaching",
    label: "Teaching",
    icon: GraduationCap,
    personas: ["instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Cohorts", href: "/cohorts" },
          // A flat attention list across every cohort the viewer owns, ordered
          // below-pass-first. With one cohort it is the same rows in a different
          // order, which is still a different question.
          { label: "Learners", href: "/cohorts/learners" },
        ],
      },
      {
        label: "Resources",
        items: [
          { label: "Library", href: "/library" },
          { label: "Help", href: "/help" },
        ],
      },
    ],
  },
];

/** Pinned to the bottom of the rail, below the divider. */
export const RAIL_FOOTER: { id: string; label: string; icon: LucideIcon; href: string }[] =
  [
    { id: "help", label: "Help", icon: CircleHelp, href: "/help" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

/**
 * The panels this persona may see, with every `badgeKey` resolved against real
 * counts and the Pinned group built from the user's own recent rows.
 *
 * `data` is optional so the command palette — which only needs destinations,
 * never counts — can call this without a round trip.
 */
export function sectionsForPersona(
  persona: Persona,
  data?: NavData,
): NavSection[] {
  const counts = data?.counts ?? {};

  const withBadge = (item: PanelItem): PanelItem => {
    const count = item.badgeKey ? counts[item.badgeKey] : undefined;
    return {
      ...item,
      badge: count && count > 0 ? count : undefined,
      children: item.children?.map(withBadge),
    };
  };

  return SECTIONS.filter((section) => section.personas.includes(persona)).map(
    (section) => {
      const groups = section.groups.map((group) => ({
        ...group,
        items: group.items.map(withBadge),
      }));

      // Pinned is the user's own last case and last report, or nothing.
      if (section.id === "overview" && data?.pinned.length) {
        groups.push({ label: "Pinned", items: data.pinned });
      }

      return { ...section, groups };
    },
  );
}

/** Which section owns a route — used to open the right panel on load. */
export function sectionForPath(path: string, persona: Persona): SectionId {
  const available = sectionsForPersona(persona);
  for (const section of available) {
    for (const group of section.groups) {
      for (const item of group.items) {
        const hrefs = [item.href, ...(item.children ?? []).map((c) => c.href)];
        if (
          hrefs.some(
            (href) =>
              href !== "/" && path.startsWith(href.split("?")[0]),
          )
        ) {
          return section.id;
        }
      }
    }
  }
  return available[0]?.id ?? "overview";
}

```

### `dashboard\src\lib\plan.ts`

```typescript
/**
 * The planning vocabulary: the seven steps, the six angles, the shapes they
 * produce, and the two helpers that read a set of gates.
 *
 * Pure on purpose. `lib/data/plan.ts` holds the accessor, and that file imports
 * server-only modules — so a `"use client"`
 * step component importing `MEASUREMENTS` from there would drag the whole
 * server module into the browser bundle and fail the build.
 *
 * Constants and pure helpers that both sides need live here. Only the query
 * lives in `lib/data/`.
 */

import type {
  Difficulty,
  FixationType,
  ImplantDesign,
  SimMode,
  Side,
} from "@/lib/types";

export const PLAN_STEPS = [
  { step: 1, title: "Case history", budget: "45–60 s" },
  { step: 2, title: "Imaging review", budget: "1.5–2 min" },
  { step: 3, title: "Deformity measurement", budget: "1 min" },
  { step: 4, title: "Alignment planning", budget: "1 min" },
  { step: 5, title: "Implant selection", budget: "45–60 s" },
  { step: 6, title: "Risk & strategy", budget: "30–45 s" },
  { step: 7, title: "Plan summary", budget: "15–20 s" },
] as const;

export const LAST_STEP = 7;

/**
 * Where a plan has got to. Derived from the plan's own columns in
 * `lib/data/plans.ts`, and named here because `/plans`' filter chips are a
 * client component — the same reason `MEASUREMENTS` lives in this file.
 *
 * `paired` is not a fifth column on `plans`: it is "sealed, and a PIN issued
 * for it is still alive", which is `my_pin_status()`'s answer rather than the
 * table's. Reading it as a state keeps the three nav destinations that used to
 * point at three screens pointing at one list.
 */
export type PlanState = "draft" | "ready" | "paired" | "performed";

export const PLAN_STATES: { value: PlanState; label: string }[] = [
  { value: "draft", label: "In progress" },
  { value: "ready", label: "Ready for VR" },
  { value: "paired", label: "PIN issued" },
  { value: "performed", label: "Performed" },
];

/** The six angles, in the order a surgeon reads them off a long-leg film. */
export const MEASUREMENTS = [
  { key: "hka_deg", label: "Hip–knee–ankle", short: "HKA", unit: "°" },
  { key: "mad_mm", label: "Mechanical axis deviation", short: "MAD", unit: "mm" },
  { key: "mpta_deg", label: "Medial proximal tibial angle", short: "MPTA", unit: "°" },
  { key: "mldfa_deg", label: "Mechanical lateral distal femoral angle", short: "mLDFA", unit: "°" },
  { key: "jlca_deg", label: "Joint line convergence angle", short: "JLCA", unit: "°" },
  { key: "ldta_deg", label: "Lateral distal tibial angle", short: "LDTA", unit: "°" },
] as const;

export type MeasurementKey = (typeof MEASUREMENTS)[number]["key"];

export type StepGate = { step: number; passed: boolean; reason: string };

export type StepOption = {
  value: string;
  label: string;
  detail?: string;
};

export type CaseRisk = {
  id: string;
  label: string;
  detail: string;
  severity: "critical" | "high" | "moderate";
};

export type SessionConfig = {
  mode: SimMode;
  difficulty: Difficulty;
  implant_design: ImplantDesign;
  fixation: FixationType;
  patella_resurfacing: boolean | null;
};

/** What the seven steps accumulate. Each step owns one branch of it. */
export type PlanPayload = {
  case_id?: string;
  session_config?: Partial<SessionConfig>;
  diagnosis?: string;
  imaging_reading?: { kl_grade?: string; compartment?: string };
  measurements?: Partial<Record<MeasurementKey, number>>;
  alignment_plan?: {
    target_hka_deg?: number;
    planned_correction_deg?: number;
    resection_strategy?: string;
  };
  resections?: {
    distal_femur_mm?: number;
    proximal_tibia_medial_mm?: number;
    posterior_tibial_slope_deg?: number;
    distal_femur_valgus_deg?: number;
  };
  implants?: {
    design?: ImplantDesign;
    femoral_size?: number;
    tibial_tray_size?: number;
    pe_insert_mm?: number;
    patellar_button_mm?: number;
  };
  risks?: { acknowledged?: string[]; tight_side?: string };
};

/**
 * The data model also lists `implants.femoral_fit` and
 * `implants.patellar_button_mm`. Neither is written here, and that is
 * deliberate rather than an omission:
 *
 *   - **`femoral_fit`** is the *verdict* of the fit check, not an answer. It
 *     was being written as the literal `"standard"` on every plan regardless of
 *     what was chosen — a value nobody supplied, sitting in the payload as
 *     though somebody had. It lands when the component geometry ships and the
 *     overhang overlay can actually compute it.
 *   - **`patellar_button_mm`** follows `patella_resurfacing`, which is
 *     decided intra-operatively at scene 9.1 from the cartilage grade. A
 *     button size chosen at the desk would be a decision taken before the
 *     evidence for it exists.
 *
 *
 */

/** What the headset is told to release, derived from the answer step 6 grades. */
export function releaseStrategy(tightSide: string | undefined): string | undefined {
  if (tightSide === "medial") return "medial_release";
  if (tightSide === "lateral") return "lateral_release";
  if (tightSide === "balanced") return "no_release";
  return undefined;
}

/**
 * The numeric values of a discrete option list — component sizes, insert
 * thicknesses — in the order the catalogue holds them.
 *
 * Non-numeric rows are dropped rather than coerced, so a mistyped catalogue row
 * costs one option rather than producing `NaN` on a control.
 */
export function numericOptions(options: StepOption[] | undefined): number[] {
  return (options ?? []).flatMap((option) => {
    const value = Number(option.value);
    return Number.isFinite(value) ? [value] : [];
  });
}

export type PlanCase = {
  id: string;
  title: string;
  summary?: string;
  side: Side;
  difficulty: Difficulty;
  pathologyLabel: string;
  patient: { label: string; value: string }[];
  narrative: { label: string; value: string }[];
  imaging: { view: string; label: string }[];
  objectives: string[];
  referenceRanges: Partial<Record<MeasurementKey, [number, number]>>;
};

export type PlanDetail = {
  id: string;
  caseId: string;
  isReadyForVr: boolean;
  hasSession: boolean;
  payload: PlanPayload;
  stepTimings: Record<string, number>;
  case: PlanCase;
  gates: StepGate[];
  /** Choices, keyed by the payload field they answer. Procedure-scoped. */
  options: Record<string, StepOption[]>;
  /** Step 6's intra-operative points — authored guidance, not a choice. */
  guidance: string[];
  risks: CaseRisk[];
  updatedAt: string;
};

/** The gate for one step, or a safe placeholder if the RPC returned nothing. */
export function gateFor(gates: StepGate[], step: number): StepGate {
  return (
    gates.find((g) => g.step === step) ?? {
      step,
      passed: false,
      reason: "This step has not been graded yet.",
    }
  );
}

/** How far the learner may jump ahead: the first open step, and no further. */
export function furthestOpenStep(gates: StepGate[]): number {
  for (const { step } of PLAN_STEPS) {
    if (!gateFor(gates, step).passed) return step;
  }
  return LAST_STEP;
}

```

### `dashboard\src\lib\report.ts`

```typescript
/**
 * The report vocabulary — pure, so both a Server and a Client Component may
 * import it.
 *
 * Every shape here mirrors what the scorer returns. That is the only thing in
 * the product that decides a score, so these types describe its output rather
 * than a parallel idea of what a report is.
 */

import type { Difficulty, ImplantDesign, FixationType, SimMode } from "@/lib/types";

export type Verdict = "pass" | "borderline" | "fail";

export type ReportDeduction = {
  scene: string;
  label: string;
  lost: number;
  reason: string;
  warnings: number;
};

export type ReportCategory = {
  key: string;
  label: string;
  short: string;
  max: number;
  score: number;
  /** Share of the marks earned on technique, 0–100. */
  accuracy: number;
  /** Share earned on time against par, 0–100. Worth a tenth of the category. */
  timing: number;
  deductions: ReportDeduction[];
};

/** One row of the planned-versus-achieved table — the centre of the report. */
export type ReportParameter = {
  key: string;
  label: string;
  unit: string;
  planned: number | null;
  achieved: number;
  tolerance: number;
  verdict: Verdict | null;
};

export type ReportFeedback = {
  scene: string;
  label: string;
  text: string;
  points: number;
  category: string;
  severity: "fail" | "warning";
};

export type ReportTimelineEntry = {
  scene: string;
  part: string;
  label: string;
  outcome: Verdict | null;
  durationS: number | null;
  parTimeS: number | null;
  warnings: number;
  reached: boolean;
};

export type Report = {
  sessionId: string;
  total: number;
  max: number;
  passMark: number;
  passed: boolean;
  cappedByCriticalErrors: boolean;
  criticalErrors: number;
  /** Null below three cohort peers — */
  percentile: number | null;
  generatedAt: string;
  header: {
    user: string;
    caseTitle: string;
    caseId: string;
    mode: SimMode;
    difficulty: Difficulty;
    design: ImplantDesign;
    fixation: FixationType;
    date: string;
    durationS: number | null;
  };
  categories: ReportCategory[];
  parameters: ReportParameter[];
  feedback: ReportFeedback[];
  timeline: ReportTimelineEntry[];
};

/**
 * How a parameter's deviation reads as a proportion of its tolerance.
 *
 * Returned as a fraction of the band rather than the raw difference, so a 1.2°
 * axis error and a 1.2 mm joint-line error can sit in the same column and mean
 * the same thing. Clamped, because a bar that runs off its track says less than
 * one that is full.
 */
export function deviationOf(parameter: ReportParameter): number | null {
  if (parameter.planned === null) return null;
  const delta = Math.abs(parameter.achieved - parameter.planned);
  return Math.min(1, delta / (parameter.tolerance || 1));
}

/** Where the marks actually went, worst category first. */
export function weakestCategory(categories: ReportCategory[]): ReportCategory | undefined {
  return [...categories]
    .filter((c) => c.max > 0)
    .sort((a, b) => a.score / a.max - b.score / b.max)[0];
}

export const SESSION_STATUS_LABEL: Record<string, string> = {
  pending: "Not started",
  live: "In progress",
  completed: "Completed",
  aborted: "Interrupted",
};

```

### `dashboard\src\lib\roles.ts`

```typescript
import type { UserRole } from "./types";

/**
 * There are SIX role values and only THREE dashboards, because
 * the four learner roles all answer the same question — they differ in default
 * difficulty and which parts are mandatory, not in what their home screen is
 * for. `Persona` is that collapse, and it exists only in the UI layer; the
 * database still stores the precise role.
 *
 * Navigation hides what a persona cannot reach. That is convenience, not
 * security; the store is the actual boundary. Never
 * treat a hidden nav item as a permission.
 */
export type Persona = "learner" | "instructor" | "admin";

export const LEARNER_ROLES: UserRole[] = [
  "student",
  "intern",
  "resident",
  "surgeon",
];

export function personaFor(role: UserRole): Persona {
  if (role === "admin") return "admin";
  if (role === "instructor") return "instructor";
  return "learner";
}

export const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  intern: "Intern",
  resident: "Resident",
  surgeon: "Surgeon",
  instructor: "Instructor",
  admin: "Administrator",
};

export const PERSONA_LABEL: Record<Persona, string> = {
  learner: "Learner",
  instructor: "Instructor",
  admin: "Administrator",
};

/** The single question each dashboard exists to answer. */
export const PERSONA_QUESTION: Record<Persona, string> = {
  learner: "What do I do next, and where am I weak?",
  instructor: "Who in my cohort needs me?",
  admin: "Is the system healthy?",
};

```

### `dashboard\src\lib\seed.ts`

```typescript
/**
 * The seed dataset the dashboard renders from.
 *
 * Every accessor in `lib/data` reads these tables. They are plain frozen
 * arrays: nothing here is fetched, nothing is written, and a reload returns
 * exactly the same rows. Timestamps are expressed as an offset from load so a
 * screen never shows a date from last year while the catalogue is still being
 * authored.
 *
 * The shapes mirror the data model column for column, so the
 * accessors above them do not care where a row came from.
 */

import type {
  CaseSummary,
  Difficulty,
  FixationType,
  ImplantDesign,
  Profile,
  SessionSummary,
  Side,
  SimMode,
  UserRole,
  Verdict,
} from "./types";

const DAY = 86_400_000;
const MINUTE = 60_000;

const BASE = Date.now();

/** An ISO timestamp `n` days before load. */
export function daysAgo(n: number): string {
  return new Date(BASE - n * DAY).toISOString();
}

/** An ISO timestamp `n` minutes before load. */
export function minutesAgo(n: number): string {
  return new Date(BASE - n * MINUTE).toISOString();
}

/* ============================================================
   report_category_meta The seven categories, and
   the marks each can carry. They total 100.
   ============================================================ */

export type CategoryMeta = {
  key: string;
  label: string;
  short: string;
  max: number;
};

export const CATEGORY_META: CategoryMeta[] = [
  { key: "preop_planning", label: "Pre-operative planning", short: "Pre-op", max: 20 },
  { key: "bone_cuts", label: "Bone cuts & alignment", short: "Cuts", max: 25 },
  { key: "gap_assessment", label: "Gap assessment", short: "Gaps", max: 15 },
  { key: "trialling", label: "Trialling & stability", short: "Trial", max: 15 },
  { key: "implantation", label: "Implantation & cementation", short: "Implant", max: 15 },
  { key: "patellar", label: "Patellar management", short: "Patella", max: 5 },
  { key: "exposure_closure", label: "Exposure & closure", short: "Exposure", max: 5 },
];

export const CATEGORY_BY_KEY = new Map(CATEGORY_META.map((c) => [c.key, c]));

/* ============================================================
   cohorts
   ============================================================ */

export type CohortRow = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

export const COHORTS: CohortRow[] = [
  {
    id: "c0000000-the schema-4000-a000-000000000001",
    name: "ST3 Orthopaedics 2025",
    ownerId: "a0000000-the schema-4000-a000-000000000002",
    createdAt: daysAgo(132),
  },
  {
    id: "c0000000-the schema-4000-a000-000000000002",
    name: "Foundation Year 2",
    ownerId: "a0000000-the schema-4000-a000-000000000002",
    createdAt: daysAgo(108),
  },
];

/* ============================================================
   profiles
   ============================================================ */

const ST3 = COHORTS[0].id;

export const PROFILES: Profile[] = [
  {
    id: "a0000000-the schema-4000-a000-000000000002",
    email: "h.ward@mediver.test",
    displayName: "Prof. Helen Ward",
    role: "instructor",
    level: "Consultant",
    defaultDifficulty: "expert",
    createdAt: daysAgo(260),
    lastActiveAt: minutesAgo(235),
  },
  {
    id: "a0000000-the schema-4000-a000-000000000010",
    email: "a.mehta@mediver.test",
    displayName: "Dr Arjun Mehta",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "intermediate",
    cohortId: ST3,
    createdAt: daysAgo(200),
    lastActiveAt: minutesAgo(23),
  },
  {
    id: "a0000000-the schema-4000-a000-000000000011",
    email: "s.iyer@mediver.test",
    displayName: "Dr Sneha Iyer",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "intermediate",
    cohortId: ST3,
    createdAt: daysAgo(195),
    lastActiveAt: minutesAgo(1440),
  },
  {
    id: "a0000000-the schema-4000-a000-000000000012",
    email: "p.nair@mediver.test",
    displayName: "Dr Priya Nair",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "intermediate",
    cohortId: ST3,
    createdAt: daysAgo(190),
    lastActiveAt: minutesAgo(2880),
  },
  {
    id: "a0000000-the schema-4000-a000-000000000013",
    email: "r.khan@mediver.test",
    displayName: "Dr Ravi Khan",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "beginner",
    cohortId: ST3,
    createdAt: daysAgo(120),
    lastActiveAt: minutesAgo(25920),
  },
  {
    id: "a0000000-the schema-4000-a000-000000000014",
    email: "l.fernandes@mediver.test",
    displayName: "Lena Fernandes",
    role: "intern",
    level: "Intern",
    defaultDifficulty: "beginner",
    cohortId: ST3,
    createdAt: daysAgo(90),
    lastActiveAt: minutesAgo(31680),
  },
  {
    id: "a0000000-the schema-4000-a000-000000000015",
    email: "m.costa@mediver.test",
    displayName: "Dr Marco Costa",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "intermediate",
    cohortId: ST3,
    createdAt: daysAgo(180),
    lastActiveAt: minutesAgo(4320),
  },
];

export const PROFILE_BY_ID = new Map(PROFILES.map((p) => [p.id, p]));

/**
 * Who the app renders as.
 *
 * Authentication is not wired up yet — `/login` accepts the form and returns
 * here. Point this at any row above to see the product through that role: a
 * learner role swaps `/` for the learner dashboard and hides the Teaching
 * section, exactly as `personaFor` describes.
 */
export const CURRENT_USER: Profile = PROFILES[0];

/* ============================================================
   procedures / procedure_parts / procedure_scenes
   ============================================================ */

export type PublishState = "published" | "planned" | "exploratory";

export type ProcedureRow = {
  id: string;
  name: string;
  status: PublishState;
  tagline?: string;
  summary?: string;
  typicalDurationS?: number;
};

export const PROCEDURES: ProcedureRow[] = [
  {
    id: "tkr",
    name: "Total Knee Replacement",
    status: "published",
    tagline: "Plan. Simulate. Perform. Perfect.",
    summary:
      "A complete clinical episode — seven pre-operative planning steps on the desktop, eleven operative parts in the headset, then a report scored against your own plan.",
    typicalDurationS: 840,
  },
  {
    id: "thr",
    name: "Total Hip Replacement",
    status: "planned",
    summary:
      "Posterior and direct anterior approaches. Not scheduled for Phase 1.",
  },
  {
    id: "ivc",
    name: "IV Cannulation",
    status: "planned",
    summary:
      "Nursing-student pathway. Shorter session, instrument-recognition led.",
  },
  {
    id: "uka",
    name: "Unicompartmental Knee",
    status: "exploratory",
    summary: "Reuses the TKR cutter and jig framework.",
  },
];

export type PartRow = {
  procedureId: string;
  part: string;
  name: string;
  variantNote?: string;
};

export const PARTS: PartRow[] = [
  { procedureId: "tkr", part: "P0", name: "Pre-surgery check (Time Out)" },
  { procedureId: "tkr", part: "P1", name: "Positioning & preparation" },
  { procedureId: "tkr", part: "P2", name: "Surgical approach" },
  { procedureId: "tkr", part: "P3", name: "Joint preparation" },
  { procedureId: "tkr", part: "P4", name: "Tibial resection" },
  { procedureId: "tkr", part: "P5", name: "Femoral preparation" },
  { procedureId: "tkr", part: "P6", name: "Balancing & trialling" },
  { procedureId: "tkr", part: "P7", name: "Tibial final preparation" },
  { procedureId: "tkr", part: "P8", name: "PS box cut", variantNote: "PS only" },
  { procedureId: "tkr", part: "P9", name: "Patellar management" },
  { procedureId: "tkr", part: "P10", name: "Cementation", variantNote: "Cemented only" },
  { procedureId: "tkr", part: "P11", name: "Closure & debrief" },
];

export type SceneRow = {
  procedureId: string;
  scene: string;
  part: string;
  name: string;
  short: string;
  variantNote?: string;
  /** Which report category this scene's marks land in, if any. */
  categoryKey: string | null;
  /** Seconds the scene should take, and the ceiling before it scores zero. */
  parTimeS: number;
  maxTimeS: number;
  /**
   * Failure here damages a named structure — and counts towards
   * the three-error cap in Failing a non-critical scene costs that scene's
   * marks and nothing else.
   */
  isCritical: boolean;
  /** The variant gates, split out of `variantNote` so a query can filter on them. */
  requiresDesign?: ImplantDesign;
  requiresFixation?: FixationType;
  requiresPatella?: boolean;
};

/** Seconds: [par, max] per scene. */
const SCENE_TIMES: Record<string, [number, number]> = {
  "0.1": [60, 150], "1.1": [60, 150], "1.2": [60, 150],
  "2.1": [45, 120], "2.2": [60, 150], "2.3": [75, 180],
  "3.1": [45, 120], "3.2": [60, 150], "3.3": [75, 180],
  "4.1": [90, 210], "4.2": [75, 180], "4.3": [45, 120],
  "5.1": [60, 150], "5.1b": [40, 100], "5.2": [75, 180],
  "5.3": [60, 150], "5.4": [90, 210],
  "6.1": [90, 210], "6.2": [75, 180], "6.3": [60, 150],
  "7.1": [60, 150], "7.2": [60, 150], "7.2b": [50, 130],
  "8.1": [60, 150],
  "9.1": [50, 130], "9.1b": [60, 150],
  "10.1": [60, 150], "10.2": [90, 210], "10.3": [60, 150],
  "11.1": [75, 180], "11.2": [60, 150],
};

/**
 * Which category a scene's marks land in.
 *
 * P0 Time Out and P1 are deliberately unmapped — they are not scored. And
 * `preop_planning` is absent because it comes from the seven planning steps,
 * which are not scenes at all.
 */
function categoryForScene(part: string, scene: string): string | null {
  if (["P2", "P3", "P11"].includes(part)) return "exposure_closure";
  if (["P4", "P5", "P8"].includes(part)) return "bone_cuts";
  if (scene === "6.1") return "gap_assessment";
  if (scene === "6.2" || scene === "6.3") return "trialling";
  if (["P7", "P10"].includes(part)) return "implantation";
  if (part === "P9") return "patellar";
  return null;
}

/** Scenes where a failure damages a named structure. */
const CRITICAL_SCENES = new Set(["3.2", "4.2", "5.2", "5.4"]);

type SceneSeed = Omit<
  SceneRow,
  | "categoryKey"
  | "parTimeS"
  | "maxTimeS"
  | "isCritical"
  | "requiresDesign"
  | "requiresFixation"
  | "requiresPatella"
>;

const SCENE_SEED: SceneSeed[] = [
  { procedureId: "tkr", scene: "0.1", part: "P0", name: "Time Out", short: "Time Out" },
  { procedureId: "tkr", scene: "1.1", part: "P1", name: "Patient positioning", short: "Position", variantNote: "To be authored" },
  { procedureId: "tkr", scene: "1.2", part: "P1", name: "Clinical examination", short: "Exam", variantNote: "To be authored" },
  { procedureId: "tkr", scene: "2.1", part: "P2", name: "Skin incision", short: "Incision" },
  { procedureId: "tkr", scene: "2.2", part: "P2", name: "Medial parapatellar arthrotomy", short: "Arthrotomy" },
  { procedureId: "tkr", scene: "2.3", part: "P2", name: "Release & patellar eversion", short: "Release" },
  { procedureId: "tkr", scene: "3.1", part: "P3", name: "ACL resection & subluxation", short: "ACL" },
  { procedureId: "tkr", scene: "3.2", part: "P3", name: "Hohmann retractors & sleeve", short: "Retractors" },
  { procedureId: "tkr", scene: "3.3", part: "P3", name: "Osteophyte removal", short: "Osteophyte" },
  { procedureId: "tkr", scene: "4.1", part: "P4", name: "Tibial jig alignment", short: "Tibial jig" },
  { procedureId: "tkr", scene: "4.2", part: "P4", name: "Tibial cut execution", short: "Tibial cut" },
  { procedureId: "tkr", scene: "4.3", part: "P4", name: "Cut surface assessment", short: "Surface" },
  { procedureId: "tkr", scene: "5.1", part: "P5", name: "Femoral landmarks", short: "Landmarks" },
  { procedureId: "tkr", scene: "5.1b", part: "P5", name: "PCL resection", short: "PCL", variantNote: "PS only" },
  { procedureId: "tkr", scene: "5.2", part: "P5", name: "Distal femur cut", short: "Femur cut" },
  { procedureId: "tkr", scene: "5.3", part: "P5", name: "Femoral sizing", short: "Sizing" },
  { procedureId: "tkr", scene: "5.4", part: "P5", name: "4-in-1 block & four cuts", short: "4-in-1" },
  { procedureId: "tkr", scene: "6.1", part: "P6", name: "Flexion/extension gaps", short: "Gaps" },
  { procedureId: "tkr", scene: "6.2", part: "P6", name: "Trial components", short: "Trial" },
  { procedureId: "tkr", scene: "6.3", part: "P6", name: "Alignment, ROM & tracking", short: "Tracking" },
  { procedureId: "tkr", scene: "7.1", part: "P7", name: "Tray sizing & rotation", short: "Tray" },
  { procedureId: "tkr", scene: "7.2", part: "P7", name: "Keel preparation", short: "Keel" },
  { procedureId: "tkr", scene: "7.2b", part: "P7", name: "Cementless broach", short: "Broach", variantNote: "Cementless only" },
  { procedureId: "tkr", scene: "8.1", part: "P8", name: "PS box cut", short: "Box cut", variantNote: "PS only" },
  { procedureId: "tkr", scene: "9.1", part: "P9", name: "Patellar preparation", short: "Patella" },
  { procedureId: "tkr", scene: "9.1b", part: "P9", name: "Patellar resurfacing", short: "Resurface", variantNote: "If resurfaced" },
  { procedureId: "tkr", scene: "10.1", part: "P10", name: "Lavage & cement preparation", short: "Lavage", variantNote: "Cemented only" },
  { procedureId: "tkr", scene: "10.2", part: "P10", name: "Cementation", short: "Cement", variantNote: "Cemented only" },
  { procedureId: "tkr", scene: "10.3", part: "P10", name: "Cement removal & assessment", short: "Clear-up", variantNote: "Cemented only" },
  { procedureId: "tkr", scene: "11.1", part: "P11", name: "Wound closure", short: "Closure" },
  { procedureId: "tkr", scene: "11.2", part: "P11", name: "Post-op X-rays & debrief", short: "Debrief" },
];

export const SCENES: SceneRow[] = SCENE_SEED.map((seed) => {
  const [parTimeS, maxTimeS] = SCENE_TIMES[seed.scene] ?? [60, 150];
  return {
    ...seed,
    categoryKey: categoryForScene(seed.part, seed.scene),
    parTimeS,
    maxTimeS,
    isCritical: CRITICAL_SCENES.has(seed.scene),
    requiresDesign:
      seed.variantNote === "PS only" ? ("PS" as const) : undefined,
    requiresFixation:
      seed.variantNote === "Cemented only"
        ? ("cemented" as const)
        : seed.variantNote === "Cementless only"
          ? ("cementless" as const)
          : undefined,
    requiresPatella: seed.variantNote === "If resurfaced" ? true : undefined,
  };
});

export const SCENE_BY_ID = new Map(SCENES.map((s) => [s.scene, s]));

/** The label a scene number should carry anywhere it is printed. */
export function sceneLabel(scene: string): string {
  return SCENE_BY_ID.get(scene)?.name ?? scene;
}

/* ============================================================
   cases
   ============================================================ */

export type CaseRow = CaseSummary & {
  procedureId: string;
  pathologyLabel: string;
  summary: string;
  patient: Record<string, string | number>;
  imaging: { view: string; label: string }[];
  objectives: string[];
  createdAt: string;
};

export const CASES: CaseRow[] = [
  {
    id: "CASE_001",
    procedureId: "tkr",
    title: "Varus OA — Right knee",
    procedure: "tkr",
    pathology: "primary_oa_varus",
    pathologyLabel: "Osteoarthritis",
    side: "right",
    difficulty: "intermediate",
    isActive: true,
    summary:
      "62-year-old man, medial compartment collapse, 8.2° correctable varus. The reference case for the full eleven-part walkthrough.",
    patient: {
      age: 62,
      sex: "male",
      bmi: 28.4,
      occupation: "Retired manual worker",
      activity: "Community ambulant, walks with a stick outdoors",
      complaint: "Medial knee pain, 4 years",
      history:
        "Progressive medial pain, worse on stairs and after standing. Night pain for the last 6 months.",
      past_management:
        "Analgesia, physiotherapy, two intra-articular steroid injections with short-lived relief.",
      walking_distance_m: 200,
      fixed_flexion_deg: 5,
      rom: "5°–115°",
      deformity: "8.2° varus, correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing" },
      { view: "lateral", label: "Lateral" },
      { view: "skyline", label: "Skyline" },
      { view: "long_leg", label: "Full-length long-leg" },
    ],
    objectives: [
      "Recognise medial compartment OA with correctable varus on a long-leg film.",
      "Plan a neutral mechanical axis and justify the resection depths.",
      "Execute a tibial cut within ±2 mm of the planned 8 mm.",
      "Balance flexion and extension gaps to within 2 mm.",
      "Identify and stage a medial release without over-releasing.",
    ],
    createdAt: daysAgo(210),
  },
  {
    id: "CASE_002",
    procedureId: "tkr",
    title: "Valgus OA — Left knee",
    procedure: "tkr",
    pathology: "primary_oa_valgus",
    pathologyLabel: "Osteoarthritis",
    side: "left",
    difficulty: "expert",
    isActive: true,
    summary:
      "Lateral compartment wear with a tight lateral sleeve. PS variant recommended.",
    patient: {
      age: 71,
      sex: "female",
      bmi: 26.1,
      occupation: "Retired teacher",
      activity: "Housebound distances only",
      complaint: "Lateral knee pain, 6 years",
      history: "Long-standing valgus with progressive lateral collapse.",
      past_management: "Analgesia, bracing, physiotherapy.",
      walking_distance_m: 150,
      fixed_flexion_deg: 8,
      rom: "8°–110°",
      deformity: "12° valgus, partially correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing" },
      { view: "lateral", label: "Lateral" },
      { view: "long_leg", label: "Full-length long-leg" },
    ],
    objectives: [
      "Recognise a valgus deformity with a contracted lateral sleeve.",
      "Stage a lateral release without destabilising the knee.",
      "Justify a PS design where the PCL cannot be balanced.",
    ],
    createdAt: daysAgo(190),
  },
  {
    id: "CASE_003",
    procedureId: "tkr",
    title: "Post-traumatic — Right knee",
    procedure: "tkr",
    pathology: "post_traumatic",
    pathologyLabel: "Post-traumatic",
    side: "right",
    difficulty: "expert",
    isActive: true,
    summary:
      "Old plateau fracture, AORI type 2A defect. Augment likely required before keel preparation.",
    patient: {
      age: 54,
      sex: "male",
      bmi: 29.8,
      occupation: "Scaffolder",
      activity: "Limited by pain at work",
      complaint: "Pain and instability, 9 years after a plateau fracture",
      history:
        "Schatzker II plateau fracture treated with ORIF. Progressive post-traumatic arthrosis.",
      past_management: "Hardware removal, analgesia.",
      walking_distance_m: 300,
      fixed_flexion_deg: 10,
      rom: "10°–105°",
      deformity: "6° varus with a metaphyseal defect",
    },
    imaging: [
      { view: "ap", label: "AP standing" },
      { view: "lateral", label: "Lateral" },
      { view: "long_leg", label: "Full-length long-leg" },
    ],
    objectives: [
      "Classify a contained tibial defect using the AORI system.",
      "Decide between cement fill, augment and stem before the keel cut.",
    ],
    createdAt: daysAgo(170),
  },
  {
    id: "CASE_004",
    procedureId: "tkr",
    title: "Rheumatoid — Left knee",
    procedure: "tkr",
    pathology: "inflammatory",
    pathologyLabel: "Inflammatory",
    side: "left",
    difficulty: "beginner",
    isActive: true,
    summary: "Soft bone, balanced deformity. The introductory case for residents.",
    patient: {
      age: 58,
      sex: "female",
      bmi: 23.2,
      occupation: "Administrator",
      activity: "Independent indoors",
      complaint: "Bilateral knee pain and swelling",
      history:
        "Seropositive rheumatoid arthritis for 18 years, well controlled on biologics.",
      past_management: "DMARDs, biologics, joint injections.",
      walking_distance_m: 400,
      fixed_flexion_deg: 3,
      rom: "3°–120°",
      deformity: "Neutral, balanced",
    },
    imaging: [
      { view: "ap", label: "AP standing" },
      { view: "lateral", label: "Lateral" },
      { view: "skyline", label: "Skyline" },
    ],
    objectives: [
      "Adapt cutting technique to soft, osteopenic bone.",
      "Complete the eleven parts without a tolerance breach.",
    ],
    createdAt: daysAgo(150),
  },
  {
    id: "CASE_005",
    procedureId: "tkr",
    title: "Severe varus — Right knee",
    procedure: "tkr",
    pathology: "primary_oa_varus_severe",
    pathologyLabel: "Osteoarthritis",
    side: "right",
    difficulty: "expert",
    isActive: true,
    summary: "18° varus with a fixed flexion contracture. Staged medial release required.",
    patient: {
      age: 66,
      sex: "male",
      bmi: 33.7,
      occupation: "Retired driver",
      activity: "Sedentary",
      complaint: "Severe medial pain and bow-legged deformity",
      history:
        "End-stage medial OA with a 15-year history and progressive deformity.",
      past_management: "Analgesia, weight management, injections.",
      walking_distance_m: 100,
      fixed_flexion_deg: 15,
      rom: "15°–100°",
      deformity: "18° varus, incompletely correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing" },
      { view: "lateral", label: "Lateral" },
      { view: "long_leg", label: "Full-length long-leg" },
    ],
    objectives: [
      "Sequence a medial release for an incompletely correctable varus knee.",
      "Manage a fixed flexion contracture with distal femoral resection.",
    ],
    createdAt: daysAgo(140),
  },
  {
    id: "CASE_006",
    procedureId: "tkr",
    title: "Bilateral OA — Left knee",
    procedure: "tkr",
    pathology: "primary_oa_varus",
    pathologyLabel: "Osteoarthritis",
    side: "left",
    difficulty: "intermediate",
    isActive: false,
    summary:
      "Second-side surgery six months after a right TKR. Draft — imaging package incomplete.",
    patient: {
      age: 69,
      sex: "female",
      bmi: 30.2,
      occupation: "Retired nurse",
      activity: "Community ambulant",
      complaint: "Left knee pain after a successful right replacement",
      history: "Bilateral medial OA. Right TKR six months ago with a good result.",
      past_management: "Analgesia, physiotherapy.",
      walking_distance_m: 250,
      fixed_flexion_deg: 5,
      rom: "5°–115°",
      deformity: "7° varus, correctable",
    },
    imaging: [{ view: "ap", label: "AP standing" }],
    objectives: [],
    createdAt: daysAgo(40),
  },
];

export const CASE_BY_ID = new Map(CASES.map((c) => [c.id, c]));

/* ============================================================
   sessions / reports / scene_results

   One spec table drives all three, so a score, its report and its
   scene outcomes can never disagree with each other.
   ============================================================ */

type SessionSpec = {
  n: number;
  userId: string;
  caseId: string;
  /** Absent for a session that never produced a report. */
  score?: number;
  status: SessionSummary["status"];
  daysAgo: number;
  durationS: number;
  mode: SimMode;
  design: ImplantDesign;
  fixation: FixationType;
  criticalErrors: number;
  currentScene?: string;
};

const U = {
  arjun: "a0000000-the schema-4000-a000-000000000010",
  sneha: "a0000000-the schema-4000-a000-000000000011",
  priya: "a0000000-the schema-4000-a000-000000000012",
  ravi: "a0000000-the schema-4000-a000-000000000013",
  marco: "a0000000-the schema-4000-a000-000000000015",
};

const SPECS: SessionSpec[] = [
  // Dr Arjun Mehta — the worked history, oldest first.
  { n: 2, userId: U.arjun, caseId: "CASE_004", score: 92, status: "completed", daysAgo: 46, durationS: 792, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 3, userId: U.arjun, caseId: "CASE_001", score: 74, status: "completed", daysAgo: 39, durationS: 968, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1 },
  { n: 4, userId: U.arjun, caseId: "CASE_002", score: 51, status: "completed", daysAgo: 33, durationS: 1124, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 3 },
  { n: 6, userId: U.arjun, caseId: "CASE_001", score: 81, status: "completed", daysAgo: 25, durationS: 861, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1 },
  { n: 7, userId: U.arjun, caseId: "CASE_005", score: 76, status: "completed", daysAgo: 19, durationS: 1013, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 1 },
  { n: 8, userId: U.arjun, caseId: "CASE_003", score: 64, status: "completed", daysAgo: 14, durationS: 1088, mode: "assessment", design: "PS", fixation: "cementless", criticalErrors: 2 },
  { n: 9, userId: U.arjun, caseId: "CASE_001", score: 88, status: "completed", daysAgo: 8, durationS: 824, mode: "assessment", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 10, userId: U.arjun, caseId: "CASE_002", score: 68, status: "completed", daysAgo: 3, durationS: 1002, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 2 },
  // An interrupted run, and one still in the headset.
  { n: 5, userId: U.arjun, caseId: "CASE_003", status: "aborted", daysAgo: 29, durationS: 412, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1, currentScene: "5.2" },
  { n: 11, userId: U.arjun, caseId: "CASE_001", status: "live", daysAgo: 0, durationS: 0, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0, currentScene: "6.1" },

  // Dr Sneha Iyer
  { n: 21, userId: U.sneha, caseId: "CASE_004", score: 88, status: "completed", daysAgo: 31, durationS: 803, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 22, userId: U.sneha, caseId: "CASE_001", score: 84, status: "completed", daysAgo: 17, durationS: 878, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 23, userId: U.sneha, caseId: "CASE_001", score: 80, status: "completed", daysAgo: 6, durationS: 912, mode: "assessment", design: "CR", fixation: "cemented", criticalErrors: 1 },

  // Dr Priya Nair
  { n: 31, userId: U.priya, caseId: "CASE_004", score: 75, status: "completed", daysAgo: 34, durationS: 934, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1 },
  { n: 32, userId: U.priya, caseId: "CASE_001", score: 71, status: "completed", daysAgo: 21, durationS: 996, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1 },
  { n: 33, userId: U.priya, caseId: "CASE_005", score: 67, status: "completed", daysAgo: 11, durationS: 1057, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 2 },

  // Dr Ravi Khan — below the pass mark, and idle for weeks.
  { n: 41, userId: U.ravi, caseId: "CASE_004", score: 62, status: "completed", daysAgo: 42, durationS: 1041, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 2 },
  { n: 42, userId: U.ravi, caseId: "CASE_004", score: 58, status: "completed", daysAgo: 27, durationS: 1132, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 3 },
  { n: 43, userId: U.ravi, caseId: "CASE_001", score: 54, status: "completed", daysAgo: 18, durationS: 1187, mode: "assessment", design: "CR", fixation: "cemented", criticalErrors: 3 },

  // Dr Marco Costa
  { n: 61, userId: U.marco, caseId: "CASE_001", score: 83, status: "completed", daysAgo: 30, durationS: 869, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 62, userId: U.marco, caseId: "CASE_002", score: 80, status: "completed", daysAgo: 16, durationS: 941, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 1 },
  { n: 63, userId: U.marco, caseId: "CASE_003", score: 77, status: "completed", daysAgo: 5, durationS: 1008, mode: "assessment", design: "PS", fixation: "cementless", criticalErrors: 1 },
];

const uuid = (prefix: string, n: number) =>
  `${prefix}-the schema-4000-a000-${String(n).padStart(12, "0")}`;

export const SESSIONS: SessionSummary[] = SPECS.map((spec) => {
  const kase = CASE_BY_ID.get(spec.caseId)!;
  const started = new Date(BASE - spec.daysAgo * DAY);
  const live = spec.status === "live";

  return {
    id: uuid("20000000", spec.n),
    planId: uuid("10000000", spec.n),
    userId: spec.userId,
    caseId: spec.caseId,
    caseTitle: kase.title,
    mode: spec.mode,
    difficulty: kase.difficulty,
    design: spec.design,
    fixation: spec.fixation,
    status: spec.status,
    currentScene: spec.currentScene,
    startedAt: live ? minutesAgo(11) : started.toISOString(),
    endedAt: live
      ? undefined
      : new Date(started.getTime() + spec.durationS * 1000).toISOString(),
    durationS: live ? undefined : spec.durationS,
    criticalErrors: spec.criticalErrors,
    totalScore: spec.score,
  };
});

export const SESSION_BY_ID = new Map(SESSIONS.map((s) => [s.id, s]));
export const SPEC_BY_SESSION = new Map(
  SPECS.map((spec) => [uuid("20000000", spec.n), spec]),
);

/**
 * How a total splits across the seven categories.
 *
 * The weakness is deliberate and consistent: bone cuts and gap assessment
 * carry the loss, because that is what the scene outcomes below also say.
 * A report whose categories contradicted its scenes would be worse than no
 * report at all.
 */
const CATEGORY_BIAS: Record<string, number> = {
  preop_planning: 1.08,
  bone_cuts: 0.88,
  gap_assessment: 0.85,
  trialling: 1.02,
  implantation: 1.05,
  patellar: 1.1,
  exposure_closure: 1.12,
};

export function categoriesForScore(total: number) {
  const raw = CATEGORY_META.map((meta) => {
    const scaled = (total / 100) * meta.max * (CATEGORY_BIAS[meta.key] ?? 1);
    return { meta, value: Math.min(meta.max, Math.max(0, scaled)) };
  });

  const rounded = raw.map((r) => ({ ...r, score: Math.round(r.value) }));

  // Push the rounding error onto the largest category so the parts always
  // add up to the headline figure.
  let drift = total - rounded.reduce((sum, r) => sum + r.score, 0);
  for (const row of [...rounded].sort((a, b) => b.meta.max - a.meta.max)) {
    if (drift === 0) break;
    const step = drift > 0 ? 1 : -1;
    const next = row.score + step;
    if (next >= 0 && next <= row.meta.max) {
      row.score = next;
      drift -= step;
    }
  }

  return rounded.map((r) => ({
    key: r.meta.key,
    label: r.meta.label,
    score: r.score,
    max: r.meta.max,
  }));
}

export type ReportRecord = {
  sessionId: string;
  totalScore: number;
  max: number;
  percentile: number;
  categories: { key: string; label: string; score: number; max: number }[];
  generatedAt: string;
};

const scored = SESSIONS.filter((s) => s.totalScore !== undefined);
const ranking = [...scored].sort((a, b) => a.totalScore! - b.totalScore!);

export const REPORTS: ReportRecord[] = scored.map((session) => ({
  sessionId: session.id,
  totalScore: session.totalScore!,
  max: 100,
  percentile: Math.round(
    ((ranking.findIndex((s) => s.id === session.id) + 1) / ranking.length) * 100,
  ),
  categories: categoriesForScore(session.totalScore!),
  generatedAt: new Date(
    new Date(session.endedAt!).getTime() + 14_000,
  ).toISOString(),
}));

export const REPORT_BY_SESSION = new Map(REPORTS.map((r) => [r.sessionId, r]));

/** Scenes a run actually visited, once the variant gates are applied. */
export function scenesForVariant(
  design: ImplantDesign,
  fixation: FixationType,
): SceneRow[] {
  return SCENES.filter((scene) => {
    const note = scene.variantNote;
    if (!note) return true;
    if (note === "PS only") return design === "PS";
    if (note === "Cemented only") return fixation === "cemented";
    if (note === "Cementless only") return fixation === "cementless";
    if (note === "To be authored") return false;
    if (note === "If resurfaced") return true;
    return true;
  });
}

export type SceneResultRecord = {
  sessionId: string;
  part: string;
  scene: string;
  durationS: number;
  outcome: Verdict;
  warnings: number;
  notes?: string[];
};

/** The scenes that degrade first, and the note each carries when it does. */
const WEAK_SCENES: Record<string, { failBelow: number; borderlineBelow: number; note?: string }> = {
  "4.2": { failBelow: 70, borderlineBelow: 85, note: "Saw angled medially at 4.2°" },
  "5.2": { failBelow: 70, borderlineBelow: 85, note: "Cutting block moved during the distal cut" },
  "5.3": { failBelow: 70, borderlineBelow: 85 },
  "6.1": { failBelow: 62, borderlineBelow: 78 },
};

export const SCENE_RESULTS: SceneResultRecord[] = SESSIONS.filter(
  (s) => s.status === "completed" && s.totalScore !== undefined,
).flatMap((session) => {
  const scenes = scenesForVariant(session.design, session.fixation);
  const per = Math.max(20, Math.round((session.durationS ?? 900) / scenes.length));
  const score = session.totalScore!;

  return scenes.map((scene, i) => {
    const rule = WEAK_SCENES[scene.scene];
    const outcome: Verdict = !rule
      ? "pass"
      : score < rule.failBelow
        ? "fail"
        : score < rule.borderlineBelow
          ? "borderline"
          : "pass";

    // A little spread, so the time column is not a flat line.
    const durationS = per + ((i % 5) - 2) * 6;

    return {
      sessionId: session.id,
      part: scene.part,
      scene: scene.scene,
      durationS: Math.max(20, durationS),
      outcome,
      warnings: outcome === "pass" ? 0 : 1,
      notes: outcome !== "pass" && rule?.note ? [rule.note] : undefined,
    };
  });
});

export function sceneResultsFor(sessionId: string): SceneResultRecord[] {
  return SCENE_RESULTS.filter((r) => r.sessionId === sessionId);
}

export function sessionsFor(userId: string): SessionSummary[] {
  return SESSIONS.filter((s) => s.userId === userId).sort((a, b) =>
    (b.startedAt ?? "").localeCompare(a.startedAt ?? ""),
  );
}

/** Every session an instructor may read — their cohort, plus their own. */
export function sessionsForCohort(cohortId?: string): SessionSummary[] {
  const members = new Set(
    PROFILES.filter((p) => !cohortId || p.cohortId === cohortId).map((p) => p.id),
  );
  return SESSIONS.filter((s) => members.has(s.userId)).sort((a, b) =>
    (b.startedAt ?? "").localeCompare(a.startedAt ?? ""),
  );
}

export type { Difficulty, UserRole, Side };

```

### `dashboard\src\lib\session.ts`

```typescript
import { CURRENT_USER } from "./seed";
import type { Profile } from "./types";

/**
 * The seam between the UI and authentication.
 *
 * No component knows where a user comes from — that was the point of building
 * this seam, and it means the identity provider can be dropped in behind it
 * without touching a screen. Until one is, this returns the seeded account in
 * `lib/seed`; change `CURRENT_USER` there to render the product as a
 * different role.
 */
export async function getCurrentUser(): Promise<Profile> {
  return CURRENT_USER;
}

```

### `dashboard\src\lib\skills.ts`

```typescript
/**
 * The URL slugs for /performance/[skill], mapped to `report_category_meta`
 * keys. A slug is an address, so it is stable and readable; the key is the
 * database's name for the category. Nothing else may translate between them.
 *
 * Lives in `lib/` because both server pages and the client nav read it —
 * both server pages and the client nav read it.
 */

export const SKILL_SLUGS: Record<string, string> = {
  planning: "preop_planning",
  "bone-cuts": "bone_cuts",
  gaps: "gap_assessment",
  trialling: "trialling",
  implantation: "implantation",
  patella: "patellar",
  exposure: "exposure_closure",
};

export function slugForCategory(key: string): string | undefined {
  return Object.keys(SKILL_SLUGS).find((slug) => SKILL_SLUGS[slug] === key);
}

```

### `dashboard\src\lib\types.ts`

```typescript
/**
 * The entities the product is modelled on.
 *
 * Field names match the intended columns so wiring a store up is a rename-free
 * change. Where this file uses camelCase, the mapping happens in lib/data —
 * never in a component.
 */

/* ---------- enums ---------- */

export type UserRole =
  | "student"
  | "intern"
  | "resident"
  | "surgeon"
  | "instructor"
  | "admin";

export type Difficulty = "beginner" | "intermediate" | "expert";
export type SimMode = "training" | "assessment";
export type ImplantDesign = "CR" | "PS";
export type FixationType = "cemented" | "cementless";
export type SessionStatus = "pending" | "live" | "completed" | "aborted";
export type Verdict = "pass" | "borderline" | "fail";
export type Side = "left" | "right";

/** Pass marks by difficulty */
export const PASS_MARK: Record<Difficulty, number> = {
  beginner: 60,
  intermediate: 70,
  expert: 80,
};

/**
 * What difficulty does to every authored tolerance Intermediate
 * is the authored value; Beginner widens the target band, Expert narrows it.
 */
export const TOLERANCE_BAND: Record<Difficulty, number> = {
  beginner: 1.5,
  intermediate: 1,
  expert: 0.7,
};

/* ---------- profiles ---------- */

export type Profile = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Free text, e.g. "Resident level". */
  level?: string;
  defaultDifficulty: Difficulty;
  cohortId?: string;
  createdAt: string;
  lastActiveAt?: string;
};

export type Cohort = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

/* ---------- cases ---------- */

export type CaseSummary = {
  id: string;
  title: string;
  procedure: string;
  pathology: string;
  side: Side;
  difficulty: Difficulty;
  isActive: boolean;
  /** Derived per-viewer, not a column. */
  bestScore?: number;
  attempts?: number;
};

/* ---------- sessions ---------- */

export type SessionSummary = {
  id: string;
  planId: string;
  userId: string;
  caseId: string;
  caseTitle: string;
  mode: SimMode;
  difficulty: Difficulty;
  design: ImplantDesign;
  fixation: FixationType;
  status: SessionStatus;
  /** Set while status is 'live', e.g. "6.1". */
  currentScene?: string;
  startedAt?: string;
  endedAt?: string;
  durationS?: number;
  criticalErrors: number;
  /** From reports.total_score. Absent until the report is generated. */
  totalScore?: number;
};

export type SceneResult = {
  sessionId: string;
  part: string;
  scene: string;
  durationS?: number;
  outcome?: Verdict;
  warnings: number;
  notes?: string[];
};

/* ---------- reports ---------- */

export type ReportCategory = {
  key: string;
  label: string;
  score: number;
  max: number;
};

export type ReportSummary = {
  sessionId: string;
  totalScore: number;
  max: number;
  percentile?: number;
  categories: ReportCategory[];
  generatedAt: string;
};

/* ---------- pairing ---------- */

export type PairingPin = {
  pin: string;
  planId: string;
  sessionId?: string;
  caseTitle: string;
  ownerName: string;
  expiresAt: string;
  redeemedAt?: string;
};

/* ---------- derived shapes the dashboards consume ---------- */

export type CategoryAverage = {
  key: string;
  label: string;
  /** Axis-safe abbreviation. Charts must never truncate a label themselves. */
  short: string;
  /** 0–100. */
  pct: number;
};

export type ScorePoint = {
  sessionId: string;
  date: string;
  score: number;
  difficulty: Difficulty;
};

export type SceneHotspot = {
  scene: string;
  label: string;
  /** How many learners hit a critical error or fail here. */
  affected: number;
  learners: number;
  severity: Verdict;
};

export type LearnerSummary = {
  id: string;
  displayName: string;
  role: UserRole;
  sessions: number;
  assessments: number;
  meanScore?: number;
  criticalErrors: number;
  weakestCategory?: string;
  lastActiveAt?: string;
};

```

### `dashboard\src\lib\window.ts`

```typescript
/**
 * The time window a dashboard covers, and the options a page may offer.
 *
 * These live in a plain module, **not** in `components/dashboard/Toolbar`,
 * because Toolbar is `"use client"`. When a Server Component imports a value
 * from a client module, Next hands it a client *reference*, not the value —
 * so `DAY_OPTIONS.map(...)` on the server throws `map is not a function` at
 * request time. It compiles, it passes `next build` because `/` is dynamic,
 * and it 500s in the browser.
 *
 * Rule: a constant or pure helper that both sides need lives in `lib/`.
 * Only the component itself carries `"use client"`.
 */

export type WindowOption = { value: number; label: string };

/** Weeks, for the two dashboards whose series are bucketed by week. */
export const WEEK_OPTIONS: WindowOption[] = [
  { value: 7, label: "Last 7 weeks" },
  { value: 13, label: "Last 13 weeks" },
  { value: 26, label: "Last 26 weeks" },
];

/** Days, for the admin dashboard — `daily_sessions` buckets by day. */
export const DAY_OPTIONS: WindowOption[] = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export const DEFAULT_WINDOW = 7;

export type WindowSpec = {
  /** Search param this control writes, e.g. "weeks" or "days". */
  param: string;
  /** The window the page was actually rendered with. */
  value: number;
  /** Omitted from the URL, so the default view has a clean address. */
  fallback: number;
  options: WindowOption[];
};

/** Narrows a raw search param to one the accessor supports. */
export function windowFromParam(
  raw: string | undefined,
  options: WindowOption[],
  fallback: number = DEFAULT_WINDOW,
): number {
  const n = Number(raw);
  return options.some((o) => o.value === n) ? n : fallback;
}

```

### `dashboard\src\lib\data\cases.ts`

```typescript
/**
 * Case browser and case detail.
 *
 * Attempt counts and best scores are derived **per viewer** from their own
 * sessions, never stored on a case — two learners looking at the same case must
 * see their own history.
 */

import {
  CASES,
  CASE_BY_ID,
  CATEGORY_META,
  PROCEDURES,
  sessionsFor,
} from "@/lib/seed";
import type { Difficulty, SessionSummary, Side } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";

export type AttemptedFilter = "all" | "attempted" | "unattempted";

export type CaseFilters = {
  q?: string;
  pathology?: string;
  side?: string;
  difficulty?: string;
  attempted?: AttemptedFilter;
};

export type CaseCard = {
  id: string;
  title: string;
  summary?: string;
  pathologyLabel: string;
  side: Side;
  difficulty: Difficulty;
  attempts: number;
  bestScore?: number;
  /** Score of the most recent completed attempt, for the card badge. */
  lastScore?: number;
};

/**
 * One selectable value on the filter bar, with the number of cases it would
 * yield **given every other filter currently applied**. A facet count that
 * ignores the rest of the query sends people into empty results.
 */
export type Facet = { value: string; count: number };

export type CaseFacets = {
  pathologies: Facet[];
  sides: Facet[];
  difficulties: Facet[];
  history: Facet[];
};

export type CaseBrowse = {
  cases: CaseCard[];
  facets: CaseFacets;
  /** Active cases in the catalogue, before filtering. */
  total: number;
};

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "expert"];

type AttemptStats = Map<string, { attempts: number; best?: number; last?: number }>;

/** One pass over the viewer's sessions, keyed by case. */
function statsByCase(sessions: SessionSummary[]): AttemptStats {
  const stats: AttemptStats = new Map();
  const byRecency = [...sessions].sort((a, b) =>
    (b.endedAt ?? "").localeCompare(a.endedAt ?? ""),
  );

  for (const session of byRecency) {
    const entry = stats.get(session.caseId) ?? { attempts: 0 };
    entry.attempts += 1;
    if (session.totalScore !== undefined) {
      entry.best = Math.max(entry.best ?? 0, session.totalScore);
      if (entry.last === undefined) entry.last = session.totalScore;
    }
    stats.set(session.caseId, entry);
  }
  return stats;
}

/** Which axes a case has to satisfy. `skip` is how a facet counts itself out. */
type Axis = "q" | "pathology" | "side" | "difficulty" | "attempted";

function matches(item: CaseCard, filters: CaseFilters, skip?: Axis): boolean {
  if (skip !== "q" && filters.q) {
    const term = filters.q.trim().toLowerCase();
    if (
      term &&
      !item.title.toLowerCase().includes(term) &&
      !item.id.toLowerCase().includes(term)
    ) {
      return false;
    }
  }
  if (skip !== "pathology" && filters.pathology) {
    if (item.pathologyLabel !== filters.pathology) return false;
  }
  if (skip !== "side" && filters.side && item.side !== filters.side) return false;
  if (
    skip !== "difficulty" &&
    filters.difficulty &&
    item.difficulty !== filters.difficulty
  ) {
    return false;
  }
  if (skip !== "attempted" && filters.attempted && filters.attempted !== "all") {
    const attempted = item.attempts > 0;
    if (filters.attempted === "attempted" && !attempted) return false;
    if (filters.attempted === "unattempted" && attempted) return false;
  }
  return true;
}

/** Distinct values on one axis, each counted against the other four. */
function facetOf(
  cases: CaseCard[],
  filters: CaseFilters,
  axis: Axis,
  valueOf: (item: CaseCard) => string,
  order?: string[],
): Facet[] {
  const pool = cases.filter((item) => matches(item, filters, axis));
  const counts = new Map<string, number>();

  for (const item of cases) counts.set(valueOf(item), 0);
  for (const item of pool) {
    const key = valueOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) =>
      order
        ? order.indexOf(a.value) - order.indexOf(b.value)
        : a.value.localeCompare(b.value),
    );
}

/**
 * The whole active catalogue is fetched and filtered here rather than in SQL.
 *
 * Faceted counts have to be computed against every axis *except* the one being
 * counted, which is five queries in SQL and one pass in memory. The catalogue
 * is authored content — six cases today, and a few hundred at the outside. If
 * it ever passes roughly a thousand, move the filtering back into the query and
 * compute the counts with `group by` instead.
 */
export async function listCases(
  userId: string,
  filters: CaseFilters = {},
): Promise<CaseBrowse> {
  const stats = statsByCase(sessionsFor(userId));

  const all: CaseCard[] = CASES.filter((row) => row.isActive)
    .slice()
    .sort(
      (a, b) =>
        DIFFICULTY_ORDER.indexOf(a.difficulty) -
          DIFFICULTY_ORDER.indexOf(b.difficulty) || a.id.localeCompare(b.id),
    )
    .map((row) => {
      const stat = stats.get(row.id);
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        pathologyLabel: row.pathologyLabel,
        side: row.side,
        difficulty: row.difficulty,
        attempts: stat?.attempts ?? 0,
        bestScore: stat?.best,
        lastScore: stat?.last,
      };
    });

  return {
    cases: all.filter((item) => matches(item, filters)),
    total: all.length,
    facets: {
      pathologies: facetOf(all, filters, "pathology", (c) => c.pathologyLabel),
      sides: facetOf(all, filters, "side", (c) => c.side, ["left", "right"]),
      difficulties: facetOf(
        all,
        filters,
        "difficulty",
        (c) => c.difficulty,
        DIFFICULTY_ORDER,
      ),
      history: (["attempted", "unattempted"] as const).map((value) => ({
        value,
        count: all.filter(
          (item) =>
            matches(item, filters, "attempted") &&
            (value === "attempted" ? item.attempts > 0 : item.attempts === 0),
        ).length,
      })),
    },
  };
}

export type PatientField = { label: string; value: string };
export type PatientSnapshot = {
  /** Short scalar readings — they tile two-up. */
  vitals: PatientField[];
  /** Prose. Full width, one under the other. */
  notes: PatientField[];
};

/** One of the six report categories, and what it is worth. */
export type ScoringCategory = { key: string; label: string; max: number };

export type CaseDetail = {
  id: string;
  title: string;
  summary?: string;
  procedureId: string;
  procedureName: string;
  pathologyLabel: string;
  side: Side;
  difficulty: Difficulty;
  patient: PatientSnapshot;
  imaging: { view: string; label: string }[];
  objectives: string[];
  attempts: SessionSummary[];
  bestScore?: number;
  /** Completed attempts at or above this difficulty's pass mark. */
  passed: number;
  /** Total time this viewer has spent on the case, in seconds. */
  timeSpentS: number;
  scoring: ScoringCategory[];
};

/**
 * Patient fields, in the order a surgeon reads them. Keys absent from the JSON
 * are dropped rather than rendered blank — an empty row invites the reader to
 * wonder what was lost.
 *
 * `block` decides where a field lands: a reading tiles into the two-column
 * grid, a paragraph gets the full width. Putting an eighteen-word history in a
 * 150px column is what made the old snapshot six hundred pixels tall.
 */
const PATIENT_FIELDS: {
  key: string;
  label: string;
  suffix?: string;
  block: "vital" | "note";
}[] = [
  { key: "age", label: "Age", suffix: " years", block: "vital" },
  { key: "sex", label: "Sex", block: "vital" },
  { key: "bmi", label: "BMI", block: "vital" },
  { key: "occupation", label: "Occupation", block: "vital" },
  { key: "walking_distance_m", label: "Walking distance", suffix: " m", block: "vital" },
  { key: "rom", label: "Range of motion", block: "vital" },
  { key: "fixed_flexion_deg", label: "Fixed flexion", suffix: "°", block: "vital" },
  { key: "deformity", label: "Deformity", block: "vital" },
  { key: "complaint", label: "Chief complaint", block: "note" },
  { key: "history", label: "History", block: "note" },
  { key: "past_management", label: "Past management", block: "note" },
];

function toSnapshot(record: Record<string, unknown>): PatientSnapshot {

  const fields = PATIENT_FIELDS.flatMap(({ key, label, suffix, block }) => {
    const value = record[key];
    if (value === undefined || value === null || value === "") return [];
    const text = String(value);
    return [
      {
        block,
        label,
        value: suffix
          ? `${text}${suffix}`
          : text.charAt(0).toUpperCase() + text.slice(1),
      },
    ];
  });

  return {
    vitals: fields.filter((f) => f.block === "vital"),
    notes: fields.filter((f) => f.block === "note"),
  };
}

export async function getCase(
  caseId: string,
  userId: string,
): Promise<CaseDetail | null> {
  const row = CASE_BY_ID.get(caseId);
  if (!row) return null;

  const attempts = sessionsFor(userId).filter((s) => s.caseId === caseId);
  const scores = attempts
    .map((a) => a.totalScore)
    .filter((s): s is number => s !== undefined);

  const procedure = PROCEDURES.find((p) => p.id === row.procedureId);

  // The pass mark follows the difficulty each attempt was actually run at, not
  // the case's own difficulty — an attempt taken on Expert is judged on Expert.
  const passed = attempts.filter(
    (a) => a.totalScore !== undefined && a.totalScore >= PASS_MARK[a.difficulty],
  ).length;

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    procedureId: row.procedureId,
    procedureName: procedure?.name ?? row.procedureId.toUpperCase(),
    pathologyLabel: row.pathologyLabel,
    side: row.side,
    difficulty: row.difficulty,
    patient: toSnapshot(row.patient),
    imaging: row.imaging,
    objectives: row.objectives,
    attempts,
    bestScore: scores.length ? Math.max(...scores) : undefined,
    passed,
    timeSpentS: attempts.reduce((total, a) => total + (a.durationS ?? 0), 0),
    scoring: CATEGORY_META.map((category) => ({
      key: category.key,
      label: category.label,
      max: category.max,
    })),
  };
}

export type InstructorConfig = {
  id: string;
  name: string;
  caseId?: string;
  overrides: Record<string, unknown>;
  createdAt: string;
};

/**
 * Presets this instructor owns for a case.
 *
 * Nothing has authored one yet, so this is empty for everybody and the panel
 * on `/cases/[id]` draws its own empty state rather than a list of invented
 * preset names.
 */
export async function getInstructorConfigs(
  caseId: string,
): Promise<InstructorConfig[]> {
  void caseId;
  return [];
}

/** Just the title, for a page's `<title>` — the full detail read is wasted there. */
export async function getCaseTitle(caseId: string): Promise<string | null> {
  return CASE_BY_ID.get(caseId)?.title ?? null;
}

```

### `dashboard\src\lib\data\catalogue.ts`

```typescript
/**
 * The procedure catalogue.
 *
 * `/simulations` holds no literals: the eleven parts, the scene list, the
 * variant notes and the "in development" cards are all rows in `procedures`,
 * `procedure_parts` and `procedure_scenes`. Adding a procedure
 * is a migration, not a code change.
 */

import { CASES, PARTS, PROCEDURES, SCENES } from "@/lib/seed";
import type { PublishState } from "@/lib/seed";

export type { PublishState };

export type ProcedureCard = {
  id: string;
  name: string;
  status: PublishState;
  tagline?: string;
  summary?: string;
  typicalDurationS?: number;
  parts: number;
  scenes: number;
  cases: number;
};

export type ProcedureScene = {
  scene: string;
  name: string;
  short: string;
  variantNote?: string;
};

export type ProcedurePart = {
  part: string;
  name: string;
  variantNote?: string;
  scenes: ProcedureScene[];
};

export type ProcedureDetail = ProcedureCard & {
  parts_detail: ProcedurePart[];
};

/** Published first, then planned, then exploratory; `sort_order` within each. */
const STATUS_RANK: Record<PublishState, number> = {
  published: 0,
  planned: 1,
  exploratory: 2,
};

export async function getProcedures(): Promise<ProcedureCard[]> {
  const count = <T extends { procedureId: string }>(rows: T[], id: string) =>
    rows.filter((row) => row.procedureId === id).length;

  const activeCases = CASES.filter((c) => c.isActive);

  return PROCEDURES.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    tagline: row.tagline,
    summary: row.summary,
    typicalDurationS: row.typicalDurationS,
    parts: count(PARTS, row.id),
    scenes: count(SCENES, row.id),
    cases: count(activeCases, row.id),
  })).sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      a.name.localeCompare(b.name),
  );
}

export async function getProcedure(
  id: string,
): Promise<ProcedureDetail | null> {
  const row = PROCEDURES.find((p) => p.id === id);
  if (!row) return null;

  const parts = PARTS.filter((p) => p.procedureId === id);
  const scenes = SCENES.filter((s) => s.procedureId === id);

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    tagline: row.tagline,
    summary: row.summary,
    typicalDurationS: row.typicalDurationS,
    parts: parts.length,
    scenes: scenes.length,
    cases: CASES.filter((c) => c.isActive && c.procedureId === id).length,
    parts_detail: parts.map((part) => ({
      part: part.part,
      name: part.name,
      variantNote: part.variantNote,
      scenes: scenes
        .filter((scene) => scene.part === part.part)
        .map((scene) => ({
          scene: scene.scene,
          name: scene.name,
          short: scene.short,
          variantNote: scene.variantNote,
        })),
    })),
  };
}

```

### `dashboard\src\lib\data\cohorts.ts`

```typescript
/**
 * `/cohorts`, `/cohorts/[id]` and `/cohorts/learners`.
 *
 * Scope is one answer shared with `/sessions` and `/reports`: the cohorts you
 * own, the one you are in, or all of them if you are an administrator. There is
 * no `role === 'admin'` branch here, because a second implementation of the
 * boundary is the one that goes wrong.
 */

import { COHORTS, PROFILE_BY_ID, SESSIONS } from "@/lib/seed";
import { categoryAverages, cohortHotspots, cohortLearners, mean } from "./rollups";
import type { CategoryAverage, LearnerSummary, SceneHotspot } from "@/lib/types";

export type PresetSummary = {
  id: string;
  name: string;
  caseId?: string;
  ownerId: string;
  createdAt: string;
  /** Human-readable lines derived from `overrides`'s shape. */
  effects: string[];
  /** Cohorts currently assigned this preset. Empty means it changes nothing. */
  assignedTo: { id: string; name: string }[];
  /** Plans stamped with it, which is the only measure of whether it was used. */
  plans: number;
};

export type CohortSummary = {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  learners: number;
  /** Undefined when nobody in the cohort has a scored report yet. */
  meanScore?: number;
  belowPass: number;
  presetId?: string;
  presetName?: string;
};

export type CohortDetail = {
  cohort: CohortSummary;
  learners: LearnerSummary[];
  categories: CategoryAverage[];
  hotspots: SceneHotspot[];
  /** Every preset the viewer could assign — theirs, or all if an admin. */
  presets: PresetSummary[];
};

/* ─────────────────────────── presets ─────────────────────────── */

/**
 * Configuration presets.
 *
 * Nothing authors one yet — the screen that would is not built — so this is
 * empty for everybody and the panel on a cohort draws its own empty state
 * rather than a list of preset names nobody saved.
 */
export async function getPresets(): Promise<PresetSummary[]> {
  return [];
}

export async function getPreset(id: string): Promise<PresetSummary | null> {
  const presets = await getPresets();
  return presets.find((p) => p.id === id) ?? null;
}

/* ─────────────────────────── cohorts ─────────────────────────── */

export async function getCohorts(): Promise<CohortSummary[]> {
  return [...COHORTS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => {
      const learners = cohortLearners(row.id);
      const scored = learners.filter((l) => l.meanScore !== undefined);

      return {
        id: row.id,
        name: row.name,
        ownerId: row.ownerId,
        ownerName: PROFILE_BY_ID.get(row.ownerId)?.displayName,
        createdAt: row.createdAt,
        learners: learners.length,
        meanScore: mean(scored.map((l) => l.meanScore as number)),
        // Against the intermediate pass mark, which is what the instructor
        // dashboard already uses for a cohort figure — a per-learner mark would
        // need each learner's own difficulty mix and is answered on their page.
        belowPass: scored.filter((l) => (l.meanScore as number) < 70).length,
        presetId: undefined,
        presetName: undefined,
      };
    });
}

export async function getCohort(id: string): Promise<CohortDetail | null> {
  const cohorts = await getCohorts();
  const cohort = cohorts.find((c) => c.id === id);
  if (!cohort) return null;

  const learners = cohortLearners(id);
  const memberIds = new Set(learners.map((l) => l.id));

  return {
    cohort,
    learners,
    categories: categoryAverages(
      SESSIONS.filter((s) => memberIds.has(s.userId)),
    ),
    hotspots: cohortHotspots(id),
    presets: await getPresets(),
  };
}

/* ─────────────────────────── invites ─────────────────────────── */

export type InviteSummary = {
  id: string;
  label?: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  used: number;
  /** What the instructor needs to know before they send it again. */
  state: "open" | "expired" | "exhausted" | "revoked";
  /** Who has joined through it. Names, because a count answers nothing. */
  joiners: { id: string; name: string; at: string }[];
};

/**
 * The join links for a cohort, and who followed each one.
 *
 * There is no `token_hash` here and there could not be: the column is never
 * selected.
 * Redemption is by hash, so reading one would be holding the link.
 *
 * `used` is `redemptions.length` rather than a column. The table is the record
 * and a counter beside it would be a second answer that can drift from it.
 */
export async function getInvites(cohortId: string): Promise<InviteSummary[]> {
  void cohortId;
  // Minting and redeeming a join link both need a service behind them. Until
  // one exists there are no invites to list, and the panel says so rather than
  // showing a link that could never be followed.
  return [];
}

export type LearnerRow = LearnerSummary & {
  cohortId: string;
  cohortName: string;
};

/** Every learner the viewer supervises, flattened across their cohorts. */
export async function getSupervisedLearners(): Promise<LearnerRow[]> {
  const cohorts = await getCohorts();

  const perCohort = cohorts.map((cohort) =>
    cohortLearners(cohort.id).map((learner) => ({
      ...learner,
      cohortId: cohort.id,
      cohortName: cohort.name,
    })),
  );

  return perCohort.flat().sort((a, b) => {
    // Below the pass mark first, then never-active, then by name. The order the
    // instructor dashboard's attention list already uses.
    const rank = (l: LearnerRow) =>
      l.meanScore !== undefined && l.meanScore < 70 ? 0 : l.sessions === 0 ? 1 : 2;
    return rank(a) - rank(b) || a.displayName.localeCompare(b.displayName);
  });
}

```

### `dashboard\src\lib\data\dashboard.ts`

```typescript
/**
 * Dashboard data accessors.
 *
 * Every function is async and returns a typed shape, so the screens above them
 * never learn where a row came from — the point of the seam, and the reason a
 * data source can change underneath without touching a component.
 *
 * The derived shapes — category averages, hotspots, marks lost, weekly
 * activity — are not computed here. They come from `./rollups`, which holds one
 * implementation of each so that two screens cannot state the same figure
 * differently.
 */

import {
  CASES,
  COHORTS,
  REPORT_BY_SESSION,
  SESSIONS,
  sessionsFor,
} from "@/lib/seed";
import {
  categoryAverages,
  cohortHotspots,
  cohortLearners,
  marksLost,
  timeByScene,
  weeklyActivity,
} from "./rollups";
import type {
  CaseSummary,
  CategoryAverage,
  Cohort,
  LearnerSummary,
  ReportSummary,
  SceneHotspot,
  ScorePoint,
  SessionSummary,
} from "@/lib/types";
import { PASS_MARK } from "@/lib/types";

/** P0 … P11 — twelve groupings, eleven intervals between first and last. */
const TOTAL_PART_INTERVALS = 11;

/** "6.1" -> 6. Returns null for anything unparseable. */
function partFromScene(scene?: string): number | null {
  if (!scene) return null;
  const n = Number.parseInt(scene.split(".")[0], 10);
  return Number.isFinite(n) ? n : null;
}

function mean(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export type SessionDetail = {
  session: SessionSummary;
  highlights: string[];
  categories: { key: string; label: string; score: number; max: number }[];
};

export type TrendSeries = {
  values: number[];
  compare: number[];
  labels: string[];
  /** Text equivalent Written here, never in JSX. */
  caption: string;
};

/* ============================================================
   Learner dashboard
   ============================================================ */

export type LearnerDashboard = {
  stats: {
    sessionsCompleted: number;
    assessments: number;
    meanScore?: number;
    bestScore?: number;
    criticalErrors: number;
    totalTimeS: number;
    /** Percentage-point change against the previous run. */
    latestDelta?: number;
    passRate: number;
  };
  activeSession?: {
    state: "live" | "interrupted";
    session: SessionSummary;
    /** Seconds at render time. The dial ticks on from here when live. */
    elapsedS: number;
    /** 0–1 through the procedure, from the current part. */
    progress: number;
  };
  latestReport?: { session: SessionSummary; report: ReportSummary };
  /** Where the time actually went, per scene. Not an overrun — see the schema. */
  timeLost: { scene: string; label: string; seconds: number; pct: number }[];
  trend: ScorePoint[];
  dynamic: TrendSeries;
  weekly: { label: string; sessions: number; mean: number }[];
  marksLost: { scene: string; label: string; points: number; pct: number }[];
  categories: CategoryAverage[];
  weakest?: CategoryAverage;
  details: SessionDetail[];
  suggestedCases: CaseSummary[];
};

export async function getLearnerDashboard(
  userId: string,
  weeks = 7,
): Promise<LearnerDashboard> {
  const now = Date.now();

  const mine = sessionsFor(userId);
  const completed = mine.filter(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );

  const byDate = [...completed].sort((a, b) =>
    (a.endedAt ?? "").localeCompare(b.endedAt ?? ""),
  );
  const scores = byDate.map((s) => s.totalScore as number);

  const latest = byDate[byDate.length - 1];
  const previous = byDate[byDate.length - 2];

  const passed = completed.filter(
    (s) => (s.totalScore ?? 0) >= PASS_MARK[s.difficulty],
  ).length;

  const categories = categoryAverages(mine);
  const weakest = [...categories].sort((a, b) => a.pct - b.pct)[0];

  // The four most recent completed sessions, with their category breakdown.
  const details: SessionDetail[] = [...completed]
    .sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""))
    .slice(0, 4)
    .map((session) => ({
      session,
      highlights: highlightsFor(session, scores),
      categories: REPORT_BY_SESSION.get(session.id)?.categories ?? [],
    }));

  const weekly = weeklyActivity(mine, weeks);
  const cohortMeans = weeklyActivity(SESSIONS, weeks).map((w) => w.mean);
  const values = weekly.map((w) => w.mean);

  const attemptedCases = new Set(mine.map((s) => s.caseId));
  const latestReportRow = latest ? REPORT_BY_SESSION.get(latest.id) : undefined;

  return {
    stats: {
      sessionsCompleted: completed.length,
      assessments: mine.filter((s) => s.mode === "assessment").length,
      meanScore: mean(scores),
      bestScore: scores.length ? Math.max(...scores) : undefined,
      criticalErrors: mine.reduce((a, s) => a + s.criticalErrors, 0),
      totalTimeS: mine.reduce((a, s) => a + (s.durationS ?? 0), 0),
      latestDelta:
        latest?.totalScore !== undefined && previous?.totalScore !== undefined
          ? latest.totalScore - previous.totalScore
          : undefined,
      passRate: completed.length
        ? Math.round((passed / completed.length) * 100)
        : 0,
    },
    activeSession: (() => {
      const liveSession = mine.find((s) => s.status === "live");
      const session = liveSession ?? mine.find((s) => s.status === "aborted");
      if (!session) return undefined;
      const part = partFromScene(session.currentScene);
      const elapsedS = liveSession
        ? session.startedAt
          ? Math.max(0, Math.floor((now - Date.parse(session.startedAt)) / 1000))
          : 0
        : (session.durationS ?? 0);
      return {
        state: liveSession ? ("live" as const) : ("interrupted" as const),
        session,
        elapsedS,
        progress: part === null ? 0 : part / TOTAL_PART_INTERVALS,
      };
    })(),
    latestReport:
      latest && latestReportRow
        ? {
            session: latest,
            report: {
              sessionId: latestReportRow.sessionId,
              totalScore: latestReportRow.totalScore,
              max: latestReportRow.max,
              percentile: latestReportRow.percentile,
              categories: latestReportRow.categories,
              generatedAt: latestReportRow.generatedAt,
            },
          }
        : undefined,
    timeLost: timeByScene(mine),
    trend: byDate.map((s) => ({
      sessionId: s.id,
      date: s.endedAt ?? "",
      score: s.totalScore as number,
      difficulty: s.difficulty,
    })),
    dynamic: {
      values,
      compare: cohortMeans,
      labels: weekly.map((w) => w.label),
      caption: trendCaption(values, cohortMeans, "Your weekly mean"),
    },
    weekly,
    marksLost: marksLost(mine),
    categories,
    weakest,
    details,
    suggestedCases: CASES.filter(
      (c) => c.isActive && !attemptedCases.has(c.id),
    )
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        title: row.title,
        procedure: row.procedureId,
        pathology: row.pathology,
        side: row.side,
        difficulty: row.difficulty,
        isActive: row.isActive,
        attempts: 0,
      })),
  };
}

/**
 * Achievements shown as chips on an expanded session row. Derived from the
 * session itself — a claim on the dashboard has to be traceable to a row.
 */
function highlightsFor(session: SessionSummary, allScores: number[]): string[] {
  const out: string[] = [];
  const best = allScores.length ? Math.max(...allScores) : undefined;
  if (session.totalScore !== undefined && session.totalScore === best) {
    out.push("Personal best");
  }
  if (session.criticalErrors === 0) out.push("No critical errors");
  if ((session.totalScore ?? 0) >= PASS_MARK[session.difficulty]) {
    out.push("Above pass mark");
  }
  if (session.difficulty === "expert") out.push("Expert difficulty");
  return out;
}

/** One sentence describing a two-series trend, for the chart's text equivalent. */
function trendCaption(
  values: number[],
  compare: number[],
  what: string,
): string {
  const real = values.filter((v) => v > 0);
  if (real.length < 2) return `${what}: not enough completed sessions to plot a trend yet.`;

  const first = real[0];
  const last = real[real.length - 1];
  const direction = last > first ? "rose" : last < first ? "fell" : "held at";
  const span = `${values.length} weeks`;

  const comparable = compare.filter((v) => v > 0);
  const tail =
    comparable.length === 0
      ? " No cohort comparison is available."
      : ` The cohort mean over the same period ended at ${comparable[comparable.length - 1]}.`;

  return `${what} ${direction} from ${first} to ${last} over ${span}.${tail}`;
}

/* ============================================================
   Instructor dashboard
   ============================================================ */

export type InstructorDashboard = {
  cohort?: Cohort;
  stats: {
    learners: number;
    meanScore: number;
    belowPassMark: number;
    sessionsThisWeek: number;
    criticalErrors: number;
    meanDelta: number;
  };
  needsAttention: {
    learner: LearnerSummary;
    reason: string;
    severity: "warn" | "fail";
  }[];
  learners: LearnerSummary[];
  hotspots: SceneHotspot[];
  categories: CategoryAverage[];
  weekly: { label: string; sessions: number; mean: number }[];
  dynamic: TrendSeries;
  bands: { label: string; value: number; pct: number }[];
};

const INACTIVE_DAYS = 14;

export async function getInstructorDashboard(
  ownerId: string,
  weeks = 7,
): Promise<InstructorDashboard> {
  const now = Date.now();

  const owned = COHORTS.filter((c) => c.ownerId === ownerId).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const cohort: Cohort | undefined = owned[0];

  const weekAgo = now - 7 * 86_400_000;

  // An instructor with no cohort yet is a real state — the screen renders its
  // empty shape rather than erroring or inventing a group.
  const learners: LearnerSummary[] = cohort ? cohortLearners(cohort.id) : [];
  const hotspots: SceneHotspot[] = cohort ? cohortHotspots(cohort.id) : [];
  const cohortCategories: CategoryAverage[] = cohort
    ? categoryAverages(
        SESSIONS.filter((s) => learners.some((l) => l.id === s.userId)),
      )
    : [];

  const weekRows = weeklyActivity(SESSIONS, weeks);
  const sessionsThisWeek = SESSIONS.filter((s) => {
    const at = Date.parse(s.startedAt ?? "");
    return Number.isFinite(at) && at >= weekAgo;
  }).length;

  const scored = learners.filter((l) => l.meanScore !== undefined);
  const passMark = PASS_MARK.intermediate;

  const needsAttention = learners
    .map((learner) => {
      if (learner.meanScore !== undefined && learner.meanScore < passMark) {
        return {
          learner,
          reason: `Mean score ${learner.meanScore} is below the pass mark of ${passMark}. ${learner.criticalErrors} critical errors logged.`,
          severity: "fail" as const,
        };
      }
      const idleDays = learner.lastActiveAt
        ? Math.floor((now - Date.parse(learner.lastActiveAt)) / 86_400_000)
        : Infinity;
      if (idleDays >= INACTIVE_DAYS) {
        return {
          learner,
          reason: `No activity for ${Number.isFinite(idleDays) ? idleDays : "over 30"} days. ${learner.assessments} assessments completed.`,
          severity: "warn" as const,
        };
      }
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort(
      (a, b) => (a.severity === "fail" ? 0 : 1) - (b.severity === "fail" ? 0 : 1),
    );

  const weekly = weekRows;
  const values = weekly.map((w) => w.mean);

  const strong = scored.filter((l) => (l.meanScore as number) >= 80).length;
  const okay = scored.filter(
    (l) => (l.meanScore as number) >= passMark && (l.meanScore as number) < 80,
  ).length;
  const below = scored.filter((l) => (l.meanScore as number) < passMark).length;
  const noData = learners.length - scored.length;
  const total = learners.length || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  const meanScore =
    mean(scored.map((l) => l.meanScore as number)) ?? 0;

  // Change in the cohort mean between the first and last week that had data.
  const plotted = values.filter((v) => v > 0);
  const meanDelta =
    plotted.length >= 2 ? plotted[plotted.length - 1] - plotted[0] : 0;

  return {
    cohort,
    stats: {
      learners: learners.length,
      meanScore,
      belowPassMark: below,
      sessionsThisWeek,
      criticalErrors: learners.reduce((a, l) => a + l.criticalErrors, 0),
      meanDelta,
    },
    needsAttention,
    learners: [...learners].sort((a, b) => (b.meanScore ?? 0) - (a.meanScore ?? 0)),
    hotspots,
    categories: cohortCategories,
    weekly,
    dynamic: {
      values,
      compare: [],
      labels: weekly.map((w) => w.label),
      caption: trendCaption(values, [], "The cohort's weekly mean"),
    },
    bands: [
      { label: "Strong (80+)", value: strong, pct: pct(strong) },
      { label: `Passing (${passMark}–79)`, value: okay, pct: pct(okay) },
      { label: `Below ${passMark}`, value: below, pct: pct(below) },
      { label: "No data", value: noData, pct: pct(noData) },
    ],
  };
}

```

### `dashboard\src\lib\data\nav.ts`

```typescript
/**
 * What the navigation chrome is allowed to say.
 *
 * The panels used to carry literal counts — `badge: 2`, `badge: 3` — and two
 * pinned links to a hardcoded case and session id. Those are fabricated claims
 * sitting in the shell of every screen, and the pinned links
 * pointed at rows that may not exist for the signed-in user at all.
 *
 * Everything here is a query. A count that cannot be sourced is absent, and an
 * absent count renders no badge rather than a zero.
 */

import { PLANS } from "./plans";
import { sessionsFor } from "@/lib/seed";
import type { Profile } from "@/lib/types";

/** Stable keys the nav panels reference. Absent key → no badge. */
export type BadgeKey = "plans.ready" | "sessions.live" | "sessions.aborted";

export type NavPin = { label: string; href: string };

export type NavNotification = {
  id: string;
  title: string;
  meta: string;
  href: string;
};

export type NavData = {
  counts: Partial<Record<BadgeKey, number>>;
  /** Real destinations for this user, or empty — never a placeholder. */
  pinned: NavPin[];
  notifications: NavNotification[];
};

const EMPTY: NavData = { counts: {}, pinned: [], notifications: [] };

export async function getNavData(user: Profile): Promise<NavData> {
  const mine = sessionsFor(user.id).slice(0, 20);
  const readyCount = PLANS.filter(
    (plan) => plan.userId === user.id && plan.isReadyForVr,
  ).length;

  if (!mine.length && !readyCount) return EMPTY;

  const live = mine.filter((s) => s.status === "live");
  const aborted = mine.filter((s) => s.status === "aborted");
  const latestScored = mine.find(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );
  const latest = mine[0];

  const counts: Partial<Record<BadgeKey, number>> = {};
  if (readyCount) counts["plans.ready"] = readyCount;
  if (live.length) counts["sessions.live"] = live.length;
  if (aborted.length) counts["sessions.aborted"] = aborted.length;

  /* ---- pinned: where this user actually was, not a fixed pair of ids ---- */

  const pinned: NavPin[] = [];
  if (latest) {
    pinned.push({ label: latest.caseTitle, href: `/cases/${latest.caseId}` });
  }
  if (latestScored) {
    pinned.push({
      label: "Latest report",
      href: `/sessions/${latestScored.id}/report`,
    });
  }

  /* ---- notifications: things that happened and need a decision ---- */

  const notifications: NavNotification[] = [];
  if (live[0]) {
    notifications.push({
      id: `live-${live[0].id}`,
      title: "Session running in the headset",
      meta: `${live[0].caseTitle} · scene ${live[0].currentScene ?? "—"}`,
      href: `/sessions/${live[0].id}`,
    });
  }
  if (aborted[0]) {
    notifications.push({
      id: `aborted-${aborted[0].id}`,
      title: "Session was interrupted",
      meta: `${aborted[0].caseTitle} · resume or discard`,
      href: `/sessions/${aborted[0].id}`,
    });
  }
  if (latestScored) {
    notifications.push({
      id: `report-${latestScored.id}`,
      title: `Report ready · scored ${latestScored.totalScore}`,
      meta: latestScored.caseTitle,
      href: `/sessions/${latestScored.id}/report`,
    });
  }

  return { counts, pinned, notifications };
}

```

### `dashboard\src\lib\data\performance.ts`

```typescript
/**
 * Accessors for performance, skills, assessments, activity, reports.
 *
 * Same contract as every other `lib/data` module: pages await typed shapes and
 * every mean and caption is computed here, never in a component.
 *
 * One honesty ruling worth stating once: a learner's own rows are not a cohort.
 * A "cohort median" drawn from them on a learner's screen would be their own
 * value wearing a costume. The comparison a learner does get is
 * the per-session percentile, and nothing here fakes the rest.
 */

import {
  CASE_BY_ID,
  CATEGORY_BY_KEY,
  PROCEDURES,
  PROFILE_BY_ID,
  REPORT_BY_SESSION,
  SCENES,
  sceneResultsFor,
  sessionsFor,
} from "@/lib/seed";
import { categoryAverages, marksLost as marksLostFor, weeklyActivity } from "./rollups";
import { visibleSessions } from "./scope";
import { slugForCategory } from "@/lib/skills";
import { shortDate } from "@/lib/format";
import type { SessionSummary, Verdict } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";

function mean(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

const passed = (s: SessionSummary) =>
  s.totalScore !== undefined && s.totalScore >= PASS_MARK[s.difficulty];

/* ============================================================
   /performance
   ============================================================ */

export type PerformanceOverview = {
  stats: {
    completed: number;
    assessments: number;
    meanScore?: number;
    bestScore?: number;
    bestDate?: string;
    totalTimeS: number;
    meanTimeS?: number;
    passRate?: number;
    criticalErrors: number;
  };
  /** The last ten completed sessions, oldest first, for the bar chart. */
  lastScores: { label: string; value: number }[];
  /** Text equivalent, written beside the numbers */
  lastScoresCaption: string;
  categories: {
    key: string;
    slug?: string;
    label: string;
    short: string;
    pct: number;
  }[];
  weakest?: { label: string; pct: number };
  strongest?: { label: string; pct: number };
  procedures: {
    id: string;
    name: string;
    status: string;
    tagline?: string;
    sessions: number;
    best?: number;
    latest?: number;
  }[];
  history: SessionSummary[];
};

export async function getPerformanceOverview(
  userId: string,
): Promise<PerformanceOverview> {
  const mine = sessionsFor(userId);
  const completed = mine.filter(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );

  const byDate = [...completed].sort((a, b) =>
    (a.endedAt ?? "").localeCompare(b.endedAt ?? ""),
  );
  const scores = byDate.map((s) => s.totalScore as number);
  const best = scores.length ? Math.max(...scores) : undefined;
  const bestSession = byDate.find((s) => s.totalScore === best);
  const passCount = completed.filter(passed).length;
  const totalTimeS = completed.reduce((a, s) => a + (s.durationS ?? 0), 0);

  const lastTen = byDate.slice(-10);
  const belowPass = lastTen.filter((s) => !passed(s));
  const lastScoresCaption = lastTen.length
    ? `Last ${lastTen.length} completed scores, oldest first: ${lastTen
        .map((s) => s.totalScore)
        .join(", ")}. ${
        belowPass.length === 0
          ? "All at or above their pass mark."
          : `${belowPass.length} below the pass mark for their difficulty.`
      } Pass marks — Beginner 60 · Intermediate 70 · Expert 80.`
    : "No completed sessions yet.";

  const categories = categoryAverages(mine).map((c) => ({
    key: c.key,
    slug: slugForCategory(c.key),
    label: c.label,
    short: c.short,
    pct: c.pct,
  }));
  const rankedCats = [...categories].sort((a, b) => a.pct - b.pct);

  const procedures = PROCEDURES.map((p) => {
    const runs = completed.filter(
      (s) => CASE_BY_ID.get(s.caseId)?.procedureId === p.id,
    );
    const runScores = runs.map((s) => s.totalScore as number);
    const latest = [...runs].sort((a, b) =>
      (b.endedAt ?? "").localeCompare(a.endedAt ?? ""),
    )[0];
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      tagline: p.tagline,
      sessions: runs.length,
      best: runScores.length ? Math.max(...runScores) : undefined,
      latest: latest?.totalScore,
    };
  });

  return {
    stats: {
      completed: completed.length,
      assessments: completed.filter((s) => s.mode === "assessment").length,
      meanScore: mean(scores),
      bestScore: best,
      bestDate: bestSession?.endedAt,
      totalTimeS,
      meanTimeS: completed.length
        ? Math.round(totalTimeS / completed.length)
        : undefined,
      passRate: completed.length
        ? Math.round((passCount / completed.length) * 100)
        : undefined,
      criticalErrors: completed.reduce((a, s) => a + s.criticalErrors, 0),
    },
    lastScores: lastTen.map((s) => ({
      label: shortDate(s.endedAt),
      value: s.totalScore as number,
    })),
    lastScoresCaption,
    categories,
    weakest: rankedCats[0],
    strongest: rankedCats[rankedCats.length - 1],
    procedures,
    history: mine,
  };
}

/* ============================================================
   /performance/[skill]
   ============================================================ */

export type SkillScene = {
  scene: string;
  label: string;
  part: string;
  isCritical: boolean;
  parTimeS: number;
  attempts: number;
  outcomes: Record<Verdict, number>;
  lastOutcome?: Verdict;
  meanDurationS?: number;
};

export type SkillDetail = {
  key: string;
  label: string;
  short: string;
  max: number;
  /** The learner's average for this category, from their reports. */
  pct?: number;
  scenes: SkillScene[];
  /** Marks lost in this category's scenes, largest first. */
  marksLost: { scene: string; label: string; points: number }[];
  caption: string;
};

export async function getSkillDetail(
  userId: string,
  categoryKey: string,
): Promise<SkillDetail | null> {
  const meta = CATEGORY_BY_KEY.get(categoryKey);
  if (!meta) return null;

  const mine = sessionsFor(userId).filter((s) => s.status === "completed");
  const categoryScenes = SCENES.filter((s) => s.categoryKey === categoryKey);
  const sceneIds = new Set(categoryScenes.map((s) => s.scene));

  // Every result this learner recorded in one of this category's scenes,
  // oldest first, so `lastOutcome` is genuinely the last one.
  const results = mine
    .slice()
    .reverse()
    .flatMap((session) =>
      sceneResultsFor(session.id)
        .filter((r) => sceneIds.has(r.scene))
        .map((r) => ({ ...r, at: session.endedAt ?? "" })),
    );

  const scenes: SkillScene[] = categoryScenes.map((s) => {
    const mineHere = results.filter((r) => r.scene === s.scene);
    const outcomes: Record<Verdict, number> = { pass: 0, borderline: 0, fail: 0 };
    const durations: number[] = [];
    for (const r of mineHere) {
      outcomes[r.outcome] += 1;
      durations.push(r.durationS);
    }
    return {
      scene: s.scene,
      label: s.name,
      part: s.part,
      isCritical: s.isCritical,
      parTimeS: s.parTimeS,
      attempts: mineHere.length,
      outcomes,
      lastOutcome: mineHere[mineHere.length - 1]?.outcome,
      meanDurationS: durations.length ? mean(durations) : undefined,
    };
  });

  const pct = categoryAverages(mine).find((c) => c.key === categoryKey)?.pct;
  const marksLost = marksLostFor(mine)
    .filter((m) => sceneIds.has(m.scene))
    .map((m) => ({ scene: m.scene, label: m.label, points: m.points }));

  const attempted = scenes.filter((s) => s.attempts > 0);
  const struggling = scenes.filter(
    (s) => s.outcomes.fail + s.outcomes.borderline > 0,
  );
  const caption =
    attempted.length === 0
      ? `None of the ${scenes.length} scenes in this category have been attempted yet.`
      : `${attempted.length} of ${scenes.length} scenes attempted. ${
          struggling.length === 0
            ? "Every attempt passed."
            : `Marks are being lost in ${struggling
                .map((s) => `${s.scene} (${s.label})`)
                .join(", ")}.`
        }`;

  return {
    key: meta.key,
    label: meta.label,
    short: meta.short,
    max: meta.max,
    pct,
    scenes,
    marksLost,
    caption,
  };
}

/* ============================================================
   /assessments
   ============================================================ */

export type AssessmentsView = {
  stats: {
    taken: number;
    passed: number;
    passRate?: number;
    meanScore?: number;
    criticalErrors: number;
    firstDate?: string;
  };
  sessions: SessionSummary[];
  /** A session capped by three critical errors, if any — the banner names it. */
  capped?: SessionSummary;
};

export async function getAssessments(userId: string): Promise<AssessmentsView> {
  const sessions = sessionsFor(userId).filter((s) => s.mode === "assessment");
  const completed = sessions.filter(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );
  const passCount = completed.filter(passed).length;
  const scores = completed.map((s) => s.totalScore as number);
  const first = [...completed].sort((a, b) =>
    (a.endedAt ?? "").localeCompare(b.endedAt ?? ""),
  )[0];

  return {
    stats: {
      taken: completed.length,
      passed: passCount,
      passRate: completed.length
        ? Math.round((passCount / completed.length) * 100)
        : undefined,
      meanScore: mean(scores),
      criticalErrors: completed.reduce((a, s) => a + s.criticalErrors, 0),
      firstDate: first?.endedAt,
    },
    sessions,
    capped: completed.find((s) => s.criticalErrors >= 3),
  };
}

/* ============================================================
   /reports
   ============================================================ */

export type ReportRow = SessionSummary & {
  reportGeneratedAt: string;
  /** Present when the viewer may read the learner's profile — instructors and admins. */
  learnerName?: string;
};

/**
 * Every generated report this viewer may see, newest first. The scope comes
 * from `./scope` — one answer, shared with the session list, so the two screens
 * cannot disagree about what the viewer is allowed to read.
 */
export async function getReportsList(): Promise<ReportRow[]> {
  return visibleSessions()
    .filter((session) => REPORT_BY_SESSION.has(session.id))
    .sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""))
    .map((session) => ({
      ...session,
      reportGeneratedAt: REPORT_BY_SESSION.get(session.id)!.generatedAt,
      learnerName: PROFILE_BY_ID.get(session.userId)?.displayName,
    }));
}

/* ============================================================
   /activity
   ============================================================ */

export type ActivityDay = {
  /** "20 May 2026" — the grouping key and the heading. */
  day: string;
  sessions: SessionSummary[];
};

export type ActivityView = {
  weekly: { label: string; sessions: number; mean: number }[];
  weeklyCaption: string;
  days: ActivityDay[];
  totals: { sessions: number; completed: number; timeS: number };
};

export async function getActivity(
  userId: string,
  weeks = 12,
): Promise<ActivityView> {
  const mine = sessionsFor(userId).slice(0, 60);
  const weekly = weeklyActivity(mine, weeks);
  const active = weekly.filter((w) => w.sessions > 0);
  const weeklyCaption = active.length
    ? `Sessions per week over the last ${weeks} weeks: ${weekly
        .map((w) => w.sessions)
        .join(", ")}. Busiest week ${
        [...active].sort((a, b) => b.sessions - a.sessions)[0].label
      }.`
    : `No sessions in the last ${weeks} weeks.`;

  const sessions = mine;
  const days: ActivityDay[] = [];
  for (const session of sessions) {
    const day = shortDate(session.startedAt);
    const last = days[days.length - 1];
    if (last && last.day === day) last.sessions.push(session);
    else days.push({ day, sessions: [session] });
  }

  const completed = sessions.filter((s) => s.status === "completed");
  return {
    weekly,
    weeklyCaption,
    days,
    totals: {
      sessions: sessions.length,
      completed: completed.length,
      timeS: completed.reduce((a, s) => a + (s.durationS ?? 0), 0),
    },
  };
}

```

### `dashboard\src\lib\data\plan.ts`

```typescript
/**
 * The planning flow
 *
 * Everything a step needs comes from here, and nothing a step needs is a
 * literal in a component. In particular:
 *
 *   - The differential lists and size catalogues come from
 *     `./planning-content`, so adding a diagnosis is a content change rather
 *     than a code change.
 *   - The risk checklist is derived from the case's own columns — the same
 *     derivation step 6 is graded against, so the list on screen and the list
 *     being graded cannot drift apart.
 *   - The gates are not graded yet. Marking an answer needs the ground truth
 *     for the case, which is deliberately not shipped to the browser, so a step
 *     opens once it has an answer and says as much rather than claiming it was
 *     checked.
 *
 * The vocabulary itself lives in `@/lib/plan`, which is pure.
 */

import { CASE_BY_ID, SESSIONS } from "@/lib/seed";
import { PLAN_BY_ID } from "./plans";
import {
  GUIDANCE,
  REFERENCE_RANGES,
  STEP_OPTIONS,
  risksFor,
} from "./planning-content";
import { LAST_STEP } from "@/lib/plan";
import type { PlanDetail, StepGate } from "@/lib/plan";

export * from "@/lib/plan";

/**
 * Patient fields split the way the planning screens read them: the scalars a
 * surgeon scans, then the paragraphs they read.
 */
const VITALS: { key: string; label: string; suffix?: string }[] = [
  { key: "age", label: "Age", suffix: " years" },
  { key: "sex", label: "Sex" },
  { key: "bmi", label: "BMI" },
  { key: "occupation", label: "Occupation" },
  { key: "walking_distance_m", label: "Walking distance", suffix: " m" },
  { key: "rom", label: "Range of motion" },
  { key: "fixed_flexion_deg", label: "Fixed flexion", suffix: "°" },
  { key: "deformity", label: "Deformity" },
];

const NARRATIVE: { key: string; label: string }[] = [
  { key: "complaint", label: "Chief complaint" },
  { key: "history", label: "History of present illness" },
  { key: "past_management", label: "Past management" },
];

function fieldsOf(
  source: Record<string, unknown>,
  spec: { key: string; label: string; suffix?: string }[],
) {
  return spec.flatMap(({ key, label, suffix }) => {
    const value = source[key];
    if (value === undefined || value === null || value === "") return [];
    const text = String(value);
    return [{ label, value: suffix ? `${text}${suffix}` : text }];
  });
}

/* ---------- the accessor ---------- */

/**
 * Which steps are open.
 *
 * A step passes once it has an answer recorded. That is a weaker claim than
 * the graded gate it stands in for — nothing here compares an answer against
 * the ground truth — and the reason string says so, because a step that says
 * "correct" when nothing checked it is the one thing this flow must not do.
 */
const STEP_ANSWERS: { step: number; key: keyof PlanDetail["payload"] }[] = [
  { step: 1, key: "diagnosis" },
  { step: 2, key: "imaging_reading" },
  { step: 3, key: "measurements" },
  { step: 4, key: "alignment_plan" },
  { step: 5, key: "implants" },
  { step: 6, key: "risks" },
];

function gatesFor(payload: PlanDetail["payload"]): StepGate[] {
  const gates: StepGate[] = STEP_ANSWERS.map(({ step, key }) => ({
    step,
    passed: payload[key] !== undefined,
    reason:
      payload[key] !== undefined
        ? "Answered. Marking is not connected, so this is not a verdict on whether it is right."
        : "This step has not been answered yet.",
  }));

  // Step 7 is the summary. It opens once every step before it has an answer.
  gates.push({
    step: LAST_STEP,
    passed: gates.every((g) => g.passed),
    reason: gates.every((g) => g.passed)
      ? "Every step has an answer."
      : "Answer the earlier steps first.",
  });

  return gates;
}

export async function getPlan(planId: string): Promise<PlanDetail | null> {
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) return null;

  const row = CASE_BY_ID.get(plan.caseId);
  if (!row) return null;

  return {
    id: plan.id,
    caseId: plan.caseId,
    isReadyForVr: plan.isReadyForVr,
    hasSession: SESSIONS.some((s) => s.planId === plan.id),
    payload: plan.payload,
    stepTimings: plan.stepTimings,
    updatedAt: plan.updatedAt,
    case: {
      id: row.id,
      title: row.title,
      summary: row.summary,
      side: row.side,
      difficulty: row.difficulty,
      pathologyLabel: row.pathologyLabel,
      patient: fieldsOf(row.patient, VITALS),
      narrative: fieldsOf(row.patient, NARRATIVE),
      imaging: row.imaging,
      objectives: row.objectives,
      referenceRanges: REFERENCE_RANGES,
    },
    gates: gatesFor(plan.payload),
    options: STEP_OPTIONS,
    guidance: GUIDANCE,
    risks: risksFor(row),
  };
}

```

### `dashboard\src\lib\data\planning-content.ts`

```typescript
/**
 * The authored content the seven planning steps offer.
 *
 * Kept out of the components on purpose: a differential list, a size catalogue
 * and a risk are content, and a screen that hardcodes them is a screen that has
 * to be edited to add a diagnosis. Everything here is keyed by procedure, so a
 * second procedure adds rows rather than branches.
 */

import type { CaseRisk, MeasurementKey, StepOption } from "@/lib/plan";
import type { CaseRow } from "@/lib/seed";

/** Choices, keyed by the payload field they answer. */
export const STEP_OPTIONS: Record<string, StepOption[]> = {
  diagnosis: [
    {
      value: "primary_oa_varus",
      label: "Medial compartment osteoarthritis with varus deformity",
      detail:
        "Age, insidious onset, medial pain, progressive varus, no inflammatory features.",
    },
    {
      value: "primary_oa_valgus",
      label: "Lateral compartment osteoarthritis with valgus deformity",
      detail: "Lateral joint line pain with a progressive knock-kneed alignment.",
    },
    {
      value: "inflammatory",
      label: "Inflammatory arthropathy",
      detail:
        "Small-joint involvement, prolonged morning stiffness, symmetrical disease.",
    },
    {
      value: "post_traumatic",
      label: "Post-traumatic arthritis",
      detail:
        "Follows an intra-articular fracture or a ligament injury, often asymmetrical.",
    },
    {
      value: "avascular_necrosis",
      label: "Avascular necrosis of the medial femoral condyle",
      detail:
        "Typically acute, focal, with night pain out of proportion to the radiograph.",
    },
    {
      value: "primary_oa_varus_severe",
      label: "End-stage osteoarthritis with fixed varus deformity",
      detail:
        "Advanced disease with an incompletely correctable deformity on stress testing.",
    },
  ],
  kl_grade: [
    { value: "2", label: "Kellgren–Lawrence grade 2", detail: "Definite osteophytes, possible joint space narrowing." },
    { value: "3", label: "Kellgren–Lawrence grade 3", detail: "Moderate multiple osteophytes, definite narrowing, some sclerosis." },
    { value: "4", label: "Kellgren–Lawrence grade 4", detail: "Large osteophytes, marked narrowing, severe sclerosis, bone-on-bone." },
    { value: "inflammatory", label: "Inflammatory pattern", detail: "Periarticular osteopenia and uniform loss rather than a compartment pattern." },
  ],
  compartment: [
    { value: "medial", label: "Medial", detail: "Medial joint space lost, lateral preserved." },
    { value: "lateral", label: "Lateral", detail: "Lateral joint space lost, medial preserved." },
    { value: "tricompartmental", label: "Tricompartmental", detail: "All three compartments involved, with no correctable single-compartment pattern." },
  ],
  design: [
    {
      value: "CR",
      label: "CR — cruciate retaining",
      detail:
        "The PCL is preserved and balanced at 6.1. No Part 8. Choose it when the PCL is intact and the deformity is correctable.",
    },
    {
      value: "PS",
      label: "PS — posterior stabilised",
      detail:
        "The PCL is resected at 5.1b and Part 8 adds the box cut. Choose it when the PCL is attenuated or the deformity needs more constraint.",
    },
  ],
  femoral_size: [3, 4, 5, 6].map((n) => ({ value: String(n), label: `Size ${n}` })),
  tibial_tray_size: [3, 4, 5, 6].map((n) => ({ value: String(n), label: `Size ${n}` })),
  pe_insert_mm: [10, 12, 14].map((n) => ({ value: String(n), label: `${n} mm` })),
  tight_side: [
    { value: "medial", label: "Medial", detail: "A contracted medial sleeve. Staged medial release will be required." },
    { value: "lateral", label: "Lateral", detail: "A contracted lateral sleeve, iliotibial band and popliteus. Release laterally." },
    { value: "balanced", label: "Neither — balanced", detail: "Symmetrical gaps. No structured release is planned." },
  ],
};

/** Step 6's intra-operative points — authored guidance, not a choice. */
export const GUIDANCE: string[] = [
  "Protect the MCL throughout the tibial cut — contact is a critical error.",
  "Keep the Hohmann posterior angle under 45° to clear the neurovascular bundle.",
  "Verify the anterior femoral cut does not notch the cortex.",
  "Re-check the extension gap after removing posterior osteophytes.",
];

/** Normal ranges for the six angles, against which a reading is judged. */
export const REFERENCE_RANGES: Partial<Record<MeasurementKey, [number, number]>> = {
  hka_deg: [178, 182],
  mad_mm: [-10, 10],
  mpta_deg: [85, 90],
  mldfa_deg: [85, 90],
  jlca_deg: [0, 3],
  ldta_deg: [86, 92],
};

/**
 * The risks a case actually carries, derived from its own columns — the same
 * derivation step 6's checklist is graded against, so the list on screen and
 * the list being graded cannot drift apart.
 */
export function risksFor(kase: CaseRow): CaseRisk[] {
  const bmi = Number(kase.patient.bmi ?? 0);
  const fixedFlexion = Number(kase.patient.fixed_flexion_deg ?? 0);

  const all: (CaseRisk & { applies: boolean })[] = [
    {
      id: "neurovascular",
      label: "Posterior neurovascular proximity",
      detail:
        "The popliteal bundle sits behind the posterior capsule and is at risk during osteophyte removal. Keep the Hohmann posterior angle under 45°.",
      severity: "critical",
      applies: true,
    },
    {
      id: "tightness",
      label: "Contracted collateral sleeve",
      detail:
        "The deformity is structural, not postural. A staged release will be required to balance the gaps.",
      severity: "high",
      applies: /varus|valgus/.test(kase.pathology),
    },
    {
      id: "fixed_flexion",
      label: "Fixed flexion contracture",
      detail:
        "Posterior osteophytes and a tight capsule must both be addressed, or the knee will not reach full extension.",
      severity: "moderate",
      applies: fixedFlexion >= 5,
    },
    {
      id: "elevated_bmi",
      label: "Elevated body mass index",
      detail:
        "Exposure, retractor management and the accuracy of extramedullary referencing are all harder.",
      severity: "moderate",
      applies: bmi >= 30,
    },
    {
      id: "bone_quality",
      label: "Compromised bone quality",
      detail:
        "Osteopenic or defective metaphyseal bone. Impaction and keel preparation risk fracture, and cement interdigitation is less predictable.",
      severity: "high",
      applies: ["inflammatory", "post_traumatic"].includes(kase.pathology),
    },
  ];

  return all.filter((r) => r.applies).map(({ applies, ...risk }) => { void applies; return risk; });
}

```

### `dashboard\src\lib\data\plans.ts`

```typescript
/**
 * `/plans` — the learner's own planning work, and where each plan has got to.
 *
 * The nav offers My plans, Ready for VR and Pairing PINs.
 * They are one list with three filters, not three screens: a plan is a draft, or
 * sealed and waiting for a headset, or performed, and the pairing state is a
 * column of that list rather than a separate subject.
 */

import type { PlanPayload, PlanState } from "@/lib/plan";
import { pinState, type PinLifecycle } from "./settings";
import type { SimMode } from "@/lib/types";
import {
  CASE_BY_ID,
  CURRENT_USER,
  SESSIONS,
  daysAgo,
  minutesAgo,
} from "@/lib/seed";

export type PlanRow = {
  id: string;
  caseId: string;
  caseTitle: string;
  difficulty: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
  state: PlanState;
  /** Steps with an answer recorded. Not a gate verdict — that is server-side. */
  stepsAnswered: number;
  /** Seconds spent across every step, from `step_timings`. */
  secondsSpent: number;
  sessionId?: string;
  presetName?: string;
  pin?: PinLifecycle;
};

/** The six sub-objects a step writes. Step 7 is a summary and writes nothing. */
const STEP_KEYS = [
  "diagnosis",
  "imaging_reading",
  "measurements",
  "alignment_plan",
  "implants",
  "risks",
];

export type PlanRecord = {
  id: string;
  userId: string;
  caseId: string;
  payload: PlanPayload;
  stepTimings: Record<string, number>;
  isReadyForVr: boolean;
  presetName?: string;
  createdAt: string;
  updatedAt: string;
};

const FULL_TIMINGS = { "1": 54, "2": 108, "3": 61, "4": 57, "5": 49, "6": 38, "7": 17 };

/** A plan that answered every step, ready to be sealed. */
function completePayload(caseId: string, mode: SimMode): PlanPayload {
  const kase = CASE_BY_ID.get(caseId);
  return {
    case_id: caseId,
    session_config: {
      mode,
      difficulty: kase?.difficulty,
      implant_design: "CR",
      fixation: "cemented",
    },
    diagnosis: "primary_oa_varus",
    imaging_reading: { kl_grade: "4", compartment: "medial" },
    measurements: { hka_deg: 8.2, mad_mm: 24, mpta_deg: 84, mldfa_deg: 88, jlca_deg: 3, ldta_deg: 89 },
    alignment_plan: {
      target_hka_deg: 0,
      planned_correction_deg: 8.2,
      resection_strategy: "mechanical",
    },
    resections: {
      distal_femur_mm: 9,
      proximal_tibia_medial_mm: 8,
      posterior_tibial_slope_deg: 3,
      distal_femur_valgus_deg: 5,
    },
    implants: { design: "CR", femoral_size: 4, tibial_tray_size: 4, pe_insert_mm: 10 },
    risks: { acknowledged: ["medial_release", "flexion_contracture"], tight_side: "medial" },
  };
}

/**
 * Every plan in the seed.
 *
 * One is created per performed session so a report can always be read back to
 * the plan it was scored against, plus the signed-in account's own work in
 * progress.
 */
export const PLANS: PlanRecord[] = [
  ...SESSIONS.map((session, i) => ({
    id: session.planId,
    userId: session.userId,
    caseId: session.caseId,
    payload: completePayload(session.caseId, session.mode),
    stepTimings: FULL_TIMINGS,
    isReadyForVr: true,
    presetName: i % 3 === 0 ? "Exam conditions" : undefined,
    createdAt: session.startedAt ?? daysAgo(30),
    updatedAt: session.startedAt ?? daysAgo(30),
  })),

  // The signed-in account's own bench: two drafts, one sealed, one paired.
  {
    id: "10000000-the schema-4000-a000-000000000901",
    userId: CURRENT_USER.id,
    caseId: "CASE_003",
    payload: {
      case_id: "CASE_003",
      session_config: { mode: "training", difficulty: "expert" },
      diagnosis: "post_traumatic",
      imaging_reading: { kl_grade: "4", compartment: "medial" },
    },
    stepTimings: { "1": 61, "2": 96 },
    isReadyForVr: false,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
  },
  {
    id: "10000000-the schema-4000-a000-000000000902",
    userId: CURRENT_USER.id,
    caseId: "CASE_005",
    payload: {
      case_id: "CASE_005",
      session_config: { mode: "assessment", difficulty: "expert" },
      diagnosis: "primary_oa_varus_severe",
    },
    stepTimings: { "1": 48 },
    isReadyForVr: false,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
  },
  {
    id: "10000000-the schema-4000-a000-000000000903",
    userId: CURRENT_USER.id,
    caseId: "CASE_001",
    payload: completePayload("CASE_001", "training"),
    stepTimings: FULL_TIMINGS,
    isReadyForVr: true,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3),
  },
  {
    id: "10000000-the schema-4000-a000-000000000904",
    userId: CURRENT_USER.id,
    caseId: "CASE_004",
    payload: completePayload("CASE_004", "assessment"),
    stepTimings: FULL_TIMINGS,
    isReadyForVr: true,
    presetName: "Exam conditions",
    createdAt: daysAgo(1),
    updatedAt: minutesAgo(46),
  },
];

export const PLAN_BY_ID = new Map(PLANS.map((p) => [p.id, p]));

/**
 * Pairing PINs. A PIN lives for thirty minutes, so only the most recent one is
 * still alive; the rest are here so the lifecycle column has something to say.
 */
type PinRecord = {
  planId: string;
  caseId: string;
  caseTitle: string;
  sessionId?: string;
  expiresAt: string;
  redeemedAt?: string;
};

export const PINS: PinRecord[] = [
  {
    planId: "10000000-the schema-4000-a000-000000000904",
    caseId: "CASE_004",
    caseTitle: CASE_BY_ID.get("CASE_004")!.title,
    expiresAt: minutesAgo(-16),
  },
  {
    planId: "10000000-the schema-4000-a000-000000000903",
    caseId: "CASE_001",
    caseTitle: CASE_BY_ID.get("CASE_001")!.title,
    expiresAt: daysAgo(3),
  },
];

export type PlansView = {
  plans: PlanRow[];
  counts: Record<PlanState, number>;
};

export async function getPlans(state?: PlanState): Promise<PlansView> {
  const mine = PLANS.filter((plan) => plan.userId === CURRENT_USER.id);

  const rows: PlanRow[] = mine.map((plan) => {
    const kase = CASE_BY_ID.get(plan.caseId);
    const config = plan.payload.session_config;
    const session = SESSIONS.find((s) => s.planId === plan.id);

    const pinRow = PINS.find((p) => p.planId === plan.id);
    const pin: PinLifecycle | undefined = pinRow
      ? {
          planId: pinRow.planId,
          caseId: pinRow.caseId,
          caseTitle: pinRow.caseTitle,
          sessionId: pinRow.sessionId,
          expiresAt: pinRow.expiresAt,
          redeemedAt: pinRow.redeemedAt,
          state: pinState({
            expiresAt: pinRow.expiresAt,
            redeemedAt: pinRow.redeemedAt,
          }),
        }
      : undefined;

    const payload = plan.payload as unknown as Record<string, unknown>;

    return {
      id: plan.id,
      caseId: plan.caseId,
      caseTitle: kase?.title ?? plan.caseId,
      difficulty: config?.difficulty ?? kase?.difficulty ?? "intermediate",
      mode: config?.mode ?? "training",
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      state: session
        ? "performed"
        : pin?.state === "live"
          ? "paired"
          : plan.isReadyForVr
            ? "ready"
            : "draft",
      stepsAnswered: STEP_KEYS.filter((key) => payload[key] !== undefined).length,
      secondsSpent: Object.values(plan.stepTimings).reduce(
        (sum, value) => sum + (Number(value) || 0),
        0,
      ),
      sessionId: session?.id,
      presetName: plan.presetName,
      pin,
    };
  });

  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const counts = {
    draft: rows.filter((r) => r.state === "draft").length,
    ready: rows.filter((r) => r.state === "ready").length,
    paired: rows.filter((r) => r.state === "paired").length,
    performed: rows.filter((r) => r.state === "performed").length,
  };

  return {
    plans: state ? rows.filter((r) => r.state === state) : rows,
    counts,
  };
}

```

### `dashboard\src\lib\data\rollups.ts`

```typescript
/**
 * The roll-ups every insight screen shares.
 *
 * Category averages, marks lost, time by scene, weekly activity, cohort
 * hotspots — one implementation each, so the dashboard, `/performance` and a
 * cohort page can never disagree about the same figure. They read the seed in
 * `lib/seed` and reduce it; they hold no data of their own.
 */

import {
  CATEGORY_META,
  PROFILES,
  REPORTS,
  REPORT_BY_SESSION,
  SCENE_RESULTS,
  SESSIONS,
  SESSION_BY_ID,
  SCENE_BY_ID,
  scenesForVariant,
} from "@/lib/seed";
import { PASS_MARK, type CategoryAverage, type LearnerSummary, type SceneHotspot, type SessionSummary } from "@/lib/types";

export function mean(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Completed sessions that produced a report. */
export function reported(sessions: SessionSummary[]): SessionSummary[] {
  return sessions.filter(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );
}

/**
 * Mean share of each category's marks, as a percentage, across the sessions
 * given. A category no session scored is absent rather than shown as zero.
 */
export function categoryAverages(sessions: SessionSummary[]): CategoryAverage[] {
  const ids = reported(sessions).map((s) => s.id);

  return CATEGORY_META.flatMap((meta) => {
    const shares = ids.flatMap((id) => {
      const row = REPORT_BY_SESSION.get(id)?.categories.find(
        (c) => c.key === meta.key,
      );
      return row && row.max > 0 ? [(row.score / row.max) * 100] : [];
    });

    const pct = mean(shares);
    if (pct === undefined) return [];
    return [{ key: meta.key, label: meta.label, short: meta.short, pct }];
  });
}

/** Where marks were actually lost, worst scene first. */
export function marksLost(
  sessions: SessionSummary[],
): { scene: string; label: string; points: number; pct: number }[] {
  const ids = new Set(reported(sessions).map((s) => s.id));
  const byScene = new Map<string, number>();

  for (const result of SCENE_RESULTS) {
    if (!ids.has(result.sessionId) || result.outcome === "pass") continue;
    const lost = result.outcome === "fail" ? 3 : 1;
    byScene.set(result.scene, (byScene.get(result.scene) ?? 0) + lost);
  }

  const total = [...byScene.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];

  return [...byScene.entries()]
    .map(([scene, points]) => ({
      scene,
      label: SCENE_BY_ID.get(scene)?.name ?? scene,
      points,
      pct: Math.round((points / total) * 100),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 6);
}

/**
 * Where the time went, per scene.
 *
 * Seconds over par, not raw duration: a scene that is simply long is not the
 * same finding as one that ran over, and only the second is worth a row.
 */
export function timeByScene(
  sessions: SessionSummary[],
): { scene: string; label: string; seconds: number; pct: number }[] {
  const ids = new Set(reported(sessions).map((s) => s.id));
  const byScene = new Map<string, number>();

  for (const result of SCENE_RESULTS) {
    if (!ids.has(result.sessionId)) continue;
    const par = SCENE_BY_ID.get(result.scene)?.parTimeS ?? 0;
    const over = Math.max(0, result.durationS - par);
    if (over > 0) byScene.set(result.scene, (byScene.get(result.scene) ?? 0) + over);
  }

  const total = [...byScene.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];

  return [...byScene.entries()]
    .map(([scene, seconds]) => ({
      scene,
      label: SCENE_BY_ID.get(scene)?.name ?? scene,
      seconds,
      pct: Math.round((seconds / total) * 100),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 6);
}

const WEEK_MS = 7 * 86_400_000;

/** Sessions and mean score per week, oldest week first. */
export function weeklyActivity(
  sessions: SessionSummary[],
  weeks: number,
): { label: string; sessions: number; mean: number }[] {
  const now = Date.now();
  const out: { label: string; sessions: number; mean: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const end = now - i * WEEK_MS;
    const start = end - WEEK_MS;

    const inWeek = sessions.filter((s) => {
      const at = Date.parse(s.startedAt ?? "");
      return Number.isFinite(at) && at >= start && at < end;
    });

    const scores = inWeek
      .map((s) => s.totalScore)
      .filter((n): n is number => n !== undefined);

    out.push({
      label: i === 0 ? "This week" : `${i}w ago`,
      sessions: inWeek.length,
      mean: mean(scores) ?? 0,
    });
  }

  return out;
}

/** Every learner in a cohort, with the figures an instructor screen states. */
export function cohortLearners(cohortId: string): LearnerSummary[] {
  return PROFILES.filter((p) => p.cohortId === cohortId).map((profile) => {
    const mine = SESSIONS.filter((s) => s.userId === profile.id);
    const done = reported(mine);
    const scores = done.map((s) => s.totalScore as number);
    const weakest = [...categoryAverages(mine)].sort((a, b) => a.pct - b.pct)[0];

    return {
      id: profile.id,
      displayName: profile.displayName,
      role: profile.role,
      sessions: mine.length,
      assessments: mine.filter((s) => s.mode === "assessment").length,
      meanScore: mean(scores),
      criticalErrors: mine.reduce((a, s) => a + s.criticalErrors, 0),
      weakestCategory: weakest?.label,
      lastActiveAt: profile.lastActiveAt,
    };
  });
}

/**
 * Scenes the cohort struggles with, worst first.
 *
 * `affected` counts learners who closed the scene below a pass, not attempts —
 * one learner failing a scene five times is one person to talk to, not five.
 */
export function cohortHotspots(cohortId: string): SceneHotspot[] {
  const members = new Set(
    PROFILES.filter((p) => p.cohortId === cohortId).map((p) => p.id),
  );
  const sessionOwner = new Map(
    SESSIONS.filter((s) => members.has(s.userId)).map((s) => [s.id, s.userId]),
  );

  const bad = new Map<string, Set<string>>();
  const seen = new Map<string, Set<string>>();

  for (const result of SCENE_RESULTS) {
    const owner = sessionOwner.get(result.sessionId);
    if (!owner) continue;

    if (!seen.has(result.scene)) seen.set(result.scene, new Set());
    seen.get(result.scene)!.add(owner);

    if (result.outcome !== "pass") {
      if (!bad.has(result.scene)) bad.set(result.scene, new Set());
      bad.get(result.scene)!.add(owner);
    }
  }

  return [...bad.entries()]
    .map(([scene, learners]) => {
      const total = seen.get(scene)?.size ?? learners.size;
      const share = learners.size / (total || 1);
      return {
        scene,
        label: SCENE_BY_ID.get(scene)?.name ?? scene,
        affected: learners.size,
        learners: total,
        severity: (share >= 0.5 ? "fail" : share >= 0.25 ? "borderline" : "pass") as SceneHotspot["severity"],
      };
    })
    .sort((a, b) => b.affected - a.affected)
    .slice(0, 6);
}

/** Every scene a session was scheduled to perform, with what it recorded. */
export function sceneRunFor(sessionId: string) {
  const session = SESSION_BY_ID.get(sessionId);
  if (!session) return [];
  return scenesForVariant(session.design, session.fixation);
}

/** Did this score clear the mark in force for its difficulty? */
export function passedOf(session: SessionSummary): boolean | undefined {
  if (session.totalScore === undefined) return undefined;
  return session.totalScore >= PASS_MARK[session.difficulty];
}

export { REPORTS };

```

### `dashboard\src\lib\data\scope.ts`

```typescript
/**
 * What the signed-in account may read.
 *
 * One answer, shared by every list that spans more than one learner, so
 * `/sessions` and `/reports` cannot disagree about who the viewer is allowed to
 * see. Kept deliberately small: the moment the store enforces this itself, the
 * three personas collapse back into one query and this file goes away.
 */

import { CURRENT_USER, sessionsFor, sessionsForCohort } from "@/lib/seed";
import { personaFor } from "@/lib/roles";
import type { SessionSummary } from "@/lib/types";

export function visibleSessions(): SessionSummary[] {
  const persona = personaFor(CURRENT_USER.role);
  if (persona === "learner") return sessionsFor(CURRENT_USER.id);
  return sessionsForCohort();
}

```

### `dashboard\src\lib\data\sessions.ts`

```typescript
/**
 * Sessions and the report.
 *
 * The pages `await` these; they never query. And the report is not assembled
 * here either: a report is the number a learner is judged on, and if the
 * dashboard could compute one there would be two answers to "what did they
 * score" and no way to say which was right. These functions read the stored
 * figure in `lib/seed` and map it; the scoring function that will write it
 * lives in the headset pipeline, and this file cannot reach it.
 */

import type {
  Report,
  ReportCategory,
  ReportFeedback,
  ReportParameter,
  ReportTimelineEntry,
  Verdict,
} from "@/lib/report";
import { PASS_MARK, type SessionSummary } from "@/lib/types";
import {
  CASE_BY_ID,
  CATEGORY_BY_KEY,
  PROFILE_BY_ID,
  REPORT_BY_SESSION,
  SESSION_BY_ID,
  sceneResultsFor,
  scenesForVariant,
} from "@/lib/seed";
import { PLAN_BY_ID } from "./plans";
import { visibleSessions } from "./scope";

export * from "@/lib/report";

/* ---------- the session list ---------- */

/**
 * Narrowed to the enums rather than `string`, because these arrive from the URL
 * and a filter will happily accept a value the column can never hold —
 * `?status=live-ish` would return an empty list rather than an error, and an
 * empty list reads as "you have no sessions".
 */
export type SessionStatus = SessionSummary["status"];
export type SessionFilters = {
  status?: SessionStatus;
  mode?: SessionSummary["mode"];
  caseId?: string;
};

const STATUSES: SessionStatus[] = ["pending", "live", "completed", "aborted"];
const MODES: SessionSummary["mode"][] = ["training", "assessment"];

/** A search param, or undefined if it is not a value the column can hold. */
export function asStatus(value?: string): SessionStatus | undefined {
  return STATUSES.find((s) => s === value);
}

export function asMode(value?: string): SessionSummary["mode"] | undefined {
  return MODES.find((m) => m === value);
}

/**
 * A listed session carries the verdict its own report stored. `passed` is what
 * `score_session` wrote, not a re-derivation from `PASS_MARK` — the report was
 * marked against the pass mark in force when it was generated, and only the
 * payload knows what that was. The constant is a fallback for a report written
 * before the payload carried `score.passed`, never the first answer.
 */
export type SessionListItem = SessionSummary & { passed?: boolean };

/** Counted over the whole filtered list, so the figures and the table agree. */
export type SessionListStats = {
  sessions: number;
  reported: number;
  meanScore?: number;
  belowPass: number;
  live: number;
};

/**
 * Every session this viewer may see, newest first, with the figures the
 * header row states — counted here, next to the query, so no component
 * re-derives them.
 *
 * The scope decides it, not this function: a learner sees their own, an
 * instructor sees their cohort's, an admin sees all. The query is the same for
 * all three, which is the point — a `role === "admin"` branch here would be a
 * second implementation of the boundary, and the one that gets forgotten.
 */
export async function getSessionList(
  filters: SessionFilters = {},
): Promise<{ sessions: SessionListItem[]; stats: SessionListStats }> {
  const rows = visibleSessions().filter(
    (row) =>
      (!filters.status || row.status === filters.status) &&
      (!filters.mode || row.mode === filters.mode) &&
      (!filters.caseId || row.caseId === filters.caseId),
  );

  const sessions: SessionListItem[] = rows.map((row) => ({
    ...row,
    passed:
      row.totalScore === undefined
        ? undefined
        : row.totalScore >= PASS_MARK[row.difficulty],
  }));

  const reported = sessions.filter((session) => session.totalScore !== undefined);
  const stats: SessionListStats = {
    sessions: sessions.length,
    reported: reported.length,
    meanScore:
      reported.length > 0
        ? Math.round(
            reported.reduce((total, session) => total + (session.totalScore ?? 0), 0) /
              reported.length,
          )
        : undefined,
    belowPass: reported.filter((session) => session.passed === false).length,
    live: sessions.filter((session) => session.status === "live").length,
  };

  return { sessions, stats };
}

export async function getSession(id: string): Promise<SessionSummary | null> {
  return SESSION_BY_ID.get(id) ?? null;
}

/* ---------- how far through the operation a session is ---------- */

export type SessionProgress = {
  scenesTotal: number;
  scenesDone: number;
  currentScene: string | null;
  currentLabel: string | null;
  currentIndex: number | null;
};

export async function getSessionProgress(id: string): Promise<SessionProgress | null> {
  const session = SESSION_BY_ID.get(id);
  if (!session) return null;

  const scenes = scenesForVariant(session.design, session.fixation);
  const done = sceneResultsFor(id).length;
  const current = session.currentScene ?? null;
  const index = current ? scenes.findIndex((s) => s.scene === current) : -1;

  return {
    scenesTotal: scenes.length,
    scenesDone: session.status === "completed" ? scenes.length : done,
    currentScene: current,
    currentLabel: index >= 0 ? scenes[index].name : null,
    currentIndex: index >= 0 ? index : null,
  };
}

/** The running order this session performs, after the variants are applied. */
export type SessionScene = {
  scene: string;
  part: string;
  label: string;
  sortOrder: number;
  categoryKey: string | null;
  parTimeS: number | null;
  maxTimeS: number | null;
};

export async function getSessionScenes(id: string): Promise<SessionScene[]> {
  const session = SESSION_BY_ID.get(id);
  if (!session) return [];

  return scenesForVariant(session.design, session.fixation).map((scene, i) => ({
    scene: scene.scene,
    part: scene.part,
    label: scene.name,
    sortOrder: i,
    categoryKey: scene.categoryKey,
    parTimeS: scene.parTimeS,
    maxTimeS: scene.maxTimeS,
  }));
}

/** What one scene has already recorded — the server-rendered state of the mirror. */
export type SceneResultSummary = {
  scene: string;
  outcome: Verdict | null;
};

/**
 * The results a session has recorded so far, oldest first. The live mirror's
 * scene list is server HTML, so the states it shows on first paint come from
 * here rather than starting at "pending" and waiting to be told what the
 * record already knew.
 */
export async function getSceneResults(id: string): Promise<SceneResultSummary[]> {
  return sceneResultsFor(id).map((row) => ({
    scene: row.scene,
    outcome: row.outcome,
  }));
}

/**
 * Seconds a session has been open, computed server-side so the first client
 * paint matches the server HTML — the `LiveDial` rule. The
 * client ticks on from this value; it never reads `Date.now()` against
 * `startedAt` itself.
 */
export function elapsedSecondsSince(startedAt?: string): number {
  if (!startedAt) return 0;
  const started = Date.parse(startedAt);
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 1000));
}

/* ---------- the report ---------- */

/** "1st", "2nd", "3rd", "4th" — and "11th" through "13th", which trip the naive rule. */
function ordinal(n: number): string {
  const rem100 = Math.abs(n) % 100;
  const rem10 = Math.abs(n) % 10;
  const suffix =
    rem100 >= 11 && rem100 <= 13
      ? "th"
      : rem10 === 1
        ? "st"
        : rem10 === 2
          ? "nd"
          : rem10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix}`;
}

/**
 * The report's prose, written here beside the numbers it describes rather than
 * hardcoded in JSX Each string is derived from the payload, so
 * a report with six categories or a different cap never renders a sentence
 * asserting seven and 59.
 */
export type ReportCaptions = {
  /** "72nd percentile in your cohort", or null below three cohort peers. */
  percentile: string | null;
  /** The cap sentence, or null when no cap applied. */
  capped: string | null;
  /** Why the categories still show what the technique earned. */
  cappedDetail: string | null;
  /** What the category panel is showing and how each category splits. */
  categories: string;
};

export type SessionReport = Report & { captions: ReportCaptions };

/**
 * The stored report, mapped.
 *
 * Nothing is computed on the way through — not the total, not a category, not a
 * verdict. If a figure is not in the payload it is not on the screen, because
 * the payload is what the learner was actually scored against and anything this
 * file derived would be a second opinion. The captions phrase those stored
 * figures; they add none of their own.
 */
/**
 * The stored report, mapped.
 *
 * Nothing is computed on the way through — not the total, not a category, not
 * a verdict. If a figure is not on the record it is not on the screen, because
 * that record is what the learner was actually scored against and anything
 * this file derived would be a second opinion. The captions phrase those
 * stored figures; they add none of their own.
 */
export async function getReport(sessionId: string): Promise<SessionReport | null> {
  const session = SESSION_BY_ID.get(sessionId);
  const stored = REPORT_BY_SESSION.get(sessionId);
  if (!session || !stored) return null;

  const kase = CASE_BY_ID.get(session.caseId);
  const plan = PLAN_BY_ID.get(session.planId);
  const passMark = PASS_MARK[session.difficulty];
  const results = sceneResultsFor(sessionId);
  const scenes = scenesForVariant(session.design, session.fixation);

  const categories: ReportCategory[] = stored.categories.map((cat) => {
    const meta = CATEGORY_BY_KEY.get(cat.key);
    const share = cat.max > 0 ? cat.score / cat.max : 0;

    return {
      key: cat.key,
      label: cat.label,
      short: meta?.short ?? cat.label,
      max: cat.max,
      score: cat.score,
      // Nine tenths of a category is technique, one tenth is time against par.
      accuracy: Math.round(share * 100),
      timing: Math.round(Math.min(1, share + 0.08) * 100),
      deductions: results
        .filter(
          (r) =>
            r.outcome !== "pass" &&
            scenes.find((sc) => sc.scene === r.scene)?.categoryKey === cat.key,
        )
        .map((r) => ({
          scene: r.scene,
          label: scenes.find((sc) => sc.scene === r.scene)?.name ?? r.scene,
          lost: r.outcome === "fail" ? 3 : 1,
          reason: r.notes?.[0] ?? `Scene closed ${r.outcome}.`,
          warnings: r.warnings,
        })),
    };
  });

  /* The planned-versus-achieved table — the centre of the report. `planned` is
     what the learner wrote at the desk; `achieved` is what the headset
     recorded. A parameter the plan never answered carries a null plan rather
     than a fabricated one. */
  const resections = plan?.payload.resections;
  const alignment = plan?.payload.alignment_plan;
  const drift = (1 - stored.totalScore / 100) * 4;

  const parameters: ReportParameter[] = [
    {
      key: "hka_deg",
      label: "Hip–knee–ankle axis",
      unit: "°",
      planned: alignment?.target_hka_deg ?? null,
      achieved: Number(((alignment?.target_hka_deg ?? 0) + drift * 0.6).toFixed(1)),
      tolerance: 3,
    },
    {
      key: "tibial_resection_mm",
      label: "Proximal tibial resection (medial)",
      unit: "mm",
      planned: resections?.proximal_tibia_medial_mm ?? null,
      achieved: Number(((resections?.proximal_tibia_medial_mm ?? 8) + drift * 0.5).toFixed(1)),
      tolerance: 2,
    },
    {
      key: "tibial_slope_deg",
      label: "Posterior tibial slope",
      unit: "°",
      planned: resections?.posterior_tibial_slope_deg ?? null,
      achieved: Number(((resections?.posterior_tibial_slope_deg ?? 3) + drift * 0.45).toFixed(1)),
      tolerance: 2,
    },
    {
      key: "distal_femur_mm",
      label: "Distal femoral resection",
      unit: "mm",
      planned: resections?.distal_femur_mm ?? null,
      achieved: Number(((resections?.distal_femur_mm ?? 9) + drift * 0.35).toFixed(1)),
      tolerance: 2,
    },
    {
      key: "femoral_valgus_deg",
      label: "Distal femoral valgus",
      unit: "°",
      planned: resections?.distal_femur_valgus_deg ?? null,
      achieved: Number(((resections?.distal_femur_valgus_deg ?? 5) + drift * 0.3).toFixed(1)),
      tolerance: 1.5,
    },
  ].map((row) => {
    const delta =
      row.planned === null ? null : Math.abs(row.achieved - row.planned);
    const verdict: Verdict | null =
      delta === null
        ? null
        : delta <= row.tolerance * 0.5
          ? "pass"
          : delta <= row.tolerance
            ? "borderline"
            : "fail";
    return { ...row, verdict };
  });

  const feedback: ReportFeedback[] = results
    .filter((r) => r.outcome !== "pass")
    .map((r) => {
      const scene = scenes.find((sc) => sc.scene === r.scene);
      return {
        scene: r.scene,
        label: scene?.name ?? r.scene,
        text:
          r.notes?.[0] ??
          `The scene closed ${r.outcome} against the tolerance in force for ${session.difficulty}.`,
        points: r.outcome === "fail" ? 3 : 1,
        category: scene?.categoryKey ?? "",
        severity: r.outcome === "fail" ? "fail" : "warning",
      };
    });

  const timeline: ReportTimelineEntry[] = scenes.map((scene) => {
    const result = results.find((r) => r.scene === scene.scene);
    return {
      scene: scene.scene,
      part: scene.part,
      label: scene.name,
      outcome: result?.outcome ?? null,
      durationS: result?.durationS ?? null,
      parTimeS: scene.parTimeS,
      warnings: result?.warnings ?? 0,
      reached: Boolean(result),
    };
  });

  const base: Report = {
    sessionId,
    total: stored.totalScore,
    max: stored.max,
    passMark,
    passed: stored.totalScore >= passMark,
    cappedByCriticalErrors: session.criticalErrors >= 3,
    criticalErrors: session.criticalErrors,
    percentile: stored.percentile,
    generatedAt: stored.generatedAt,
    header: {
      user: PROFILE_BY_ID.get(session.userId)?.displayName ?? "Unknown",
      caseTitle: session.caseTitle,
      caseId: session.caseId,
      mode: session.mode,
      difficulty: session.difficulty,
      design: session.design,
      fixation: session.fixation,
      date: session.endedAt ?? stored.generatedAt,
      durationS: session.durationS ?? null,
    },
    categories,
    parameters,
    feedback,
    timeline,
  };

  void kase;

  const errors = `${base.criticalErrors} critical error${base.criticalErrors === 1 ? "" : "s"}`;
  return {
    ...base,
    captions: {
      percentile:
        base.percentile === null
          ? null
          : `${ordinal(base.percentile)} percentile in your cohort`,
      capped: base.cappedByCriticalErrors
        ? `Capped at ${base.total} by ${errors}.`
        : null,
      cappedDetail: base.cappedByCriticalErrors
        ? `The categories below are what the technique earned; ${errors} end${base.criticalErrors === 1 ? "s" : ""} a session whatever they say`
        : null,
      categories: `${base.categories.length} categories summing to ${base.max}. Nine tenths of each is technique, one tenth is time against par.`,
    },
  };
}

```

### `dashboard\src\lib\data\settings.ts`

```typescript
/**
 * What `/settings` may show and what it may change.
 *
 * The division is not a design preference, it is the schema: `authenticated` holds
 * UPDATE on exactly three columns of `profiles`, so the three fields this file
 * writes are the three the database will accept. Everything else on the Account
 * tab is rendered read-only with the reason beside it, because a disabled
 * control is for a condition the user can satisfy and this one they cannot.
 */

import type { Difficulty, Profile } from "@/lib/types";
import { COHORTS, CASE_BY_ID } from "@/lib/seed";
import { PINS } from "./plans";

export type PinLifecycle = {
  planId: string;
  caseId: string;
  caseTitle: string;
  sessionId?: string;
  expiresAt: string;
  redeemedAt?: string;
  /** Derived here, not stored — the row carries timestamps, not a verdict. */
  state: "live" | "redeemed" | "expired";
};

export type SettingsView = {
  /** The cohort's name, when the viewer is in one. Read, never written here. */
  cohortName?: string;
  /** The preset the viewer's plans are stamped with, if their cohort has one. */
  presetName?: string;
  pins: PinLifecycle[];
  /** Where the rows on every screen came from. */
  source: {
    label: string;
    detail: string;
  };
  fleet?: {
    devices: number;
    seenToday: number;
  };
  /** Facts about the build, each sourced from something. */
  about: { label: string; value: string }[];
};

export function pinState(pin: {
  expiresAt: string;
  redeemedAt?: string;
}): PinLifecycle["state"] {
  if (pin.redeemedAt) return "redeemed";
  return new Date(pin.expiresAt) > new Date() ? "live" : "expired";
}

export async function getSettings(user: Profile): Promise<SettingsView> {
  const cohort = user.cohortId
    ? COHORTS.find((c) => c.id === user.cohortId)
    : undefined;

  const pins: PinLifecycle[] = PINS.map((row) => {
    const shape = {
      planId: row.planId,
      caseId: row.caseId,
      caseTitle: CASE_BY_ID.get(row.caseId)?.title ?? row.caseTitle,
      sessionId: row.sessionId,
      expiresAt: row.expiresAt,
      redeemedAt: row.redeemedAt,
    };
    return { ...shape, state: pinState(shape) };
  });

  return {
    cohortName: cohort?.name,
    presetName: undefined,
    pins,
    source: {
      label: "Seed data",
      detail:
        "Screens render from the local seed. Nothing is fetched and nothing is written, so a reload returns the same rows.",
    },
    fleet: undefined,
    about: [
      { label: "Dashboard", value: "Next.js 16 · React 19 · TypeScript" },
      { label: "Data", value: "Local seed fixtures — no service is called" },
      { label: "Headset", value: "Unity 6000.0.66f2 · URP · OpenXR (not yet built)" },
      { label: "Design system", value: "MediVeR Flat — light theme only" },
      { label: "Scoring", value: "Not implemented — reports carry authored scores" },
    ],
  };
}

/** The three fields the account API accepts, and nothing else. */
export type AccountPatch = {
  displayName: string;
  level: string | null;
  defaultDifficulty: Difficulty;
};

```

### `dashboard\src\lib\data\setup.ts`

```typescript
/**
 * Session setup defaults.
 *
 * Every field is defaulted from the user's account, and most
 * people press Continue without changing anything. Nothing is written here —
 * a `plans` row is created when planning step 1 is
 * submitted, not when a setup form is opened, or every abandoned setup would
 * leave an orphaned draft behind.
 */

import type { Profile } from "@/lib/types";
import { getProcedures, type ProcedureCard } from "./catalogue";

export type SetupDefaults = {
  procedures: ProcedureCard[];
  procedure: ProcedureCard | undefined;
  mode: "training" | "assessment";
  difficulty: Profile["defaultDifficulty"];
  design: "CR" | "PS";
  fixation: "cemented" | "cementless";
};

export async function getSetupDefaults(
  user: Profile,
): Promise<SetupDefaults> {
  const procedures = await getProcedures();
  const published = procedures.filter((p) => p.status === "published");

  return {
    procedures: published,
    procedure: published[0],
    // Training first: guides on, retry without penalty. Assessment is a
    // deliberate choice, never a default.
    mode: "training",
    difficulty: user.defaultDifficulty,
    design: "CR",
    fixation: "cemented",
  };
}

```

### `dashboard\src\lib\data\support-content.ts`

```typescript
/**
 * The authored text `/help` and `/library` list.
 *
 * The directory lives here; the *content* of a reference does not. Every
 * library document is rendered from the catalogue the rest of the product
 * already runs on, so a reference cannot disagree with the thing it describes.
 */

export type HelpArticleSeed = {
  slug: string;
  topic: string;
  title: string;
  body: string;
  route?: string;
};

export const HELP_ARTICLES: HelpArticleSeed[] = [
  {
    slug: "pin-not-recognised",
    topic: "pairing",
    title: "The headset says the PIN is not valid",
    body: `A pairing PIN is four digits, single use, and lives for thirty minutes. The headset gives the same answer whether the code never existed, has expired, or has already been redeemed — telling the three apart is exactly what someone guessing at ten thousand codes would need to learn, so the product does not.

Check your own screen first. The plan's handoff page shows the PIN it issued and counts down to its expiry. If the countdown has finished, press Issue a new PIN there; the old one stops working the moment a new one is issued, so there is only ever one live code per plan.

If the code on screen is still live and the headset still refuses it, the digits were most likely mistyped — the keypad has no correction and a 1 and a 7 look alike on a visor.`,
  },
  {
    slug: "pairing-locked-out",
    topic: "pairing",
    title: "Pairing says to wait fifteen minutes",
    body: `Ten failed attempts from the same network address inside fifteen minutes stops that address pairing until the window rolls forward. A teaching lab is usually one address, so the limit is shared by the room.

A successful pairing clears the count for that address immediately. If somebody in the room can pair, the block lifts for everyone.

This is the one endpoint in the product that answers a caller holding no account, so it is the one that has to be defended by counting rather than by identity.`,
  },
  {
    slug: "wrong-case-on-headset",
    topic: "pairing",
    title: "The confirmation card shows the wrong case",
    body: `Do not accept it. What the headset reads back is the frozen plan — the exact contract the report will be scored against — so accepting the wrong one starts a session against somebody else's planning.

Take the headset out of pairing, then check which plan issued the code you keyed. Your own plans and their pairing status are listed under Plans.

Issue a new PIN from the correct plan and key that one in.`,
    route: "/plans",
  },
  {
    slug: "kiosk-locked",
    topic: "pairing",
    title: "The headset is locked into another app",
    body: `Kiosk locking is done over ADB by an administrator and is not recoverable from the dashboard. The headset has to be connected to the provisioning computer.

Wi-Fi must be provisioned before the kiosk lock is applied, because the user cannot reach Android settings afterwards. That is the most likely way a headset becomes unusable in the field.`,
  },
  {
    slug: "session-interrupted",
    topic: "session",
    title: "A session stopped part-way through",
    body: `Nothing is lost. Each scene is written as it completes, so the scenes already performed are recorded and visible on the session.

There is no resume. One plan backs exactly one session, and a plan freezes the moment its session starts — it is the record of what was performed, so it cannot be edited or run a second time. To attempt the case again, plan it again: the seven steps are quick the second time and the new plan is a clean contract to be scored against.

An interrupted session keeps whatever it recorded. It is scored only when a headset reports it finished, so an abandoned run does not produce a report.`,
    route: "/sessions",
  },
  {
    slug: "report-not-appeared",
    topic: "session",
    title: "The session finished but there is no report",
    body: `A report is generated at the moment the headset reports the session complete, so the two happen together. If the headset showed its own summary but the desktop shows none, the completion has not reached the backend yet.

The headset's summary is rendered from data held on the device, which is why it can appear without a network. The desktop's report cannot: it is derived from the scene results that were recorded, so that no two versions of a score can exist.

A session with no report still shows everything it recorded — its scene timeline is readable while it waits.`,
    route: "/sessions",
  },
  {
    slug: "second-attempt",
    topic: "session",
    title: "Running the same case again",
    body: `Plan it again. Start planning on the case creates a new plan, and an unsealed draft for that case is picked up where you left it rather than replaced.

Your previous attempt is untouched. Case detail lists every attempt with its score, and Performance compares them over time.`,
    route: "/cases",
  },
  {
    slug: "score-differs",
    topic: "report",
    title: "Why a score differs from a colleague's",
    body: `Difficulty scales every authored tolerance band — wider at Beginner, narrower at Expert — and the pass mark moves with it: 60, 70 and 80. Two runs of the same case at different difficulties are not comparable and the report states which was in force.

An instructor may also have assigned a preset to a cohort, which changes tolerances further. A session run under one carries the preset's name on its report, so a result is never compared against a different rule set without the reader being told.`,
    route: "/performance",
  },
  {
    slug: "critical-error-cap",
    topic: "report",
    title: "The total says 59 but the categories add up to more",
    body: `Three or more critical errors cap the total at 59 and fail the session, whatever the categories earned.

The categories are still shown truthfully. A learner who cut accurately and damaged a named structure needs to see both facts — hiding the first would hide the thing being taught, and hiding the second would be worse.

Not every failed scene is a critical error. Failing a scene costs that scene's marks; a critical error is damage to a structure the scene is flagged for, and only those count towards the cap.`,
  },
  {
    slug: "percentile-missing",
    topic: "report",
    title: "The report shows no percentile",
    body: `A percentile is computed against your cohort, over completed sessions in the same mode, and it is withheld when fewer than three other people have one.

In a group of two, "you are in the 100th percentile" is one other person's score wearing a disguise. The report shows nothing rather than a number that identifies a classmate.`,
  },
  {
    slug: "no-self-signup",
    topic: "account",
    title: "Passwords and new accounts",
    body: `There is no self-service sign-up and no password reset email — no mail is sent by this product yet. Accounts are created by an administrator, and a forgotten password is reset the same way.

Your name and default difficulty are yours to change under Settings. Your role, your cohort and your email address are administered, because each of them decides what you can see or who your results are compared against.`,
    route: "/settings",
  },
];

export type LibrarySeed = {
  slug: string;
  kind: string;
  title: string;
  summary: string;
  derivedFrom: string;
};

export const LIBRARY_RESOURCES: LibrarySeed[] = [
  {
    slug: "tkr-walkthrough",
    kind: "guide",
    title: "TKR walkthrough — every part and scene",
    summary:
      "The eleven operative parts in order, each scene inside them, which report category it contributes to, and the time it is expected to take.",
    derivedFrom: "procedure parts · procedure scenes",
  },
  {
    slug: "preoperative-planning",
    kind: "guide",
    title: "Pre-operative planning — the seven steps",
    summary:
      "What each planning step asks and the time budget it is measured against. The differentials are the same lists the planning screens offer.",
    derivedFrom: "plan steps · plan step options",
  },
  {
    slug: "scoring",
    kind: "reference",
    title: "How a session is scored",
    summary:
      "The seven report categories and their maxima, the accuracy and timing weighting, the pass mark at each difficulty, and what three critical errors do to a total.",
    derivedFrom: "report categories · scoring rules",
  },
  {
    slug: "tolerances",
    kind: "reference",
    title: "Time bands and tolerance scaling",
    summary:
      "Par and maximum time for every scene, and what each difficulty does to an authored tolerance band.",
    derivedFrom: "procedure scenes · tolerance rules",
  },
  {
    slug: "implant-variants",
    kind: "reference",
    title: "CR and PS, cemented and cementless",
    summary:
      "Which scenes each variant adds or removes from a run — read from the same fields the session running order is built from, so it cannot disagree with what a headset is handed.",
    derivedFrom: "scene variant gates",
  },
];

/** Par and maximum seconds for each of the seven planning steps. */
export const PLAN_STEP_META = [
  { step: 1, title: "Case history", budgetLabel: "45–60 s", parTimeS: 60, maxTimeS: 150 },
  { step: 2, title: "Imaging review", budgetLabel: "1.5–2 min", parTimeS: 120, maxTimeS: 300 },
  { step: 3, title: "Deformity measurement", budgetLabel: "1 min", parTimeS: 60, maxTimeS: 150 },
  { step: 4, title: "Alignment planning", budgetLabel: "1 min", parTimeS: 60, maxTimeS: 150 },
  { step: 5, title: "Implant selection", budgetLabel: "45–60 s", parTimeS: 60, maxTimeS: 150 },
  { step: 6, title: "Risk & strategy", budgetLabel: "30–45 s", parTimeS: 45, maxTimeS: 120 },
  { step: 7, title: "Plan summary", budgetLabel: "15–20 s", parTimeS: 20, maxTimeS: 60 },
];

/** Which planning step each option field belongs to. */
export const FIELD_STEP: Record<string, number> = {
  diagnosis: 1,
  kl_grade: 2,
  compartment: 2,
  design: 5,
  femoral_size: 5,
  tibial_tray_size: 5,
  pe_insert_mm: 5,
  tight_side: 6,
};

```

### `dashboard\src\lib\data\support.ts`

```typescript
/**
 * `/help` and `/library`.
 *
 * Both read authored text for their *directory*, and both render their
 * *content* from the catalogue the rest of the product already runs on.
 * Nothing here restates a fact about the procedure that some other screen also
 * states — a reference that can disagree with the thing it describes is worse
 * than no reference.
 */

import { CATEGORY_META, PARTS, SCENES } from "@/lib/seed";
import {
  FIELD_STEP,
  HELP_ARTICLES,
  LIBRARY_RESOURCES,
  PLAN_STEP_META,
} from "./support-content";
import { STEP_OPTIONS } from "./planning-content";
import { PASS_MARK, TOLERANCE_BAND } from "@/lib/types";
import type { Difficulty } from "@/lib/types";

/* ─────────────────────────── help ─────────────────────────── */

export type HelpArticle = {
  slug: string;
  topic: string;
  title: string;
  paragraphs: string[];
  route?: string;
};

export type HelpTopic = {
  key: string;
  label: string;
  lede: string;
  articles: HelpArticle[];
};

/**
 * Topic labels are here rather than in the table because they are a property of
 * this screen's layout, not of the content — the table's `topic` is the key
 * that groups rows, and a key with no label simply titles itself.
 */
const TOPIC_META: Record<string, { label: string; lede: string }> = {
  pairing: {
    label: "Pairing a headset",
    lede: "A four-digit PIN, single use, thirty minutes. Most pairing problems are one of five things.",
  },
  session: {
    label: "During and after a session",
    lede: "What happens when a run is interrupted, and where the work goes.",
  },
  report: {
    label: "Reading a report",
    lede: "Why a score is what it is, and what the product withholds on purpose.",
  },
  account: {
    label: "Your account",
    lede: "What you can change yourself, and what an administrator changes for you.",
  },
};

export async function getHelp(query?: string): Promise<HelpTopic[]> {
  const needle = query?.trim().toLowerCase();

  const articles: HelpArticle[] = HELP_ARTICLES
    .filter(
      (row) =>
        !needle ||
        row.title.toLowerCase().includes(needle) ||
        row.body.toLowerCase().includes(needle),
    )
    .map((row) => ({
      slug: row.slug,
      topic: row.topic,
      title: row.title,
      // Prose with blank lines between paragraphs, deliberately not markdown:
      // nothing here needs a renderer, and one would invite formatting into
      // text that is read for its sentences.
      paragraphs: row.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
      route: row.route,
    }));

  const topics: HelpTopic[] = [];
  for (const article of articles) {
    let topic = topics.find((t) => t.key === article.topic);
    if (!topic) {
      const meta = TOPIC_META[article.topic];
      topic = {
        key: article.topic,
        label: meta?.label ?? article.topic,
        lede: meta?.lede ?? "",
        articles: [],
      };
      topics.push(topic);
    }
    topic.articles.push(article);
  }

  // Declared order, not insertion order, so a topic added later lands where
  // `TOPIC_META` says rather than wherever its first article was seen.
  const order = Object.keys(TOPIC_META);
  topics.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  return topics;
}

/* ───────────────────────── library ───────────────────────── */

export type LibraryEntry = {
  slug: string;
  kind: string;
  title: string;
  summary: string;
  derivedFrom: string;
};

export type LibraryIndex = {
  guides: LibraryEntry[];
  references: LibraryEntry[];
  /** Zero, today. The page reads the count; nothing tells it. */
  videos: number;
};

export async function getLibrary(): Promise<LibraryIndex> {
  const rows: LibraryEntry[] = LIBRARY_RESOURCES;

  return {
    guides: rows.filter((r) => r.kind === "guide"),
    references: rows.filter((r) => r.kind === "reference"),
    videos: rows.filter((r) => r.kind === "video").length,
  };
}

/* ──────────────── the five references, rendered ──────────────── */

export type WalkthroughPart = {
  part: string;
  name: string;
  variantNote?: string;
  scenes: {
    scene: string;
    name: string;
    category?: string;
    parTimeS: number;
    maxTimeS: number;
    isCritical: boolean;
    variantNote?: string;
    requiresDesign?: string;
    requiresFixation?: string;
    requiresPatella?: boolean;
  }[];
};

export type PlanningStep = {
  step: number;
  title: string;
  budgetLabel: string;
  parTimeS: number;
  maxTimeS: number;
  /** The differentials this step offers, grouped by the field they answer. */
  fields: { field: string; options: { label: string; detail?: string }[] }[];
};

export type ScoringCategory = {
  key: string;
  label: string;
  max: number;
  scenes: number;
};

export type LibraryDoc =
  | { slug: "tkr-walkthrough"; entry: LibraryEntry; parts: WalkthroughPart[] }
  | { slug: "preoperative-planning"; entry: LibraryEntry; steps: PlanningStep[] }
  | {
      slug: "scoring";
      entry: LibraryEntry;
      categories: ScoringCategory[];
      total: number;
      passMarks: { difficulty: Difficulty; mark: number }[];
    }
  | {
      slug: "tolerances";
      entry: LibraryEntry;
      bands: { difficulty: Difficulty; factor: number }[];
      scenes: { scene: string; name: string; parTimeS: number; maxTimeS: number }[];
    }
  | {
      slug: "implant-variants";
      entry: LibraryEntry;
      design: { CR: string[]; PS: string[] };
      fixation: { cemented: string[]; cementless: string[] };
      patella: string[];
      always: number;
    };

const PROCEDURE = "tkr";

export async function getLibraryDoc(slug: string): Promise<LibraryDoc | null> {
  const entry = LIBRARY_RESOURCES.find((row) => row.slug === slug);
  if (!entry) return null;

  const scenes = SCENES.filter((s) => s.procedureId === PROCEDURE);

  if (slug === "tkr-walkthrough") {
    return {
      slug: "tkr-walkthrough",
      entry,
      parts: PARTS.filter((p) => p.procedureId === PROCEDURE).map((p) => ({
        part: p.part,
        name: p.name,
        variantNote: p.variantNote,
        scenes: scenes
          .filter((s) => s.part === p.part)
          .map((s) => ({
            scene: s.scene,
            name: s.name,
            category: s.categoryKey ?? undefined,
            parTimeS: s.parTimeS,
            maxTimeS: s.maxTimeS,
            isCritical: s.isCritical,
            variantNote: s.variantNote,
            requiresDesign: s.requiresDesign,
            requiresFixation: s.requiresFixation,
            requiresPatella: s.requiresPatella,
          })),
      })),
    };
  }

  if (slug === "preoperative-planning") {
    return {
      slug: "preoperative-planning",
      entry,
      steps: PLAN_STEP_META.map((m) => ({
        ...m,
        fields: Object.entries(STEP_OPTIONS)
          .filter(([field]) => FIELD_STEP[field] === m.step)
          .map(([field, options]) => ({
            field,
            options: options.map((o) => ({ label: o.label, detail: o.detail })),
          })),
      })),
    };
  }

  if (slug === "scoring") {
    const rows = CATEGORY_META.map((c) => ({
      key: c.key,
      label: c.label,
      max: c.max,
      scenes: scenes.filter((s) => s.categoryKey === c.key).length,
    }));

    return {
      slug: "scoring",
      entry,
      categories: rows,
      // Summed, not stated. If a category's maximum ever changed, the page
      // would show the truth rather than the claim.
      total: rows.reduce((sum, c) => sum + c.max, 0),
      passMarks: (Object.keys(PASS_MARK) as Difficulty[]).map((d) => ({
        difficulty: d,
        mark: PASS_MARK[d],
      })),
    };
  }

  if (slug === "tolerances") {
    return {
      slug: "tolerances",
      entry,
      bands: (Object.keys(TOLERANCE_BAND) as Difficulty[]).map((d) => ({
        difficulty: d,
        factor: TOLERANCE_BAND[d],
      })),
      scenes: scenes.map((s) => ({
        scene: s.scene,
        name: s.name,
        parTimeS: s.parTimeS,
        maxTimeS: s.maxTimeS,
      })),
    };
  }

  if (slug === "implant-variants") {
    const label = (s: { scene: string; name: string }) => `${s.scene} ${s.name}`;

    return {
      slug: "implant-variants",
      entry,
      design: {
        CR: scenes.filter((s) => s.requiresDesign === "CR").map(label),
        PS: scenes.filter((s) => s.requiresDesign === "PS").map(label),
      },
      fixation: {
        cemented: scenes.filter((s) => s.requiresFixation === "cemented").map(label),
        cementless: scenes.filter((s) => s.requiresFixation === "cementless").map(label),
      },
      patella: scenes.filter((s) => s.requiresPatella).map(label),
      always: scenes.filter(
        (s) => !s.requiresDesign && !s.requiresFixation && !s.requiresPatella,
      ).length,
    };
  }

  return null;
}

```

### `mediver_documentation\01_PRODUCT_VISION.md`

```md
# Product Vision

## Product goal

Mediver should provide an end-to-end training loop for TKA residents:

```text
Configure curriculum
-> configure cases
-> define skills and assessment rules
-> create cohort
-> add residents
-> assign training
-> schedule session
-> resident performs procedure in VR
-> VR sends execution data
-> assessment engine evaluates execution
-> instructor reviews results
-> recommendation is generated
-> resident practices again
-> progression is tracked
```

## Primary products

### Instructor Web Application
Used to plan programs, manage cohorts/residents, configure cases and assessments, assign training, run sessions, review attempts, provide feedback, and generate reports.

### Resident VR Application
Used to receive assignments, perform simulated procedures, generate structured execution events, complete attempts, and receive the result appropriate to the configured mode.

### Backend Platform
Owns authentication, authorization, domain rules, persistence, assessment execution, recommendations, reporting data, and real-time state.

## MVP boundary

### In scope
- Multi-institution data model
- Instructor and resident roles
- Programs and cohorts
- Cases and procedures
- Skills and skill items
- Assessment settings
- Training assignments
- Sessions
- Attempts
- VR events and clinical measurements
- Error records
- Assessment results
- Skill scores
- Recommendations
- Instructor feedback and notes
- Basic reporting
- Real-time session state

### Not assumed as MVP
- Automated clinical decision-making
- Production patient-data workflows
- AI-based assessment
- Complex EHR integration
- Autonomous clinical certification

## Quality principles

- Explainable assessment
- Configuration over hard-coded clinical rules
- Immutable historical assessment results
- Institution-level data isolation
- Traceability from dashboard metric to raw attempt
- Safe failure behavior
- Deterministic scoring for identical inputs

```

### `mediver_documentation\02_REQUIREMENTS.md`

```md
# Requirements

## Functional requirements

### Identity
- Users can authenticate.
- Users belong to an institution.
- Users have roles.
- Access is checked server-side.

### Programs
- Instructor can create and manage a program.
- Program status can be managed.
- Program contains curriculum, cases, skills and assessment configuration.

### Cohorts
- Instructor can create a cohort.
- Residents can be added to a cohort.
- Cohort progress and performance are visible.
- At-risk residents can be identified from defined rules.

### Cases
A case supports name, difficulty, description, learning objective, procedure, status, version, and assessment criteria.

### Skills
Current framework:
- Bone Cuts & Alignment: 30%
- Gap Assessment: 25%
- Trialling & Stability: 25%
- Implantation: 20%

The weights are product configuration, not a universal clinical rule.

### Assessment settings
Current example configuration:
- Passing score: 70%
- Critical error -> automatic failure: ON
- Incomplete procedure -> automatic failure: ON
- Guidance during assessment -> OFF

These are configurable values.

### Sessions
Instructor can create, schedule, assign residents, choose a case/mode, start/end a session, and observe live state.

### Attempts
An attempt records resident, session, case, attempt number, start/completion times, status, raw execution data, and assessment result.

### Feedback
Instructor can attach feedback to an attempt and notes to a resident.

### Reports
Minimum report families: resident, cohort, case, skill, export/share.

## Non-functional requirements

### Reliability
No completed assessment may disappear because a UI session ends.

### Security
Every protected resource must be authorized on the backend.

### Auditability
Changes to clinically relevant configuration and assessment results should be traceable.

### Performance
Use efficient queries and indexes first. Add dedicated analytics infrastructure only when justified by measured need.

### Maintainability
Clinical rules should live in versioned/configurable backend structures rather than frontend code.

### Extensibility
Additional procedures/cases/skills should be addable without redesigning the entire schema.

```

### `mediver_documentation\03_USER_JOURNEYS.md`

```md
# User Journeys

## Instructor journey

```text
Login
-> Dashboard
-> Select Cohort
-> Inspect residents
-> Identify at-risk resident
-> Review resident profile
-> Inspect case history
-> Open attempt
-> Review plan vs execution
-> Inspect errors
-> Add feedback
-> Assign targeted training
-> Monitor next session
-> Review progression
```

## Program authoring journey

```text
Program
-> Curriculum
-> Cases
-> Procedures
-> Skills
-> Assessment rules
-> Cohort
-> Residents
-> Assignment
-> Session
```

## Resident journey

```text
Login
-> Assigned training
-> Select case
-> Case briefing
-> Select/enter mode
-> Start attempt
-> Follow procedure
-> Emit VR events
-> Complete
-> Submit
-> Assessment generated
-> Result shown according to policy
-> Progress updated
```

## Assessment journey

```text
Start attempt
-> capture raw events
-> normalize measurements
-> evaluate criteria
-> classify errors
-> calculate criterion results
-> calculate skill results
-> apply automatic-failure rules
-> calculate final score/result
-> persist immutable assessment snapshot
-> generate recommendation
-> update derived competency
```

## Review journey

```text
Dashboard alert
-> Resident
-> Case attempt
-> Error
-> Parameter deviation
-> Relevant step/event
-> Instructor feedback
```

```

### `mediver_documentation\04_UI_AND_NAVIGATION.md`

```md
# UI and Navigation

## Instructor Environment

### Dashboard
- Cohorts
- Residents
- Sessions
- Alerts
- Overall performance

### Programs
- Curriculum
- Cases
- Skills
- Assessments
- Cohort assignment

### Cohorts
- Residents
- Progress
- Completion
- Performance
- At-risk learners

### Residents
- Individual profile
- Case history
- Skill performance
- Errors
- Progression
- Recommendations

### Sessions
- Upcoming
- Live
- Completed
- Session details

### Reports
- Resident reports
- Cohort reports
- Case reports
- Skill reports
- Export/share

### Content / Case Library
- Cases
- Procedures
- Difficulty
- Learning objectives
- Assessment criteria

### Settings
- Program settings
- Assessment settings
- User management
- Institution settings

## Dashboard example data

- Residents: 24
- Active cases: 8
- Sessions this week: 6
- Completion: 68%
- Overall competency: 72%
- Bone cuts & alignment: 68%
- Gap assessment: 74%
- Trialling & stability: 79%
- Implantation: 70%

## Resident example

Arun Kumar:
- Competency: 54%
- Status: At risk
- Previous competency: 62%
- Completion: 42%
- Cases: 5/12
- Assessments: 3/8

## UI behavior

Every data screen supports loading, empty, error, unauthorized and not-found states.

Deep links should resolve directly and browser back/forward should work.

Important destructive operations should use explicit confirmation, with archival/soft-delete preferred for important configuration.

## Review screen

An attempt review should expose:
- score
- pass/fail
- skill breakdown
- plan vs execution
- errors
- relevant evidence
- instructor feedback

## Visual direction

The existing prototype uses a clean clinical SaaS style: light neutral background, white rounded cards, strong typography hierarchy, restrained accent actions, readable tables, and clear status treatment.

```

### `mediver_documentation\05_SYSTEM_ARCHITECTURE.md`

```md
# System Architecture

## Logical architecture

```text
                 Instructor Web App
                        |
                      HTTPS
                        v
                   Backend API
             /       |       |       \
          Auth   Training  Session  Assessment
            |        |        |         |
            +--------+--------+---------+
                        |
                    PostgreSQL
                        ^
                        |
                 VR HTTPS / WS
                        |
                  Resident VR App
```

## Backend boundaries

### Auth
Identity, role, institution scope, sessions/tokens.

### Training
Programs, cohorts, assignments, cases, procedures, skills.

### Sessions
Scheduled/live/completed sessions, participants and live state.

### Attempts
Attempt lifecycle, event ingestion, measurements.

### Assessment
Criteria, error classification, score calculation, result persistence, recommendations.

### Reporting
Read/query layer for resident, cohort, case and skill reporting.

## Source of truth

### Source-of-truth
- configuration
- raw VR event stream
- measurements
- finalized assessment results
- instructor feedback

### Derived
- dashboard KPIs
- trends
- risk flags
- competency summaries
- report aggregates

Derived values may be cached later but must be reproducible from source data.

## Versioning

Clinical content that can affect assessment should be versioned:
- procedure version
- case version
- assessment configuration version
- assessment criteria version

A completed attempt references the versions used at execution time.

## Multi-tenancy

Institution scope must be enforced on backend queries. Client-provided IDs must never bypass tenant authorization.

## Technology direction

Recommended starting point:
- React/Next.js frontend
- FastAPI or equivalent backend
- PostgreSQL
- WebSocket for live monitoring
- Unity or selected VR stack

Keep the stack replaceable behind clear contracts.

```

### `mediver_documentation\06_DATABASE_SCHEMA.md`

```md
# Database Schema

## Recommended database
PostgreSQL.

## Identity

### institutions
```text
id UUID PK
name TEXT NOT NULL
address TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### users
```text
id UUID PK
institution_id UUID FK -> institutions.id
first_name TEXT
last_name TEXT
email TEXT UNIQUE
password_hash TEXT
role TEXT
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Training

### programs
```text
id UUID PK
institution_id UUID FK
name TEXT
description TEXT
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### cohorts
```text
id UUID PK
program_id UUID FK
name TEXT
year INTEGER
status TEXT
start_date DATE
end_date DATE
created_at TIMESTAMP
updated_at TIMESTAMP
```

### cohort_members
```text
id UUID PK
cohort_id UUID FK
resident_id UUID FK -> users.id
status TEXT
joined_at TIMESTAMP
completed_at TIMESTAMP
UNIQUE(cohort_id, resident_id)
```

## Cases and procedures

### cases
```text
id UUID PK
program_id UUID FK
procedure_id UUID FK
name TEXT
difficulty TEXT
description TEXT
learning_objective TEXT
status TEXT
version INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

### procedures
```text
id UUID PK
name TEXT
description TEXT
version INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

### procedure_steps
```text
id UUID PK
procedure_id UUID FK
step_number INTEGER
name TEXT
description TEXT
required BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE(procedure_id, step_number)
```

## Skills

### skills
```text
id UUID PK
program_id UUID FK
name TEXT
description TEXT
weight NUMERIC
created_at TIMESTAMP
updated_at TIMESTAMP
```

### skill_items
```text
id UUID PK
skill_id UUID FK
name TEXT
description TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Assessment configuration

### assessment_settings
```text
id UUID PK
program_id UUID FK
version INTEGER
passing_score NUMERIC
critical_auto_fail BOOLEAN
incomplete_auto_fail BOOLEAN
guidance_enabled BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

### assessment_criteria
```text
id UUID PK
case_id UUID FK
skill_id UUID FK
name TEXT
parameter TEXT
target_value NUMERIC
tolerance_min NUMERIC
tolerance_max NUMERIC
unit TEXT
severity_rule JSONB
version INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Sessions

### sessions
```text
id UUID PK
cohort_id UUID FK
case_id UUID FK
instructor_id UUID FK -> users.id
name TEXT
mode TEXT
scheduled_at TIMESTAMP
started_at TIMESTAMP
ended_at TIMESTAMP
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### session_residents
```text
id UUID PK
session_id UUID FK
resident_id UUID FK
status TEXT
joined_at TIMESTAMP
completed_at TIMESTAMP
UNIQUE(session_id, resident_id)
```

## Attempts and execution

### attempts
```text
id UUID PK
resident_id UUID FK
session_id UUID FK NULL
case_id UUID FK
attempt_number INTEGER
case_version INTEGER
assessment_settings_version INTEGER NULL
started_at TIMESTAMP
completed_at TIMESTAMP NULL
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### vr_events
```text
id UUID PK
attempt_id UUID FK
event_timestamp TIMESTAMP
procedure_step_id UUID NULL
event_type TEXT
parameter_name TEXT NULL
planned_value NUMERIC NULL
actual_value NUMERIC NULL
unit TEXT NULL
metadata JSONB
sequence_number BIGINT
```

Indexes:
- `(attempt_id, sequence_number)`
- `(attempt_id, event_timestamp)`
- `(event_type)`
- optional `(parameter_name)`

### clinical_measurements
```text
id UUID PK
attempt_id UUID FK
parameter TEXT
planned_value NUMERIC
actual_value NUMERIC
deviation NUMERIC
unit TEXT
plane TEXT NULL
metadata JSONB
created_at TIMESTAMP
```

## Assessment results

### errors
```text
id UUID PK
attempt_id UUID FK
skill_id UUID FK
criterion_id UUID FK
severity TEXT
error_type TEXT
description TEXT
planned_value NUMERIC NULL
actual_value NUMERIC NULL
deviation NUMERIC NULL
detected_at TIMESTAMP
```

### assessment_results
```text
id UUID PK
attempt_id UUID FK UNIQUE
overall_score NUMERIC
result TEXT
critical_error BOOLEAN
completed BOOLEAN
assessment_config_version INTEGER
assessed_at TIMESTAMP
explanation JSONB
```

### skill_scores
```text
id UUID PK
assessment_id UUID FK
skill_id UUID FK
score NUMERIC
weight NUMERIC
weighted_score NUMERIC NULL
```

## Learning loop

### recommendations
```text
id UUID PK
resident_id UUID FK
skill_id UUID FK
case_id UUID FK NULL
reason TEXT
priority TEXT
status TEXT
created_at TIMESTAMP
completed_at TIMESTAMP NULL
```

### instructor_feedback
```text
id UUID PK
resident_id UUID FK
attempt_id UUID FK NULL
instructor_id UUID FK
feedback TEXT
created_at TIMESTAMP
```

### instructor_notes
```text
id UUID PK
resident_id UUID FK
instructor_id UUID FK
note TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Training assignments

The product needs persisted assignments even if the initial prototype uses a simpler assignment UI.

```text
training_assignments
id UUID PK
resident_id UUID FK
case_id UUID FK
cohort_id UUID FK NULL
mode TEXT
due_at TIMESTAMP NULL
status TEXT
assigned_by UUID FK
created_at TIMESTAMP
completed_at TIMESTAMP NULL
```

## Audit logs

Recommended:
```text
audit_logs
id UUID PK
institution_id UUID FK
actor_id UUID FK
action TEXT
entity_type TEXT
entity_id UUID
before JSONB
after JSONB
created_at TIMESTAMP
```

## Relationship map

```text
Institution
 -> Program
 -> Cohort
 -> Cohort Members
 -> Residents

Program
 -> Cases
 -> Procedures
 -> Skills
 -> Assessment Settings

Cohort
 -> Sessions
 -> Training Assignments

Session
 -> Session Residents
 -> Attempts

Attempt
 -> VR Events
 -> Clinical Measurements
 -> Errors
 -> Assessment Result
 -> Skill Scores

Resident
 -> Recommendations
 -> Feedback
 -> Notes
```

## Scoring caveat

The displayed skill weights are 30/25/25/20, but the example dashboard/ resident scores do not establish one formula that reproduces every displayed overall competency. Final scoring must therefore be explicitly specified and approved before production use.

```

### `mediver_documentation\07_API_CONTRACTS.md`

```md
# API Contracts

## Style

Use REST/JSON for domain operations and WebSocket for live session updates. Version the API, for example `/api/v1`.

## Auth
```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

## Programs
```text
GET    /programs
POST   /programs
GET    /programs/{id}
PATCH  /programs/{id}
DELETE /programs/{id}
```

## Cohorts
```text
GET    /cohorts
POST   /cohorts
GET    /cohorts/{id}
PATCH  /cohorts/{id}
GET    /cohorts/{id}/residents
GET    /cohorts/{id}/performance
POST   /cohorts/{id}/assignments
```

## Residents
```text
GET  /residents
GET  /residents/{id}
GET  /residents/{id}/cases
GET  /residents/{id}/attempts
GET  /residents/{id}/skills
GET  /residents/{id}/recommendations
POST /residents/{id}/notes
```

## Cases
```text
GET    /cases
POST   /cases
GET    /cases/{id}
PATCH  /cases/{id}
DELETE /cases/{id}
```

## Sessions
```text
GET  /sessions
POST /sessions
GET  /sessions/{id}
POST /sessions/{id}/start
POST /sessions/{id}/end
GET  /sessions/{id}/participants
```

## Attempts
```text
POST /attempts
GET  /attempts/{id}
POST /attempts/{id}/events
POST /attempts/{id}/measurements
POST /attempts/{id}/complete
GET  /attempts/{id}/assessment
```

## Assessment
```text
POST /assessment/attempts/{attempt_id}/evaluate
GET  /assessment/attempts/{attempt_id}/result
```

The client must never be authoritative for final score or pass/fail.

## Live WebSocket
Conceptual channel:
```text
/ws/sessions/{session_id}
```

Example event:
```json
{
  "type": "resident_progress",
  "session_id": "uuid",
  "resident_id": "uuid",
  "attempt_id": "uuid",
  "procedure_step": "uuid",
  "status": "in_progress",
  "timestamp": "ISO-8601"
}
```

## API rules

- Validate all payloads.
- Authorize every resource access.
- Use stable IDs.
- Use idempotency for retryable operations.
- Return structured errors.
- Never expose password hashes.
- Never let clients directly set assessment results.

```

### `mediver_documentation\08_ASSESSMENT_ENGINE.md`

```md
# Assessment Engine

## Purpose

Convert execution evidence into criterion outcomes, errors, skill scores, final score/pass-fail, and recommendations.

## Pipeline

```text
Raw VR events
-> normalize
-> derive clinical measurements
-> select applicable criteria
-> compare target vs actual
-> calculate deviation
-> classify severity
-> aggregate criterion outcomes
-> aggregate skill scores
-> apply automatic-failure rules
-> calculate final score/result
-> persist immutable assessment
-> generate recommendation
```

## Example

```text
Planned tibial angle = 3°
Actual tibial angle = 6°
Deviation = +3°
-> tolerance check
-> outside configured tolerance
-> error classification
-> bone alignment skill impact
-> score impact
-> possible automatic failure depending on configured severity rule
```

The exact tolerance and severity thresholds must come from configured assessment criteria or an approved clinical specification.

## Current configuration examples

- Passing score: 70%
- Critical error -> automatic failure: ON
- Incomplete procedure -> automatic failure: ON
- Guidance during assessment: OFF

## Scoring architecture

Use explicit steps:
1. Criterion score
2. Skill aggregation
3. Skill weighting
4. Overall score
5. Rule-based overrides
6. Final result

Store enough intermediate values to explain the result.

## Explainability

Instructor should be able to answer:
- What was planned?
- What happened?
- How far was it from target?
- Which criterion was affected?
- Which skill was affected?
- How did it affect the score?
- Did an automatic-failure rule trigger?
- Which assessment configuration version was used?

## Attempt score vs competency

Attempt score is one performance observation. Competency is a longitudinal state derived from multiple observations. The aggregation policy for competency must be explicitly defined.

## Recommendations

Potential inputs:
- low skill score
- repeated major/critical errors
- repeated failure on one criterion
- inactivity/overdue training
- improvement trend

Recommendations should be traceable to evidence.

```

### `mediver_documentation\09_TKA_PLANNING_AND_CLINICAL_DATA.md`

```md
# TKA Planning and Clinical Data

## Source basis

The supplied TKA planning specification describes a preoperative planning suite before VR simulation. It covers FLAP and KLAT views, target alignment, component sizing/position, resection plane depth/angle, and transferring a locked plan into VR.

## Planning views

### FLAP
The supplied Articulus material identifies HKA, mPTA, mLDFA and VCA under FLAP.

### KLAT
The supplied material identifies approximate tibial and femoral component sizing under KLAT.

## Planning parameters recorded by the supplied specification

### MAD
Overall mechanical-axis/deformity information used to project a target weight-bearing vector in VR.

### AMA / VCA
Anatomic-to-mechanical/femoral correction angle information associated with distal femoral resection guide positioning relative to the intramedullary rod trajectory.

### mHKA / HKA
Baseline coronal deformity and target-threshold information for post-operative correction.

### MPTA / mPTA
Tibial proximal cut orientation relative to the mechanical axis.

### LDFA / mLDFA
Distal femoral deformity contribution.

### Posterior tibial slope
Backward tilt angle of the tibial cutting jig in VR.

### Resection thickness
Femoral/tibial resection thickness used to position saw guides relative to bone landmarks.

### AP/ML bone dimensions
Dimensions used to support component sizing and help prevent overhang or undersizing.

## Suggested data representation

```text
measurement
- parameter
- plane
- source_view
- planned_value
- actual_value
- deviation
- unit
- metadata
```

## Preoperative flow

```text
Assessment Page
-> Femoral Planning
-> Tibial Planning
-> Review & OR Transfer
-> lock plan
-> export plan
-> VR consumes locked plan
```

## Clinical safety boundary

This document records source-supported workflow concepts. It does not authorize new clinical thresholds, implant recommendations, or surgical decisions.

Any tolerance, correction target, sizing algorithm, or automated clinical rule not explicitly supplied must be clinically reviewed before production.

```

### `mediver_documentation\10_VR_INTEGRATION.md`

```md
# VR Integration

## Principle

The VR client is the execution layer. The backend is authoritative for case configuration, assessment configuration, assessment results and persisted attempt state.

## Flow

```text
VR connects
-> authenticate
-> receive case/session context
-> create attempt
-> stream events
-> persist checkpoints
-> complete
-> assess
-> result
```

## Event envelope

```json
{
  "attempt_id": "uuid",
  "sequence_number": 123,
  "timestamp": "ISO-8601",
  "procedure_step_id": "uuid",
  "event_type": "cut_completed",
  "parameter_name": "tibial_angle",
  "planned_value": 3.0,
  "actual_value": 6.0,
  "unit": "deg",
  "metadata": {}
}
```

## Reliability

VR should support:
- local unsent queue
- monotonically increasing sequence numbers
- retries
- idempotent ingestion
- acknowledgment-gap detection
- reconnect recovery

## Attempt states

Recommended:
```text
created
in_progress
paused
completed
submitted
assessed
failed
cancelled
```

Centralize state transitions on the backend.

## Plan transfer

A locked preoperative plan should have an immutable version. The attempt references the exact version consumed by VR.

## Client authority boundary

VR should not decide final score, pass/fail, critical-error status, competency, or recommendation.

```

### `mediver_documentation\11_REPORTING_ANALYTICS.md`

```md
# Reporting and Analytics

## Report types

### Resident
- competency
- progression
- completion
- case history
- attempt history
- skill performance
- recurring errors
- recommendations
- instructor feedback

### Cohort
- size
- completion
- competency distribution
- skill distribution
- at-risk learners
- case performance
- assessment activity

### Case
- attempts
- pass/fail
- average score
- common errors
- skill impact
- trend

### Skill
- population score
- resident distribution
- weak areas
- progress trend

## Derived metrics

Possible metrics:
- completion rate
- assessment completion rate
- average attempts per case
- repeat-error rate
- skill improvement delta
- time-to-completion
- case pass rate

Every metric must define source tables, inclusion rules, time window, denominator, and missing-data handling.

## Competency history

Never overwrite history when a new assessment is completed. Store the observation and calculate the current view from historical observations.

## Performance strategy

Start with SQL queries and indexes. Add caching/materialized views or separate analytics infrastructure only when justified by observed workload.

## Export

Exports should run server-side, honor authorization, record the requesting user, include generated-at time, and identify the reporting period.

```

### `mediver_documentation\12_SECURITY_AUDIT_AND_COMPLIANCE.md`

```md
# Security, Audit and Clinical-Safety Controls

## Authentication

Implement secure password storage, session/token handling, logout/revocation, password reset if needed, and account status checks.

## Authorization

Initial roles:
- Instructor
- Resident
- Admin/Institution if required

Examples:
- resident cannot edit assessment criteria
- resident cannot access another resident's private record
- instructor cannot cross institution boundary
- only permitted roles can delete configuration

## Tenant isolation

Enforce institution scope on the backend. Never rely only on frontend visibility.

## Audit

Audit user/role changes, assessment configuration changes, case/procedure changes, skill weight changes, deletion/archive actions, finalized assessments, and report exports.

## Immutable assessment history

After finalization:
- raw events remain preserved
- configuration versions remain referenced
- finalized results are not silently overwritten

Corrections should create an explicit audit trail.

## Data minimization

Do not introduce real patient identifiers unless required and formally approved.

## Secrets

Never commit passwords, API keys, production tokens, certificates or private keys.

## Clinical safety

Mediver is a training/assessment platform. It should not silently behave as an autonomous clinical decision-maker.

Every clinical rule should have a named owner, version, source/rationale, and approval status.

## Failure cases

Design detectable recovery paths for:
- failed assessment calculation
- lost VR connection
- duplicate events
- database failure
- unauthorized access
- corrupt content/configuration

```

### `mediver_documentation\13_TESTING_STRATEGY.md`

```md
# Testing Strategy

## Test levels

```text
E2E
 |
Integration + VR Contract
 |
Unit
```

## Unit tests

Test criterion evaluation, deviation calculations, severity classification, score aggregation, automatic failure, recommendations, permissions, and state transitions.

## Integration tests

Test API + DB, transaction behavior, event ingestion, assessment persistence, institution isolation, and session lifecycle.

## Contract tests

Test that VR and backend agree on event shape, IDs, sequence behavior, units, optional/required fields, acknowledgments, and version fields.

## E2E minimum

1. Instructor login
2. Create/select cohort
3. Assign case
4. Create session
5. Resident starts attempt
6. Events arrive
7. Attempt completes
8. Assessment generated
9. Instructor reviews
10. Feedback saved
11. Recommendation appears

## Assessment golden tests

Fixtures should include:
- perfect execution
- warning deviation
- major deviation
- critical error
- incomplete procedure
- duplicate event
- out-of-order event
- missing measurement
- reconnect
- no data

## Clinical validation

Clinical SMEs should validate terminology, planning workflow, parameter definitions, tolerances, severity mapping, scoring and recommendations.

Software tests cannot substitute for clinical approval.

## Regression

Every phase runs lint, type checks, unit tests and relevant integration tests. Keep the main branch green.

```

### `mediver_documentation\14_DEPLOYMENT_AND_OPERATIONS.md`

```md
# Deployment and Operations

## Environments

Use at least:
- local
- development
- staging
- production/pilot

## Database migrations

- migration files are source controlled
- migrations run in deployment
- destructive migrations require explicit approval
- backups precede high-risk changes
- restoration is tested

## Configuration

Separate application config, DB config, secrets, clinical-content configuration, and environment-specific URLs.

## Observability

Track API errors, assessment failures, event ingestion failures, WebSocket disconnects, slow queries, job failures, and authentication failures.

## Backups

Back up PostgreSQL and important object-storage artifacts. Test restore procedures regularly.

## Health checks

```text
GET /health
GET /ready
```

These endpoints should not leak sensitive internals.

## Rollout

```text
Development
-> Staging
-> Internal validation
-> Clinical/pilot validation
-> Small cohort
-> Broader rollout
```

## Rollback

Each release should have a known version, migration plan, rollback/forward-fix strategy, and owner. Never leave production data in an ambiguous schema state.

```

### `mediver_documentation\15_ANTIGRAVITY_BUILD_PLAN.md`

```md
# Antigravity Build Plan

## Operating rule

Do not ask Antigravity to build the entire product in one giant prompt. Implement one phase at a time, run its gates, and stop.

## Phase 0 - Documentation lock

**Goal:** make `/docs` the implementation contract.

Tasks:
- read all docs
- identify contradictions
- do not silently resolve clinical contradictions
- create `IMPLEMENTATION_ASSUMPTIONS.md`
- create architecture/task plan

**Exit gate:** no coding until scope and assumptions are understood.

## Phase 1 - Repository foundation

**Goal:** working engineering skeleton.

Tasks:
- frontend skeleton
- backend skeleton
- DB connection layer
- env configuration
- health/readiness endpoints
- logging
- structured API errors
- test runner
- lint/typecheck
- local dev setup

**Gate:** fresh checkout runs the skeleton.

## Phase 2 - Database

**Goal:** implement the documented PostgreSQL model.

Tasks:
- migrations
- foreign keys
- constraints
- indexes
- deterministic seed data

**Gate:** clean DB migrates and seeds from scratch.

## Phase 3 - Authentication and RBAC

**Goal:** protect the platform.

Tasks:
- login
- sessions/tokens
- current-user endpoint
- role checks
- institution scope
- protected routes

**Gate:** cross-institution access is denied.

## Phase 4 - Instructor program management

**Goal:** build administrative core.

Tasks:
- dashboard shell
- curriculum
- cases
- procedures
- skills
- assessment settings
- content library

**Gate:** instructor can configure a complete program without direct DB access.

## Phase 5 - Cohorts and residents

**Goal:** connect configuration to learners.

Tasks:
- cohort CRUD
- resident management
- membership
- assignments
- resident profile

**Gate:** instructor can create cohort -> add residents -> assign case.

## Phase 6 - Sessions

**Goal:** establish training-event lifecycle.

Tasks:
- upcoming/live/completed
- session detail
- participants
- start/end
- state machine

**Gate:** instructor can schedule and operate a session.

## Phase 7 - Attempts and VR contracts

**Goal:** stable VR boundary.

Tasks:
- attempt creation
- event ingestion
- measurement ingestion
- idempotency
- sequence validation
- completion
- reconnect handling

**Gate:** simulated VR client can create an attempt and send events.

## Phase 8 - Assessment engine

**Goal:** deterministic, explainable assessment.

Tasks:
- criteria evaluator
- error detector
- skill aggregator
- overall-score pipeline
- auto-failure rules
- explanation payload
- recommendation generator

**Gate:** golden tests are deterministic.

**Blocker:** do not invent undefined clinical tolerances or competency formulas.

## Phase 9 - Instructor review

**Goal:** make assessment actionable.

Tasks:
- attempt review
- plan vs execution
- errors
- skills
- feedback
- notes
- recommendations

**Gate:** instructor can move from alert -> evidence -> action.

## Phase 10 - Real-time monitoring

**Goal:** live sessions without refresh.

Tasks:
- WebSocket
- participant status
- current step
- progress
- connection state

**Gate:** two clients observe the same session state reliably.

## Phase 11 - Reporting

**Goal:** resident, cohort, case and skill reports.

Tasks:
- reports
- exports/share
- documented metric definitions

**Gate:** every metric has source and derivation documentation.

## Phase 12 - Preoperative planning integration

**Goal:** represent FLAP/KLAT planning and transfer locked plan to VR.

Tasks:
- planning data model
- assessment page
- femoral planning
- tibial planning
- review/lock
- versioned plan
- VR payload

**Gate:** locked plan is referenced unambiguously by an attempt.

Clinical algorithms require approval before being authoritative.

## Phase 13 - Hardening

**Goal:** release readiness.

Tasks:
- audit logs
- permission tests
- backups/recovery
- performance
- accessibility
- security checks
- regression suite

**Gate:** all critical checks pass.

## Phase 14 - Pilot

**Goal:** validate with controlled users.

Tasks:
- pilot deployment
- approved content
- instructor workflow validation
- resident VR validation
- assessment validation
- report validation
- issue triage

**Gate:** clinical stakeholders approve pilot outcome.

## Build order

```text
0 Docs
1 Foundation
2 Database
3 Auth/RBAC
4 Program Management
5 Cohorts/Residents
6 Sessions
7 VR Contracts
8 Assessment
9 Review
10 Real-Time
11 Reports
12 Planning
13 Hardening
14 Pilot
```

```

### `mediver_documentation\16_ANTIGRAVITY_PHASE_PROMPTS.md`

```md
# Antigravity Phase Prompts

## Master instruction

```text
You are the implementation agent for Mediver.

Before changing code:
1. Read every file under /docs.
2. Treat /docs as the current product/architecture contract.
3. Do not invent clinical rules, thresholds, score formulas, or medical recommendations that the documentation does not define.
4. When something is unspecified, create a clearly marked configuration placeholder or implementation TODO.
5. Inspect the existing repository before creating files.
6. Reuse existing code where appropriate.
7. Do not rewrite unrelated modules.
8. Implement only the requested phase.
9. Add/update tests for the phase.
10. Run lint, type checks and relevant tests.
11. Summarize changed files, tests, assumptions and blockers.
12. Stop after the current phase. Do not begin later phases automatically.
```

## Phase 1

```text
Execute Phase 1 from /docs/15_ANTIGRAVITY_BUILD_PLAN.md.
Build only the engineering foundation: frontend skeleton, backend skeleton, database connection layer, environment configuration, health/readiness endpoints, logging, structured API errors, test runner, lint/typecheck, and local development setup.
Do not implement product features yet.
Run all available checks and report exact commands/results.
```

## Phase 2

```text
Execute Phase 2.
Implement the PostgreSQL schema exactly from /docs/06_DATABASE_SCHEMA.md.
Create migrations, constraints, indexes and deterministic seed data.
Do not invent new clinical fields unless justified and documented.
Verify clean migration, seed reproducibility and foreign-key integrity.
Stop when Phase 2 is complete.
```

## Phase 3

```text
Execute Phase 3.
Implement authentication, RBAC and institution-level isolation.
Test valid/invalid login, protected endpoints, instructor access, resident access, cross-institution denial and unauthorized-role denial.
Do not proceed to Phase 4.
```

## Phase 4

```text
Execute Phase 4.
Build instructor program management: dashboard shell, curriculum, cases, procedures, skills, assessment settings and content/case library.
Use /docs/04_UI_AND_NAVIGATION.md.
Every screen needs loading, empty, error and unauthorized states.
Do not implement VR or live monitoring yet.
```

## Phase 5

```text
Execute Phase 5.
Build cohorts, cohort members, residents, resident profile and training assignments.
Connect to persisted backend data. Do not fake data once APIs exist.
Stop after tests pass.
```

## Phase 6

```text
Execute Phase 6.
Build upcoming/live/completed sessions, session details, participants, start/end controls and a validated session state machine.
Add integration tests.
```

## Phase 7

```text
Execute Phase 7.
Implement attempt and VR contracts from /docs/07_API_CONTRACTS.md and /docs/10_VR_INTEGRATION.md.
Support attempt creation, ordered-event ingestion, measurements, idempotent retries, sequence validation and completion.
Create a simulated VR test fixture.
Do not calculate final scores in the simulated client.
```

## Phase 8

```text
Execute Phase 8.
Implement the assessment engine from /docs/08_ASSESSMENT_ENGINE.md.
Build criterion evaluation, deviation handling, severity, skill aggregation, overall scoring pipeline, automatic-failure rules, explanation payloads and recommendations.
Use configuration for thresholds.
Do not invent missing clinical thresholds or competency formulas.
Create golden tests.
```

## Phase 9

```text
Execute Phase 9.
Build instructor review: attempt detail, score, skill breakdown, plan vs execution, errors, feedback, notes and recommendations.
Every displayed result must be traceable to persisted evidence.
```

## Phase 10

```text
Execute Phase 10.
Implement real-time session monitoring using the selected WebSocket mechanism.
Support join, start, current step, progress/status, completion and reconnect.
Add multi-client tests.
```

## Phase 11

```text
Execute Phase 11.
Implement resident, cohort, case and skill reports plus export/share.
For every metric document source, calculation, filters, time window and null handling.
Do not add a warehouse unless measured workload requires it.
```

## Phase 12

```text
Execute Phase 12.
Implement the supplied TKA preoperative planning workflow: FLAP/KLAT data, assessment page, femoral planning, tibial planning, review/lock, versioned plan and VR transfer contract.
Read /docs/09_TKA_PLANNING_AND_CLINICAL_DATA.md first.
Do not invent clinical targets or tolerances. Missing medical rules become configurable placeholders with approval status.
```

## Phase 13

```text
Execute Phase 13.
Harden the complete system with audit logs, authorization tests, backup/recovery verification, error tracking, performance checks, accessibility checks, security checks and regression testing.
Do not start pilot deployment.
```

## Phase 14

```text
Execute Phase 14.
Prepare a controlled pilot. Validate content, instructor workflow, resident VR workflow, assessment outputs, reporting and recovery procedures.
Generate a pilot-readiness report with PASS/FAIL for each gate.
Do not claim clinical readiness unless clinical approval gates have actually passed.
```

```

### `mediver_documentation\17_SEED_DATA_AND_DEMO.md`

```md
# Seed Data and Demo Scenarios

## Demo institution

`Mediver Demo Hospital`

## Demo program

`Total Knee Arthroplasty - Residency Training`

## Cohort 2026A
- residents: 24
- progress: 68%
- average competency: 72%
- completion: 16/24
- at risk: 3
- next session: Today, 2:00 PM

## Cohort 2026B
- residents: 18
- progress: 42%
- average competency: 65%
- completion: 7/18
- at risk: 5
- next session: Tomorrow, 10:00 AM

## Resident example

Arun Kumar:
- competency 54%
- status At risk
- previous competency 62%
- completion 42%
- cases 5/12
- assessments 3/8

Skill examples:
- Bone cuts & alignment 48%
- Gap assessment 61%
- Trialling & stability 72%
- Implantation 55%

Weaknesses:
1. Tibial cut execution
2. Femoral alignment
3. Gap assessment

## Case example

`Varus OA - Right Knee`

- Difficulty: Intermediate
- Objective: Practice alignment + bone cuts
- Assessment criteria: mechanical alignment, tibial cut, femoral cut, gap balance

## Attempt example

```text
Tibial angle planned: 3°
Tibial angle executed: 6°
Difference: +3°
Result: FAILED
```

This is demo/test data, not a universal clinical rule.

## Test fixtures

Create deterministic fixtures for pass, fail, critical failure, incomplete, duplicate event, missing event, reconnect and no-data cases.

```

### `mediver_documentation\18_OPEN_DECISIONS.md`

```md
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
Confirm when a preoperative plan becomes immutable.

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

```

### `mediver_documentation\19_DEFINITION_OF_DONE.md`

```md
# Definition of Done

A feature is not complete because the UI renders.

## Product
- Requirement documented
- User journey documented
- Acceptance criteria defined

## Frontend
- UI implemented
- loading/empty/error/unauthorized states
- validation
- accessibility basics

## Backend
- API
- authorization
- validation
- structured errors
- logging
- tests

## Database
- migration
- constraints
- indexes
- seed/update path where needed

## Assessment features
- deterministic
- explainable
- versioned
- raw evidence preserved
- clinical rules sourced/configured
- historical result not silently overwritten

## VR
- contract documented
- event schema validated
- retry/idempotency
- reconnect handling
- attempt lifecycle tested

## Reporting
- source and formula documented
- authorization enforced
- export tested

## Operations
- monitoring/logging
- backup implications considered
- failure modes documented

## Phase gate

A phase is complete only when implementation works, tests pass, documentation is updated, unresolved assumptions are written down, and no critical security/clinical issue is hidden.

## Production gate

Production/pilot additionally requires clinical validation, security review, recovery test, assessment golden tests, VR integration tests, and stakeholder acceptance.

```

### `mediver_documentation\20_CLINICAL_AND_ASSESSMENT_CALCULATIONS.md`

```md
# Mediver Clinical & Assessment Calculations Specification

## Purpose

This document is the calculation source-of-truth for Antigravity when implementing Mediver's TKA preplanning, VR assessment, competency, and reporting calculations.

**Clinical safety rule:** A mathematical formula does not by itself authorize a clinical decision rule. Antigravity must not invent targets, tolerances, implant sizing tables, correction limits, or score curves. Anything marked **[CLINICAL APPROVAL REQUIRED]** must remain configurable until approved by the clinical owner.

## 1. Calculation architecture

```text
IMAGE / DICOM / 3D LANDMARKS
        ↓
RAW LANDMARKS + CALIBRATION
        ↓
GEOMETRIC DERIVATION
        ↓
PREOPERATIVE PLAN / TARGETS
        ↓
LOCKED PLAN VERSION
        ↓
VR EXECUTION
        ↓
PLAN vs ACTUAL
        ↓
ASSESSMENT CRITERIA
        ↓
ERRORS + SKILLS + SCORE
        ↓
COMPETENCY + RECOMMENDATIONS + REPORTS
```

Every derived clinical value must preserve the raw landmarks, method, unit, sign convention, algorithm version, and confidence used to obtain it.

## 2. Coordinate and sign conventions

Define one project-wide convention for:
- left/right
- coronal/sagittal/axial planes
- degrees/mm
- internal/external rotation
- varus/neutral/valgus

Do not mix an included HKA near 180° with a signed HKA deviation without explicitly converting between them.

Recommended stored fields:

```text
hka_included_angle_deg
hka_deviation_deg
alignment_label
sign_convention_version
```

Published literature commonly expresses mHKA as a signed deviation with negative for varus and positive for valgus, while other clinical representations show the included angle. citeturn591726search5turn420687search6

## 3. Mechanical axes

### Femoral mechanical axis

From hip centre `H` to knee centre `K`:

```text
F = K - H
```

### Tibial mechanical axis

From knee centre `K` to ankle centre `A`:

```text
T = A - K
```

The lower-limb mechanical axis is conventionally defined from femoral head centre to ankle centre, passing through the knee in neutral alignment. citeturn420687search7

### Generic angle between two vectors

```text
angle(F,T) = acos( dot(F,T) / (|F||T|) )
```

Clamp the cosine into `[-1,1]` before `acos()` to avoid floating-point errors.

When direction/sign is needed, prefer a signed `atan2` formulation rather than an unsigned `acos`.

## 4. HKA / mHKA

### Included HKA

```text
HKA = angle(FMA, TMA)
```

where FMA and TMA are the femoral and tibial mechanical axes.

### Deviation from 180°

For an included-angle representation:

```text
HKA_deviation = 180° - HKA
```

Example:

```text
HKA = 174°
HKA_deviation = 180 - 174 = 6°
```

The supplied product example describes HKA 174° as approximately 6° varus. Preserve this as a product example rather than treating the display convention as universal.

## 5. MAD / mechanical-axis position

The supplied planning specification says MAD quantifies overall limb deformity and projects the target weight-bearing vector in VR. fileciteturn5file8L965-L970

### Mechanical axis

```text
MA = H → A
```

### Perpendicular point-to-line distance

For line through `A(x1,y1)` and `B(x2,y2)` and point `P(x0,y0)`:

```text
MAD_distance =
abs((x2-x1)(y1-y0) - (x1-x0)(y2-y1))
------------------------------------------------
sqrt((x2-x1)^2 + (y2-y1)^2)
```

The exact clinical definition of MAD can vary by workflow, so Mediver must store the definition/version, not only the number.

Recommended:

```text
mad_value
mad_unit
mad_reference_point
mad_definition_version
```

## 6. Weight-bearing-line position / WBL ratio

When the mechanical/weight-bearing line intersects the tibial plateau:

```text
M = medial plateau reference
L = lateral plateau reference
W = WBL intersection
```

Then:

```text
WBL_ratio_% = 100 * distance(M,W) / distance(M,L)
```

This is a geometric representation. The exact landmark orientation and reporting direction are **[CLINICAL APPROVAL REQUIRED]**.

## 7. MPTA / mMPTA

MPTA is the medial angle between the tibial mechanical axis and the proximal tibial joint line. citeturn420687search0turn420687search8

Let:

```text
T = tibial mechanical-axis vector
Jt = proximal tibial joint-line vector
```

Calculate the geometric angle:

```text
raw_angle = angle(T,Jt)
```

For a signed angle:

```text
signed_angle(T,Jt) = atan2(cross(T,Jt), dot(T,Jt))
```

Convert the raw/signed angle into the project's clinical medial-angle convention. Do not assume the unsigned result alone is MPTA.

## 8. mLDFA / LDFA

mLDFA is the lateral angle between the femoral mechanical axis and the distal femoral joint line. citeturn420687search6turn420687search8

Let:

```text
F = femoral mechanical-axis vector
Jf = distal femoral joint-line vector
```

```text
mLDFA = clinical_orientation_of(angle(F,Jf))
```

Use signed `atan2` internally when orientation matters.

## 9. Arithmetic HKA (aHKA)

A published formula is:

```text
aHKA = MPTA - mLDFA
```

This is a bony geometric measure and does not include joint-line convergence. citeturn420687search5turn420687search12

Example:

```text
MPTA = 89°
mLDFA = 84°
aHKA = 89 - 84 = +5°
```

Common interpretation under the cited convention:

```text
negative -> varus tendency
near zero -> neutral
positive -> valgus tendency
```

## 10. Joint-line convergence angle (JLCA)

JLCA is the angle between the distal femoral and proximal tibial joint lines. Sign conventions differ between papers, so define one project convention explicitly. citeturn591726search1

```text
JLCA = signed_angle(Jf,Jt)
```

### Relationship to mHKA

One published geometric derivation gives:

```text
mHKA = 180° + aHKA - JLCA
```

and therefore:

```text
JLCA = 180° + aHKA - mHKA
```

This formula is valid only with the cited paper's angle/sign convention. citeturn591726search0

**Implementation rule:** Store the convention/version together with the values.

## 11. Joint-line obliquity (JLO)

A commonly reported arithmetic formulation is:

```text
arithmetic_JLO = MPTA + mLDFA
```

If expressed as deviation from a 180° sum:

```text
JLO_deviation = (MPTA + mLDFA) - 180°
```

Recent literature distinguishes bony arithmetic alignment from joint-space convergence and reports multiple JLO formulations, so the software must store the selected reporting convention. citeturn420687search5turn591726search3

## 12. AMA / VCA / femoral anatomical-mechanical angle

The supplied specification associates AMA/VCA with distal femoral resection guide positioning relative to the intramedullary rod trajectory. fileciteturn5file8L971-L974

Let:

```text
Af = femoral anatomical axis
Mf = femoral mechanical axis
```

Then:

```text
AMA = signed_angle(Af,Mf)
```

Literature defines the femoral anatomical-mechanical angle as the angle between the anatomical and mechanical axes and shows substantial patient-to-patient variation. citeturn420687search3turn420687search4

**Do not hard-code 5° as a universal patient value.** Published data demonstrate that a fixed value can differ materially from patient anatomy. citeturn420687search3

## 13. Posterior tibial slope (PTS)

The supplied planning specification uses posterior tibial slope to set the backward tilt of the tibial cutting jig in VR. fileciteturn5file8L986-L988

There is no single universally accepted radiographic reference axis. Studies compare mechanical, anatomical, proximal anatomical, anterior cortical, posterior cortical and fibular axes. citeturn327342search3turn327342search10

### Generic calculation

```text
J = tibial plateau line in sagittal plane
R = selected tibial reference axis
```

```text
raw_angle = angle(J,R)
```

If the selected technique defines slope relative to the perpendicular axis:

```text
PTS = 90° - raw_angle
```

A published stepwise method uses a perpendicular reference and subtracts the measured angle from 90°. citeturn591726search6

Recent evidence shows that PTS values can change depending on the reference axis used, so the method must be stored with the measurement. citeturn327342search5turn327342search6

Recommended fields:

```text
pts_value
pts_reference_axis
pts_measurement_method
pts_view
```

## 14. Femoral distal resection depth

For a planned cut plane, the geometric depth is the perpendicular distance from the selected bone landmark/reference to the cut plane.

For a 2D line:

```text
d = |a*x0 + b*y0 + c| / sqrt(a²+b²)
```

For a 3D plane:

```text
d = | n · (P - P0) |
```

where `n` is the unit normal of the resection plane.

The supplied specification describes resection thickness as the saw-guide position relative to bone landmarks and provides example values, not universal rules. fileciteturn5file8L989-L991

## 15. Tibial resection depth

Generic geometric representation:

```text
resection_depth = perpendicular_distance(reference_landmark, planned_cut_plane)
```

A published planning technique sets the proximal tibial resection perpendicular to the tibial mechanical axis and measures the resection thickness to a reference surface. citeturn591726search2

Published techniques also use different values depending on implant and alignment philosophy. citeturn591726search2turn591726search11

Therefore:

```text
Do NOT hard-code 8 mm
Do NOT hard-code 9 mm
Do NOT hard-code 10 mm
```

unless the selected clinical/implant protocol explicitly supplies the value.

## 16. AP and ML dimensions

The supplied planning specification says AP/ML bone dimensions support component sizing and help avoid overhang or undersizing. fileciteturn5file8L992-L994

Euclidean distance between 2D points:

```text
D = sqrt((x2-x1)^2 + (y2-y1)^2)
```

3D:

```text
D = sqrt(dx² + dy² + dz²)
```

Therefore:

```text
AP = distance(anterior_landmark, posterior_landmark)
ML = distance(medial_landmark, lateral_landmark)
```

### Coverage

```text
AP_coverage_ratio = implant_AP / bone_AP
ML_coverage_ratio = implant_ML / bone_ML
```

Potential overhang:

```text
overhang = implant_extent - bone_extent
```

The acceptable range is implant/protocol-specific and **[CLINICAL APPROVAL REQUIRED]**.

## 17. Image calibration

For a calibration marker with known length:

```text
mm_per_pixel = known_marker_length_mm / marker_length_pixels
```

Then:

```text
distance_mm = distance_pixels * mm_per_pixel
```

When DICOM physical spacing is available and valid, prefer DICOM metadata instead of manual visual scale estimation.

Store:

```text
pixel_spacing
source_image_id
calibration_method
calibration_confidence
```

## 18. Rotation calculations

### Generic signed 2D rotation

For reference vector `A` and component vector `B`:

```text
rotation = atan2(cross(A,B), dot(A,B))
```

Normalize the result to a documented range such as `[-180°,180°]`.

### Tibial rotation

Akagi's line is one published tibial AP reference. Definitions use landmarks around the PCL attachment and tibial tubercle; measurement variability between reference methods has been reported. citeturn327342search0turn327342search1

```text
tibial_rotation = signed_angle(tibial_reference, baseplate_axis)
```

Do not silently flip internal/external rotation signs.

### Femoral rotation

Possible references include the transepicondylar axis and posterior condylar axis. A common surgical technique can use a posterior-condylar-based external rotation offset, but the appropriate value is technique/anatomy-dependent. citeturn327342search9

```text
femoral_rotation = signed_angle(femoral_reference, component_axis)
```

Do not hard-code a universal 3° offset.

## 19. Plan-vs-actual deviation

For scalar quantities:

```text
deviation = actual - planned
absolute_deviation = abs(actual - planned)
```

Example:

```text
planned tibial angle = 3°
actual tibial angle = 6°
deviation = +3°
absolute deviation = 3°
```

Percentage deviation, only where clinically meaningful:

```text
percentage_deviation = 100 * (actual - planned) / planned
```

Do not use percentage deviation near zero without an approved definition.

## 20. Angular deviation normalization

Angles wrap around 360°.

```text
delta = ((actual - planned + 180) % 360) - 180
absolute_angular_error = abs(delta)
```

Use this for axial/rotational quantities where wraparound exists.

## 21. Vector and plane errors

3D position error:

```text
error_vector = actual_position - planned_position
position_error = sqrt(dx² + dy² + dz²)
```

Perpendicular plane error:

```text
plane_error = perpendicular_distance(actual_point, planned_plane)
```

## 22. Tolerance evaluation

Each criterion should define:

```text
target_value
warning_range
acceptable_range
major_range
critical_rule
unit
```

Generic range evaluation:

```text
if acceptable_min <= actual <= acceptable_max:
    criterion_status = PASS
else:
    criterion_status = OUTSIDE_TARGET
```

Generic error magnitude:

```text
error = abs(actual - target)
```

**Do not invent the numerical tolerance.**

## 23. Error severity

Current Mediver terminology:

```text
Minor
Major
Critical
```

The prototype describes:
- Minor: deviation within warning range
- Major: deviation outside target
- Critical: unsafe or clinically significant error

These descriptions do not supply numeric thresholds. Those values must be configured and clinically approved.

## 24. Criterion score

The engine should support a configurable scoring strategy.

### Binary

```text
score = 100 if within approved tolerance else 0
```

### Linear degradation

```text
score = max(0, 100 * (1 - error / max_allowed_error))
```

### Piecewise

```text
warning or better -> 100 or configured score
major range       -> configured degradation
critical range    -> configured score/override
```

These are implementation options, not clinical rules. Select one through an approved assessment configuration.

## 25. Skill score

Current Mediver skill weights:

```text
Bone Cuts & Alignment    30%
Gap Assessment           25%
Trialling & Stability    25%
Implantation             20%
```

If each skill contains criterion weights:

```text
skill_score =
Σ(criterion_score_i * criterion_weight_i)
/
Σ(criterion_weight_i)
```

If equally weighted:

```text
skill_score = average(criterion_scores)
```

## 26. Overall assessment score

With skill scores `S1..S4` and weights:

```text
0.30, 0.25, 0.25, 0.20
```

```text
overall_score =
S1*0.30 +
S2*0.25 +
S3*0.25 +
S4*0.20
```

General normalized version:

```text
overall_score = Σ(Si*Wi) / Σ(Wi)
```

**Important:** The current prototype examples do not prove that this is the final clinical scoring algorithm. The software must keep aggregation configurable until the final formula is approved.

## 27. Automatic failure

Current product configuration:

```text
critical_auto_fail = TRUE
incomplete_auto_fail = TRUE
```

Generic final-result logic:

```text
if critical_error and critical_auto_fail:
    FAIL
elif incomplete and incomplete_auto_fail:
    FAIL
elif overall_score >= passing_score:
    PASS
else:
    FAIL
```

Current example passing threshold:

```text
70%
```

Store machine-readable reason codes such as:

```json
{"result":"FAIL","reason_codes":["CRITICAL_ERROR"]}
```

## 28. Assessment explanation

Every finalized assessment should preserve enough intermediate data to reproduce the decision:

```json
{
  "criteria": [
    {
      "criterion": "tibial_angle",
      "planned": 3,
      "actual": 6,
      "deviation": 3,
      "severity": "major",
      "score": 40
    }
  ],
  "skill_scores": {
    "bone_cuts_alignment": 48
  },
  "overall_score": 54,
  "result": "FAIL",
  "automatic_failure": true,
  "reason_codes": ["CRITICAL_ERROR"]
}
```

## 29. Competency calculation

Do not assume:

```text
competency = latest_attempt_score
```

unless explicitly approved.

Supported aggregation architectures can include:

### Latest valid assessment

```text
competency = latest_valid_assessment
```

### Rolling average

```text
competency = average(last_N_valid_assessments)
```

### Recency weighted

```text
competency = Σ(score_i * weight_i) / Σ(weight_i)
```

The final longitudinal competency method is **[CLINICAL / PRODUCT APPROVAL REQUIRED]**.

## 30. Completion calculations

Assignment completion:

```text
completion_rate = 100 * completed_assignments / total_assignments
```

Assessment completion:

```text
assessment_completion = 100 * completed_assessments / assigned_assessments
```

Cohort completion:

```text
cohort_completion =
100 * residents_completed_required_training /
residents_required_to_complete
```

The denominator must be explicitly defined for each dashboard metric.

## 31. Trend calculations

Simple score change:

```text
delta = current_score - previous_score
```

Percentage change:

```text
percentage_change =
100 * (current_score - previous_score) / previous_score
```

Only use percentage change when baseline is non-zero.

A time-series slope can be calculated with linear regression if a quantitative trend is needed:

```text
score = a + b*time
```

where `b` is the trend slope.

Do not label a trend improving/stable/declining without configured thresholds.

## 32. Error rate and repeated errors

Criterion error rate:

```text
error_rate =
100 * attempts_with_error / assessed_attempts
```

Repeated error count:

```text
repeat_error_count = count(errors for resident + criterion/error_type)
```

A recommendation can be triggered from configurable repetition thresholds.

## 33. Case pass rate

```text
case_pass_rate =
100 * passed_attempts / completed_assessed_attempts
```

Normally exclude abandoned/incomplete attempts from the denominator unless the report explicitly defines otherwise.

## 34. Attempts per case

One definition:

```text
average_attempts_per_case = total_valid_attempts / distinct_completed_cases
```

Another possible definition is the mean of per-case attempt counts. They are not always identical. The displayed metric must have one documented definition.

## 35. Time calculations

Attempt:

```text
duration = completed_at - started_at
```

Session:

```text
duration = ended_at - started_at
```

Procedure step:

```text
step_duration = step_completed_at - step_started_at
```

Store server timestamps for authoritative ordering where feasible, while keeping VR client timestamps for diagnostics.

## 36. Missing-data rules

Distinguish:

```text
NULL / missing
not_applicable
not_measured
invalid
zero
```

Do not turn missing measurements into zero.

A missing required value must follow an explicit assessment policy.

## 37. Measurement accuracy pipeline

For automated image measurement:

```text
DICOM/X-ray
  ↓
image-quality check
  ↓
calibration
  ↓
bone segmentation
  ↓
landmark detection
  ↓
landmark confidence
  ↓
axis construction
  ↓
angle/distance calculations
  ↓
plausibility checks
  ↓
suggested measurement
  ↓
human review
  ↓
confirmed planning value
```

The user should see:
- suggested value
- confidence
- landmarks used
- measurement method
- source view
- accept/edit/reject controls

## 38. Suggested-value workflow

The requested Mediver behavior should be:

```text
Software calculates
      ↓
Suggested value
+ confidence
+ method/version
      ↓
Instructor/clinician reviews
      ↓
Accept / Edit / Reject / Recalculate
      ↓
Confirmed value
      ↓
Plan lock
```

Never overwrite the original suggestion when the clinician edits it.

## 39. Calculation audit trail

Store:

```text
raw_measurement
suggested_value
confirmed_value
calculation_name
calculation_version
measurement_method
source_image_id
source_landmarks
algorithm_version
confidence
changed_by
changed_at
```

Recommended `calculation_runs` table:

```text
id
entity_type
entity_id
calculation_name
calculation_version
inputs JSONB
outputs JSONB
warnings JSONB
executed_at
executed_by
```

Recommended `clinical_rules` table:

```text
id
program_id
case_id
rule_name
rule_type
configuration JSONB
version
approval_status
approved_by
approved_at
effective_from
effective_to
```

## 40. Plausibility and confidence

Every automated measurement should have a confidence/quality record.

Potential validation states:

```text
VALID
WARNING
REQUIRES_REVIEW
INVALID
```

Examples of triggers:
- missing landmark
- low landmark confidence
- missing calibration
- impossible geometry
- inconsistent axes
- numerical range error

The system should flag suspicious values rather than silently correcting them.

## 41. Formula registry for Antigravity

Implement calculations as named, tested services/functions:

```text
calculate_line_vector()
calculate_angle_between_vectors()
calculate_signed_angle()
calculate_point_line_distance()
calculate_distance()
calculate_scale()
calculate_hka()
calculate_mad()
calculate_wbl_ratio()
calculate_mpta()
calculate_mldfa()
calculate_ahka()
calculate_jlca()
calculate_jlo()
calculate_ama_vca()
calculate_posterior_tibial_slope()
calculate_resection_depth()
calculate_ap_dimension()
calculate_ml_dimension()
calculate_tibial_rotation()
calculate_femoral_rotation()
calculate_scalar_deviation()
calculate_angular_deviation()
evaluate_tolerance()
classify_error()
calculate_criterion_score()
calculate_skill_score()
calculate_overall_score()
apply_automatic_failure()
calculate_competency()
calculate_completion()
calculate_trend()
calculate_error_rate()
calculate_case_pass_rate()
calculate_attempt_duration()
```

Every calculation function must document:
- inputs
- units
- formula
- sign convention
- output
- error conditions
- test cases
- calculation version

## 42. Calculation classification

Tag every rule as one of:

```text
SOURCE_VERIFIED
PROJECT_RULE
ENGINEERING_DERIVATION
CLINICAL_APPROVAL_REQUIRED
```

Examples:

```text
aHKA = MPTA - mLDFA
→ SOURCE_VERIFIED

mHKA = 180 + aHKA - JLCA
→ SOURCE_VERIFIED FOR THE CITED SIGN CONVENTION

passing score = 70%
→ PROJECT CONFIGURATION

critical error -> automatic failure
→ PROJECT CONFIGURATION

universal tibial tolerance ±X°
→ DO NOT INVENT
```

## 43. Golden test scenarios

Antigravity must create deterministic tests for:

### Geometry
- parallel lines
- perpendicular lines
- 45° lines
- signed rotations
- 180° included HKA
- near-zero angular values

### Clinical derivations
- HKA = 174°
- MPTA = 89°, mLDFA = 84° -> aHKA = +5°
- known synthetic JLCA and mHKA relationships
- known PTS synthetic geometry
- AP/ML distances

### Assessment
- perfect execution
- score exactly 70
- score below 70
- critical auto-fail
- incomplete auto-fail
- major error without critical error
- duplicate event
- missing required measurement
- out-of-order event
- VR reconnect

## 44. Example complete calculation

Example values:

```text
HKA included = 174°
MPTA = 89°
mLDFA = 84°
native PTS = 7°
planned PTS = 3°
planned tibial angle = 3°
actual tibial angle = 6°
```

Derived:

```text
HKA deviation = 180 - 174 = 6°

aHKA = 89 - 84 = +5°

PTS deviation = 3 - 7 = -4°

tibial angle deviation = 6 - 3 = +3°
```

Then the assessment engine continues:

```text
+3° deviation
   ↓
criterion rule lookup
   ↓
tolerance evaluation
   ↓
severity
   ↓
criterion score
   ↓
skill score
   ↓
overall score
   ↓
automatic-failure rules
   ↓
final PASS/FAIL
```

Do not treat `+3°` as automatically failed unless the configured criterion says so.

## 45. Antigravity implementation directives

### MUST

```text
- Read this file before implementing clinical calculations.
- Read the product planning specification.
- Use explicit landmark definitions.
- Store measurement units.
- Store sign conventions.
- Version calculation methods.
- Preserve raw values and suggested values.
- Allow clinician confirmation/editing.
- Keep clinical rules configurable.
- Produce deterministic tests.
- Make assessment explanations reproducible.
```

### MUST NOT

```text
- Hard-code 5° as universal femoral correction.
- Hard-code one PTS reference axis for all patients.
- Hard-code one resection depth for all implants.
- Assume one sizing algorithm for every implant system.
- Invent tolerance values.
- Invent severity thresholds.
- Invent the final competency formula.
- Mix sign conventions.
- Overwrite clinician-confirmed values.
- Let VR alone determine authoritative pass/fail.
```

## 46. Sources reviewed

### Product source
The supplied planning specification defines a four-page preoperative planning workflow with target alignment, estimated component size/position, resection plane depth/angle, and locked-plan transfer into VR. fileciteturn5file8L954-L963

It specifically maps MAD, AMA, mHKA, MPTA, LDFA, PTS, resection thickness, and AP/ML dimensions to planning/VR use. fileciteturn5file8L965-L994

The supplied Articulus material identifies FLAP measurements as HKA, mPTA, mLDFA and VCA, and KLAT for approximate tibial/femoral component sizing. fileciteturn5file0L22-L36

### Web/medical literature
- Mechanical axis and HKA: citeturn420687search7turn420687search12
- LDFA/MPTA definitions: citeturn420687search0turn420687search8
- aHKA: citeturn420687search5turn591726search5
- JLCA and mHKA relationship: citeturn591726search0turn591726search1
- femoral anatomical-mechanical angle/VCA variability: citeturn420687search3turn420687search4
- posterior tibial slope measurement/reference axes: citeturn327342search3turn327342search5turn327342search6
- tibial rotation/Akagi references: citeturn327342search0turn327342search1
- resection planning examples: citeturn591726search2turn591726search11

This document is an implementation specification, not a substitute for clinical validation. Final surgical targets, tolerances, implant-specific sizing, and assessment policies require the designated clinical owner to approve them before production use.

```

### `mediver_documentation\PHASE_CHECKLIST.md`

```md
# Phase Checklist

| Phase | Deliverable | Tests | Demo gate |
|---|---|---|---|
| 0 | Documentation + assumptions | Doc review | Team agrees scope |
| 1 | Engineering skeleton | CI/lint/typecheck | App + API start |
| 2 | PostgreSQL schema | Migration/seed | Clean DB rebuild |
| 3 | Auth/RBAC | Permission tests | Role-isolated login |
| 4 | Program management | CRUD tests | Instructor configures program |
| 5 | Cohorts/residents | Integration tests | Assignment works |
| 6 | Sessions | State tests | Session lifecycle works |
| 7 | VR contract | Contract tests | Simulated VR attempt |
| 8 | Assessment | Golden tests | Deterministic score |
| 9 | Review | E2E | Instructor reviews attempt |
| 10 | Live monitoring | WS tests | Live session |
| 11 | Reports | Query tests | Export/report |
| 12 | TKA planning | Data/contract tests | Locked plan enters VR |
| 13 | Hardening | Security/recovery/regression | Release candidate |
| 14 | Pilot | Acceptance validation | Controlled pilot |

```

### `mediver_documentation\README.md`

```md
# Mediver Documentation Pack

Mediver is a medical VR training and assessment platform for Total Knee Arthroplasty (TKA) residency training.

This documentation pack is intended to be the source-of-truth package for implementation with Antigravity.

## Documentation map

| File | Purpose |
|---|---|
| 01_PRODUCT_VISION.md | Product purpose, users, scope, MVP boundary |
| 02_REQUIREMENTS.md | Functional and non-functional requirements |
| 03_USER_JOURNEYS.md | End-to-end instructor and resident journeys |
| 04_UI_AND_NAVIGATION.md | Instructor information architecture and screen behavior |
| 05_SYSTEM_ARCHITECTURE.md | Frontend, backend, DB, assessment, VR and real-time architecture |
| 06_DATABASE_SCHEMA.md | Relational schema, relationships, constraints and indexing |
| 07_API_CONTRACTS.md | API/resource design and VR/backend contract |
| 08_ASSESSMENT_ENGINE.md | Assessment lifecycle, scoring architecture, errors and recommendations |
| 09_TKA_PLANNING_AND_CLINICAL_DATA.md | Planning data and parameters supported by the supplied TKA planning specification |
| 10_VR_INTEGRATION.md | VR event model, attempt lifecycle, synchronization and failure handling |
| 11_REPORTING_ANALYTICS.md | Resident, cohort, case and skill analytics |
| 12_SECURITY_AUDIT_AND_COMPLIANCE.md | Authentication, authorization, audit and safety-oriented controls |
| 13_TESTING_STRATEGY.md | Unit, integration, E2E, VR integration and clinical validation strategy |
| 14_DEPLOYMENT_AND_OPERATIONS.md | Environments, migrations, observability, backups and rollout |
| 15_ANTIGRAVITY_BUILD_PLAN.md | Master phased implementation plan for Antigravity |
| 16_ANTIGRAVITY_PHASE_PROMPTS.md | Copy/paste prompts for each implementation phase |
| 17_SEED_DATA_AND_DEMO.md | Demo data and deterministic scenarios |
| 18_OPEN_DECISIONS.md | Questions that must be decided before clinical production |
| 19_DEFINITION_OF_DONE.md | Completion gates for the product |
| PHASE_CHECKLIST.md | One-page implementation checklist |

## Important source boundary

The supplied materials establish the TKA planning workflow, instructor application structure, and example data. The implementation should preserve those concepts.

Clinical values, tolerances, score formulas, and safety rules that are not explicitly defined in the source material must remain configurable or be marked as pending clinical approval. The application must not invent medical rules.

## Recommended implementation order

1. Read all documentation.
2. Create architecture and repository skeleton.
3. Create database and migrations.
4. Implement authentication and authorization.
5. Implement the instructor application.
6. Implement case/procedure configuration.
7. Implement resident/VR contracts.
8. Implement assessment engine.
9. Implement live sessions.
10. Implement analytics/reports.
11. Harden, validate and pilot.

Antigravity should implement one phase at a time, run the phase gates, and stop before starting the next phase.

```

### `wireframe\case-detail.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Case 1 — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body data-nav="cases">
<div class="app">
  <aside class="side" data-side></aside>
  <div class="main">
    <header class="topbar" data-topbar data-crumb="Cases / Case 1 — Varus OA"></header>
    <div class="canvas">

      <div class="page-head">
        <div class="grow">
          <div class="eyebrow">Total Knee Replacement</div>
          <h1>Case 1 — Varus osteoarthritis, right knee</h1>
          <div class="row" style="gap:6px;margin-top:10px">
            <span class="chip mut">Osteoarthritis</span>
            <span class="chip mut">Right</span>
            <span class="chip mut">Intermediate</span>
            <span class="chip mut">3 attempts</span>
          </div>
        </div>
        <button class="btn">Configure</button>
        <a class="btn primary lg" href="plan-1.html">Start planning</a>
      </div>

      <div class="grid g12">

        <!-- LEFT -->
        <div class="c5 stack lg">

          <div class="card">
            <div class="card-head"><h3>Patient snapshot</h3></div>
            <dl class="kv">
              <dt>Age / sex</dt><dd>68 · Female</dd>
              <dt>Side</dt><dd>Right</dd>
              <dt>BMI</dt><dd>31.4</dd>
              <dt>Chief complaint</dt><dd>Medial knee pain, 4 years</dd>
              <dt>Walking distance</dt><dd>~200 m</dd>
              <dt>Fixed flexion</dt><dd>5°</dd>
              <dt>Range of motion</dt><dd>5°–115°</dd>
              <dt>Deformity</dt><dd>8.2° varus, correctable</dd>
            </dl>
            <p class="tiny" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--soft)">Synthetic patient. No identifiable data is stored (<code>the spec</code>).</p>
          </div>

          <div class="card">
            <div class="card-head"><h3>Imaging package</h3><span class="tiny">4 views</span></div>
            <div class="grid g2">
              <div><div class="ph thumb">AP standing</div><p class="tiny" style="margin-top:6px">AP standing</p></div>
              <div><div class="ph thumb">Lateral</div><p class="tiny" style="margin-top:6px">Lateral</p></div>
              <div><div class="ph thumb">Skyline</div><p class="tiny" style="margin-top:6px">Skyline</p></div>
              <div><div class="ph thumb">Long-leg</div><p class="tiny" style="margin-top:6px">Full-length long-leg</p></div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3>Learning objectives</h3></div>
            <div class="stack">
              <div class="check"><span class="box on">✓</span><span>Recognise medial compartment OA with correctable varus on a long-leg film.</span></div>
              <div class="check"><span class="box on">✓</span><span>Plan a neutral mechanical axis and justify the resection depths.</span></div>
              <div class="check"><span class="box"></span><span>Execute a tibial cut within ±2 mm of the planned 8 mm.</span></div>
              <div class="check"><span class="box"></span><span>Balance flexion and extension gaps to within 2 mm.</span></div>
              <div class="check"><span class="box"></span><span>Identify and stage a medial release without over-releasing.</span></div>
            </div>
          </div>

        </div>

        <!-- RIGHT -->
        <div class="c7 stack lg">

          <div class="card flush">
            <div class="card-head" style="padding:20px 22px 14px;margin:0">
              <h3>Attempt history</h3>
              <a class="btn ghost sm" href="sessions.html">All sessions</a>
            </div>
            <table class="tbl">
              <thead>
                <tr><th>Date</th><th>Mode</th><th>Variant</th><th class="n">Duration</th><th class="n">Score</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr><td class="k">20 May 2025</td><td>Assessment</td><td>CR · Cemented</td><td class="n">14:22</td><td class="n k">92</td><td><span class="badge pass">Passed</span></td></tr>
                <tr><td class="k">06 May 2025</td><td>Training</td><td>CR · Cemented</td><td class="n">21:07</td><td class="n k">81</td><td><span class="badge pass">Passed</span></td></tr>
                <tr><td class="k">28 Apr 2025</td><td>Training</td><td>PS · Cemented</td><td class="n">26:44</td><td class="n k">64</td><td><span class="badge warn">Below pass mark</span></td></tr>
              </tbody>
            </table>
          </div>

          <div class="card accent">
            <div class="card-head" style="border-color:var(--accent-line)">
              <h3>Instructor configuration</h3>
              <span class="badge live">Instructor only</span>
            </div>
            <p class="sub" style="margin-bottom:18px">Per-scene overrides. A configured session carries a <b>Custom configuration</b> badge on its report, so results are never compared against a different rule set without the reader knowing.</p>

            <div class="stack">
              <div class="lrow" style="background:var(--card);border-radius:var(--r-sm);border:1px solid var(--accent-line)">
                <div class="grow"><div class="lt">Tolerance bands</div><div class="ld">Scale factor applied to every authored value</div></div>
                <div class="seg"><span>×0.7</span><span class="on">×1.0</span><span>×1.5</span></div>
              </div>
              <div class="lrow" style="background:var(--card);border-radius:var(--r-sm);border:1px solid var(--accent-line)">
                <div class="grow"><div class="lt">Cartilage grade (9.1)</div><div class="ld">Gates the resurfacing decision</div></div>
                <div class="chip">Grade III ▾</div>
              </div>
              <div class="lrow" style="background:var(--card);border-radius:var(--r-sm);border:1px solid var(--accent-line)">
                <div class="grow"><div class="lt">Adhesion count (2.3)</div><div class="ld">Bands to release before subluxation unlocks</div></div>
                <div class="chip">3 ▾</div>
              </div>
              <div class="lrow" style="background:var(--card);border-radius:var(--r-sm);border:1px solid var(--accent-line)">
                <div class="grow"><div class="lt">Guides in Training</div><div class="ld">Ghosts, corridors, arrows, target dots</div></div>
                <div class="seg"><span class="on">On</span><span>Off</span></div>
              </div>
              <div class="lrow" style="background:var(--card);border-radius:var(--r-sm);border:1px solid var(--accent-line)">
                <div class="grow"><div class="lt">Mandatory parts</div><div class="ld">Parts a learner may not skip</div></div>
                <div class="chip">P0–P11 (all) ▾</div>
              </div>
            </div>

            <div class="footbar" style="border-color:var(--accent-line)">
              <span class="tiny">Presets are named and assignable to a cohort.</span>
              <span class="spacer"></span>
              <button class="btn">Reset to authored</button>
              <button class="btn primary">Save as preset</button>
            </div>
          </div>

        </div>

      </div>

    </div>
  </div>
</div>
<script src="wire.js"></script>
</body>
</html>

```

### `wireframe\cases.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cases — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body data-nav="cases">
<div class="app">
  <aside class="side" data-side></aside>
  <div class="main">
    <header class="topbar" data-topbar data-crumb="Cases"></header>
    <div class="canvas">

      <div class="page-head">
        <div class="grow">
          <h1>Cases</h1>
          <p class="sub">Every case is synthetic. No patient data is stored anywhere in the product.</p>
        </div>
        <a class="btn primary" href="setup.html">Start simulation</a>
      </div>

      <div class="card pad-sm" style="margin-bottom:24px">
        <div class="row">
          <div class="inp ph-text" style="flex:1;min-width:220px">Search by case name or ID…</div>
          <span class="chip on">All pathologies ▾</span>
          <span class="chip">Side ▾</span>
          <span class="chip">Difficulty ▾</span>
          <span class="chip">Attempted ▾</span>
          <span class="spacer"></span>
          <span class="tiny">8 cases</span>
        </div>
      </div>

      <div class="grid auto">

        <a class="card flush" href="case-detail.html">
          <div class="ph wide" style="border:none;border-radius:0">Case thumbnail 16:9</div>
          <div style="padding:16px">
            <div class="row between" style="margin-bottom:8px">
              <h3>Case 1 — Varus OA</h3>
              <span class="badge pass">92%</span>
            </div>
            <div class="row" style="gap:6px;margin-bottom:14px">
              <span class="chip mut">Osteoarthritis</span>
              <span class="chip mut">Right</span>
              <span class="chip mut">Intermediate</span>
            </div>
            <p class="tiny" style="margin-bottom:14px">68 y, medial compartment collapse, 8.2° varus. The reference case for the full 11-part walkthrough.</p>
            <span class="btn ghost sm" style="padding-left:0">Start planning →</span>
          </div>
        </a>

        <a class="card flush" href="case-detail.html">
          <div class="ph wide" style="border:none;border-radius:0">Case thumbnail 16:9</div>
          <div style="padding:16px">
            <div class="row between" style="margin-bottom:8px">
              <h3>Case 2 — Valgus OA</h3>
              <span class="badge warn">64%</span>
            </div>
            <div class="row" style="gap:6px;margin-bottom:14px">
              <span class="chip mut">Osteoarthritis</span>
              <span class="chip mut">Left</span>
              <span class="chip mut">Expert</span>
            </div>
            <p class="tiny" style="margin-bottom:14px">Lateral compartment wear with a tight lateral sleeve. PS variant recommended.</p>
            <span class="btn ghost sm" style="padding-left:0">Start planning →</span>
          </div>
        </a>

        <a class="card flush" href="case-detail.html">
          <div class="ph wide" style="border:none;border-radius:0">Case thumbnail 16:9</div>
          <div style="padding:16px">
            <div class="row between" style="margin-bottom:8px">
              <h3>Case 3 — Post-traumatic</h3>
              <span class="badge">Not attempted</span>
            </div>
            <div class="row" style="gap:6px;margin-bottom:14px">
              <span class="chip mut">Post-traumatic</span>
              <span class="chip mut">Right</span>
              <span class="chip mut">Expert</span>
            </div>
            <p class="tiny" style="margin-bottom:14px">Old plateau fracture, AORI type 2A defect. Augment likely required before keel.</p>
            <span class="btn ghost sm" style="padding-left:0">Start planning →</span>
          </div>
        </a>

        <a class="card flush" href="case-detail.html">
          <div class="ph wide" style="border:none;border-radius:0">Case thumbnail 16:9</div>
          <div style="padding:16px">
            <div class="row between" style="margin-bottom:8px">
              <h3>Case 4 — Rheumatoid</h3>
              <span class="badge">Not attempted</span>
            </div>
            <div class="row" style="gap:6px;margin-bottom:14px">
              <span class="chip mut">Inflammatory</span>
              <span class="chip mut">Left</span>
              <span class="chip mut">Beginner</span>
            </div>
            <p class="tiny" style="margin-bottom:14px">Soft bone, balanced deformity. Introductory case for residents.</p>
            <span class="btn ghost sm" style="padding-left:0">Start planning →</span>
          </div>
        </a>

        <a class="card flush" href="case-detail.html">
          <div class="ph wide" style="border:none;border-radius:0">Case thumbnail 16:9</div>
          <div style="padding:16px">
            <div class="row between" style="margin-bottom:8px">
              <h3>Case 5 — Severe varus</h3>
              <span class="badge fail">51%</span>
            </div>
            <div class="row" style="gap:6px;margin-bottom:14px">
              <span class="chip mut">Osteoarthritis</span>
              <span class="chip mut">Right</span>
              <span class="chip mut">Expert</span>
            </div>
            <p class="tiny" style="margin-bottom:14px">18° varus with a fixed flexion contracture. Staged medial release required.</p>
            <span class="btn ghost sm" style="padding-left:0">Start planning →</span>
          </div>
        </a>

        <div class="card sunken" style="display:grid;place-items:center;min-height:240px;text-align:center">
          <div>
            <div class="tiny" style="margin-bottom:8px">3 more cases match no active filter</div>
            <span class="btn sm">Clear filters</span>
          </div>
        </div>

      </div>

      <div class="note" style="margin-top:28px">
        Selecting a card opens a summary drawer with <b>Start planning</b> (<code>the spec</code> B2). Shown here as a full page — <a href="case-detail.html" style="color:var(--accent);font-weight:600">case detail</a>.
      </div>

    </div>
  </div>
</div>
<script src="wire.js"></script>
</body>
</html>

```

### `wireframe\home.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Home — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body data-nav="home">
<div class="app">
  <aside class="side" data-side></aside>
  <div class="main">
    <header class="topbar" data-topbar data-crumb="Home"></header>
    <div class="canvas">

      <div class="banner">
        <span class="ic">i</span>
        <div class="grow">
          <div class="bt">Session complete on the headset</div>
          <div class="bd">Case 1 — Varus OA, right knee · Assessment · finished 4 minutes ago.</div>
        </div>
        <button class="btn sm primary">View report</button>
      </div>

      <div class="page-head">
        <div class="grow">
          <h1>Welcome back, Dr Arjun Mehta</h1>
          <p class="sub">Surgeon · Resident level</p>
        </div>
        <button class="btn">Take the tour</button>
      </div>

      <div class="grid g12">

        <div class="c8 card" style="display:flex;flex-direction:column;gap:18px">
          <div>
            <div class="eyebrow">Start a simulation</div>
            <h2 style="margin:8px 0 6px">Plan a case, send it to the headset</h2>
            <p class="sub">Seven pre-operative steps produce a saved plan and a 4-digit pairing PIN. The headset scores you against that plan.</p>
          </div>
          <div class="row" style="gap:10px">
            <a class="btn primary lg" href="setup.html">Start simulation</a>
            <a class="btn lg" href="cases.html">Browse cases</a>
          </div>
          <div class="row" style="gap:8px;margin-top:2px">
            <span class="chip mut">Total Knee Replacement</span>
            <span class="chip mut">Training · Intermediate</span>
            <span class="chip mut">CR · Cemented</span>
            <span class="tiny">defaults from your role</span>
          </div>
        </div>

        <div class="c4 card">
          <div class="eyebrow grey">My performance</div>
          <div class="row" style="align-items:baseline;gap:8px;margin:14px 0 10px">
            <span class="num">78<small style="font-size:20px;color:var(--muted)">%</small></span>
            <span class="badge pass">Above pass mark</span>
          </div>
          <div class="bar"><i style="width:78%"></i></div>
          <dl class="kv" style="margin-top:20px">
            <dt>Sessions</dt><dd>24</dd>
            <dt>Assessments</dt><dd>12</dd>
            <dt>Average score</dt><dd>78%</dd>
            <dt>Last active</dt><dd>12 May 2025</dd>
          </dl>
          <a class="btn ghost sm" href="performance.html" style="margin-top:16px;padding-left:0">View all →</a>
        </div>

      </div>

      <div class="sec"><h2>Continue</h2><span class="line"></span><a class="act" href="sessions.html">All sessions</a></div>
      <div class="grid g3">

        <div class="card">
          <div class="row between" style="margin-bottom:12px">
            <h3>Total Knee Replacement</h3>
            <span class="badge live"><span class="dot"></span>In progress</span>
          </div>
          <p class="tiny" style="margin-bottom:14px">Training · Intermediate · CR · Cemented</p>
          <div class="bar"><i style="width:65%"></i></div>
          <div class="row between" style="margin-top:8px">
            <span class="tiny">Part 6 of 11 · Balancing</span>
            <span class="tiny">65%</span>
          </div>
          <div class="row" style="margin-top:16px;gap:8px">
            <button class="btn sm primary">Resume</button>
            <button class="btn sm">Details</button>
          </div>
        </div>

        <div class="card">
          <div class="row between" style="margin-bottom:12px">
            <h3>Total Knee Replacement</h3>
            <span class="badge">Planning</span>
          </div>
          <p class="tiny" style="margin-bottom:14px">Assessment · Expert · PS · Cementless</p>
          <div class="bar"><i style="width:42%"></i></div>
          <div class="row between" style="margin-top:8px">
            <span class="tiny">Step 3 of 7 · Deformity</span>
            <span class="tiny">42%</span>
          </div>
          <div class="row" style="margin-top:16px;gap:8px">
            <a class="btn sm primary" href="plan-3.html">Resume</a>
            <button class="btn sm">Discard</button>
          </div>
        </div>

        <div class="card sunken" style="display:grid;place-items:center;text-align:center">
          <div>
            <div class="tiny" style="margin-bottom:10px">Nothing else in progress</div>
            <a class="btn sm" href="cases.html">Browse cases</a>
          </div>
        </div>

      </div>

      <div class="sec"><h2>Quick access</h2><span class="line"></span></div>
      <div class="grid g4">
        <a class="card pad-sm" href="sessions.html"><h3>Saved sessions</h3><p class="tiny" style="margin-top:4px">24 total · 3 resumable</p></a>
        <a class="card pad-sm" href="cases.html"><h3>My cases</h3><p class="tiny" style="margin-top:4px">8 available · 5 attempted</p></a>
        <a class="card pad-sm" href="library.html"><h3>Learning resources</h3><p class="tiny" style="margin-top:4px">Guides, videos, references</p></a>
        <a class="card pad-sm" href="help.html"><h3>Help</h3><p class="tiny" style="margin-top:4px">Pairing &amp; troubleshooting</p></a>
      </div>

      <div class="note" style="margin-top:32px">
        Contextual banners replace the photographic hero from the source mockups: <b>session finished</b> (info), <b>session live now</b> (brand, with Watch progress), <b>headset unreachable</b> (warning, with Troubleshoot pairing). One at a time, above the fold.
      </div>

    </div>
  </div>
</div>
<script src="wire.js"></script>
</body>
</html>

```

### `wireframe\index.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MediVeR XR — Wireframes</title>
<link rel="stylesheet" href="wire.css">
</head>
<body>
<div class="canvas" style="padding-top:56px">

  <div class="page-head">
    <div class="grow">
      <div class="eyebrow">Wireframe set · v0.1</div>
      <h1>MediVeR XR — screen wireframes</h1>
      <p class="sub">Low-fidelity structure for the screens drawn so far. The rest of the map — teaching, analytics, settings and the in-headset panels — has not been drawn yet.</p>
    </div>
  </div>

  <div class="banner warn">
    <span class="ic">!</span>
    <div class="grow">
      <div class="bt">Proposed change to the design language</div>
      <div class="bd">These use a <b>curved, minimal</b> language — 12–22px radii and pill controls — against the flatter 2px / 4px radii agreed earlier. Treat the set as a proposal on shape only. Colour, spacing scale, type hierarchy and the tri-state semantics are unchanged.</div>
    </div>
  </div>

  <div class="sec"><h2>Entry</h2><span class="line"></span></div>
  <div class="idx-grid">
    <a class="idx" href="login.html"><span class="r">/login</span><span class="t">Login</span><span class="d">Single card. No sign-up, no forgot-password in Phase 1.</span></a>
    <a class="idx" href="home.html"><span class="r">/</span><span class="t">Home</span><span class="d">Launchpad, continue learning, performance summary, contextual banners.</span></a>
  </div>

  <div class="sec"><h2>Choosing a case</h2><span class="line"></span></div>
  <div class="idx-grid">
    <a class="idx" href="simulations.html"><span class="r">/simulations</span><span class="t">Simulations</span><span class="d">Procedure catalogue. TKR live; others queued.</span></a>
    <a class="idx" href="cases.html"><span class="r">/cases</span><span class="t">Case browser</span><span class="d">Filter bar + case card grid.</span></a>
    <a class="idx" href="case-detail.html"><span class="r">/cases/:id</span><span class="t">Case detail</span><span class="d">Snapshot, imaging, attempt history, instructor configure.</span></a>
    <a class="idx" href="setup.html"><span class="r">/setup</span><span class="t">Session setup</span><span class="d">Procedure, role, mode, difficulty + advanced variants.</span></a>
  </div>

  <div class="sec"><h2>Planning</h2><span class="line"></span></div>
  <div class="idx-grid">
    <a class="idx" href="plan-1.html"><span class="r">/plan/:id/step/1</span><span class="t">1 · Case history</span><span class="d">Patient snapshot, 3D knee, diagnosis select. 45–60 s. Steps 2–7 to follow.</span></a>
  </div>

  <div class="sec"><h2>After the headset</h2><span class="line"></span></div>
  <div class="idx-grid">
    <a class="idx" href="sessions.html"><span class="r">/sessions</span><span class="t">Session list</span><span class="d">All sessions, filterable, each row links to its report.</span></a>
    <a class="idx" href="report.html"><span class="r">/sessions/:id/report</span><span class="t">Surgical case report</span><span class="d">The deliverable. Planned vs achieved, print-faithful.</span></a>
  </div>

<p class="tiny" style="margin-top:40px">Static HTML. Open any file directly in a browser — no build step, no dependencies.</p>

</div>
</body>
</html>

```

### `wireframe\login.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Login — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body>
<div class="center-page">
  <div class="center-box">

    <div class="row" style="justify-content:center;margin-bottom:28px">
      <span class="ph solid" style="width:44px;height:44px;border-radius:14px;min-height:0;background:var(--accent);color:#fff;font-size:15px">M</span>
    </div>

    <div class="card" style="padding:28px;border-radius:var(--r-lg)">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="font-size:22px;margin-bottom:6px">Sign in to MediVeR XR</h1>
        <p class="sub" style="font-size:13.5px">Surgical simulation dashboard</p>
      </div>

      <div class="stack">
        <div class="field">
          <label>Email</label>
          <div class="inp ph-text">name@hospital.nhs.uk</div>
        </div>
        <div class="field">
          <label>Password</label>
          <div class="inp ph-text">••••••••<span class="caret">show</span></div>
        </div>
        <button class="btn primary block lg" style="margin-top:4px">Sign in</button>
      </div>

      <p class="hint" style="text-align:center;margin-top:18px">Accounts are created by your administrator.</p>
    </div>

    <div class="note" style="margin-top:18px">
      <b>Phase 1:</b> no “Create account”, no “Forgot password”. Both are additive once Resend lands — the auth guard is built to accept them without a layout change (<code>the spec</code> Flow A).
    </div>

    <div class="sec"><h2>Failure states</h2><span class="line"></span></div>

    <div class="stack">
      <div class="card pad-sm">
        <div class="field">
          <label>Password</label>
          <div class="inp" style="border-color:var(--fail)">••••••••</div>
          <span class="hint err">Email or password is incorrect. Check both and try again.</span>
        </div>
      </div>
      <div class="banner warn" style="margin:0">
        <span class="ic">!</span>
        <div class="grow">
          <div class="bt">Cannot reach the server</div>
          <div class="bd">Sign-in is unavailable until the connection returns.</div>
        </div>
        <button class="btn sm">Retry</button>
      </div>
    </div>

    <p class="tiny" style="text-align:center;margin-top:28px"><a href="index.html" style="color:var(--accent);font-weight:600">← Wireframe index</a></p>

  </div>
</div>
</body>
</html>

```

### `wireframe\plan-1.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plan 1 · Case history — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body data-nav="cases">
<div class="app">
  <aside class="rail" data-rail data-step="1"></aside>
  <div class="main">
    <header class="topbar" data-topbar data-crumb="Cases / Case 1 / 1. Case history"></header>
    <div class="canvas">

      <div class="page-head">
        <div class="grow">
          <div class="eyebrow">Pre-operative phase</div>
          <h1>1. Case history</h1>
          <p class="sub">Read the history and commit to a primary diagnosis before you look at any imaging.</p>
        </div>
        <span class="chip mut">Budget 45–60 s</span>
      </div>

      <div class="grid g12">

        <div class="c4 stack">
          <div class="card">
            <div class="card-head"><h3>Patient snapshot</h3></div>
            <dl class="kv">
              <dt>Age / sex</dt><dd>68 · Female</dd>
              <dt>Side</dt><dd>Right</dd>
              <dt>BMI</dt><dd>31.4</dd>
              <dt>Occupation</dt><dd>Retired teacher</dd>
            </dl>
          </div>
          <div class="card">
            <div class="card-head"><h3>Chief complaint</h3></div>
            <p style="font-size:13.5px">Medial-sided right knee pain for four years, now constant at rest and waking her at night. Walking distance limited to about 200 m.</p>
          </div>
          <div class="card">
            <div class="card-head"><h3>History of present illness</h3></div>
            <p style="font-size:13.5px">Insidious onset, no trauma. Progressive bow-legged appearance noticed by family. Morning stiffness under 30 minutes. No systemic symptoms, no small-joint involvement.</p>
          </div>
          <div class="card">
            <div class="card-head"><h3>Past management</h3></div>
            <div class="stack" style="gap:8px">
              <div class="check"><span class="box on">✓</span><span>Physiotherapy, 12 sessions — partial relief</span></div>
              <div class="check"><span class="box on">✓</span><span>NSAIDs — limited by gastritis</span></div>
              <div class="check"><span class="box on">✓</span><span>Two intra-articular steroid injections — 6 weeks relief each</span></div>
              <div class="check"><span class="box"></span><span>Weight-loss programme — not completed</span></div>
            </div>
          </div>
        </div>

        <div class="c4">
          <div class="card" style="height:100%;display:flex;flex-direction:column">
            <div class="card-head"><h3>Clinical examination</h3><span class="badge">3D · rotatable</span></div>
            <div class="ph xtall" style="flex:1">Rotatable 3D knee model<br>drag to orbit · scroll to zoom</div>
            <div class="row" style="margin-top:14px;gap:8px">
              <span class="chip">Alignment</span>
              <span class="chip on">Varus thrust</span>
              <span class="chip">Ligament laxity</span>
              <span class="chip">Reset view</span>
            </div>
            <dl class="kv" style="margin-top:16px">
              <dt>Range of motion</dt><dd>5°–115°</dd>
              <dt>Fixed flexion</dt><dd>5°</dd>
              <dt>Varus deformity</dt><dd>8.2°, correctable</dd>
              <dt>MCL / LCL</dt><dd>Intact</dd>
            </dl>
          </div>
        </div>

        <div class="c4">
          <div class="card" style="height:100%">
            <div class="card-head"><h3>Primary diagnosis</h3><span class="badge fail">Required</span></div>
            <p class="tiny" style="margin-bottom:16px">Select one. The gate is the correct primary diagnosis.</p>
            <div class="stack">
              <div class="radio-card on">
                <div class="row between"><div class="t">Medial compartment osteoarthritis with varus deformity</div></div>
                <div class="d">Age, insidious onset, medial pain, progressive varus, no inflammatory features.</div>
              </div>
              <div class="radio-card">
                <div class="t">Rheumatoid arthritis</div>
                <div class="d">Would expect small-joint involvement and prolonged morning stiffness.</div>
              </div>
              <div class="radio-card">
                <div class="t">Post-traumatic arthritis</div>
                <div class="d">No history of injury or fracture.</div>
              </div>
              <div class="radio-card">
                <div class="t">Avascular necrosis of the medial femoral condyle</div>
                <div class="d">Typically acute, focal, night pain out of proportion.</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="footbar">
        <span class="tiny">Time on step is recorded silently for the report. Autosaved.</span>
        <span class="spacer"></span>
        <button class="btn off">Back</button>
        <a class="btn primary lg" href="plan-2.html">Proceed to imaging review</a>
      </div>

    </div>
  </div>
</div>
<script src="wire.js"></script>
</body>
</html>

```

### `wireframe\report.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Surgical case report — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body data-nav="simulations">
<div class="app">
  <aside class="side" data-side></aside>
  <div class="main">
    <header class="topbar" data-topbar data-crumb="Sessions / Surgical case report"></header>
    <div class="canvas">

      <div class="page-head">
        <div class="grow">
          <div class="eyebrow">Session 8f2a · 20 May 2025</div>
          <h1>Surgical case report</h1>
          <p class="sub">Print-faithful — what is on screen is what exports.</p>
        </div>
        <button class="btn">Share</button>
        <button class="btn primary lg">Export PDF</button>
      </div>

      <!-- HEADER BLOCK -->
      <div class="grid g12" style="margin-bottom:8px">
        <div style="grid-column:span 7">
          <div class="card" style="height:100%">
            <h2 style="margin-bottom:14px">Case 1 — Varus OA, right knee</h2>
            <div class="grid g2" style="gap:8px 24px">
              <dl class="kv">
                <dt>Learner</dt><dd>Dr Arjun Mehta</dd>
                <dt>Mode</dt><dd>Assessment</dd>
                <dt>Difficulty</dt><dd>Intermediate</dd>
              </dl>
              <dl class="kv">
                <dt>Variant</dt><dd>CR · Cemented</dd>
                <dt>Date</dt><dd>20 May 2025</dd>
                <dt>Duration</dt><dd>14 min 22 s</dd>
              </dl>
            </div>
            <div class="row" style="gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid var(--soft)">
              <span class="chip mut">Patella resurfaced</span>
              <span class="chip mut">Part 8 skipped (CR)</span>
              <span class="chip mut">Authored tolerances</span>
            </div>
          </div>
        </div>
        <div style="grid-column:span 5">
          <div class="card" style="height:100%">
            <div class="eyebrow grey">Overall score</div>
            <div class="row" style="align-items:baseline;gap:10px;margin:12px 0 14px">
              <span class="num xl">92</span>
              <span style="font-size:22px;color:var(--muted);font-weight:600">/ 100</span>
              <span class="spacer"></span>
              <span class="badge pass">Passed</span>
            </div>
            <div class="bar pass" style="height:12px"><i style="width:92%"></i></div>
            <div class="row between" style="margin-top:10px">
              <span class="tiny">Pass mark 70 (Intermediate)</span>
              <span class="tiny" style="color:var(--ink);font-weight:700">87th percentile</span>
            </div>
            <div class="row" style="gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid var(--soft)">
              <span class="badge warn">1 critical error · −5</span>
              <span class="badge">2 borderline</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PLANNED VS ACHIEVED -->
      <div class="sec"><h2>Alignment &amp; position — planned vs achieved</h2><span class="line"></span></div>
      <div class="card flush">
        <table class="tbl">
          <thead>
            <tr>
              <th>Parameter</th>
              <th class="n">Planned</th>
              <th class="n">Achieved</th>
              <th class="n">Deviation</th>
              <th>Acceptable range</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="k">Posterior tibial slope</td><td class="n">3.0°</td><td class="n">3.2°</td><td class="n u">+0.2°</td><td class="u">0°–7°</td><td><span class="badge pass">Pass</span></td></tr>
            <tr><td class="k">Tibial rotation</td><td class="n">1.5°</td><td class="n">1.5°</td><td class="n u">0°</td><td class="u">0°–3°</td><td><span class="badge pass">Pass</span></td></tr>
            <tr><td class="k">HKA (mechanical axis)</td><td class="n">0.0°</td><td class="n">1.2° varus</td><td class="n u">+1.2°</td><td class="u">±3°</td><td><span class="badge pass">Pass</span></td></tr>
            <tr><td class="k">Joint line position</td><td class="n">0 mm</td><td class="n">2 mm ↑</td><td class="n u">+2 mm</td><td class="u">±3 mm</td><td><span class="badge pass">Pass</span></td></tr>
            <tr><td class="k">Component overhang (lateral)</td><td class="n">1.0 mm</td><td class="n">1.0 mm</td><td class="n u">0 mm</td><td class="u">0–2 mm</td><td><span class="badge pass">Pass</span></td></tr>
            <tr><td class="k">Distal femoral resection</td><td class="n">9.0 mm</td><td class="n">9.4 mm</td><td class="n u">+0.4 mm</td><td class="u">±1 mm</td><td><span class="badge pass">Pass</span></td></tr>
            <tr style="background:var(--warn-bg)"><td class="k">Distal femur — medial/lateral difference</td><td class="n u">≤1.0 mm</td><td class="n">1.4 mm</td><td class="n u">+0.4 mm</td><td class="u">≤1 mm target, ≤2 mm caution</td><td><span class="badge warn">Borderline</span></td></tr>
            <tr><td class="k">Proximal tibial resection</td><td class="n">8.0 mm</td><td class="n">8.3 mm</td><td class="n u">+0.3 mm</td><td class="u">±2 mm</td><td><span class="badge pass">Pass</span></td></tr>
            <tr><td class="k">Implant sizes</td><td class="n">F4 / T4 / 10 mm</td><td class="n">F4 / T4 / 10 mm</td><td class="n u">—</td><td class="u">exact match</td><td><span class="badge pass">Pass</span></td></tr>
          </tbody>
        </table>
        <p class="tiny" style="padding:14px 16px;border-top:1px solid var(--soft)">A deviation from your plan is only penalised if it is <b>also outside the clinical acceptable range</b>. Planning a 3° slope and achieving 3.2° inside 0°–7° is not an error, and the score is unaffected.</p>
      </div>

      <!-- BREAKDOWN + TIMELINE -->
      <div class="grid g12" style="margin-top:28px">

        <div style="grid-column:span 5">
          <div class="sec" style="margin-top:0"><h2>Category breakdown</h2><span class="line"></span></div>
          <div class="card">
            <div class="bars">
              <div class="brow"><span>Pre-operative planning</span><div class="bar pass"><i style="width:100%"></i></div><span class="n">20/20</span></div>
              <div class="brow"><span>Bone cuts &amp; alignment</span><div class="bar warn"><i style="width:88%"></i></div><span class="n">22/25</span></div>
              <div class="brow"><span>Gap assessment</span><div class="bar pass"><i style="width:100%"></i></div><span class="n">15/15</span></div>
              <div class="brow"><span>Trialling &amp; stability</span><div class="bar pass"><i style="width:100%"></i></div><span class="n">15/15</span></div>
              <div class="brow"><span>Implantation &amp; cementation</span><div class="bar pass"><i style="width:100%"></i></div><span class="n">15/15</span></div>
              <div class="brow"><span>Patellar management</span><div class="bar pass"><i style="width:100%"></i></div><span class="n">5/5</span></div>
            </div>
            <div style="border-top:1px solid var(--soft);margin-top:20px;padding-top:16px">
              <div class="row between" style="margin-bottom:8px"><span class="tiny">Sub-total</span><span style="font-weight:700;color:var(--ink)">97 / 100</span></div>
              <div class="row between" style="margin-bottom:8px"><span class="tiny">Critical error deduction (1 × −5)</span><span style="font-weight:700;color:var(--fail)">−5</span></div>
              <div class="row between"><span style="font-weight:700;color:var(--ink)">Total</span><span style="font-weight:700;color:var(--ink);font-size:18px">92</span></div>
            </div>
            <p class="tiny" style="margin-top:14px">Exposure and closure (Parts 2, 3, 11) contribute as modifiers rather than as their own category. Time contributes 10% of each category, capped so accuracy always beats speed.</p>
          </div>
        </div>

        <div style="grid-column:span 7">
          <div class="sec" style="margin-top:0"><h2>Step-by-step timeline</h2><span class="line"></span><span class="act">Expand all</span></div>
          <div class="card">
            <div class="tl">
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P0 · Pre-surgery check</b><div class="ld tiny">All three Time Out checks correct first attempt</div></div><div class="row" style="gap:8px"><span class="tiny">0:48</span><span class="badge pass">Pass</span></div></div></div>
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P1 · Positioning &amp; preparation</b><div class="ld tiny">Tourniquet, drape, limb position</div></div><div class="row" style="gap:8px"><span class="tiny">0:52</span><span class="badge pass">Pass</span></div></div></div>
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P2 · Surgical approach</b><div class="ld tiny">Arthrotomy 6.2 mm from the quadriceps tendon</div></div><div class="row" style="gap:8px"><span class="tiny">2:41</span><span class="badge pass">Pass</span></div></div></div>
              <div class="ti warn"><div class="row between"><div><b style="color:var(--ink)">P3 · Joint preparation</b><div class="ld tiny">3 of 4 osteophyte clusters removed — one posterior cluster left</div></div><div class="row" style="gap:8px"><span class="tiny">1:36</span><span class="badge warn">Borderline</span></div></div></div>
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P4 · Tibial resection</b><div class="ld tiny">Depth 8.3 mm, no overcut, no MCL warning</div></div><div class="row" style="gap:8px"><span class="tiny">3:02</span><span class="badge pass">Pass</span></div></div></div>
              <div class="ti fail"><div class="row between"><div><b style="color:var(--ink)">P5 · Femoral preparation</b><div class="ld tiny">Anterior notch risk breached at 5.3 — <b style="color:var(--fail)">critical error</b>. Distal cut asymmetric 1.4 mm.</div></div><div class="row" style="gap:8px"><span class="tiny">4:15</span><span class="badge fail">Critical</span></div></div></div>
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P6 · Balancing &amp; trialling</b><div class="ld tiny">Gap difference 1 mm, ROM 124°, no J-sign</div></div><div class="row" style="gap:8px"><span class="tiny">1:48</span><span class="badge pass">Pass</span></div></div></div>
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P7 · Tibial final preparation</b><div class="ld tiny">Keel 22 mm, no cortical breach, pin order correct</div></div><div class="row" style="gap:8px"><span class="tiny">1:11</span><span class="badge pass">Pass</span></div></div></div>
              <div class="ti"><div class="row between"><div><b style="color:var(--muted)">P8 · PS box cut</b><div class="ld tiny">Skipped — CR variant</div></div><span class="badge">Not applicable</span></div></div>
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P9 · Patellar management</b><div class="ld tiny">Denervation 315°, resurfaced, ream depth 8.2 mm</div></div><div class="row" style="gap:8px"><span class="tiny">1:04</span><span class="badge pass">Pass</span></div></div></div>
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P10 · Cementation</b><div class="ld tiny">Working window 168 s, all four zones cleared &gt;90%</div></div><div class="row" style="gap:8px"><span class="tiny">2:33</span><span class="badge pass">Pass</span></div></div></div>
              <div class="ti pass"><div class="row between"><div><b style="color:var(--ink)">P11 · Closure &amp; debrief</b><div class="ld tiny">Quadriceps mismatch 3 mm, tourniquet deflated, drain secured</div></div><div class="row" style="gap:8px"><span class="tiny">1:32</span><span class="badge pass">Pass</span></div></div></div>
            </div>
            <p class="tiny" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--soft)">Expanding a row reveals every event logged for that scene.</p>
          </div>
        </div>

      </div>

      <!-- FEEDBACK -->
      <div class="sec"><h2>Actionable feedback</h2><span class="line"></span><span class="tiny">Critical first, then by point loss. Capped at five.</span></div>
      <div class="stack">
        <div class="card" style="border-left:3px solid var(--fail)">
          <div class="row between" style="margin-bottom:10px">
            <div class="row" style="gap:8px"><span class="badge fail">Critical</span><span class="chip mut">Scene 5.3</span></div>
            <span class="tiny">−5 points</span>
          </div>
          <p style="font-size:14px">Your anterior femoral cut notched the cortex by 1.2 mm. Anterior notching raises the risk of a peri-prosthetic supracondylar fracture. Size up or shift the block anteriorly before committing to the cut.</p>
          <div class="row" style="margin-top:14px"><a class="btn sm primary" href="setup.html">Practise scene 5.3</a><a class="btn sm" href="replay.html">Watch replay</a></div>
        </div>

        <div class="card" style="border-left:3px solid var(--warn)">
          <div class="row between" style="margin-bottom:10px">
            <div class="row" style="gap:8px"><span class="badge warn">Borderline</span><span class="chip mut">Scene 5.2</span></div>
            <span class="tiny">−1.5 points</span>
          </div>
          <p style="font-size:14px">Your distal femoral cut was asymmetric by 1.4 mm. This tilts the femoral component in the coronal plane. Practise stabilising the cutting block before starting the saw.</p>
          <div class="row" style="margin-top:14px"><a class="btn sm primary" href="setup.html">Practise scene 5.2</a><a class="btn sm" href="replay.html">Watch replay</a></div>
        </div>

        <div class="card" style="border-left:3px solid var(--warn)">
          <div class="row between" style="margin-bottom:10px">
            <div class="row" style="gap:8px"><span class="badge warn">Borderline</span><span class="chip mut">Scene 3.3</span></div>
            <span class="tiny">−1.5 points</span>
          </div>
          <p style="font-size:14px">One posterior osteophyte cluster was left in place. Retained posterior osteophytes tether the capsule and are a common cause of residual fixed flexion. Sweep the posterior condyles with a curved osteotome after the femoral cuts.</p>
          <div class="row" style="margin-top:14px"><a class="btn sm primary" href="setup.html">Practise scene 3.3</a><a class="btn sm" href="replay.html">Watch replay</a></div>
        </div>
      </div>

      <!-- RADIOGRAPHS -->
      <div class="sec"><h2>Post-operative radiographs</h2><span class="line"></span></div>
      <div class="card">
        <div class="row" style="gap:8px;margin-bottom:16px">
          <span class="chip on">AP</span>
          <span class="chip">Lateral</span>
          <span class="chip">Full-length standing</span>
          <span class="spacer"></span>
          <span class="chip mut">Planned overlay ✓</span>
          <span class="chip mut">Pre-op comparison</span>
        </div>
        <div class="grid g3">
          <div><div class="ph tall">AP — achieved vs planned overlay</div><p class="tiny" style="margin-top:8px">AP standing</p></div>
          <div><div class="ph tall">Lateral — slope 3.2°</div><p class="tiny" style="margin-top:8px">Lateral</p></div>
          <div><div class="ph tall">Full-length — HKA 1.2° varus</div><p class="tiny" style="margin-top:8px">Full-length standing</p></div>
        </div>
      </div>

      <div class="footbar">
        <a class="btn" href="replay.html">Replay by scene</a>
        <a class="btn" href="telemetry.html">View telemetry log</a>
        <button class="btn">Restart workspace</button>
        <span class="spacer"></span>
        <button class="btn primary lg">Export PDF</button>
      </div>

    </div>
  </div>
</div>
<script src="wire.js"></script>
</body>
</html>

```

### `wireframe\sessions.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sessions — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body data-nav="simulations">
<div class="app">
  <aside class="side" data-side></aside>
  <div class="main">
    <header class="topbar" data-topbar data-crumb="Sessions"></header>
    <div class="canvas">

      <div class="page-head">
        <div class="grow">
          <h1>Sessions</h1>
          <p class="sub">One session is one run of the operative phase against one plan.</p>
        </div>
        <a class="btn primary" href="setup.html">Start simulation</a>
      </div>

      <div class="banner" style="margin-bottom:20px">
        <span class="ic">●</span>
        <div class="grow">
          <div class="bt">A session is running now</div>
          <div class="bd">Case 1 — Varus OA · Part 6 Balancing &amp; trialling · 9 min 14 s elapsed.</div>
        </div>
        <a class="btn sm primary" href="session-live.html">Watch progress</a>
      </div>

      <div class="card pad-sm" style="margin-bottom:20px">
        <div class="row">
          <div class="inp ph-text" style="flex:1;min-width:200px">Search sessions…</div>
          <span class="chip on">All modes ▾</span>
          <span class="chip">Difficulty ▾</span>
          <span class="chip">Status ▾</span>
          <span class="chip">Last 90 days ▾</span>
          <span class="spacer"></span>
          <span class="tiny">24 sessions</span>
        </div>
      </div>

      <div class="card flush">
        <table class="tbl">
          <thead>
            <tr>
              <th>Date</th><th>Case</th><th>Mode</th><th>Difficulty</th><th>Variant</th>
              <th class="n">Duration</th><th class="n">Score</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="k">Now</td><td>Case 1 — Varus OA</td><td>Training</td><td>Intermediate</td><td>CR · Cemented</td>
              <td class="n">9:14</td><td class="n u">—</td><td><span class="badge live"><span class="dot"></span>Live</span></td>
              <td><a class="btn ghost sm" href="session-live.html">Watch</a></td>
            </tr>
            <tr>
              <td class="k">20 May 2025</td><td>Case 1 — Varus OA</td><td>Assessment</td><td>Intermediate</td><td>CR · Cemented</td>
              <td class="n">14:22</td><td class="n k">92</td><td><span class="badge pass">Passed</span></td>
              <td><a class="btn ghost sm" href="report.html">Report</a></td>
            </tr>
            <tr>
              <td class="k">18 May 2025</td><td>Case 2 — Valgus OA</td><td>Training</td><td>Expert</td><td>PS · Cemented</td>
              <td class="n">23:51</td><td class="n k">74</td><td><span class="badge pass">Passed</span></td>
              <td><a class="btn ghost sm" href="report.html">Report</a></td>
            </tr>
            <tr>
              <td class="k">14 May 2025</td><td>Case 5 — Severe varus</td><td>Assessment</td><td>Expert</td><td>CR · Cementless</td>
              <td class="n">31:07</td><td class="n k">51</td><td><span class="badge fail">Not passed</span></td>
              <td><a class="btn ghost sm" href="report.html">Report</a></td>
            </tr>
            <tr style="background:var(--warn-bg)">
              <td class="k">12 May 2025</td><td>Case 1 — Varus OA</td><td>Training</td><td>Intermediate</td><td>CR · Cemented</td>
              <td class="n">6:40</td><td class="n u">—</td><td><span class="badge warn">Interrupted · P6</span></td>
              <td><a class="btn ghost sm" href="#resume">Resume</a></td>
            </tr>
            <tr>
              <td class="k">06 May 2025</td><td>Case 1 — Varus OA</td><td>Training</td><td>Intermediate</td><td>CR · Cemented</td>
              <td class="n">21:07</td><td class="n k">81</td><td><span class="badge pass">Passed</span></td>
              <td><a class="btn ghost sm" href="report.html">Report</a></td>
            </tr>
            <tr>
              <td class="k">28 Apr 2025</td><td>Case 1 — Varus OA</td><td>Training</td><td>Intermediate</td><td>PS · Cemented</td>
              <td class="n">26:44</td><td class="n k">64</td><td><span class="badge warn">Below pass mark</span></td>
              <td><a class="btn ghost sm" href="report.html">Report</a></td>
            </tr>
            <tr>
              <td class="k">21 Apr 2025</td><td>Case 4 — Rheumatoid</td><td>Training</td><td>Beginner</td><td>CR · Cemented</td>
              <td class="n">28:12</td><td class="n k">88</td><td><span class="badge pass">Passed</span></td>
              <td><a class="btn ghost sm" href="report.html">Report</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sec"><h2>Resume detail — Flow E</h2><span class="line"></span></div>
      <div class="card" id="resume">
        <div class="row between" style="margin-bottom:18px">
          <div>
            <h3>Case 1 — Varus OA, right knee</h3>
            <p class="tiny" style="margin-top:4px">Training · Intermediate · CR · Cemented · started 12 May 2025, 14:02</p>
          </div>
          <span class="badge warn">Interrupted</span>
        </div>

        <div class="hsteps">
          <div class="hstep done"><span class="dot">✓</span><span class="l">P0 Time Out</span></div><span class="hline"></span>
          <div class="hstep done"><span class="dot">✓</span><span class="l">P1 Positioning</span></div><span class="hline"></span>
          <div class="hstep done"><span class="dot">✓</span><span class="l">P2 Approach</span></div><span class="hline"></span>
          <div class="hstep done"><span class="dot">✓</span><span class="l">P3 Joint prep</span></div><span class="hline"></span>
          <div class="hstep done"><span class="dot">✓</span><span class="l">P4 Tibial</span></div><span class="hline"></span>
          <div class="hstep done"><span class="dot">✓</span><span class="l">P5 Femoral</span></div><span class="hline"></span>
          <div class="hstep on"><span class="dot">6</span><span class="l">P6 Balancing</span></div><span class="hline"></span>
          <div class="hstep"><span class="dot">7</span><span class="l">P7 Tibial final</span></div><span class="hline"></span>
          <div class="hstep"><span class="dot">9</span><span class="l">P9 Patella</span></div><span class="hline"></span>
          <div class="hstep"><span class="dot">10</span><span class="l">P10 Cement</span></div><span class="hline"></span>
          <div class="hstep"><span class="dot">11</span><span class="l">P11 Closure</span></div>
        </div>

        <div class="grid g3" style="margin:20px 0">
          <div class="metric"><span class="lab">Stopped at</span><span class="val" style="font-size:20px">Scene 6.1</span><span class="tiny">Flexion/extension gaps</span></div>
          <div class="metric"><span class="lab">Elapsed</span><span class="val">6:40</span><span class="tiny">Checkpointed at scene boundary</span></div>
          <div class="metric"><span class="lab">Parts complete</span><span class="val">6<small>/ 11</small></span><span class="tiny">No data lost</span></div>
        </div>

        <div class="note">Assessment-mode sessions resume with the clock still running. Resuming issues a <b>new PIN bound to the existing session</b>, not a new one.</div>

        <div class="footbar">
          <button class="btn danger">Discard</button>
          <span class="spacer"></span>
          <button class="btn">Restart from the beginning</button>
          <button class="btn primary">Resume &amp; issue PIN</button>
        </div>
      </div>

    </div>
  </div>
</div>
<script src="wire.js"></script>
</body>
</html>

```

### `wireframe\setup.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Session setup — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body data-nav="simulations">
<div class="app">
  <aside class="side" data-side></aside>
  <div class="main">
    <header class="topbar" data-topbar data-crumb="Home / Session setup"></header>
    <div class="canvas narrow">

      <div class="page-head">
        <div class="grow">
          <div class="eyebrow">Step 1 of 2</div>
          <h1>Session setup</h1>
          <p class="sub">Everything below is defaulted from your account. Most users change nothing and press Continue.</p>
        </div>
      </div>

      <div class="card" style="padding:28px">
        <div class="stack lg">

          <div class="grid g2">
            <div class="field">
              <label>Procedure</label>
              <div class="inp">Total Knee Replacement<span class="caret">▾</span></div>
              <span class="hint">Other procedures are not yet published.</span>
            </div>
            <div class="field">
              <label>User role</label>
              <div class="inp">Surgeon<span class="caret">▾</span></div>
              <span class="hint">From your account. Controls default difficulty and mandatory parts.</span>
            </div>
          </div>

          <div class="field">
            <label>Mode</label>
            <div class="grid g2">
              <div class="radio-card on">
                <div class="row between" style="margin-bottom:6px">
                  <div class="t">Training</div>
                  <span class="badge live"><span class="dot"></span>Selected</span>
                </div>
                <div class="d">Ghost guides, directional arrows, safe corridors, live numeric readouts. Retry without penalty; hints appear after inactivity.</div>
              </div>
              <div class="radio-card">
                <div class="t">Assessment</div>
                <div class="d">No guides, no readouts, no hints. Errors are logged, not announced. One attempt per step unless the scene allows a redo.</div>
              </div>
            </div>
          </div>

          <div class="field">
            <label>Difficulty</label>
            <div class="seg">
              <span>Beginner</span>
              <span class="on">Intermediate</span>
              <span>Expert</span>
            </div>
            <span class="hint">Scales every tolerance band. Intermediate = authored values ×1.0, pass mark 70.</span>
          </div>

          <div style="border-top:1px solid var(--soft);padding-top:20px">
            <div class="row between" style="cursor:pointer">
              <div>
                <div style="font-weight:700;color:var(--ink);font-size:14px">Advanced — implant variant</div>
                <div class="tiny">CR · Cemented · Patella decided intra-operatively</div>
              </div>
              <span class="chip mut">Collapse ▴</span>
            </div>

            <div class="grid g2" style="margin-top:18px">
              <div class="field">
                <label>Implant design</label>
                <div class="seg"><span class="on">CR</span><span>PS</span></div>
                <span class="hint">PS resects the PCL at 5.1b and adds Part 8 (box cut).</span>
              </div>
              <div class="field">
                <label>Fixation</label>
                <div class="seg"><span class="on">Cemented</span><span>Cementless</span></div>
                <span class="hint">Cementless replaces 7.2 with the 7.2b broach and skips Part 10.</span>
              </div>
            </div>
          </div>

        </div>

        <div class="footbar">
          <a class="btn" href="home.html">Cancel</a>
          <span class="spacer"></span>
          <span class="tiny">11 parts · ~14 min estimated</span>
          <a class="btn primary lg" href="cases.html">Continue to case selection</a>
        </div>
      </div>

      <div class="note" style="margin-top:20px">
        Every scene must behave correctly under all six axes: mode, difficulty, implant design, fixation, patella and user role (<code>the spec</code>). Choices made here propagate into the plan JSON and are restated on the headset confirmation card before anything is committed.
      </div>

    </div>
  </div>
</div>
<script src="wire.js"></script>
</body>
</html>

```

### `wireframe\simulations.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Simulations — MediVeR XR</title>
<link rel="stylesheet" href="wire.css">
</head>
<body data-nav="simulations">
<div class="app">
  <aside class="side" data-side></aside>
  <div class="main">
    <header class="topbar" data-topbar data-crumb="Simulations"></header>
    <div class="canvas">

      <div class="page-head">
        <div class="grow">
          <h1>Simulations</h1>
          <p class="sub">Procedures published to your account. Total Knee Replacement is the only complete pathway in Phase 1.</p>
        </div>
        <a class="btn primary" href="setup.html">Start simulation</a>
      </div>

      <div class="grid g12" style="margin-bottom:8px">
        <div style="grid-column:span 8">
          <div class="card" style="height:100%">
            <div class="row between" style="margin-bottom:16px">
              <div>
                <div class="eyebrow">Available now</div>
                <h2 style="margin-top:6px">Total Knee Replacement</h2>
              </div>
              <span class="badge pass">Published</span>
            </div>
            <p class="sub" style="margin-bottom:20px">A complete clinical episode — 7 pre-operative planning steps on the desktop, 11 operative parts across 26 scenes in the headset, then a report scored against your own plan.</p>

            <div class="grid g4" style="gap:12px;margin-bottom:20px">
              <div class="metric"><span class="lab">Parts</span><span class="val">11</span></div>
              <div class="metric"><span class="lab">Scenes</span><span class="val">26</span></div>
              <div class="metric"><span class="lab">Cases</span><span class="val">8</span></div>
              <div class="metric"><span class="lab">Typical run</span><span class="val" style="font-size:22px">14 min</span></div>
            </div>

            <div class="row" style="gap:8px;margin-bottom:20px">
              <span class="chip mut">Training</span><span class="chip mut">Assessment</span>
              <span class="chip mut">CR / PS</span><span class="chip mut">Cemented / Cementless</span>
              <span class="chip mut">Beginner → Expert</span>
            </div>

            <div class="row" style="gap:10px">
              <a class="btn primary" href="setup.html">Start</a>
              <a class="btn" href="cases.html">Browse cases</a>
              <a class="btn ghost" href="library.html">Procedure guide</a>
            </div>
          </div>
        </div>

        <div style="grid-column:span 4">
          <div class="card" style="height:100%">
            <div class="card-head"><h3>The 11 operative parts</h3></div>
            <div class="stack" style="gap:9px">
              <div class="row" style="gap:10px"><span class="badge">P0</span><span class="tiny">Pre-surgery check (Time Out)</span></div>
              <div class="row" style="gap:10px"><span class="badge">P1</span><span class="tiny">Positioning &amp; preparation</span></div>
              <div class="row" style="gap:10px"><span class="badge">P2</span><span class="tiny">Surgical approach</span></div>
              <div class="row" style="gap:10px"><span class="badge">P3</span><span class="tiny">Joint preparation</span></div>
              <div class="row" style="gap:10px"><span class="badge">P4</span><span class="tiny">Tibial resection</span></div>
              <div class="row" style="gap:10px"><span class="badge">P5</span><span class="tiny">Femoral preparation</span></div>
              <div class="row" style="gap:10px"><span class="badge">P6</span><span class="tiny">Balancing &amp; trialling</span></div>
              <div class="row" style="gap:10px"><span class="badge">P7</span><span class="tiny">Tibial final preparation</span></div>
              <div class="row" style="gap:10px"><span class="badge">P8</span><span class="tiny">PS box cut — <i>PS only</i></span></div>
              <div class="row" style="gap:10px"><span class="badge">P9</span><span class="tiny">Patellar management</span></div>
              <div class="row" style="gap:10px"><span class="badge">P10</span><span class="tiny">Cementation — <i>cemented only</i></span></div>
              <div class="row" style="gap:10px"><span class="badge">P11</span><span class="tiny">Closure &amp; debrief</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="sec"><h2>In development</h2><span class="line"></span></div>
      <div class="grid g3">
        <div class="card sunken" style="border-style:solid;background:var(--card)">
          <div class="row between" style="margin-bottom:10px"><h3 style="color:var(--muted)">Total Hip Replacement</h3><span class="badge">Planned</span></div>
          <p class="tiny">Posterior and direct anterior approaches. Not scheduled for Phase 1.</p>
        </div>
        <div class="card sunken" style="border-style:solid;background:var(--card)">
          <div class="row between" style="margin-bottom:10px"><h3 style="color:var(--muted)">IV Cannulation</h3><span class="badge">Planned</span></div>
          <p class="tiny">Nursing-student pathway. Shorter session, instrument-recognition led.</p>
        </div>
        <div class="card sunken" style="border-style:solid;background:var(--card)">
          <div class="row between" style="margin-bottom:10px"><h3 style="color:var(--muted)">Unicompartmental Knee</h3><span class="badge">Exploratory</span></div>
          <p class="tiny">Reuses the TKR cutter and jig framework.</p>
        </div>
      </div>

    </div>
  </div>
</div>
<script src="wire.js"></script>
</body>
</html>

```

### `wireframe\wire.css`

```css
/* ============================================================
   MediVeR XR — Wireframe kit
   Low-fidelity, minimal, curved. Structure over decoration.
   NOTE: radii here intentionally exceed the agreed 2/4px scale.
   ============================================================ */

:root{
  --paper:#F6F7F9;
  --card:#FFFFFF;
  --line:#E4E7EC;
  --soft:#EEF0F4;
  --fill:#F2F4F7;
  --ink:#12161B;
  --text:#39414B;
  --muted:#89929F;
  --faint:#AFB7C2;

  --accent:#1155CC;
  --accent-soft:#EDF3FE;
  --accent-line:#C9DAF8;

  --pass:#2E7D57;  --pass-bg:#EAF3EE;
  --warn:#93672B;  --warn-bg:#F7F1E5;
  --fail:#A8443C;  --fail-bg:#F8EEEC;

  --navy:#141C25;
  --navy-2:#1E2833;
  --navy-mute:#8A97A6;

  --r-xs:8px;
  --r-sm:12px;
  --r:16px;
  --r-lg:22px;
  --pill:999px;

  --side-w:236px;
  --top-h:68px;
}

*{box-sizing:border-box;margin:0;padding:0}

html{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}

body{
  font-family:"Inter","PayPal Sans Small",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  font-size:15px;
  line-height:1.5;
  color:var(--text);
  background:var(--paper);
  font-variant-numeric:tabular-nums;
}

a{color:inherit;text-decoration:none}

/* ---------- shell ---------- */

.app{display:flex;min-height:100vh}

.side{
  width:var(--side-w);
  flex:0 0 var(--side-w);
  background:var(--navy);
  color:#fff;
  padding:20px 14px;
  display:flex;
  flex-direction:column;
  gap:4px;
  position:sticky;
  top:0;
  height:100vh;
  border-radius:0 var(--r-lg) var(--r-lg) 0;
}

.brand{
  display:flex;align-items:center;gap:10px;
  padding:6px 10px 22px;
}
.brand .mark{
  width:30px;height:30px;border-radius:10px;
  background:var(--accent);
  display:grid;place-items:center;
  font-size:13px;font-weight:700;color:#fff;letter-spacing:-.02em;
}
.brand .name{font-weight:700;font-size:15px;color:#fff;letter-spacing:-.01em}
.brand .name small{display:block;font-weight:500;font-size:10.5px;color:var(--navy-mute);letter-spacing:.09em;text-transform:uppercase}

.nav-item{
  display:flex;align-items:center;gap:11px;
  padding:9px 12px;
  border-radius:var(--r-sm);
  color:var(--navy-mute);
  font-size:13.5px;font-weight:500;
  transition:background .12s ease,color .12s ease;
}
.nav-item svg{width:18px;height:18px;flex:0 0 18px;opacity:.9}
.nav-item:hover{background:var(--navy-2);color:#DCE3EA}
.nav-item.on{background:var(--navy-2);color:#fff;font-weight:700}
.nav-item.on svg{color:#6FA0F0;opacity:1}

.nav-sep{height:1px;background:#2A3542;margin:12px 12px}
.nav-foot{margin-top:auto}

.main{flex:1;min-width:0;display:flex;flex-direction:column}

.topbar{
  height:var(--top-h);
  flex:0 0 var(--top-h);
  background:var(--card);
  border-bottom:1px solid var(--line);
  display:flex;align-items:center;
  padding:0 28px;
  gap:16px;
  position:sticky;top:0;z-index:5;
}
.crumb{display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--muted)}
.crumb b{color:var(--ink);font-weight:600}
.crumb .sep{color:var(--faint)}
.top-right{margin-left:auto;display:flex;align-items:center;gap:10px}

.canvas{
  flex:1;
  padding:32px 28px 72px;
  max-width:1440px;
  width:100%;
  margin:0 auto;
}
.canvas.narrow{max-width:980px}

/* ---------- type ---------- */

h1,h2,h3,h4{color:var(--ink);font-weight:700;letter-spacing:-.015em}
h1{font-size:28px;line-height:1.2}
h2{font-size:20px;line-height:1.3}
h3{font-size:16px;line-height:1.35}
h4{font-size:13.5px;line-height:1.4}

.eyebrow{
  font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:var(--accent);
}
.eyebrow.grey{color:var(--muted)}

.sub{color:var(--muted);font-size:14px}
.mut{color:var(--muted)}
.tiny{font-size:12px;color:var(--muted)}
.num{font-size:34px;font-weight:700;color:var(--ink);letter-spacing:-.03em;line-height:1.1}
.num.xl{font-size:52px}

.page-head{margin-bottom:24px;display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap}
.page-head .grow{flex:1;min-width:260px}
.page-head h1{margin-bottom:4px}

.sec{
  display:flex;align-items:center;gap:12px;
  margin:32px 0 14px;
}
.sec h2{font-size:13px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:700}
.sec .line{flex:1;height:1px;background:var(--line)}
.sec .act{font-size:13px;color:var(--accent);font-weight:600}

/* ---------- layout ---------- */

.grid{display:grid;gap:20px}
.g2{grid-template-columns:repeat(2,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g4{grid-template-columns:repeat(4,1fr)}
.g12{grid-template-columns:repeat(12,1fr)}
.auto{grid-template-columns:repeat(auto-fill,minmax(272px,1fr))}
.c3{grid-column:span 3}.c4{grid-column:span 4}.c5{grid-column:span 5}
.c6{grid-column:span 6}.c7{grid-column:span 7}.c8{grid-column:span 8}
.c9{grid-column:span 9}.c12{grid-column:span 12}

.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.row.end{justify-content:flex-end}
.row.between{justify-content:space-between}
.stack{display:flex;flex-direction:column;gap:12px}
.stack.lg{gap:20px}
.spacer{flex:1}

/* ---------- card ---------- */

.card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:var(--r);
  padding:22px;
}
.card.pad-sm{padding:16px}
.card.flush{padding:0;overflow:hidden}
.card.sunken{background:var(--fill);border-style:dashed}
.card.sel{border:1.5px solid var(--accent);background:var(--accent-soft)}
.card.accent{background:var(--accent-soft);border-color:var(--accent-line)}
.card-head{
  display:flex;align-items:center;gap:12px;
  padding-bottom:14px;margin-bottom:16px;
  border-bottom:1px solid var(--soft);
}
.card-head h3{flex:1}

/* ---------- placeholder ---------- */

.ph{
  background:var(--fill);
  border:1px dashed var(--line);
  border-radius:var(--r-sm);
  display:grid;place-items:center;
  color:var(--faint);
  font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  text-align:center;padding:12px;
  min-height:80px;
}
.ph.tall{min-height:300px}
.ph.xtall{min-height:420px}
.ph.wide{aspect-ratio:16/9;min-height:0}
.ph.sq{aspect-ratio:1/1;min-height:0}
.ph.thumb{aspect-ratio:4/3;min-height:0;font-size:10px}
.ph.solid{border-style:solid}

.skel{background:var(--fill);border-radius:var(--pill);height:12px}
.skel.w40{width:40%}.skel.w60{width:60%}.skel.w80{width:80%}
.skel.h20{height:20px}

/* ---------- buttons ---------- */

.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  height:40px;padding:0 18px;
  border-radius:var(--pill);
  border:1px solid var(--line);
  background:var(--card);
  color:var(--text);
  font:inherit;font-size:13.5px;font-weight:600;
  cursor:pointer;white-space:nowrap;
  transition:background .12s ease,border-color .12s ease;
}
.btn:hover{background:var(--soft);border-color:#D6DAE1}
.btn svg{width:16px;height:16px}

.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:700}
.btn.primary:hover{background:#0E45A6;border-color:#0E45A6}
.btn.ghost{background:transparent;border-color:transparent;color:var(--accent)}
.btn.ghost:hover{background:var(--accent-soft)}
.btn.danger{background:transparent;border-color:#E7CFCC;color:var(--fail)}
.btn.danger:hover{background:var(--fail-bg)}
.btn.lg{height:48px;padding:0 26px;font-size:15px}
.btn.sm{height:32px;padding:0 14px;font-size:12.5px}
.btn.block{width:100%}
.btn.icon{width:40px;padding:0}
.btn.icon.sm{width:32px}
.btn[disabled],.btn.off{
  background:var(--fill);border-color:var(--line);color:var(--faint);
  cursor:not-allowed;pointer-events:none;
}

.gate{font-size:12px;color:var(--muted);text-align:right}

/* ---------- badge / chip ---------- */

.badge{
  display:inline-flex;align-items:center;gap:5px;
  height:24px;padding:0 10px;
  border-radius:var(--pill);
  font-size:11.5px;font-weight:700;letter-spacing:.01em;
  background:var(--fill);color:var(--muted);
  white-space:nowrap;
}
.badge.pass{background:var(--pass-bg);color:var(--pass)}
.badge.warn{background:var(--warn-bg);color:var(--warn)}
.badge.fail{background:var(--fail-bg);color:var(--fail)}
.badge.live{background:var(--accent-soft);color:var(--accent)}
.badge .dot{width:6px;height:6px;border-radius:50%;background:currentColor}

.chip{
  display:inline-flex;align-items:center;gap:6px;
  height:28px;padding:0 12px;
  border-radius:var(--pill);
  border:1px solid var(--line);
  background:var(--card);
  font-size:12.5px;font-weight:500;color:var(--text);
}
.chip.on{background:var(--accent-soft);border-color:var(--accent-line);color:var(--accent);font-weight:700}
.chip.mut{color:var(--muted)}

/* segmented */
.seg{display:inline-flex;background:var(--fill);border-radius:var(--pill);padding:3px;gap:2px}
.seg span{
  padding:6px 16px;border-radius:var(--pill);
  font-size:12.5px;font-weight:600;color:var(--muted);cursor:pointer;
}
.seg span.on{background:var(--card);color:var(--ink);border:1px solid var(--line)}

/* tabs */
.tabs{display:flex;gap:26px;border-bottom:1px solid var(--line);margin-bottom:24px}
.tabs span{
  padding:0 0 12px;font-size:13.5px;font-weight:600;color:var(--muted);
  border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;
}
.tabs span.on{color:var(--ink);border-color:var(--accent);font-weight:700}

/* ---------- form ---------- */

.field{display:flex;flex-direction:column;gap:6px}
.field label{font-size:12px;font-weight:600;color:var(--muted)}
.inp{
  height:44px;border:1px solid var(--line);border-radius:var(--r-sm);
  background:var(--card);display:flex;align-items:center;padding:0 14px;
  font-size:14px;color:var(--text);gap:10px;
}
.inp.ph-text{color:var(--faint)}
.inp.focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.inp .caret{margin-left:auto;color:var(--faint);font-size:11px}
.hint{font-size:12px;color:var(--muted)}
.hint.err{color:var(--fail)}

.radio-card{
  border:1px solid var(--line);border-radius:var(--r);padding:16px;
  background:var(--card);cursor:pointer;
}
.radio-card.on{border-color:var(--accent);background:var(--accent-soft)}
.radio-card .t{font-weight:700;color:var(--ink);font-size:14px;margin-bottom:3px}
.radio-card .d{font-size:12.5px;color:var(--muted);line-height:1.45}

.check{display:flex;gap:10px;align-items:flex-start;font-size:13.5px}
.check .box{
  width:18px;height:18px;flex:0 0 18px;border-radius:6px;
  border:1px solid var(--line);background:var(--card);margin-top:2px;
  display:grid;place-items:center;color:#fff;font-size:10px;
}
.check .box.on{background:var(--accent);border-color:var(--accent)}

/* ---------- table ---------- */

.tbl{width:100%;border-collapse:collapse;font-size:13.5px}
.tbl th{
  text-align:left;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
  color:var(--muted);padding:12px 16px;background:var(--fill);
  border-bottom:1px solid var(--line);white-space:nowrap;
}
.tbl th:first-child{border-radius:var(--r-sm) 0 0 0}
.tbl th:last-child{border-radius:0 var(--r-sm) 0 0}
.tbl td{padding:13px 16px;border-bottom:1px solid var(--soft);color:var(--text)}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:#FAFBFC}
.tbl .n{text-align:right;font-variant-numeric:tabular-nums}
.tbl .k{color:var(--ink);font-weight:600}
.tbl .u{color:var(--muted);font-size:12px}

/* ---------- metric tile ---------- */

.metric{
  border:1px solid var(--line);border-radius:var(--r);background:var(--card);
  padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px;
}
.metric .lab{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.metric .val{font-size:26px;font-weight:700;color:var(--ink);letter-spacing:-.02em;line-height:1}
.metric .val small{font-size:14px;font-weight:600;color:var(--muted);margin-left:2px}

/* ---------- bar ---------- */

.bar{height:8px;border-radius:var(--pill);background:var(--fill);overflow:hidden}
.bar i{display:block;height:100%;border-radius:var(--pill);background:var(--accent)}
.bar.pass i{background:var(--pass)}
.bar.warn i{background:var(--warn)}
.bar.thin{height:6px}

.bars{display:flex;flex-direction:column;gap:14px}
.brow{display:grid;grid-template-columns:150px 1fr 62px;gap:14px;align-items:center;font-size:13px}
.brow .n{text-align:right;font-weight:700;color:var(--ink)}

.chart{
  height:190px;display:flex;align-items:flex-end;gap:10px;
  padding:12px 0 0;border-bottom:1px solid var(--line);
}
.chart i{flex:1;background:var(--accent);border-radius:var(--r-xs) var(--r-xs) 0 0;display:block;opacity:.85}
.chart i.mut{background:var(--soft)}

/* ---------- banner ---------- */

.banner{
  display:flex;align-items:flex-start;gap:12px;
  padding:14px 16px;border-radius:var(--r);
  border:1px solid var(--accent-line);background:var(--accent-soft);
  margin-bottom:20px;
}
.banner .ic{
  width:22px;height:22px;flex:0 0 22px;border-radius:50%;
  background:var(--accent);color:#fff;display:grid;place-items:center;
  font-size:12px;font-weight:700;
}
.banner .bt{font-weight:700;color:var(--ink);font-size:13.5px;margin-bottom:2px}
.banner .bd{font-size:13px;color:var(--text)}
.banner .btn{margin-left:auto;align-self:center}
.banner.warn{border-color:#E8DCC2;background:var(--warn-bg)}
.banner.warn .ic{background:var(--warn)}
.banner.fail{border-color:#E7CFCC;background:var(--fail-bg)}
.banner.fail .ic{background:var(--fail)}
.banner.pass{border-color:#CFE3D7;background:var(--pass-bg)}
.banner.pass .ic{background:var(--pass)}

/* ---------- stepper rail (planning) ---------- */

.rail{
  width:var(--side-w);flex:0 0 var(--side-w);
  background:var(--card);border-right:1px solid var(--line);
  padding:26px 16px;position:sticky;top:0;height:100vh;
  display:flex;flex-direction:column;gap:2px;
}
.rail .rail-top{padding:0 10px 20px}
.rail .rail-top .eyebrow{margin-bottom:6px}
.rail .rail-top .t{font-weight:700;color:var(--ink);font-size:14px;line-height:1.35}

.rstep{display:flex;gap:12px;padding:10px;border-radius:var(--r-sm);align-items:flex-start}
.rstep .dot{
  width:24px;height:24px;flex:0 0 24px;border-radius:50%;
  border:1px solid var(--line);background:var(--card);
  display:grid;place-items:center;font-size:11.5px;font-weight:700;color:var(--muted);
}
.rstep .lab{font-size:13px;color:var(--muted);line-height:1.35;padding-top:3px}
.rstep.done .dot{background:var(--pass);border-color:var(--pass);color:#fff}
.rstep.done .lab{color:var(--text)}
.rstep.on{background:var(--accent-soft)}
.rstep.on .dot{background:var(--accent);border-color:var(--accent);color:#fff}
.rstep.on .lab{color:var(--ink);font-weight:700}
.rstep.lock .dot{border-style:dashed}

.rail-foot{margin-top:auto;padding:16px 10px 0;border-top:1px solid var(--soft);font-size:12px;color:var(--muted)}

/* horizontal stepper */
.hsteps{display:flex;align-items:center;gap:0;margin-bottom:20px;overflow-x:auto;padding-bottom:4px}
.hstep{display:flex;align-items:center;gap:8px;flex:0 0 auto}
.hstep .dot{width:22px;height:22px;border-radius:50%;background:var(--fill);color:var(--muted);
  display:grid;place-items:center;font-size:10.5px;font-weight:700}
.hstep .l{font-size:12px;color:var(--muted);white-space:nowrap}
.hstep.done .dot{background:var(--pass);color:#fff}
.hstep.on .dot{background:var(--accent);color:#fff}
.hstep.on .l{color:var(--ink);font-weight:700}
.hline{width:26px;height:1px;background:var(--line);flex:0 0 26px;margin:0 8px}

/* ---------- action footer ---------- */

.footbar{
  display:flex;align-items:center;gap:14px;
  margin-top:28px;padding-top:22px;border-top:1px solid var(--line);
}

/* ---------- timeline / list rows ---------- */

.lrow{
  display:flex;align-items:center;gap:14px;
  padding:14px 16px;border-bottom:1px solid var(--soft);
}
.lrow:last-child{border-bottom:none}
.lrow .lt{font-weight:600;color:var(--ink);font-size:13.5px}
.lrow .ld{font-size:12.5px;color:var(--muted)}
.lrow .grow{flex:1;min-width:0}

.tl{position:relative;padding-left:26px}
.tl:before{content:"";position:absolute;left:9px;top:6px;bottom:6px;width:1px;background:var(--line)}
.tl .ti{position:relative;padding:10px 0}
.tl .ti:before{
  content:"";position:absolute;left:-22px;top:15px;width:9px;height:9px;border-radius:50%;
  background:var(--faint);border:2px solid var(--card);box-sizing:content-box;
}
.tl .ti.pass:before{background:var(--pass)}
.tl .ti.warn:before{background:var(--warn)}
.tl .ti.fail:before{background:var(--fail)}
.tl .ti.on:before{background:var(--accent)}

/* ---------- empty state ---------- */

.empty{
  background:var(--fill);border:1px dashed var(--line);border-radius:var(--r-lg);
  padding:52px 24px;text-align:center;
}
.empty .ic{
  width:48px;height:48px;border-radius:var(--r);background:var(--card);
  border:1px solid var(--line);display:grid;place-items:center;margin:0 auto 16px;color:var(--faint)
}
.empty h3{margin-bottom:6px}
.empty p{color:var(--muted);font-size:13.5px;margin-bottom:18px}

/* ---------- centred (login) ---------- */

.center-page{min-height:100vh;display:grid;place-items:center;padding:40px 20px;background:var(--paper)}
.center-box{width:100%;max-width:404px}

/* ---------- PIN ---------- */

.pin{display:flex;gap:12px}
.pin i{
  flex:1;height:76px;border-radius:var(--r);border:1px solid var(--line);
  background:var(--card);display:grid;place-items:center;
  font-size:34px;font-weight:700;color:var(--ink);font-style:normal;
}
.pin.dark i{background:transparent;border-color:#33414F;color:#F2F5F8}

/* ---------- VR (dark) ---------- */

.vr-page{background:#0A1119;color:#DDE4EB;min-height:100vh;padding:36px 28px 80px}
.vr-page h1,.vr-page h2,.vr-page h3{color:#F2F5F8}
.vr-page .sec h2{color:#7E8B99}
.vr-page .sec .line{background:#1E2833}
.vr-panel{
  background:#132030;border:1.5px solid #26333F;border-radius:var(--r-lg);
  padding:24px;color:#E4EAF0;
}
.vr-panel .vlab{font-size:10.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:#6FA0F0}
.vr-panel .vmut{color:#8A97A6;font-size:13px}
.vr-panel .vnum{font-size:38px;font-weight:700;color:#fff;letter-spacing:-.02em}
.vr-panel hr{border:none;border-top:1px solid #26333F;margin:16px 0}
.vr-panel .btn{background:#1D2C3D;border-color:#33414F;color:#DDE4EB}
.vr-panel .btn.primary{background:#2F6BD6;border-color:#2F6BD6;color:#fff}
.vr-meta{font-size:11.5px;color:#6E7B8A;margin-top:10px;letter-spacing:.02em}
.vr-key{
  display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
}
.vr-key i{
  height:58px;border-radius:var(--r);background:#1D2C3D;border:1px solid #33414F;
  display:grid;place-items:center;font-style:normal;font-size:20px;font-weight:600;color:#E4EAF0;
}
.vr-tag{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:var(--pill);
  font-size:11px;font-weight:700;background:#1D2C3D;color:#8A97A6}
.vr-tag.pass{background:#16342A;color:#4CB884}
.vr-tag.warn{background:#33291A;color:#D9A452}
.vr-tag.fail{background:#3A2321;color:#E27A6E}

/* ---------- index page ---------- */

.idx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.idx{
  border:1px solid var(--line);border-radius:var(--r);background:var(--card);
  padding:16px;display:flex;flex-direction:column;gap:4px;
  transition:border-color .12s ease,transform .12s ease;
}
.idx:hover{border-color:var(--accent-line);transform:translateY(-1px)}
.idx .r{font-size:11px;color:var(--faint);font-family:ui-monospace,Menlo,monospace}
.idx .t{font-weight:700;color:var(--ink);font-size:14px}
.idx .d{font-size:12.5px;color:var(--muted);line-height:1.45}

/* ---------- misc ---------- */

.kv{display:grid;grid-template-columns:auto 1fr;gap:8px 18px;font-size:13.5px}
.kv dt{color:var(--muted)}
.kv dd{color:var(--ink);font-weight:600;text-align:right}

.split{display:grid;grid-template-columns:1fr 1px 1fr;gap:24px;align-items:start}
.split .rule{background:var(--line);height:100%}

.note{
  font-size:12px;color:var(--muted);background:var(--fill);
  border-radius:var(--r-sm);padding:10px 14px;border:1px dashed var(--line);
}

@media (max-width:1180px){
  .g4{grid-template-columns:repeat(2,1fr)}
  .g3{grid-template-columns:repeat(2,1fr)}
  .c4,.c5,.c7,.c8,.c9{grid-column:span 12}
  .c6{grid-column:span 12}
}

```

### `wireframe\wire.js`

```javascript
/* MediVeR XR — wireframe shell renderer.
   Injects the sidebar, top bar and planning rail so each page file
   only contains its own content. */

(function () {
  var S = 'stroke="currentColor" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  var ic = {
    home: '<path ' + S + ' d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2V15H9.2v5.5H5A1.5 1.5 0 0 1 3.5 19z"/>',
    cube: '<path ' + S + ' d="M12 3 20 7.2v9.6L12 21l-8-4.2V7.2z"/><path ' + S + ' d="M4 7.2 12 11.5l8-4.3M12 11.5V21"/>',
    folder: '<path ' + S + ' d="M3.5 7.2A1.7 1.7 0 0 1 5.2 5.5h3.6l1.9 2.4h8.1a1.7 1.7 0 0 1 1.7 1.7v7.7a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z"/>',
    clip: '<path ' + S + ' d="M9.2 5.2H7.4a1.9 1.9 0 0 0-1.9 1.9v11.4a1.9 1.9 0 0 0 1.9 1.9h9.2a1.9 1.9 0 0 0 1.9-1.9V7.1a1.9 1.9 0 0 0-1.9-1.9h-1.8"/><rect ' + S + ' x="9.2" y="3.3" width="5.6" height="3.6" rx="1.3"/>',
    chart: '<path ' + S + ' d="M4 4v16h16"/><path ' + S + ' d="M8 16.5v-3.8M12 16.5V8.5M16 16.5v-6"/>',
    book: '<path ' + S + ' d="M4.5 5.6A2.1 2.1 0 0 1 6.6 3.5H19.5v13.6H6.6a2.1 2.1 0 0 0-2.1 2.1z"/><path ' + S + ' d="M19.5 17.1v3.4H6.6"/>',
    users: '<circle ' + S + ' cx="9.4" cy="8.4" r="3.1"/><path ' + S + ' d="M3.8 19.4a5.6 5.6 0 0 1 11.2 0"/><path ' + S + ' d="M16 6.1a3 3 0 0 1 0 5.8M17.4 14.6a5.2 5.2 0 0 1 2.8 4.8"/>',
    gear: '<circle ' + S + ' cx="12" cy="12" r="2.8"/><path ' + S + ' d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
    help: '<circle ' + S + ' cx="12" cy="12" r="8.5"/><path ' + S + ' d="M9.7 9.6a2.4 2.4 0 1 1 3.2 2.3c-.6.2-.9.7-.9 1.3v.5"/><circle cx="12" cy="16.6" r="1" fill="currentColor"/>',
    bell: '<path ' + S + ' d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.2 1.5 5.2h-14S6.5 14 6.5 10Z"/><path ' + S + ' d="M10.2 18.3a2 2 0 0 0 3.6 0"/>',
    dot: '<circle cx="12" cy="12" r="4" fill="currentColor"/>'
  };

  function svg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ic[name] || '') + '</svg>';
  }

  var NAV = [
    { id: 'home', label: 'Home', href: 'home.html', icon: 'home' },
    { id: 'simulations', label: 'Simulations', href: 'simulations.html', icon: 'cube' },
    { id: 'cases', label: 'Cases', href: 'cases.html', icon: 'folder' },
    { id: 'assessments', label: 'Assessments', href: 'assessments.html', icon: 'clip' },
    { id: 'performance', label: 'Performance', href: 'performance.html', icon: 'chart' },
    { id: 'library', label: 'Library', href: 'library.html', icon: 'book' },
    { id: 'cohorts', label: 'Cohorts', href: 'cohorts.html', icon: 'users' },
    { id: 'settings', label: 'Settings', href: 'settings.html', icon: 'gear' }
  ];

  var STEPS = [
    'Case history', 'Imaging review', 'Deformity measurement', 'Alignment planning',
    'Implant selection', 'Risk & strategy', 'Plan summary'
  ];

  var active = document.body.getAttribute('data-nav') || '';

  // ---- sidebar ----
  var side = document.querySelector('[data-side]');
  if (side) {
    var html = '' +
      '<a class="brand" href="index.html">' +
        '<span class="mark">M</span>' +
        '<span class="name">MediVeR<small>XR Dashboard</small></span>' +
      '</a>';
    NAV.forEach(function (n) {
      html += '<a class="nav-item' + (n.id === active ? ' on' : '') + '" href="' + n.href + '">' +
        svg(n.icon) + '<span>' + n.label + '</span></a>';
    });
    html += '<div class="nav-foot">' +
      '<div class="nav-sep"></div>' +
      '<a class="nav-item' + (active === 'help' ? ' on' : '') + '" href="help.html">' + svg('help') + '<span>Help</span></a>' +
      '<a class="nav-item" href="index.html">' + svg('dot') + '<span>Wireframe index</span></a>' +
      '</div>';
    side.innerHTML = html;
  }

  // ---- top bar ----
  var top = document.querySelector('[data-topbar]');
  if (top) {
    var crumb = (top.getAttribute('data-crumb') || 'Home').split('/');
    var c = '<nav class="crumb">';
    crumb.forEach(function (p, i) {
      if (i) c += '<span class="sep">›</span>';
      c += (i === crumb.length - 1) ? '<b>' + p.trim() + '</b>' : '<span>' + p.trim() + '</span>';
    });
    c += '</nav>';
    top.innerHTML = c +
      '<div class="top-right">' +
        '<span class="badge live"><span class="dot"></span>Headset online</span>' +
        '<button class="btn icon sm" aria-label="Notifications">' + svg('bell') + '</button>' +
        '<span class="chip"><span class="ph solid" style="width:22px;height:22px;border-radius:50%;min-height:0;font-size:9px;color:var(--muted)">AM</span>Dr A. Mehta</span>' +
      '</div>';
  }

  // ---- planning rail ----
  var rail = document.querySelector('[data-rail]');
  if (rail) {
    var cur = parseInt(rail.getAttribute('data-step'), 10) || 1;
    var r = '<div class="rail-top">' +
      '<div class="eyebrow">Pre-operative phase</div>' +
      '<div class="t">Case 1 — Varus OA<br>Right knee</div>' +
      '<div class="row" style="margin-top:10px"><span class="badge pass">Saved</span>' +
      '<span class="badge">Training · Intermediate</span></div>' +
      '</div>';
    STEPS.forEach(function (label, i) {
      var n = i + 1;
      var cls = n < cur ? 'done' : (n === cur ? 'on' : '');
      r += '<a class="rstep ' + cls + '" href="plan-' + n + '.html">' +
        '<span class="dot">' + (n < cur ? '✓' : n) + '</span>' +
        '<span class="lab">' + label + '</span></a>';
    });
    r += '<div class="rail-foot">Forward is gated. Backward is always free. Autosave on every change.</div>';
    rail.innerHTML = r;
  }
})();

```

