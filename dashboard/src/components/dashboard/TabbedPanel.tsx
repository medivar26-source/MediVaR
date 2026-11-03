"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./dashboard.module.css";

export type PanelTab = {
  label: string;
  /** Rendered on the server and swapped client-side. */
  content: ReactNode;
};

/**
 * A panel whose tabs actually switch content. The panels are server-rendered
 * and handed in as `content`, so nothing extra ships to the client beyond the
 * toggle itself.
 *
 * The selection slides to the chosen tab. A second copy of the tab row, styled as selected, sits over
 * the first and is clipped to the selected tab; moving the clip moves the dark pill and its white label
 * together, so the colour change never runs out of step with the movement. Until the row has been
 * measured (and with no script) the selected tab is styled on its own, as before.
 */
export function TabbedPanel({
  title,
  sub,
  tabs,
}: {
  title: string;
  sub?: string;
  tabs: PanelTab[];
}) {
  const [index, setIndex] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const [clip, setClip] = useState<string | null>(null);

  // Measured before paint, so the pill is never drawn in the wrong place; re-measured if the row resizes.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      const tab = row.querySelectorAll<HTMLElement>('[role="tab"]')[index];
      if (!tab) return;
      const top = tab.offsetTop;
      const left = tab.offsetLeft;
      const right = row.clientWidth - left - tab.offsetWidth;
      const bottom = row.clientHeight - top - tab.offsetHeight;
      setClip(`inset(${top}px ${right}px ${bottom}px ${left}px round 999px)`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <div>
          <p className={s.panelTitle}>{title}</p>
          {sub && <p className={s.panelSub}>{sub}</p>}
        </div>
        <div className={s.panelAction}>
          <div ref={rowRef} className={s.tabs} data-slide={clip ? "" : undefined} role="tablist" aria-label={title}>
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={cx(s.tab, i === index && s.tabOn)}
                onClick={() => setIndex(i)}
              >
                {tab.label}
              </button>
            ))}
            {clip && (
              <div className={s.tabsSelected} style={{ clipPath: clip }} aria-hidden="true" inert>
                {tabs.map((tab) => (
                  <button key={tab.label} type="button" tabIndex={-1} className={s.tab}>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyed by tab, so the incoming content is a new element and settles in. */}
      <div key={index} role="tabpanel" className={s.tabPanel}>
        {tabs[index].content}
      </div>
    </div>
  );
}
