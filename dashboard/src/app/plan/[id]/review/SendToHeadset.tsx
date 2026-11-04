"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Headset } from "lucide-react";
import { headsetStatus, sendToHeadset, type SendToHeadsetState } from "@/app/actions";
import { Button, Select } from "@/components/ui";
import {
  assignmentStatusText,
  clockText,
  currentAssignment,
  formatPairingCode,
  secondsLeft,
  shouldPoll,
  type HeadsetLink,
} from "@/lib/headset-link";
import r from "./review.module.css";

const POLL_MS = 4000;

/**
 * "Send to headset" for a sealed plan: a one-time code the trainee types on the Quest, then the run's progress
 * until its report is in. The code exists only in this page's memory: it is never stored in the clear, so a
 * reloaded page cannot show it again and offers a new one instead.
 */
export function SendToHeadset({ planId, initial }: { planId: string; initial: HeadsetLink }) {
  const [link, setLink] = useState(initial);
  const [state, formAction, pending] = useActionState<SendToHeadsetState, FormData>(sendToHeadset, {});
  const [now, setNow] = useState(() => Date.now());

  const current = currentAssignment(link.assignments);
  // The code from this page's own request, while the assignment it made is still the one waiting.
  const liveCode =
    state.code && current && current.id === state.assignmentId && current.status === "pending" ? state.code : undefined;
  const left = secondsLeft(state.expiresAt, now);

  // A fresh code: fetch the new assignment so the status below is about it.
  useEffect(() => {
    if (!state.assignmentId) return;
    let alive = true;
    headsetStatus(planId).then((next) => alive && setLink(next)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [state.assignmentId, planId]);

  // Ask for news while the headset may still act; stop once the run is reported or the code has lapsed.
  useEffect(() => {
    if (!shouldPoll(current)) return;
    const timer = setInterval(() => {
      headsetStatus(planId).then(setLink).catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [current, planId]);

  // The countdown, only while a code is on screen.
  useEffect(() => {
    if (!liveCode) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [liveCode]);

  if (!link.available || state.notSetUp) {
    return (
      <div className={r.headset}>
        <p className={r.headsetMuted}>Sending to a headset is not set up on this server yet.</p>
      </div>
    );
  }

  if (link.blocker) {
    return (
      <div className={r.headset}>
        <p className={r.headsetMuted}>{link.blocker}</p>
      </div>
    );
  }

  const canSend = !current || current.status === "pending" || current.status === "expired";
  const codeExpired = !!liveCode && left === 0;

  return (
    <div className={r.headset} aria-live="polite">
      <div className={r.headsetHead}>
        <Headset width={18} height={18} aria-hidden="true" />
        <strong>Send to headset</strong>
      </div>

      {liveCode && !codeExpired ? (
        <div className={r.codeBlock}>
          <p className={r.codeLabel}>Type this code on the headset</p>
          <p className={r.code} aria-label={`Pairing code ${liveCode.split("").join(" ")}`}>
            {formatPairingCode(liveCode)}
          </p>
          <p className={r.codeMeta}>
            Works once · expires in <span className={r.countdown}>{clockText(left)}</span>
          </p>
        </div>
      ) : null}

      {current ? (
        <p className={r.headsetStatus}>
          {current.status === "pending" && !liveCode
            ? "A code is live, but it is shown only once, when it is made. Get a new code to see one."
            : codeExpired
              ? "The code expired before the headset used it. Get a new code."
              : assignmentStatusText(current)}
        </p>
      ) : (
        <p className={r.headsetStatus}>
          Get a one-time code, then type it on the headset&rsquo;s sign-in card. The headset loads this plan and sends
          its report back here when the case is done.
        </p>
      )}

      {current?.status === "reported" && current.attemptId && current.scoringStatus === "scored" && (
        <Link className={r.headsetLink} href={`/sessions/${current.attemptId}/report`}>
          Open the report
        </Link>
      )}

      {state.error && <p className={r.headsetError}>{state.error}</p>}

      {canSend && (
        <form action={formAction} className={r.headsetForm}>
          <input type="hidden" name="planId" value={planId} />
          {/* Asked only when the plan never recorded them, and never preselected: the headset runs what is chosen. */}
          {link.needs?.includes("implant_design") && (
            <Select label="Implant design" name="implant_design" required defaultValue="" className={r.headsetField}>
              <option value="" disabled>
                Choose…
              </option>
              <option value="CR">CR (cruciate-retaining)</option>
              <option value="PS">PS (posterior-stabilised)</option>
            </Select>
          )}
          {link.needs?.includes("fixation") && (
            <Select label="Fixation" name="fixation" required defaultValue="" className={r.headsetField}>
              <option value="" disabled>
                Choose…
              </option>
              <option value="cemented">Cemented</option>
              <option value="cementless">Cementless</option>
            </Select>
          )}
          <Button type="submit" variant="primary" size="sm" loading={pending}>
            {current ? "Get a new code" : "Get a code"}
          </Button>
        </form>
      )}
    </div>
  );
}
