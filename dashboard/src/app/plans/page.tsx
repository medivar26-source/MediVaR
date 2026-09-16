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
