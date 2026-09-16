import type { ReactNode } from "react";
import { getNavData } from "@/lib/data/nav";
import { personaFor } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";
import s from "./AppShell.module.css";

export type AppShellProps = {
  user: Profile;
  /** Placeholder copy in the search pill. */
  searchHint?: string;
  children: ReactNode;
};

/**
 * Counts, pinned links and notifications are fetched here rather than passed in
 * by every page — the chrome is the same on all of them, and a page that forgot
 * to pass them used to render a permanently empty bell.
 *
 * Only the *data* crosses into `SideNav`; the sections are resolved on the
 * client from `lib/nav`, because a `NavSection` carries a Lucide icon and
 * handing a component to a `"use client"` module throws at request time
 *.
 */
export async function AppShell({
  user,
  searchHint = "Search cases, sessions, reports",
  children,
}: AppShellProps) {
  const persona = personaFor(user.role);
  const nav = await getNavData(user);

  return (
    <div className={s.app}>
      <a href="#main" className="skipLink">
        Skip to main content
      </a>

      <SideNav persona={persona} nav={nav} />

      <div className={s.main}>
        <TopBar
          user={user}
          persona={persona}
          searchHint={searchHint}
          notifications={nav.notifications}
        />

        <main id="main" className={s.surface}>
          {children}
        </main>
      </div>
    </div>
  );
}

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, lede, actions }: PageHeaderProps) {
  return (
    <div className={s.pageHead}>
      <div className={s.pageHeadText}>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h1 className={s.pageTitle}>{title}</h1>
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
