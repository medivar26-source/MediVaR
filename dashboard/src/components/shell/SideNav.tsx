"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Stethoscope } from "lucide-react";
import { cx } from "@/lib/cx";
import {
  RAIL_FOOTER,
  sectionForPath,
  sectionsForPersona,
} from "@/lib/nav";
import type { PanelItem, SectionId } from "@/lib/nav";
import type { NavData } from "@/lib/data/nav";
import type { Persona } from "@/lib/roles";
import s from "./AppShell.module.css";

/**
 * Tier 1 (rail) selects which panel is shown. Tier 2 (panel) navigates.
 * Clicking a rail icon deliberately does NOT navigate — browsing sections
 * never costs the user their current page.
 *
 * `nav` arrives as plain JSON and the sections are resolved here, on the
 * client. Resolving them on the server would mean sending a `NavSection` —
 * which holds a Lucide icon — across the boundary, and that throws at request
 * time.
 */
export function SideNav({ persona, nav }: { persona: Persona; nav: NavData }) {
  const pathname = usePathname();
  const sections = sectionsForPersona(persona, nav);
  const [openId, setOpenId] = useState<SectionId>(() =>
    sectionForPath(pathname, persona),
  );

  const active = sections.find((x) => x.id === openId) ?? sections[0];

  const isCurrent = (href: string) => {
    const base = href.split("?")[0];
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
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
        <Link href="/" className={s.logo} aria-label="MediVeR XR home">
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
            <button
              key={section.id}
              type="button"
              className={cx(s.railBtn, on && s.railBtnOn)}
              onClick={() => setOpenId(section.id)}
              aria-label={section.label}
              aria-pressed={on}
            >
              <section.icon className={s.railIcon} strokeWidth={1.75} />
              {hasBadge && <span className={s.railDot} aria-hidden="true" />}
            </button>
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
          <span className={s.panelTitle}>{active?.label}</span>
          <ChevronDown className={s.panelCaret} aria-hidden="true" />
        </div>

        <nav className={s.panelScroll} aria-label={active?.label}>
          {active?.groups.map((group, i) => (
            <div className={s.group} key={group.label ?? `g-${i}`}>
              {group.label && <p className={s.groupLabel}>{group.label}</p>}
              {group.items.map((item) => renderItem(item))}
            </div>
          ))}
        </nav>

        <p className={s.panelFoot}>
          Visibility is scoped by your role, not by this menu.
        </p>
      </div>
    </>
  );
}
