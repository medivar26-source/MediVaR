import Link from "next/link";
import { ImageOff, ListChecks, ClipboardList } from "lucide-react";
import { ScanPreview } from "@/components/cases/ScanPreview";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, Chip, EmptyState, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import type { CaseDetail, InstructorConfig } from "@/lib/data/cases";
import { getSupervisedLearners } from "@/lib/data/cohorts";
import { PLANS, type PlanRecord } from "@/lib/data/plans";
import { shortDate, titleCase } from "@/lib/format";
import { cx } from "@/lib/cx";
import { PASS_MARK, type Profile } from "@/lib/types";
import { ConfigurePanel } from "../ConfigurePanel";
import s from "../case.module.css";
import p from "@/app/panels.module.css";

export const CASE_TABS = [
  { value: "details", label: "Details" },
  { value: "imaging", label: "Imaging" },
  { value: "planning", label: "Planning" },
] as const;

export type CaseTab = (typeof CASE_TABS)[number]["value"];

/** How far through the planning steps a learner's plan is, out of the three that gate locking. */
function stepsDone(plan: PlanRecord): number {
  const payload = plan.payload as unknown as Record<string, { is_confirmed?: boolean } | undefined>;
  return [Boolean(payload.v1_assessment), Boolean(payload.v1_tibial?.is_confirmed), Boolean(payload.v1_femoral?.is_confirmed)].filter(Boolean).length;
}

/**
 * The instructor's view of one case: what it is (Details), the radiographs it ships with
 * (Imaging), and the planning side (Planning) — the single authored reference plan, plus the
 * several plans learners have made against it.
 */
