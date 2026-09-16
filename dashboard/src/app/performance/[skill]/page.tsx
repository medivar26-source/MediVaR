import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Chip,
  EmptyState,
  ProgressBar,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { RankedList } from "@/components/viz";
import { getSkillDetail } from "@/lib/data/performance";
import { clock, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { SKILL_SLUGS } from "@/lib/skills";
import { ListChecks } from "lucide-react";
import s from "../performance.module.css";

export const metadata: Metadata = { title: "Performance by skill" };

export default async function SkillPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const { skill } = await params;
  const categoryKey = SKILL_SLUGS[skill];
  // An unknown slug is an address for nothing — back to the overview rather
  // than a dead end.
  if (!categoryKey) redirect("/performance");

  const user = await getCurrentUser();
  const detail = await getSkillDetail(user.id, categoryKey);
  if (!detail) redirect("/performance");

  return (
    <AppShell user={user} searchHint='Try searching "performance"'>
      <PageHeader
        eyebrow="Performance"
        title={detail.label}
        lede={`Worth ${detail.max} of the 100 marks. Every figure below is drawn from your recorded scene results.`}
      />

      <div className={s.columns}>
        <section className={s.panel} aria-label="Category average">
          <div>
            <p className={s.panelTitle}>Your average</p>
            <p className={s.panelSub}>
              Share of this category&apos;s marks across every scored report
            </p>
          </div>
          {detail.pct !== undefined ? (
            <ProgressBar
              value={detail.pct}
              label={detail.label}
              valueLabel={`${detail.pct}%`}
            />
          ) : (
            <p className={s.panelSub}>No scored report covers this category yet.</p>
          )}
          <p className={s.caption}>{detail.caption}</p>
        </section>

        <section className={s.panel} aria-label="Marks lost">
          <div>
            <p className={s.panelTitle}>Where the marks went</p>
            <p className={s.panelSub}>
              Deductions recorded against this category&apos;s scenes
            </p>
          </div>
          {detail.marksLost.length ? (
            <RankedList
              items={detail.marksLost.map((m) => ({
                tag: m.scene,
                label: m.label,
                value: `−${m.points}`,
              }))}
            />
          ) : (
            <p className={s.panelSub}>
              No deductions recorded in this category.
            </p>
          )}
        </section>
      </div>

      <SectionHeader title="Scene by scene" />
      {detail.scenes.length === 0 ? (
        <EmptyState icon={ListChecks} title="No scenes feed this category">
          The procedure defines no scenes for this category, so there is
          nothing to break down.
        </EmptyState>
      ) : (
        <Table label={`Scenes scored under ${detail.label}`}>
          <THead>
            <Tr>
              <Th>Scene</Th>
              <Th>Step</Th>
              <Th>Part</Th>
              <Th numeric>Attempts</Th>
              <Th>Outcomes</Th>
              <Th>Last outcome</Th>
              <Th numeric>Avg time</Th>
              <Th numeric>Par</Th>
            </Tr>
          </THead>
          <TBody>
            {detail.scenes.map((scene) => (
              <Tr key={scene.scene}>
                <Td head>{scene.scene}</Td>
                <Td>
                  {scene.label}
                  {scene.isCritical && (
                    <>
                      {" "}
                      <Chip tone="muted">Critical</Chip>
                    </>
                  )}
                </Td>
                <Td>{scene.part}</Td>
                <Td numeric>{scene.attempts}</Td>
                <Td>
                  {scene.attempts > 0 ? (
                    <span className={s.sceneOutcomes}>
                      <span className={s.outcomePass}>
                        {scene.outcomes.pass} pass
                      </span>
                      <span className={s.outcomeBorderline}>
                        {scene.outcomes.borderline} borderline
                      </span>
                      <span className={s.outcomeFail}>
                        {scene.outcomes.fail} fail
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  {scene.lastOutcome ? (
                    <Badge status={scene.lastOutcome === "borderline" ? "warn" : scene.lastOutcome}>
                      {titleCase(scene.lastOutcome)}
                    </Badge>
                  ) : (
                    <Chip tone="muted">Not attempted</Chip>
                  )}
                </Td>
                <Td numeric>{clock(scene.meanDurationS)}</Td>
                <Td numeric>{clock(scene.parTimeS)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}
