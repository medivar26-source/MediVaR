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
