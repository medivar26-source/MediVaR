"use client";

import { Suspense, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Stethoscope,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { sectionForPath, sectionsForPersona } from "@/lib/nav";
import type { PanelItem, SectionId } from "@/lib/nav";
import type { NavData } from "@/lib/data/nav";
import type { Persona } from "@/lib/roles";
import { SettingsButton } from "./SettingsModal";
import s from "./AppShell.module.css";

/**
 * One sidebar for every role, in two states.
 *
 * Expanded: the Dashboard, then one accordion capsule per section; opening a capsule
 * lists that section's destinations beneath it.
 * Collapsed: a narrow rail of round icon buttons. Pressing a section icon opens the
 * sidebar with that capsule already open.
 *
 * The logo at the top and the Settings button at the bottom sit at the same
 * coordinates in both states. The collapsed/expanded choice and which capsules the
 * user has opened or closed are remembered in this browser only.
 */

const COLLAPSED_KEY = "mediver.sidebar.collapsed";
const CAPSULES_KEY = "mediver.sidebar.capsules";
/** Below this width the sidebar starts collapsed, unless the user has chosen. */
const COMPACT_QUERY = "(max-width: 1279px)";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  const media = window.matchMedia(COMPACT_QUERY);
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onChange);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked; the menu then simply stays as it is.
  }
  notify();
}

function readCollapsed(): boolean {
  const stored = readStored(COLLAPSED_KEY);
  if (stored === "1") return true;
  if (stored === "0") return false;
  return window.matchMedia(COMPACT_QUERY).matches;
}

function writeCollapsed(value: boolean) {
  writeStored(COLLAPSED_KEY, value ? "1" : "0");
}

/** Capsule id → closed. An id with no entry follows the default: open only on the current section. */
type ClosedMap = Partial<Record<SectionId, boolean>>;

function parseClosed(raw: string | null): ClosedMap {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" ? (value as ClosedMap) : {};
  } catch {
    return {};
  }
}

function writeCapsule(id: SectionId, closed: boolean) {
  const next = { ...parseClosed(readStored(CAPSULES_KEY)), [id]: closed };
  writeStored(CAPSULES_KEY, JSON.stringify(next));
}

export function SideNav(props: { persona: Persona; nav: NavData }) {
  return (
    <Suspense fallback={<aside className={s.sidebar} aria-label="Main menu" />}>
      <SideNavContent {...props} />
    </Suspense>
  );
}

