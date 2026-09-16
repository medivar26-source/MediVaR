import type { ReactNode } from "react";
import s from "./dashboard.module.css";

/* `ContextRow` and `Tabs` lived here once. Both were static pictures
   of controls — the row's download and share glyphs had no handlers at all —
   and both were superseded by `Toolbar` and `TabbedPanel`, which work. Only
   `Panel` survives. The file keeps its name because every dashboard imports
   `Panel` from it. */

export function Panel({
  title,
  sub,
  action,
  children,
}: {
  title?: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={s.panel}>
      {(title || action) && (
        <div className={s.panelHead}>
          <div>
            {title && <p className={s.panelTitle}>{title}</p>}
            {sub && <p className={s.panelSub}>{sub}</p>}
          </div>
          {action && <div className={s.panelAction}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
