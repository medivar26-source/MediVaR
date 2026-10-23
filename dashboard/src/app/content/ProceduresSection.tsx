import { FolderOpen, Wrench } from "lucide-react";
import { ProcedureCaseCard } from "@/components/cases/ProcedureCaseCard";
import { Chip, EmptyState } from "@/components/ui";
import { ExpandableRow } from "@/components/viz";
import { listCases, type CaseCard } from "@/lib/data/cases";
import { listProceduresForAuthoring, getProcedureForAuthoring } from "@/lib/data/content";
import { groupCasesByProcedure } from "@/lib/data/procedure-cases";
import { titleCase } from "@/lib/format";
import c from "./content.module.css";

/**
 * Procedures, each expandable to the cases built on it.
 *
 * Steps come from `PARTS` — the same table `/plan` reads for the operative
 * walkthrough — so an edit here and the walkthrough itself can never
 * silently disagree about what step 4 is called. They stay on the page, inside the
 * procedure, below its cases.
 *
 * Cases come from the same list as the Case Library (`listCases`), so a learner sees their
 * own attempts and an instructor sees what they manage. The Case Library at `/cases` is
 * unchanged and still reachable from the side navigation.
 */
export async function ProceduresSection({
  userId,
  staff,
}: {
  userId: string;
  /** Instructor or administrator. */
  staff: boolean;
}) {
  const procedures = await listProceduresForAuthoring();

  if (procedures.length === 0) {
    return (
      <EmptyState icon={Wrench} title="No procedures authored yet">
        A procedure is the sequence of steps a case is built on.
      </EmptyState>
    );
  }

  let cases: CaseCard[] = [];
  let casesUnavailable = false;
  try {
    cases = (await listCases(userId, { attempted: "all" })).cases;
  } catch {
    casesUnavailable = true;
  }

  const { groups, other } = groupCasesByProcedure(
    procedures.map((p) => ({ id: p.id, name: p.name })),
    cases,
  );

  // The first published procedure that has cases opens, so the cards are in view without a click.
  const openId = procedures.find(
    (p) => p.status === "published" && (groups.get(p.id)?.length ?? 0) > 0,
  )?.id;

  return (
    <div>
      {casesUnavailable && (
        <p className={c.usageSub}>The cases could not be loaded just now. Steps are still shown.</p>
      )}

      {procedures.map((procedure) => (
        <ProcedureRow
          key={procedure.id}
          procedureId={procedure.id}
          cases={groups.get(procedure.id) ?? []}
          staff={staff}
          defaultOpen={procedure.id === openId}
        />
      ))}

      {other.length > 0 && (
        <ExpandableRow
          initials="…"
          label="Other cases"
          cells={[{ value: "No procedure recorded", pill: "muted" }, { value: caseCount(other.length) }]}
        >
          <CaseGrid cases={other} staff={staff} />
        </ExpandableRow>
      )}
    </div>
  );
}

const caseCount = (n: number) => `${n} case${n === 1 ? "" : "s"}`;

function CaseGrid({ cases, staff }: { cases: CaseCard[]; staff: boolean }) {
  return (
    <ul className={c.caseGrid}>
      {cases.map((item) => (
        <li key={item.id}>
          <ProcedureCaseCard item={item} staff={staff} />
        </li>
      ))}
    </ul>
  );
}

async function ProcedureRow({
  procedureId,
  cases,
  staff,
  defaultOpen,
}: {
  procedureId: string;
  cases: CaseCard[];
  staff: boolean;
  defaultOpen: boolean;
}) {
  const detail = await getProcedureForAuthoring(procedureId);
  if (!detail) return null;

  const initials = detail.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const statusStatus =
    detail.status === "published" ? "pass" : detail.status === "planned" ? "neutral" : "warn";

  return (
    <ExpandableRow
      initials={initials}
      label={detail.name}
      defaultOpen={defaultOpen}
      cells={[
        { value: titleCase(detail.status), pill: statusStatus === "pass" ? "pass" : "muted" },
        { value: caseCount(cases.length) },
        { value: `${detail.stepCount} steps` },
      ]}
    >
      <div>
        {detail.summary && <p className={c.usageSub}>{detail.summary}</p>}

        {cases.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No cases for this procedure yet">
            {staff
              ? "Cases created for this procedure will appear here."
              : "Cases assigned to you for this procedure will appear here."}
          </EmptyState>
        ) : (
          <CaseGrid cases={cases} staff={staff} />
        )}

        <details className={c.steps}>
          <summary className={c.stepsSummary}>Workflow and steps ({detail.stepCount})</summary>
          {detail.steps.length === 0 ? (
            <EmptyState icon={Wrench} title="No steps authored for this procedure" />
          ) : (
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
                    <span className={c.stepMeta}>
                      {step.required ? "Required" : step.variantNote}
                    </span>
                  </span>
                  <Chip tone="muted">{step.required ? "Required" : "Optional"}</Chip>
                </li>
              ))}
            </ol>
          )}
        </details>
      </div>
    </ExpandableRow>
  );
}
