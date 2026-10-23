import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
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
  DemoDataNote,
  StatStrip,
} from "@/components/ui";
import { listCases } from "@/lib/data/cases";
import { startEarlyReads } from "@/lib/data/early-reads";
import { getLearnerSessions } from "@/lib/data/learner-sessions";
import { listPersonalCases } from "@/lib/data/personal-cases";
import { getPlans } from "@/lib/data/plans";
import { cx } from "@/lib/cx";
import type { PlanState } from "@/lib/plan";
import { longDuration, relativeTime, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { CasePlansPanel, type PlanningCase } from "./CasePlansPanel";
import { PlanFilters } from "./PlanFilters";
import p from "../panels.module.css";
import s from "./plans.module.css";

export const metadata: Metadata = { title: "Pre-op Plans" };

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
  searchParams: Promise<{ state?: string; case?: string }>;
}) {
  const { state: raw, case: rawCase } = await searchParams;
  const state = STATES.includes(raw as PlanState)
    ? (raw as PlanState)
    : undefined;

  // Start the reads below while the identity check runs (see `early-reads.ts`).
  startEarlyReads({ cases: true, sessions: true, personalCases: true });
  const user = await getCurrentUser();
  // One read for every plan, so the counts, the case panel and the table all agree; the state
  // filter narrows the table only.
  const everything = await getPlans(undefined, user.id);
  const { counts } = everything;
  const plans = state ? everything.plans.filter((plan) => plan.state === state) : everything.plans;
  const now = new Date().toISOString();

  // The cases that can be planned: the Case Library as this learner sees it, and their own cases.
  const [libraryCases, personalCases, sessions] = await Promise.all([
    listCases(user.id, { attempted: "all" }).then((r) => r.cases).catch(() => []),
    listPersonalCases().catch(() => []),
    getLearnerSessions(user.id),
  ]);
  const planningCases: PlanningCase[] = [
    ...libraryCases.map((c) => ({
      id: c.id,
      title: c.title,
      summary: c.summary,
      pathologyLabel: c.pathologyLabel,
      side: c.side,
      difficulty: c.difficulty,
      procedureId: c.procedureId,
      procedureName: c.procedureName,
      personal: false,
    })),
    ...personalCases.map((c) => ({
      id: c.id,
      title: c.title,
      summary: c.description,
      pathologyLabel: c.pathology_label,
      side: c.side,
      difficulty: c.difficulty,
      personal: true,
    })),
  ];
  // The case in view: the one asked for, else the one with the plan most recently worked on, else the first.
  const latestPlan = everything.plans[0];
  const selected =
    planningCases.find((c) => c.id === rawCase) ??
    planningCases.find((c) => c.id === latestPlan?.caseId) ??
    planningCases[0];
  const hrefFor = (id: string) => `/plans?${new URLSearchParams({ ...(state ? { state } : {}), case: id })}`;

  return (
    <AppShell user={user} searchHint='Try searching "plans"'>
      <PageHeader
        title="Pre-op Plans"
        lede="Choose a case to plan it, resume a plan or see its sessions."
        actions={
          <>
            <Button href="/sessions" variant="secondary">
              Sessions &amp; reports
            </Button>
            <Button href="/cases" variant="primary">
              Plan a case
            </Button>
          </>
        }
      />
      <DemoDataNote />


      <StatStrip
        label="Plan totals"
        items={[
          { label: "In progress", value: counts.draft },
          { label: "Ready for VR", value: counts.ready },
          { label: "PIN issued", value: counts.paired },
          { label: "Performed", value: counts.performed },
        ]}
      />

      {planningCases.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No cases to plan yet"
          action={
            <Button href="/cases" variant="primary">
              Browse cases
            </Button>
          }
        >
          Cases assigned to you, and cases you add, appear here.
        </EmptyState>
      ) : (
        <div className={s.layout}>
          <nav className={s.rail} aria-label="Cases">
            <ul className={s.railList}>
              {planningCases.map((item) => {
                const itemPlans = everything.plans.filter((plan) => plan.caseId === item.id).length;
                return (
                  <li key={item.id}>
                    <Link prefetch={false}
                      href={hrefFor(item.id)}
                      className={cx(s.railItem, item.id === selected?.id && s.railItemOn)}
                      aria-current={item.id === selected?.id ? "page" : undefined}
                    >
                      <span className={s.railTitle}>{item.title}</span>
                      <span className={s.railMeta}>
                        {item.personal ? "My case · " : ""}
                        {itemPlans === 0 ? "No plans" : `${itemPlans} plan${itemPlans === 1 ? "" : "s"}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {selected && (
            <CasePlansPanel
              kase={selected}
              plans={everything.plans.filter((plan) => plan.caseId === selected.id)}
              sessions={sessions.filter((session) => session.caseId === selected.id)}
            />
          )}
        </div>
      )}

      <SectionHeader title="All your plans" />
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
            : "A plan is four gated pages (Assessment, Tibial Planning, Femoral Planning, then Review & Send to VR) against the case in front of you. It becomes the contract a session is scored against, which is why it freezes the moment one starts."}
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
                  <Td numeric>{plan.stepsAnswered} / {plan.stepsTotal}</Td>
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
