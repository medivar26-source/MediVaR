"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { House, PanelLeftClose, PanelLeftOpen, Stethoscope } from "lucide-react";
import { cx } from "@/lib/cx";
import { sectionForPath, sectionsForPersona } from "@/lib/nav";
import type { PanelItem, SectionId } from "@/lib/nav";
import type { NavData } from "@/lib/data/nav";
import type { Persona } from "@/lib/roles";
import s from "./AppShell.module.css";

/**
 * One labeled sidebar. Each section of the product is a heading and its
 * destinations sit under it, so the whole menu is readable without clicking
 * anything. Program, cohort and case sub-pages are tabs inside those pages,
 * not extra groups that appear here.
 *
 * It can be collapsed to icons; the choice is remembered in this browser only.
 */

const COLLAPSED_KEY = "mediver.sidebar.collapsed";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // Storage can be blocked; the menu then simply stays as it is.
  }
  listeners.forEach((notify) => notify());
}

/**
 * Learners and instructors get two layers: a rail of icons, and a panel that opens beside it when an icon is
 * pressed. The panel can be opened and closed at any time. The choice is remembered in this
 * browser, and the panel follows the user when they move into another section.
 */
const PANEL_KEY = "mediver.nav.panel";
const PANEL_ID = "nav-panel";

type PanelState = { open: boolean; section?: SectionId; route?: SectionId | null };

function readPanelRaw() {
  try {
    return window.localStorage.getItem(PANEL_KEY);
  } catch {
    return null;
  }
}

function parsePanel(raw: string | null): PanelState {
  if (!raw) return { open: true };
  try {
    const value = JSON.parse(raw) as PanelState;
    return { open: value.open !== false, section: value.section, route: value.route };
  } catch {
    return { open: true };
  }
}

