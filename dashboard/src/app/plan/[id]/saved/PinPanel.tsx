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
