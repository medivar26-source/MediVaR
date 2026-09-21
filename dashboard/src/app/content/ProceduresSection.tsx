import { Wrench } from "lucide-react";
import { Chip, EmptyState } from "@/components/ui";
import { ExpandableRow } from "@/components/viz";
import { listProceduresForAuthoring, getProcedureForAuthoring } from "@/lib/data/content";
import { titleCase } from "@/lib/format";
import c from "./content.module.css";

/**
 * Steps come from `PARTS` — the same table `/plan` reads for the eleven-part
 * TKR walkthrough — so an edit here and the walkthrough itself can never
 * silently disagree about what step 4 is called.
 */
export async function ProceduresSection() {
  const procedures = await listProceduresForAuthoring();

  if (procedures.length === 0) {
    return (
      <EmptyState icon={Wrench} title="No procedures authored yet">
        A procedure is the sequence of steps a case is built on.
      </EmptyState>
    );
  }

  return (
    <div>
      {procedures.map((procedure) => (
        <ProcedureRow key={procedure.id} procedureId={procedure.id} />
      ))}
    </div>
  );
}

async function ProcedureRow({ procedureId }: { procedureId: string }) {
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
      cells={[
        { value: titleCase(detail.status), pill: statusStatus === "pass" ? "pass" : "muted" },
        { value: `${detail.stepCount} steps` },
        { value: `${detail.caseCount} case${detail.caseCount === 1 ? "" : "s"}` },
      ]}
    >
      <div>
        {detail.summary && <p className={c.usageSub}>{detail.summary}</p>}

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
      </div>
    </ExpandableRow>
  );
}