export async function InstructorCaseView({
  user,
  detail,
  presets,
  tab,
}: {
  user: Profile;
  detail: CaseDetail;
  presets: InstructorConfig[];
  tab: CaseTab;
}) {
  // Only plans from learners this instructor supervises: plan storage is not scoped by institution.
  const supervised = await getSupervisedLearners().catch(() => []);
  const learnerName = new Map(supervised.map((l) => [l.id, l.displayName]));
  const learnerPlans = PLANS.filter((plan) => plan.caseId === detail.id && learnerName.has(plan.userId)).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  const passMark = PASS_MARK[detail.difficulty];
  const largestCategory = Math.max(...detail.scoring.map((c) => c.max), 1);
  const base = `/cases/${detail.id}`;
  const published = detail.status === "active";

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <Breadcrumbs
        items={[
          { label: "Content Library", href: "/content?tab=procedures" },
          { label: "Case Library", href: "/cases" },
          { label: detail.title },
        ]}
      />
      <PageHeader
        eyebrow={`${detail.procedureName} · ${detail.id}`}
        title={detail.title}
        lede={detail.summary}
        actions={
          <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <Button variant="secondary" href={`/content/${detail.id}`}>
              Status &amp; imaging
            </Button>
            <Button variant="primary" href={`${base}/edit`}>
              Edit Draft
            </Button>
          </div>
        }
      />

      <div className={s.chips}>
        <Chip tone="muted">{detail.pathologyLabel}</Chip>
        <Chip tone="muted">{titleCase(detail.side)} knee</Chip>
        <Chip tone="muted">{titleCase(detail.difficulty)}</Chip>
        {detail.status && (
          <Chip tone={published ? "muted" : "default"}>
            {published ? `v${detail.version ?? 1} Published` : detail.status.toUpperCase()}
          </Chip>
        )}
      </div>

      <nav className={cx(p.tabs)} aria-label="Case sections">
        {CASE_TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "details" ? base : `${base}?tab=${t.value}`}
            className={cx(p.tab, tab === t.value && p.tabOn)}
            aria-current={tab === t.value ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "details" && (
        <>
          <div className={s.readiness}>
            <StatRow>
              <StatCard label="Status" value={published ? "Published" : titleCase(detail.status ?? "draft")} variant="accent" sub={`Version ${detail.version ?? 1}`} />
              <StatCard label="Pass mark" value={passMark} variant="accent" sub={`${titleCase(detail.difficulty)} difficulty`} />
              <StatCard label="Imaging views" value={detail.imaging.filter((v) => v.url).length} variant="accent" sub={`of ${detail.imaging.length} expected`} />
              <StatCard label="Learner plans" value={learnerPlans.length} variant="accent" sub="from your learners" />
            </StatRow>
          </div>

          <div className={s.layout}>
            <div className={s.col}>
              <Card padding="lg">
                <CardHeader title="Patient snapshot" subtitle="Synthetic patient. No identifiable data is stored anywhere in the product." />
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
                {detail.patient.vitals.length === 0 && detail.patient.notes.length === 0 && (
                  <p className={s.foot}>No patient details have been authored yet. Add them from Edit Draft.</p>
                )}
              </Card>
            </div>

            <div className={s.col}>
              {detail.objectives.length > 0 && (
                <Card padding="lg">
                  <CardHeader title="Learning objectives" />
                  <ul className={s.objectives}>
                    {detail.objectives.map((objective, idx) => (
                      <li key={`${objective}-${idx}`} className={s.objective}>
                        <ListChecks className={s.objectiveIcon} strokeWidth={2} aria-hidden="true" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

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
                          <span className={s.scoreFill} style={{ width: `${(category.max / largestCategory) * 100}%` }} />
                        </span>
                        <span className={s.scoreMax}>{category.max}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={s.foot}>Three or more critical errors cap a session at 59 and mark it Not passed, whatever the categories say.</p>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "imaging" && (
        <Card padding="lg">
          <CardHeader
            title="Imaging package"
            action={<span className={s.count}>{`${detail.imaging.length} view${detail.imaging.length === 1 ? "" : "s"}`}</span>}
          />
          {detail.imaging.length === 0 ? (
            <EmptyState icon={ImageOff} title="No imaging authored yet" action={<Button variant="secondary" href={`${base}/edit`}>Add imaging</Button>}>
              This case has no radiograph manifest. Planning needs at least an AP and a long-leg view.
            </EmptyState>
          ) : (
            <ul className={s.views}>
              {detail.imaging.map((view) => (
                <li key={view.view} className={s.view}>
                  {view.url ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className={s.viewLabel}>{view.label}</span>
                        <span className={s.viewNote}>{view.calibration?.is_valid ? "Calibrated (25mm)" : "Pending calibration"}</span>
                      </div>
                      <ScanPreview src={view.url} alt={view.label} height={280} />
                    </div>
                  ) : (
                    <>
                      <span className={s.plate} aria-hidden="true">
                        <ImageOff width={20} height={20} strokeWidth={1.5} />
                      </span>
                      <span className={s.viewLabel}>{view.label}</span>
                      <span className={s.viewNote}>Asset pending</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "planning" && (
        <>
          <Card padding="lg">
            <CardHeader
              title="Reference plan"
              subtitle="The one authoritative plan for this case, set by you. Learners never see it; their plans are compared against it."
              action={
                <Button variant="secondary" size="sm" href={`${base}/edit`}>
                  {detail.reference_plan ? "Edit reference plan" : "Author reference plan"}
                </Button>
              }
            />
            {!detail.reference_plan ? (
              <EmptyState icon={ClipboardList} title="No reference plan yet">
                Author the six measurements and the tibial and femoral components in Edit Draft so learner plans can be assessed.
              </EmptyState>
            ) : (
              <ReferencePlan plan={detail.reference_plan} />
            )}
          </Card>

          <Card padding="none">
            <CardHeader
              flush
              title="Learner plans"
              subtitle="A learner can plan the same case more than once. These are the plans from learners you supervise."
            />
            {learnerPlans.length === 0 ? (
              <div className={s.emptyWrap}>
                <EmptyState icon={ClipboardList} title="No learner has planned this case yet">
                  Plans appear here as soon as a learner starts planning it.
                </EmptyState>
              </div>
            ) : (
              <Table label={`Learner plans for ${detail.title}`}>
                <THead>
                  <Tr>
                    <Th>Learner</Th>
                    <Th>Started</Th>
                    <Th>Last updated</Th>
                    <Th>Progress</Th>
                    <Th>State</Th>
                    <Th>
                      <span className="srOnly">Open</span>
                    </Th>
                  </Tr>
                </THead>
                <TBody>
                  {learnerPlans.map((plan) => {
                    const done = stepsDone(plan);
                    return (
                      <Tr key={plan.id}>
                        <Td head>{learnerName.get(plan.userId)}</Td>
                        <Td>{shortDate(plan.createdAt)}</Td>
                        <Td>{shortDate(plan.updatedAt)}</Td>
                        <Td>{done} of 3 steps</Td>
                        <Td>
                          <Badge status={plan.isReadyForVr ? "pass" : "neutral"}>{plan.isReadyForVr ? "Locked for VR" : "In progress"}</Badge>
                        </Td>
                        <Td>
                          <Link href={`/plan/${plan.id}/review`}>Open</Link>
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>

          <div className={s.configureWrap}>
            <ConfigurePanel caseId={detail.id} presets={presets} />
          </div>
        </>
      )}
    </AppShell>
  );
}

function ReferencePlan({ plan }: { plan: NonNullable<CaseDetail["reference_plan"]> }) {
  const a = plan.assessment;
  const measures: [string, string][] = [
    ["MAD", `${a?.MAD_mm ?? "—"} mm`],
    ["AMA", `${a?.AMA_deg ?? "—"}°`],
    ["mHKA", `${a?.mHKA_deg ?? "—"}°`],
    ["MPTA", `${a?.MPTA_deg ?? "—"}°`],
    ["LDFA", `${a?.LDFA_deg ?? "—"}°`],
    ["PTS", `${a?.PTS_deg ?? "—"}°`],
  ];
  const tile = { padding: "var(--s-3)", background: "var(--surface-sunken)", border: "var(--bw) solid var(--border)", borderRadius: "var(--r-sm)" } as const;
  const heading = { margin: "0 0 var(--s-2)", fontSize: "var(--t-label)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)", fontSize: "var(--t-label)", color: "var(--text)" }}>
      <div>
        <h4 style={heading}>Six canonical measurements</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "var(--s-2)" }}>
          {measures.map(([label, value]) => (
            <div key={label} style={tile}>
              <div style={{ color: "var(--text-muted)", fontSize: "var(--t-caption)" }}>{label}</div>
              <strong style={{ color: "var(--ink)" }}>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 style={heading}>Reference components</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--s-2)" }}>
          <div style={tile}>
            <div>
              Tibial baseplate: <strong style={{ color: "var(--ink)" }}>Size {plan.tibial_component?.implant_size ?? "—"}</strong>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "var(--t-caption)", marginTop: "var(--s-1)" }}>
              Coverage {plan.tibial_component?.cortical_coverage_pct ?? "—"}% · Medial overhang {plan.tibial_component?.medial_overhang_mm ?? "—"} mm
            </div>
          </div>
          <div style={tile}>
            <div>
              Femoral component: <strong style={{ color: "var(--ink)" }}>Size {plan.femoral_component?.implant_size ?? "—"}</strong>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "var(--t-caption)", marginTop: "var(--s-1)" }}>
              AP {plan.femoral_component?.ap_coverage_pct ?? "—"}% · ML {plan.femoral_component?.ml_coverage_pct ?? "—"}% · Notch {plan.femoral_component?.notching_risk_mm ?? "—"} mm
            </div>
          </div>
        </div>
      </div>

      {plan.instructor_notes && (
        <div>
          <h4 style={heading}>Instructor notes</h4>
          <p style={{ margin: 0 }}>{plan.instructor_notes}</p>
        </div>
      )}
    </div>
  );
}
