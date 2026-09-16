"use client";

import { useState } from "react";
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

  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <div>
          <p className={s.panelTitle}>{title}</p>
          {sub && <p className={s.panelSub}>{sub}</p>}
        </div>
        <div className={s.panelAction}>
          <div className={s.tabs} role="tablist" aria-label={title}>
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
          </div>
        </div>
      </div>

      <div role="tabpanel">{tabs[index].content}</div>
    </div>
  );
}
