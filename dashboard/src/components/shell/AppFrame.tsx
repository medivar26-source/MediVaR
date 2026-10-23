"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { NavData } from "@/lib/data/nav";
import { isEmbedded } from "@/lib/embed";
import { personaFor } from "@/lib/roles";
import { searchHintFor, usesAppFrame } from "@/lib/shell-routes";
import type { Profile } from "@/lib/types";
import { MobileNav } from "./MobileNav";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";
import s from "./AppShell.module.css";

/**
 * The side navigation and top bar, mounted once in the root layout.
 *
 * A layout is not re-rendered when the user moves between pages inside it, so the sidebar keeps its
 * state (collapsed, scroll, open sections) and a loading skeleton replaces only the page content, not
 * the chrome. Before this, every page rendered its own `AppShell`, so both were rebuilt and
 * re-fetched on every navigation. Pages no longer render the frame; they render their content.
 *
 * Counts, pinned links and notifications are read once per full page load and after actions that change
 * them (sign-in and out, starting or sealing a plan, saving the account); they are not re-read on
 * every click between pages.
 */
export function AppFrame({
  user,
  nav,
  children,
}: {
  /** Null when nobody is signed in: the children are shown on their own. */
  user: Profile | null;
  nav: NavData | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const embedded = isEmbedded(searchParams.get("embed"));
  const here = `${pathname}?${searchParams.toString()}`;
  const pending = useNavigationPending(here);
  // The phone menu belongs to the address it was opened on, so following a link in it closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === here;
  const closeMenu = () => setMenuOpenOn(null);

  if (!user || !nav || !usesAppFrame(pathname, embedded)) return <>{children}</>;

  const persona = personaFor(user.role);

  return (
    <div className={s.app}>
      <a href="#main" className="skipLink">
        Skip to main content
      </a>

      <SideNav persona={persona} nav={nav} />
      <MobileNav open={menuOpen} onClose={closeMenu} persona={persona} nav={nav} />

      {pending && <div className={s.navProgress} role="progressbar" aria-label="Loading page" />}

      <div className={s.main}>
        <TopBar
          user={user}
          persona={persona}
          searchHint={searchHintFor(pathname, persona)}
          notifications={nav.notifications}
          primaryAction={nav.primaryAction}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpenOn(here)}
        />

        <main id="main" className={s.surface} aria-busy={pending}>
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * True from the click on an in-app link until the address changes. The page does not change until the
 * server has its content, so a click would otherwise look like nothing happened; this gives the click an
 * immediate response without hiding the current page behind a loading skeleton (which React holds on
 * screen for at least 300 ms even when the data arrives sooner).
 *
 * `here` is the current address. The pending state is tied to the address it started on, so it ends by
 * itself when the address changes, and a timeout ends it if the navigation never lands.
 */
function useNavigationPending(here: string): boolean {
  const [startedOn, setStartedOn] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setStartedOn(`${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`);
    };
    // Capture phase: the router's own link handler cancels the default action before a bubbling listener runs.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (startedOn === null) return;
    const timer = setTimeout(() => setStartedOn(null), 15000);
    return () => clearTimeout(timer);
  }, [startedOn]);

  return startedOn !== null && startedOn === here;
}