function writePanel(state: PanelState) {
  try {
    window.localStorage.setItem(PANEL_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked; the panel then keeps its default behaviour.
  }
  listeners.forEach((notify) => notify());
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
  const panelRaw = useSyncExternalStore(subscribe, readPanelRaw, () => null);

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

  const renderItem = (item: PanelItem, depth = 0, onNavigate?: () => void) => {
    const on = isCurrent(item.href);
    return (
      <div key={item.href + item.label} className={cx(!item.icon && s.noIcon)}>
        <Link
          href={item.href}
          className={cx(s.item, depth > 0 && s.child, on && s.itemOn)}
          aria-current={on ? "page" : undefined}
          title={collapsed && persona === "admin" ? item.label : undefined}
          onClick={onNavigate}
        >
          {item.icon && <item.icon className={s.itemIcon} strokeWidth={1.75} aria-hidden="true" />}
          <span className={s.itemLabel}>{item.label}</span>
          {item.badge !== undefined && <span className={s.badge}>{item.badge}</span>}
        </Link>
        {item.children && (
          <div className={s.children}>
            {item.children.map((child) => renderItem(child, depth + 1, onNavigate))}
          </div>
        )}
      </div>
    );
  };

  const homeOn = pathname === "/";

  // Administrators have a single section, so a second layer would add nothing for them.
  if (persona !== "admin") {
    const stored = parsePanel(panelRaw);
    const routeSection = sectionForPath(pathname, persona);
    const knows = (id?: SectionId | null) => Boolean(id && sections.some((x) => x.id === id));
    // The user's own pick holds while they stay in one section; moving to another follows them.
    const picked = knows(stored.section) && stored.route === routeSection ? stored.section : undefined;
    const panelSectionId: SectionId | undefined =
      picked ?? (routeSection && knows(routeSection) ? routeSection : sections[0]?.id);
    const panelSection = sections.find((x) => x.id === panelSectionId);
    const open = stored.open && Boolean(panelSection);

    const pressSection = (id: SectionId) => {
      if (open && panelSectionId === id) {
        writePanel({ open: false, section: id, route: routeSection });
      } else {
        writePanel({ open: true, section: id, route: routeSection });
      }
    };
    // On narrower screens the panel floats over the page, so it gets out of the way after a click.
    const closeIfNarrow = () => {
      if (window.matchMedia("(max-width: 1279px)").matches) {
        writePanel({ open: false, section: panelSectionId, route: routeSection });
      }
    };

    return (
      <div className={s.tiers}>
        <nav className={s.rail} aria-label="Sections">
          <Link
            href="/"
            className={cx(s.logo, s.railLogo)}
            aria-label="Home"
            title="Home"
            aria-current={homeOn ? "page" : undefined}
          >
            <Stethoscope className={s.logoGlyph} strokeWidth={2} />
          </Link>

          {sections.map((section) => {
            const selected = open && section.id === panelSectionId;
            const here = section.id === routeSection;
            const hasBadge = section.groups.some((g) =>
              g.items.some((i) => i.badge !== undefined),
            );
            return (
              <button
                key={section.id}
                type="button"
                className={cx(s.railBtn, selected && s.railBtnOn, here && !selected && s.railBtnHere)}
                aria-label={section.label}
                title={section.label}
                aria-expanded={selected}
                aria-controls={PANEL_ID}
                aria-current={here ? "true" : undefined}
                onClick={() => pressSection(section.id)}
              >
                <section.icon className={s.railIcon} strokeWidth={1.75} aria-hidden="true" />
                {hasBadge && <span className={s.railDot} aria-hidden="true" />}
              </button>
            );
          })}

          <div className={s.railFooter}>
            <button
              type="button"
              className={s.railBtn}
              aria-label={open ? "Close menu panel" : "Open menu panel"}
              title={open ? "Close menu panel" : "Open menu panel"}
              aria-expanded={open}
              aria-controls={PANEL_ID}
              onClick={() =>
                writePanel({ open: !open, section: panelSectionId, route: routeSection })
              }
            >
              {open ? (
                <PanelLeftClose className={s.railIcon} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <PanelLeftOpen className={s.railIcon} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        <div
          id={PANEL_ID}
          className={cx(s.panelWrap, !open && s.panelWrapClosed)}
          inert={!open}
          role="region"
          aria-label={panelSection ? `${panelSection.label} menu` : "Menu"}
        >
          {panelSection && (
            <div className={s.panelInner}>
              <div className={s.panelHead}>
                <span className={s.panelTitle}>{panelSection.label}</span>
                <button
                  type="button"
                  className={s.collapseBtn}
                  aria-label="Close menu panel"
                  title="Close menu panel"
                  onClick={() =>
                    writePanel({ open: false, section: panelSectionId, route: routeSection })
                  }
                >
                  <PanelLeftClose width={18} height={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
              <nav className={s.sidebarScroll} aria-label={panelSection.label}>
                {panelSection.groups.map((group, i) => (
                  <div className={s.subGroup} key={group.label ?? `g-${i}`}>
                    {group.label && <p className={s.subGroupLabel}>{group.label}</p>}
                    {group.items.map((item) => renderItem(item, 0, closeIfNarrow))}
                  </div>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <aside className={cx(s.sidebar, collapsed && s.sidebarCollapsed)} aria-label="Main menu">
      <div className={s.brand}>
        <Link href="/" className={s.logo} aria-label="MediVeR XR home">
          <Stethoscope className={s.logoGlyph} strokeWidth={2} />
        </Link>
        <span className={s.brandName}>MediVeR XR</span>
        <button
          type="button"
          className={s.collapseBtn}
          onClick={() => writeCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeftOpen width={18} height={18} strokeWidth={1.75} />
          ) : (
            <PanelLeftClose width={18} height={18} strokeWidth={1.75} />
          )}
        </button>
      </div>

      <nav className={s.sidebarScroll} aria-label="Main">
        <div className={s.group}>
          <Link
            href="/"
            className={cx(s.item, homeOn && s.itemOn)}
            aria-current={homeOn ? "page" : undefined}
            title={collapsed ? "Home" : undefined}
          >
            <House className={s.itemIcon} strokeWidth={1.75} aria-hidden="true" />
            <span className={s.itemLabel}>Home</span>
          </Link>
        </div>

        {sections.map((section) => (
          <div className={s.group} key={section.id}>
            <p className={s.groupLabel}>{section.label}</p>
            {section.groups.map((group, i) => (
              <div className={s.subGroup} key={group.label ?? `g-${i}`}>
                {group.label && <p className={cx(s.subGroupLabel, s.noIcon)}>{group.label}</p>}
                {group.items.map((item) => renderItem(item))}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
