import Link from "next/link";
import { ClipboardList, FolderOpen, Wrench } from "lucide-react";
import { PillNav } from "@/components/cases/LibraryNav";
import { ProcedureCaseCard } from "@/components/cases/ProcedureCaseCard";
import { Badge, Button, Chip, EmptyState, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { listCases, type CaseCard } from "@/lib/data/cases";
import { listProceduresForAuthoring, getProcedureForAuthoring } from "@/lib/data/content";
import { getPlans, type PlanRow } from "@/lib/data/plans";
import { groupCasesByProcedure } from "@/lib/data/procedure-cases";
import { relativeTime, titleCase } from "@/lib/format";
import c from "./content.module.css";
import s from "./ProcedureBrowser.module.css";

/**
 * The way into the Content Library: the procedures first. Opening a procedure shows its cases and, for a
 * learner, their own pre-op plans for them, so there is no separate Case Library or Pre-op plans page to
 * look for. (The old pages still exist at /cases and /plans for links that point at them.)
 *
 * `staff` (instructor or administrator) sees the same procedures with no plans: plans belong to learners,
 * and a staff case card shows its publication status instead of the viewer's attempts.
 */

/** Stands in for the procedure of cases that name none. */
export const OTHER_PROCEDURE = "other";

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The viewer's cases, grouped by procedure, and their plans (none for staff). Read once per page. */
async function loadLibrary(userId: string, staff: boolean) {
  const [procedures, cases, plans] = await Promise.all([
    listProceduresForAuthoring(),
    listCases(userId, { attempted: "all" }).then((r) => r.cases).catch(() => null),
    staff ? Promise.resolve([] as PlanRow[]) : getPlans(undefined, userId).then((r) => r.plans).catch(() => [] as PlanRow[]),
  ]);
  const { groups, other } = groupCasesByProcedure(
    procedures.map((p) => ({ id: p.id, name: p.name })),
    cases ?? [],
  );
  return { procedures, groups, other, plans, casesUnavailable: cases === null };
}

const plansFor = (plans: PlanRow[], cases: CaseCard[]) => {
  const ids = new Set(cases.map((k) => k.id));
  return plans.filter((plan) => ids.has(plan.caseId));
};

export async function ProcedureList({ userId, staff }: { userId: string; staff: boolean }) {
  const { procedures, groups, other, plans, casesUnavailable } = await loadLibrary(userId, staff);

  if (procedures.length === 0) {
    return (
      <EmptyState icon={Wrench} title="No procedures authored yet">
        A procedure is the sequence of steps a case is built on.
      </EmptyState>
    );
  }

  const entries = [
    ...procedures.map((p) => ({ id: p.id, name: p.name, summary: p.summary, status: p.status, cases: groups.get(p.id) ?? [] })),
    ...(other.length > 0 ? [{ id: OTHER_PROCEDURE, name: "Other cases", summary: "Cases with no procedure recorded.", status: "published", cases: other }] : []),
  ];

  return (
    <>
      {casesUnavailable && <p className={c.usageSub}>The cases could not be loaded just now.</p>}
      <p className={s.lede}>{staff ? "Choose a procedure to see its cases." : "Choose a procedure to see its cases and your pre-op plans for them."}</p>
      <ul className={s.grid}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link prefetch={false} href={`/content?procedure=${encodeURIComponent(entry.id)}`} className={s.card}>
              <span className={s.title}>{entry.name}</span>
              {staff && entry.status !== "published" && <Chip tone="muted">{titleCase(entry.status)}</Chip>}
              {entry.summary && <span className={s.summary}>{entry.summary}</span>}
              <span className={s.counts}>
                <span>
                  <strong>{entry.cases.length}</strong> {entry.cases.length === 1 ? "case" : "cases"}
                </span>
                {!staff && (
                  <span>
                    <strong>{plansFor(plans, entry.cases).length}</strong> pre-op {plansFor(plans, entry.cases).length === 1 ? "plan" : "plans"}
                  </span>
                )}
              </span>
              <span className={s.open}>Open procedure →</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** What the procedure page needs for its heading, or null when the address names no procedure. */
export async function procedureHeading(procedureId: string): Promise<{ name: string; summary?: string } | null> {
  if (procedureId === OTHER_PROCEDURE) return { name: "Other cases", summary: "Cases with no procedure recorded." };
  const detail = await getProcedureForAuthoring(procedureId);
  return detail ? { name: detail.name, summary: detail.summary ?? undefined } : null;
}

export async function ProcedureDetail({
  userId,
  procedureId,
  view,
  staff,
}: {
  userId: string;
  procedureId: string;
  view: "cases" | "plans";
  staff: boolean;
}) {
  const { groups, other, plans: allPlans, casesUnavailable } = await loadLibrary(userId, staff);
  const cases = procedureId === OTHER_PROCEDURE ? other : (groups.get(procedureId) ?? []);
  const plans = plansFor(allPlans, cases);
  const detail = procedureId === OTHER_PROCEDURE ? null : await getProcedureForAuthoring(procedureId);
  const base = `/content?procedure=${encodeURIComponent(procedureId)}`;
  const now = new Date().toISOString();

  return (
    <>
      {!staff && (
        <PillNav
          label="Procedure contents"
          current={view}
          items={[
            { id: "cases", label: `Cases (${cases.length})`, href: base },
            { id: "plans", label: `Pre-op plans (${plans.length})`, href: `${base}&view=plans` },
          ]}
        />
      )}

      {casesUnavailable && <p className={c.usageSub}>The cases could not be loaded just now.</p>}

      {staff || view === "cases" ? (
        cases.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No cases for this procedure yet">
            {staff ? "Cases created for this procedure will appear here." : "Cases assigned to you for this procedure will appear here."}
          </EmptyState>
        ) : (
          <ul className={c.caseGrid}>
            {cases.map((item) => (
              <li key={item.id}>
                <ProcedureCaseCard item={item} staff={staff} />
              </li>
            ))}
          </ul>
        )
      ) : plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No pre-op plans for this procedure yet"
          action={
            <Button variant="secondary" href={base}>
              Choose a case to plan
            </Button>
          }
        >
          Open one of its cases and start a plan. Your plans for this procedure are listed here.
        </EmptyState>
      ) : (
        <Table label="Pre-op plans">
          <THead>
            <Tr>
              <Th>Case</Th>
              <Th>Status</Th>
              <Th numeric>Steps</Th>
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
                <Td>
                  {plan.state === "performed" ? (
                    <Badge status="pass">Performed</Badge>
                  ) : (
                    <Chip tone="muted">{titleCase(plan.state)}</Chip>
                  )}
                </Td>
                <Td numeric>
                  {plan.stepsAnswered} / {plan.stepsTotal}
                </Td>
                <Td>{relativeTime(plan.updatedAt, now)}</Td>
                <Td>
                  <Button
                    variant="ghost"
                    size="sm"
                    href={plan.sessionId ? `/sessions/${plan.sessionId}` : `/plan/${plan.id}`}
                  >
                    {plan.sessionId ? "Session" : plan.state === "draft" ? "Resume" : "Pairing"}
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      {detail && detail.steps.length > 0 && (
        <details className={c.steps}>
          <summary className={c.stepsSummary}>Workflow and steps ({count(detail.stepCount, "step")})</summary>
          <ol className={c.stepList}>
            {detail.steps.map((step, i) => (
              <li key={step.part} className={c.step}>
                <span className={c.stepIndex} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={c.stepBody}>
                  <span className={c.stepName}>
                    {step.part} · {step.name}
                  </span>
                  <span className={c.stepMeta}>{step.required ? "Required" : step.variantNote}</span>
                </span>
                <Chip tone="muted">{step.required ? "Required" : "Optional"}</Chip>
              </li>
            ))}
          </ol>
        </details>
      )}
    </>
  );
}
