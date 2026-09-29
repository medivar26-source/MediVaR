import type { LucideIcon } from "lucide-react";
import {
  CircleHelp,
  Compass,
  FileText,
  FolderOpen,
  GraduationCap,
  Settings,
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
 */

export type SectionId = "overview" | "programs" | "content-library" | "reports";

export type PanelItem = {
  label: string;
  href: string;
  /** Resolved against `NavData.counts`. Absent count → no badge. */
  badgeKey?: BadgeKey;
  /** Set only by `sectionsForPersona`, after resolving `badgeKey`. */
  badge?: number;
  children?: PanelItem[];
  /** Restricts an item within a shared section to a subset of its personas. Absent → visible to every persona the section allows. */
  personas?: Persona[];
};

export type PanelGroup = {
  label?: string;
  items: PanelItem[];
};

export type NavGroup = PanelGroup;

export type NavSection = {
  id: SectionId;
  /** Panel heading. */
  label: string;
  /** Primary destination URL when clicking the rail icon. */
  href: string;
  icon: LucideIcon;
  personas: Persona[];
  groups: PanelGroup[];
};

export const SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/",
    icon: Compass,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          { label: "Dashboard", href: "/" },
          { label: "Activity", href: "/activity" },
          { label: "Performance", href: "/performance" },
          { label: "Reports", href: "/reports", personas: ["learner"] },
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
    id: "programs",
    label: "Programs",
    href: "/programs",
    icon: GraduationCap,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          {
            label: "All Programs",
            href: "/programs",
            personas: ["instructor", "admin"],
          },
          {
            label: "Learners",
            href: "/cohorts/learners",
            personas: ["instructor", "admin"],
          },
          {
            label: "Your Programs",
            href: "/programs",
            personas: ["learner"],
          },
        ],
      },
      {
        label: "Sessions",
        items: [
          {
            label: "Sessions",
            href: "/sessions",
            personas: ["learner"],
          },
        ],
      },
      {
        label: "Planning",
        items: [
          {
            label: "My Plans",
            href: "/plans",
            personas: ["learner"],
          },
        ],
      },
    ],
  },
  {
    id: "content-library",
    label: "Content Library",
    href: "/cases",
    icon: FolderOpen,
    personas: ["learner", "instructor", "admin"],
    groups: [
      {
        items: [
          {
            label: "Case Library",
            href: "/cases",
            personas: ["instructor", "admin"],
          },
          {
            label: "Simulations",
            href: "/simulations",
            personas: ["learner"],
          },
          {
            label: "Practice Cases",
            href: "/cases",
            personas: ["learner"],
          },
          {
            label: "Library",
            href: "/library",
          },
        ],
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    icon: FileText,
    personas: ["instructor", "admin"],
    groups: [
      {
        items: [
          {
            label: "Global Reports",
            href: "/reports",
          },
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
 */
export function sectionsForPersona(
  persona: Persona,
  data?: NavData,
): NavSection[] {
  const counts = data?.counts ?? {};

  const visibleTo = (item: PanelItem) =>
    !item.personas || item.personas.includes(persona);

  const withBadge = (item: PanelItem): PanelItem => {
    const count = item.badgeKey ? counts[item.badgeKey] : undefined;
    return {
      ...item,
      badge: count && count > 0 ? count : undefined,
      children: item.children?.filter(visibleTo).map(withBadge),
    };
  };

  return SECTIONS.filter((section) => section.personas.includes(persona)).map(
    (section) => {
      const groups = section.groups
        .map((group) => ({
          ...group,
          items: group.items.filter(visibleTo).map(withBadge),
        }))
        .filter((group) => group.items.length > 0);

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
  const cleanPath = path.split("?")[0];
  if (
    cleanPath === "/" ||
    cleanPath.startsWith("/activity") ||
    cleanPath.startsWith("/performance")
  ) {
    return "overview";
  }
  if (cleanPath.startsWith("/programs") || cleanPath.startsWith("/cohorts")) {
    return "programs";
  }
  if (
    cleanPath.startsWith("/cases") ||
    cleanPath.startsWith("/library") ||
    cleanPath.startsWith("/simulations")
  ) {
    return "content-library";
  }
  if (cleanPath.startsWith("/reports")) {
    if (persona === "instructor" || persona === "admin") {
      return "reports";
    }
    return "overview";
  }
  if (cleanPath.startsWith("/plans") || cleanPath.startsWith("/sessions")) {
    return "programs";
  }
  return "overview";
}
