import type { Metadata } from "next";
import { Headset } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, Card, EmptyState } from "@/components/ui";
import { getLive } from "@/lib/data/live";
import { scenesForVariant } from "@/lib/seed";
import { getCurrentUser } from "@/lib/session";
import type { FixationType, ImplantDesign } from "@/lib/types";
import { LiveView } from "./LiveView";
import s from "./live.module.css";

export const metadata: Metadata = { title: "Live" };

/**
 * The live page: what the resident is doing and seeing, a second or two behind.
 *
 * Keyed on the headset ASSIGNMENT, not a session: there is no session or attempt row until the report arrives
 * (connect_service.ingest_report), so during the run this is the only id a page can attach to. The server reads
 * the first picture; `LiveView` polls the dashboard's own route handlers from then on. The backend decides who
 * may watch (the resident, the supervising instructor, the institution's admin); a stranger gets 404 here too.
 */
export default async function LivePage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const user = await getCurrentUser();
  const read = await getLive(assignmentId);

  if (!read.available) {
    return (
      <AppShell user={user}>
        <PageHeader eyebrow="Live" title="Live view is not set up on this server" />
        <Card padding="lg">
          <EmptyState icon={Headset} title="Nothing to show yet">
            The backend has no live-view tables (migration 016). Runs still report when they finish.
          </EmptyState>
        </Card>
      </AppShell>
    );
  }
  if (!read.found) notFound();

  const live = read.live;
  const design = (live.design === "PS" ? "PS" : "CR") as ImplantDesign;
  const fixation = (live.fixation === "cementless" ? "cementless" : "cemented") as FixationType;
  const scenes = scenesForVariant(design, fixation).map((sc) => ({ scene: sc.scene, label: sc.name, part: sc.part }));

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`Live · ${live.resident || "Resident"}`}
        title={live.caseTitle || "Headset run"}
        lede={[live.mode, design, fixation].filter(Boolean).join(" · ")}
        actions={
          <div className={s.headActions}>
            <Button variant="secondary" href={`/plan/${live.planId}/review`}>
              Back to plan
            </Button>
            <Button variant="ghost" href="/sessions">
              All sessions
            </Button>
          </div>
        }
      />
      <LiveView initial={live} scenes={scenes} />
    </AppShell>
  );
}
