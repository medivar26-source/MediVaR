import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ImageOff, ListChecks, ShieldAlert, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Badge, Card, CardHeader, Chip, EmptyState, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import {
  getCaseForAuthoring,
  getCaseTitleForAuthoring,
  listProceduresForAuthoring,
} from "@/lib/data/content";
import { shortDate, titleCase } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { CaseStatusForm } from "./CaseStatusForm";
import { EditCaseForm } from "./EditCaseForm";
import { ImagingManager } from "./ImagingManager";
import p from "../../panels.module.css";
import s from "../content.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = await getCaseTitleForAuthoring(id);
  return { title: title ? `${title} — Content` : id };
}

/**
 * The authoring counterpart to `/cases/[id]`. That screen answers "should I
 * take this case"; this one answers "is this case ready for residents to
 * see" — so it opens with status and version rather than a score, and its
 * primary action is Save, not Start planning. It deliberately stops short
 * of the TKR planning canvas: a case here may carry what the planner needs,
 * but the planner itself lives at `/plan/[id]`.
 */
export default async function CaseAuthoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);
  if (persona === "learner") redirect("/");

  const [detail, procedures] = await Promise.all([
    getCaseForAuthoring(id),
    listProceduresForAuthoring(),
  ]);

  if (!detail) notFound();

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/content"
          className={p.clear}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <ChevronLeft size={16} /> Back to Content / Case Library
        </Link>
      </div>

      <PageHeader
        eyebrow={`${detail.procedureName} · ${detail.id}`}
        title={detail.title}
        lede={detail.summary}
      />

      <div className={s.title} style={{ marginBottom: "var(--s-5)" }}>
        <span className={p.filters} style={{ marginBottom: 0 }}>
          <Chip tone="muted">{titleCase(detail.side)} knee</Chip>
          <Chip tone="muted">{titleCase(detail.difficulty)}</Chip>
          <Badge status={detail.status === "active" ? "pass" : "neutral"}>
            {detail.status === "active" ? "Active" : "Inactive"}
          </Badge>
          <Chip tone="muted">Version {detail.version}</Chip>
          {detail.isSynthetic && (
            <Badge status="neutral" hideIcon>
              DEMO / SYNTHETIC — NOT FOR CLINICAL USE
            </Badge>
          )}
        </span>
      </div>

      {detail.isSynthetic && (
        <Card padding="lg" tone="tonal" style={{ marginBottom: "var(--s-5)" }}>
          <CardHeader
            title="Synthetic demo case"
            subtitle="Generated to exercise the pre-operative planning workflow end to end. No real patient data. Keep it out of any clinical or grading context."
          />
        </Card>
      )}

      <div className={p.columns}>
        <div>
          <Card padding="lg" style={{ marginBottom: "var(--s-5)" }}>
            <CardHeader title="Case details" subtitle="Visible to residents once the case is active." />
            <EditCaseForm detail={detail} procedures={procedures} />
          </Card>

          <Card padding="lg">
            <CardHeader
              title="Learning objectives"
              subtitle={
                detail.objectives.length === 0
                  ? "None authored yet."
                  : `${detail.objectives.length} objective${detail.objectives.length === 1 ? "" : "s"}`
              }
            />
            {detail.objectives.length === 0 ? (
              <EmptyState icon={ListChecks} title="No learning objectives authored yet" />
            ) : (
              <ul>
                {detail.objectives.map((objective) => (
                  <li key={objective} style={{ marginBottom: "var(--s-2)" }}>
                    {objective}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          <Card padding="lg" style={{ marginBottom: "var(--s-5)" }}>
            <CardHeader title="Status" subtitle="Controls whether residents can start new attempts." />
            <CaseStatusForm caseId={detail.id} status={detail.status} />
          </Card>

          <Card padding="lg" style={{ marginBottom: "var(--s-5)" }}>
            <CardHeader
              title="Imaging package"
              action={<span>{detail.imaging.length} view{detail.imaging.length === 1 ? "" : "s"}</span>}
            />
            {detail.imaging.length === 0 ? (
              <EmptyState icon={ImageOff} title="No imaging authored yet" />
            ) : (
              <div className={s.imgGrid}>
                {detail.imaging.map((view) => (
                  <div key={view.view} className={s.imgCard}>
                    <div className={s.imgThumb}>
                      {view.src ? (
                        <img src={view.src} alt={view.label} />
                      ) : (
                        <ImageOff width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </div>
                    <span className={s.imgLabel}>{view.label}</span>
                    {!view.src && <span className={s.imgPending}>Asset pending</span>}
                  </div>
                ))}
              </div>
            )}
            <ImagingManager caseId={detail.id} />
          </Card>

          <Card padding="lg">
            <CardHeader
              title="Assessed against"
              subtitle="Skill categories and critical scenes this case's procedure carries."
            />
            <ul>
              {detail.scoring.map((category) => (
                <li key={category.key} style={{ marginBottom: "var(--s-2)" }}>
                  {category.label} · {category.max} marks
                </li>
              ))}
            </ul>
            {detail.criticalScenes.length > 0 && (
              <p className={s.usageSub} style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                <ShieldAlert size={14} />
                {detail.criticalScenes.length} critical scene
                {detail.criticalScenes.length === 1 ? "" : "s"} — failing one caps the
                session and marks it not passed.
              </p>
            )}
          </Card>
        </div>
      </div>

      <Card padding="none">
        <CardHeader
          flush
          title="Usage"
          subtitle={
            detail.usage.length === 0
              ? "No resident has attempted this case yet."
              : `${detail.usedByLearners} learner${detail.usedByLearners === 1 ? "" : "s"} · ${detail.usedBySessions} session${detail.usedBySessions === 1 ? "" : "s"}`
          }
        />
        {detail.usage.length === 0 ? (
          <div style={{ padding: "var(--s-5)" }}>
            <EmptyState icon={Users} title="Not yet used" />
          </div>
        ) : (
          <Table label={`Residents who have attempted ${detail.title}`}>
            <THead>
              <Tr>
                <Th>Resident</Th>
                <Th numeric>Sessions</Th>
                <Th>Last session</Th>
              </Tr>
            </THead>
            <TBody>
              {detail.usage.map((row) => (
                <Tr key={row.learnerId}>
                  <Td head>{row.learnerName}</Td>
                  <Td numeric>{row.sessions}</Td>
                  <Td>{row.lastSessionAt ? shortDate(row.lastSessionAt) : "—"}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}
