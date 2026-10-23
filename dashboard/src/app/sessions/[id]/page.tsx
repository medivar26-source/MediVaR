import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, Card, CardHeader } from "@/components/ui";
import {
  elapsedSecondsSince,
  getSceneResults,
  getSession,
  getSessionProgress,
  getSessionScenes,
} from "@/lib/data/sessions";
import { canViewSession, sessionLinks } from "@/lib/data/session-links";
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
  const [session, user] = await Promise.all([getSession(id), getCurrentUser()]);
  // The title names the case, so it follows the same rule as the page: not for a session the viewer may not open.
  return { title: session && canViewSession(user, session) ? `Session — ${session.caseTitle}` : "Session" };
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
  if (!session || !canViewSession(user, session)) notFound();

  // The session, its case, its plan and its report are four pages. A finished session
  // used to jump straight to its report; it now stays here and links to each one that exists.
  const links = sessionLinks(session);

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
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {links.case && (
              <Button variant="secondary" href={links.case}>
                Back to case
              </Button>
            )}
            {links.plan && (
              <Button variant="secondary" href={links.plan}>
                Open plan
              </Button>
            )}
            {links.report && (
              <Button variant="primary" href={links.report}>
                View report
              </Button>
            )}
            <Button variant="ghost" href="/sessions">
              All sessions
            </Button>
          </div>
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
                : links.report
                  ? "This session has a report"
                  : session.status === "completed"
                    ? "This session has no report yet"
                    : "This session has not started"
            }
            subtitle={
              session.status === "aborted"
                ? "The headset stopped before the operation finished, so no report was generated. The scenes it did record are above."
                : links.report
                  ? "The operation finished and was scored. The scenes it recorded are above; the report has the marks and the planned-versus-achieved comparison."
                  : session.status === "completed"
                    ? "The operation finished, but the report for this session has not been generated. The scenes it recorded are above."
                    : "A PIN was issued but no headset has redeemed it yet."
            }
          />
          <div className={s.footActions}>
            {links.report && (
              <Button variant="primary" href={links.report}>
                View report
              </Button>
            )}
            {links.plan && (
              <Button variant="secondary" href={links.plan}>
                Open the plan
              </Button>
            )}
            {links.case && (
              <Button variant="ghost" href={links.case}>
                Back to the case
              </Button>
            )}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
