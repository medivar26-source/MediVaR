import type { ReactNode } from "react";
import s from "./AppShell.module.css";

export type AppShellProps = {
  /** Kept so existing pages compile unchanged; the frame reads the user itself (see `AppFrame`). */
  user?: unknown;
  /** Kept for the same reason; the search suggestion now comes from the route (`lib/shell-routes.ts`). */
  searchHint?: string;
  children: ReactNode;
};

/**
 * Formerly the whole page frame: every page rendered its own side navigation and top bar, so both were
 * rebuilt, and their data re-read, on every navigation. The frame now lives once in the root layout
 * (`AppFrame`), so this only passes the page content through. Pages are unchanged: they still wrap their
 * content in `AppShell`, and it still means "this page sits in the app".
 */
export function AppShell({ children }: AppShellProps) {
  return <>{children}</>;
}

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  /** A small circular badge beside the title, for a count the title is about ("Your Programs" 2). */
  count?: number;
  lede?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, count, lede, actions }: PageHeaderProps) {
  return (
    <div className={s.pageHead}>
      <div className={s.pageHeadText}>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h1 className={s.pageTitle}>
          {title}
          {count !== undefined && (
            <span className={s.titleCount}>
              <span aria-hidden="true">{count}</span>
              <span className="srOnly"> ({count})</span>
            </span>
          )}
        </h1>
        {lede && <p className={s.pageLede}>{lede}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className={s.section}>
      <h2 className={s.sectionTitle}>{title}</h2>
      <span className={s.sectionRule} aria-hidden="true" />
      {action}
    </div>
  );
}
