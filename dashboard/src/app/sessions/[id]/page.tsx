import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, Card, CardHeader } from "@/components/ui";
import {
  elapsedSecondsSince,
  getSceneResults,
  getSession,
  getSessionProgress,
  getSessionScenes,
} from "@/lib/data/sessions";
import { clock, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { LiveMirror } from "./LiveMirror";
import s from "./live.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getSession(id);
  return { title: session ? `Session — ${session.caseTitle}` : "Session" };
}

/**
 * The live mirror
 *
 * What the headset is doing, on the desktop beside it. The shell, the running
 * order and the scenes already recorded are all rendered on the server;
 * `LiveMirror` runs the elapsed clock and marks the current scene.
 *
 * The marker does not advance yet. Moving it as the operation runs needs a live
 * channel from the headset and there is nothing on the other end of one, so the
 * page shows the state the session had when it was requested and says so rather
 * than sitting on a socket that never speaks.
 *
 * A finished session has a report, and the report is the better answer to the
 * same URL — so this page redirects rather than showing a frozen mirror of
 * something that stopped moving days ago.
 */
export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const session = await getSession(id);
  if (!session) notFound();

  if (session.totalScore !== undefined) redirect(`/sessions/${id}/report`);

  const [progress, scenes, results] = await Promise.all([
    getSessionProgress(id),
    getSessionScenes(id),
    getSceneResults(id),
  ]);

  // What each scene has already recorded, so the server HTML carries the real
  // state and Realtime only has to move it forward — never reconstruct it.
  const recorded = new Map(results.map((result) => [result.scene, result.outcome ?? "done"]));

  const running = session.status === "live";

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        eyebrow={`${session.caseId} · ${shortDate(session.startedAt)}`}
        title={session.caseTitle}
        lede={`${titleCase(session.mode)} · ${titleCase(session.difficulty)} · ${session.design} · ${titleCase(session.fixation)}`}
        actions={
          <Button variant="secondary" href="/sessions">
            All sessions
          </Button>
        }
      />

      {/* Everything that ticks is inside the client component; everything that
          does not is rendered here, on the server. The scene list is a server
          render passed through `children`, so no Lucide icon and no component
          crosses the RSC boundary. */}
      <LiveMirror
        status={session.status}
        elapsedS={running ? elapsedSecondsSince(session.startedAt) : (session.durationS ?? 0)}
        initialScene={progress?.currentScene ?? null}
        initialDone={progress?.scenesDone ?? recorded.size}
        scenesTotal={progress?.scenesTotal ?? scenes.length}
      >
        <Card padding="none">
          <CardHeader
            flush
            title="Running order"
            subtitle={`${scenes.length} scenes for this variant — ${session.design}, ${titleCase(session.fixation)}`}
          />
          <ol className={s.scenes}>
            {scenes.map((scene) => (
              <li key={scene.scene} className={s.scene} data-scene={scene.scene}>
                <span className={s.sceneTag}>{scene.scene}</span>
                <span className={s.sceneBody}>
                  <span className={s.sceneLabel}>{scene.label}</span>
                  <span className={s.sceneMeta}>
                    {scene.part} ·{" "}
                    {scene.parTimeS ? `par ${clock(scene.parTimeS)}` : "no par time"}
                  </span>
                </span>
                <span
                  className={s.sceneState}
                  data-state={recorded.get(scene.scene) ?? "pending"}
                >
                  {/* The state already recorded, server-rendered; the mirror
                      only ever moves an attribute forward as new results
                      arrive, it never has to reconstruct what happened. */}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </LiveMirror>

      {!running && (
        <Card padding="lg">
          {/* Reaching this card with a `completed` session means the headset
              finished but no report row exists — a different fact from a PIN
              nobody has redeemed, and it must not be described as one. */}
          <CardHeader
            title={
              session.status === "aborted"
                ? "This session was interrupted"
                : session.status === "completed"
                  ? "This session has no report yet"
                  : "This session has not started"
            }
            subtitle={
              session.status === "aborted"
                ? "The headset stopped before the operation finished, so no report was generated. The scenes it did record are above."
                : session.status === "completed"
                  ? "The operation finished, but the report for this session has not been generated. The scenes it recorded are above."
                  : "A PIN was issued but no headset has redeemed it yet."
            }
          />
          <div className={s.footActions}>
            <Button variant="secondary" href={`/plan/${session.planId}`}>
              Open the plan
            </Button>
            <Button variant="ghost" href={`/cases/${session.caseId}`}>
              Back to the case
            </Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
