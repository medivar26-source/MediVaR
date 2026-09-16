import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CircleHelp,
  Compass,
  GraduationCap,
  Settings,
  TrendingUp,
} from "lucide-react";
import type { BadgeKey, NavData } from "./data/nav";
import type { Persona } from "./roles";

/**
 * Two-tier navigation.
 *
 * Tier 1 — a rail of circular icons. Each is a SECTION of the product.
 * Tier 2 — a contextual panel listing that section's destinations.
 *
 * Clicking a rail icon swaps the panel; it does not navigate. Navigation
 * happens from the panel, so the rail never loses the user's place.
 *
 * An item names a `badgeKey`; it never carries a number. `sectionsForPersona`
 * resolves those keys against real counts, and a key with no count renders no
 * badge — a zero is not news, and an invented count is worse than no count.
 */

export type SectionId = "overview" | "practice" | "insights" | "teaching";

export type PanelItem = {
  label: string;
  href: string;
  /** Resolved against `NavData.counts`. Absent count → no badge. */
  badgeKey?: BadgeKey;
  /** Set only by `sectionsForPersona`, after resolving `badgeKey`. */
  badge?: number;
  children?: PanelItem[];
};

export type PanelGroup = {
  label?: string;
  items: PanelItem[];
};

export type NavSection = {
  id: SectionId;
  /** Panel heading. */
  label: string;
  icon: LucideIcon;
  personas: Persona[];
  groups: PanelGroup[];
};

export const SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Compass,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Dashboard", href: "/" },
          { label: "Activity", href: "/activity" },
        ],
      },
      // The Pinned group is injected by sectionsForPersona from the user's own
      // recent rows. It used to be two hardcoded ids that pointed at a case
      // and a session the signed-in user might never have touched.
    ],
  },
  {
    id: "practice",
    label: "Practice",
    icon: Boxes,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Simulations", href: "/simulations" },
          { label: "Case library", href: "/cases" },
        ],
      },
      {
        label: "Planning",
        items: [
          {
            label: "My plans",
            href: "/plans",
            children: [
              {
                label: "Ready for VR",
                href: "/plans?state=ready",
                badgeKey: "plans.ready",
              },
              { label: "PIN issued", href: "/plans?state=paired" },
            ],
          },
        ],
      },
      {
        label: "Sessions",
        items: [
          {
            label: "All sessions",
            href: "/sessions",
            children: [
              {
                label: "Live now",
                href: "/sessions?status=live",
                badgeKey: "sessions.live",
              },
              {
                label: "Interrupted",
                href: "/sessions?status=aborted",
                badgeKey: "sessions.aborted",
              },
              { label: "Completed", href: "/sessions?status=completed" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: TrendingUp,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Performance", href: "/performance" },
          { label: "Reports", href: "/reports" },
        ],
      },
      {
        label: "By skill",
        items: [
          { label: "Bone cuts & alignment", href: "/performance/bone-cuts" },
          { label: "Gap assessment", href: "/performance/gaps" },
          { label: "Trialling & stability", href: "/performance/trialling" },
          { label: "Implantation", href: "/performance/implantation" },
        ],
      },
    ],
  },
  {
    id: "teaching",
    label: "Teaching",
    icon: GraduationCap,
    personas: ["instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Cohorts", href: "/cohorts" },
          // A flat attention list across every cohort the viewer owns, ordered
          // below-pass-first. With one cohort it is the same rows in a different
          // order, which is still a different question.
          { label: "Learners", href: "/cohorts/learners" },
        ],
      },
      {
        label: "Resources",
        items: [
          { label: "Library", href: "/library" },
          { label: "Help", href: "/help" },
        ],
      },
    ],
  },
];

/** Pinned to the bottom of the rail, below the divider. */
export const RAIL_FOOTER: { id: string; label: string; icon: LucideIcon; href: string }[] =
  [
    { id: "help", label: "Help", icon: CircleHelp, href: "/help" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

/**
 * The panels this persona may see, with every `badgeKey` resolved against real
 * counts and the Pinned group built from the user's own recent rows.
 *
 * `data` is optional so the command palette — which only needs destinations,
 * never counts — can call this without a round trip.
 */
export function sectionsForPersona(
  persona: Persona,
  data?: NavData,
): NavSection[] {
  const counts = data?.counts ?? {};

  const withBadge = (item: PanelItem): PanelItem => {
    const count = item.badgeKey ? counts[item.badgeKey] : undefined;
    return {
      ...item,
      badge: count && count > 0 ? count : undefined,
      children: item.children?.map(withBadge),
    };
  };

  return SECTIONS.filter((section) => section.personas.includes(persona)).map(
    (section) => {
      const groups = section.groups.map((group) => ({
        ...group,
        items: group.items.map(withBadge),
      }));

      // Pinned is the user's own last case and last report, or nothing.
      if (section.id === "overview" && data?.pinned.length) {
        groups.push({ label: "Pinned", items: data.pinned });
      }

      return { ...section, groups };
    },
  );
}

/** Which section owns a route — used to open the right panel on load. */
export function sectionForPath(path: string, persona: Persona): SectionId {
  const available = sectionsForPersona(persona);
  for (const section of available) {
    for (const group of section.groups) {
      for (const item of group.items) {
        const hrefs = [item.href, ...(item.children ?? []).map((c) => c.href)];
        if (
          hrefs.some(
            (href) =>
              href !== "/" && path.startsWith(href.split("?")[0]),
          )
        ) {
          return section.id;
        }
      }
    }
  }
  return available[0]?.id ?? "overview";
}