function SideNavContent({ persona, nav }: { persona: Persona; nav: NavData }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sections = sectionsForPersona(persona, nav);
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const capsulesRaw = useSyncExternalStore(
    subscribe,
    () => readStored(CAPSULES_KEY),
    () => null,
  );

  const closedMap = parseClosed(capsulesRaw);
  const routeSection = sectionForPath(pathname, persona);
  const homeOn = pathname === "/";

  const isCapsuleOpen = (id: SectionId) => {
    const closed = closedMap[id];
    return closed === undefined ? id === routeSection : !closed;
  };

  const isCurrent = (href: string) => {
    const [targetBase, targetQuery] = href.split("?");

    if (targetQuery) {
      const targetTab = new URLSearchParams(targetQuery).get("tab");
      const currentTab = searchParams.get("tab");
      return pathname === targetBase && currentTab === targetTab;
    }

    if (targetBase === "/") return pathname === "/";
    // Programs: the list and every program page below it, except the cohort list tab.
    if (targetBase === "/programs") {
      if (pathname === "/programs") return searchParams.get("tab") !== "cohorts";
      return pathname.startsWith("/programs/");
    }
    // Pre-op plans: the list and the planning workspace.
    if (targetBase === "/plans") {
      return pathname === "/plans" || pathname.startsWith("/plan/");
    }
    // The skill pages live below /performance, so the overview matches only itself.
    if (targetBase === "/performance") return pathname === "/performance";

    return pathname === targetBase || pathname.startsWith(targetBase + "/");
  };

  const renderItem = (item: PanelItem, depth = 0) => {
    const on = isCurrent(item.href);
    return (
      <div key={item.href + item.label}>
        <Link
          href={item.href}
          className={cx(s.item, depth > 0 && s.child, on && s.itemOn)}
          aria-current={on ? "page" : undefined}
        >
          {item.icon && <item.icon className={s.itemIcon} strokeWidth={1.75} aria-hidden="true" />}
          <span className={s.itemLabel}>{item.label}</span>
          {item.badge !== undefined && <span className={s.badge}>{item.badge}</span>}
        </Link>
        {item.children && (
          <div className={s.children}>
            {item.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    // Empty rail space (anything that is not a link or button) reopens the sidebar.
    const reopenFromEmptySpace = (event: MouseEvent<HTMLElement>) => {
      if (!(event.target as HTMLElement).closest("a, button")) writeCollapsed(false);
    };

    return (
      <aside
        className={cx(s.sidebar, s.sidebarCollapsed)}
        aria-label="Main menu"
        onClick={reopenFromEmptySpace}
      >
        {/* Pinned top: brand logo, which is also the reopen toggle */}
        <div className={s.brand}>
          <button
            type="button"
            className={cx(s.logo, s.logoToggleBtn)}
            onClick={() => writeCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <Stethoscope
              className={cx(s.logoGlyph, s.logoGlyphDefault)}
              strokeWidth={2}
              aria-hidden="true"
            />
            <PanelLeft
              className={cx(s.logoGlyph, s.logoGlyphToggle)}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>

        <nav className={s.collapsedNav} aria-label="Sections">
          <Link
            href="/"
            className={cx(s.railBtn, homeOn && s.railBtnHere)}
            aria-label="Dashboard"
            title="Dashboard"
            aria-current={homeOn ? "page" : undefined}
          >
            <LayoutDashboard className={s.railIcon} strokeWidth={1.75} aria-hidden="true" />
          </Link>

          {sections.map((section) => {
            const here = section.id === routeSection;
            const hasBadge = section.groups.some((g) => g.items.some((i) => i.badge !== undefined));
            return (
              <button
                key={section.id}
                type="button"
                className={cx(s.railBtn, here && s.railBtnHere)}
                aria-label={section.label}
                title={section.label}
                onClick={() => {
                  writeCapsule(section.id, false);
                  writeCollapsed(false);
                }}
              >
                <section.icon className={s.railIcon} strokeWidth={1.75} aria-hidden="true" />
                {hasBadge && <span className={s.railDot} aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        {/* Pinned bottom: Settings, a sibling of the nav so it never scrolls */}
        <div className={s.collapsedFooter}>
          <SettingsButton className={s.railBtn}>
            <Settings className={s.railIcon} strokeWidth={1.75} aria-hidden="true" />
          </SettingsButton>
        </div>
      </aside>
    );
  }

  return (
    <aside className={s.sidebar} aria-label="Main menu">
      <div className={s.brand}>
        <Link href="/" className={s.logo} aria-label="MediVeR XR home" title="Home">
          <Stethoscope className={s.logoGlyph} strokeWidth={2} />
        </Link>
        <Link href="/" className={s.brandName} title="Home">
          MediVeR XR
        </Link>
        <button
          type="button"
          className={s.collapseBtn}
          onClick={() => writeCollapsed(true)}
          aria-label="Collapse menu"
          title="Collapse menu"
        >
          <PanelLeftClose width={18} height={18} strokeWidth={1.75} />
        </button>
      </div>

      <nav className={s.sidebarScroll} aria-label="Main menu">
        {/* The dashboard is its own page, not a section */}
        <div className={s.capsule}>
          <Link
            href="/"
            className={cx(s.capsuleBtn, homeOn && s.capsuleBtnHere)}
            aria-current={homeOn ? "page" : undefined}
            title="Dashboard"
          >
            <LayoutDashboard className={s.capsuleIcon} strokeWidth={1.75} aria-hidden="true" />
            <span className={s.capsuleLabel}>Dashboard</span>
          </Link>
        </div>

        {sections.map((section) => {
          const isOpen = isCapsuleOpen(section.id);
          const bodyId = `capsule-${section.id}`;
          const here = section.id === routeSection;
          return (
            <div className={s.capsule} key={section.id}>
              <button
                type="button"
                className={cx(s.capsuleBtn, isOpen && s.capsuleBtnOn, here && s.capsuleBtnHere)}
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => writeCapsule(section.id, isOpen)}
              >
                <section.icon className={s.capsuleIcon} strokeWidth={1.75} aria-hidden="true" />
                <span className={s.capsuleLabel}>{section.label}</span>
                <ChevronDown
                  className={cx(s.capsuleChevron, isOpen && s.capsuleChevronOpen)}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
              <div id={bodyId} className={cx(s.capsuleBody, isOpen && s.capsuleBodyOpen)} inert={!isOpen}>
                <div className={s.capsuleBodyInner}>
                  {section.groups.map((group, i) => (
                    <div className={s.subGroup} key={group.label ?? `g-${i}`}>
                      {group.label && <p className={s.subGroupLabel}>{group.label}</p>}
                      <div className={cx(group.label && s.subGroupItems)}>
                        {group.items.map((item) => renderItem(item, group.label ? 1 : 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Pinned bottom: Settings */}
      <div className={s.navFooter}>
        <SettingsButton className={s.railBtn}>
          <Settings className={s.railIcon} strokeWidth={1.75} aria-hidden="true" />
        </SettingsButton>
      </div>
    </aside>
  );
}
