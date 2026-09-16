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
