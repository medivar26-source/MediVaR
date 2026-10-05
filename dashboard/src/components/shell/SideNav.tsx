"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { cx } from "@/lib/cx";
import {
  RAIL_FOOTER,
  sectionForPath,
  sectionsForPersona,
} from "@/lib/nav";
import type { NavGroup, PanelItem } from "@/lib/nav";
import type { NavData } from "@/lib/data/nav";
import type { Persona } from "@/lib/roles";
import s from "./AppShell.module.css";

/**
 * Rail icons are direct navigation links. Clicking an icon immediately redirects
 * to that section's primary route. The contextual panel displays that section's
 * sub-navigation based on the current active URL.
 */
export function SideNav(props: { persona: Persona; nav: NavData }) {
  return (
    <Suspense fallback={<nav className={s.rail} aria-label="Sections" />}>
      <SideNavContent {...props} />
    </Suspense>
  );
}

function SideNavContent({ persona, nav }: { persona: Persona; nav: NavData }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sections = sectionsForPersona(persona, nav);
  const activeSectionId = sectionForPath(pathname, persona);
  // `null`: a page outside every section (the dashboard, Settings, Help). Nothing is highlighted
  // on the rail and the panel lists each section's destinations.
  const active = activeSectionId ? sections.find((x) => x.id === activeSectionId) : undefined;
  const isHome = !active;

  // Inspect path for contextual program and cohort hierarchy
  const programMatch = pathname.match(/^\/programs\/([^/]+)(?:\/cohorts\/([^/]+))?/);
  const programId = programMatch ? programMatch[1] : null;
  const cohortId = programMatch ? programMatch[2] : null;

  let activeGroups: NavGroup[] = active
    ? active.groups
    : sections.map((section) => ({
        label: section.label,
        // Each section's headline links; the long "By skill" list stays inside Performance.
        items: section.groups[0]?.items ?? [],
      }));
  if (
    (persona === "instructor" || persona === "admin") &&
    active?.id === "programs" &&
    programId
  ) {
    const programGroup: NavGroup = {
      label: "Program Workspace",
      items: [
        { label: "Activities", href: `/programs/${programId}?tab=activities` },
        { label: "Cohorts", href: `/programs/${programId}?tab=cohorts` },
        { label: "Learners & Performance", href: `/programs/${programId}?tab=learners${cohortId ? `&cohort=${cohortId}` : ""}` },
        { label: "Cohort Performance", href: `/programs/${programId}?tab=performance${cohortId ? `&cohort=${cohortId}` : ""}` },
      ],
    };

    const newGroups: NavGroup[] = [...activeGroups, programGroup];

    if (cohortId) {
      const cohortGroup: NavGroup = {
        label: "Cohort Workspace",
        items: [
          { label: "Sessions", href: `/programs/${programId}/cohorts/${cohortId}?tab=sessions` },
          { label: "Case Access", href: `/programs/${programId}/cohorts/${cohortId}?tab=cases` },
          { label: "Enrollment", href: `/programs/${programId}/cohorts/${cohortId}?tab=enrollment` },
        ],
      };
      newGroups.push(cohortGroup);
    }
    activeGroups = newGroups;
  }

  // An open case (not the "new" or "edit" screens) gets its own Details / Imaging / Planning group.
  const caseMatch = pathname.match(/^\/cases\/([^/]+)$/);
  const caseId = caseMatch && caseMatch[1] !== "new" ? caseMatch[1] : null;
  if ((persona === "instructor" || persona === "admin") && active?.id === "content-library" && caseId) {
    activeGroups = [
      ...activeGroups,
      {
        label: "Case",
        items: [
          { label: "Details", href: `/cases/${caseId}?tab=details` },
          { label: "Imaging", href: `/cases/${caseId}?tab=imaging` },
          { label: "Planning", href: `/cases/${caseId}?tab=planning` },
        ],
      },
    ];
  }

  const isCurrent = (href: string) => {
    const [targetBase, targetQuery] = href.split("?");
    // Each workspace has its own landing tab when none is in the URL.
    const currentTab = searchParams.get("tab") ?? (cohortId ? "sessions" : programId ? "activities" : caseId ? "details" : "overview");

    if (targetQuery) {
      const targetTab = new URLSearchParams(targetQuery).get("tab");
      return pathname === targetBase && currentTab === targetTab;
    }

    if (targetBase === "/") return pathname === "/";
    if (targetBase === "/programs") {
      return pathname === "/programs" && searchParams.get("tab") !== "cohorts";
    }
    if (targetBase === "/cases") return pathname === "/cases";
    if (targetBase === "/sessions") return pathname === "/sessions";
    if (targetBase === "/plans") return pathname === "/plans";
    if (targetBase === "/reports") return pathname === "/reports";
    if (targetBase === "/settings") return pathname === "/settings";

    if (pathname === targetBase) return true;
    return pathname.startsWith(targetBase + "/");
  };

  const renderItem = (item: PanelItem, depth = 0) => (
    <div key={item.href + item.label}>
      <Link
        href={item.href}
        className={cx(
          s.item,
          depth > 0 && s.child,
          isCurrent(item.href) && s.itemOn,
        )}
        aria-current={isCurrent(item.href) ? "page" : undefined}
      >
        <span className={s.itemLabel}>{item.label}</span>
        {item.badge !== undefined && (
          <span className={s.badge}>{item.badge}</span>
        )}
      </Link>
      {item.children && (
        <div className={s.children}>
          {item.children.map((child) => renderItem(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <nav className={s.rail} aria-label="Sections">
        <Link href="/" className={s.logo} aria-label="Dashboard" aria-current={pathname === "/" ? "page" : undefined}>
          <Stethoscope className={s.logoGlyph} strokeWidth={2} />
        </Link>

        {sections.map((section) => {
          const on = section.id === active?.id;
          const hasBadge = section.groups.some((g) =>
            g.items.some(
              (i) =>
                i.badge !== undefined ||
                (i.children ?? []).some((c) => c.badge !== undefined),
            ),
          );
          return (
            <Link
              key={section.id}
              href={section.href}
              className={cx(s.railBtn, on && s.railBtnOn)}
              aria-label={section.label}
              aria-current={on ? "page" : undefined}
            >
              <section.icon className={s.railIcon} strokeWidth={1.75} />
              {hasBadge && <span className={s.railDot} aria-hidden="true" />}
            </Link>
          );
        })}

        <div className={s.railFooter}>
          {RAIL_FOOTER.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cx(s.railBtn, isCurrent(item.href) && s.railBtnOn)}
              aria-label={item.label}
            >
              <item.icon className={s.railIcon} strokeWidth={1.75} />
            </Link>
          ))}
        </div>
      </nav>

      <div className={s.panel}>
        <div className={s.panelHead}>
          <span className={s.panelTitle}>{isHome ? "Dashboard" : active?.label}</span>
        </div>

        <nav className={s.panelScroll} aria-label={isHome ? "All sections" : active?.label}>
          {activeGroups.map((group, i) => (
            <div className={s.group} key={group.label ?? `g-${i}`}>
              {group.label && <p className={s.groupLabel}>{group.label}</p>}
              {group.items.map((item) => renderItem(item))}
            </div>
          ))}
        </nav>

        <p className={pFootStyle}>
          Visibility is scoped by your role, not by this menu.
        </p>
      </div>
    </>
  );
}

const pFootStyle = s.panelFoot;

