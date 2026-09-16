import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, Card, CardHeader, Chip, EmptyState } from "@/components/ui";
import { getProcedures } from "@/lib/data/catalogue";
import { roughDuration } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import s from "./simulations.module.css";

export const metadata: Metadata = { title: "Simulations" };

/**
 * The procedure catalogue. Everything on this page is a row: the counts, the
 * variant chips and the in-development cards all come from `procedures`, so
 * publishing a procedure is a data change (do not ship a
 * picker of procedures that do not exist).
 */
export default async function SimulationsPage() {
  const [user, procedures] = await Promise.all([
    getCurrentUser(),
    getProcedures(),
  ]);

  const published = procedures.filter((p) => p.status === "published");
  const upcoming = procedures.filter((p) => p.status !== "published");

  return (
    <AppShell user={user} searchHint='Try searching "total knee"'>
      <PageHeader
        title="Simulations"
        lede="Procedures published to your account. Total Knee Replacement is the only complete pathway in Phase 1."
        actions={
          published.length > 0 ? (
            <Button variant="primary" icon={Play} href="/setup">
              Start simulation
            </Button>
          ) : undefined
        }
      />

      {published.length === 0 ? (
        <EmptyState icon={Boxes} title="No procedures are published yet">
          An administrator publishes a procedure before it appears here.
        </EmptyState>
      ) : (
        <div className={s.grid}>
          {published.map((procedure) => (
            <Card key={procedure.id} padding="lg" className={s.hero}>
              <div className={s.heroHead}>
                <div>
                  <p className={s.eyebrow}>Available now</p>
                  <h2 className={s.heroTitle}>{procedure.name}</h2>
                </div>
                <Chip>Published</Chip>
              </div>

              {procedure.summary && (
                <p className={s.heroSummary}>{procedure.summary}</p>
              )}

              <dl className={s.metrics}>
                <div className={s.metric}>
                  <dt>Parts</dt>
                  <dd>{procedure.parts}</dd>
                </div>
                <div className={s.metric}>
                  <dt>Scenes</dt>
                  <dd>{procedure.scenes}</dd>
                </div>
                <div className={s.metric}>
                  <dt>Cases</dt>
                  <dd>{procedure.cases}</dd>
                </div>
                <div className={s.metric}>
                  <dt>Typical run</dt>
                  <dd>
                    {procedure.typicalDurationS
                      ? roughDuration(procedure.typicalDurationS)
                      : "—"}
                  </dd>
                </div>
              </dl>

              <div className={s.chips}>
                <Chip tone="muted">Training</Chip>
                <Chip tone="muted">Assessment</Chip>
                <Chip tone="muted">CR / PS</Chip>
                <Chip tone="muted">Cemented / Cementless</Chip>
                <Chip tone="muted">Beginner → Expert</Chip>
              </div>

              <div className={s.actions}>
                <Button variant="primary" href="/setup">
                  Start
                </Button>
                <Button variant="secondary" href="/cases">
                  Browse cases
                </Button>
                <Button
                  variant="ghost"
                  href={`/simulations/${procedure.id}`}
                >
                  Open launcher
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className={s.sectionTitle}>In development</h2>
          <div className={s.upcoming}>
            {upcoming.map((procedure) => (
              <Card key={procedure.id} padding="md" className={s.upcomingCard}>
                <CardHeader
                  title={procedure.name}
                  action={
                    <Chip tone="muted">
                      {procedure.status === "planned" ? "Planned" : "Exploratory"}
                    </Chip>
                  }
                />
                <p className={s.upcomingText}>{procedure.summary}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <p className={s.note}>
        Every scene must behave correctly under all six axes — mode, difficulty,
        implant design, fixation, patella and user role. See{" "}
        <Link href="/library">the procedure guide</Link> for the full
        specification.
      </p>
    </AppShell>
  );
}
