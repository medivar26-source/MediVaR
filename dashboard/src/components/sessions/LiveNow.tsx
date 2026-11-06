import Link from "next/link";
import { Radio } from "lucide-react";
import { getActiveRuns } from "@/lib/data/live";
import { clockText, liveChipText, livePagePath } from "@/lib/live-view";
import s from "./LiveNow.module.css";

/**
 * "Live now": the headset runs the viewer may watch at this moment, one row each, with a Watch live link.
 * A server component, so the lists that carry it (Sessions, the dashboards) stay server-rendered; it renders
 * nothing at all when no run is live or live view is not set up, because an empty "Live now" box would read
 * as something being wrong.
 */
export async function LiveNow() {
  const runs = await getActiveRuns();
  if (runs.length === 0) return null;

  return (
    <section className={s.strip} aria-label="Live now">
      <div className={s.head}>
        <Radio width={16} height={16} aria-hidden="true" />
        <strong>Live now</strong>
        <span className={s.count}>{runs.length}</span>
      </div>
      <ul className={s.list}>
        {runs.map((r) => (
          <li key={r.assignmentId} className={s.row}>
            <span className={s.who}>
              <span className={s.name}>{r.resident || "Resident"}</span>
              <span className={s.meta}>
                {r.caseTitle || "Headset run"}
                {r.state.sceneId ? ` · scene ${r.state.sceneId}` : ""}
                {r.state.stepsTotal > 0 ? ` · ${r.state.stepsDone} of ${r.state.stepsTotal} steps` : ""}
                {` · ${clockText(r.state.elapsedS)}`}
              </span>
            </span>
            <span className={s.chip} data-state={r.liveState}>{liveChipText(r.liveState)}</span>
            <Link href={livePagePath(r.assignmentId)} className={s.watch}>
              Watch live
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
