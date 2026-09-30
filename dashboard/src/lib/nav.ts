import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CircleHelp,
  ClipboardList,
  Compass,
  FolderOpen,
  GraduationCap,
  Settings,
  ShieldCheck,
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

export type SectionId =
  | "overview"
  | "training"
  | "programs"
  | "personal-space"
  | "content-library"
  | "help"
  | "admin";

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
    personas: ["learner", "instructor"],
    groups: [
      {
        items: [
          { label: "Dashboard", href: "/" },
          { label: "Activity", href: "/activity" },
          { label: "Performance", href: "/performance" },
          { label: "Reports", href: "/reports" },
        ],
      },
      {
        label: "By skill",
        items: [
          { label: "Pre-op planning", href: "/performance/planning" },
          { label: "Bone cuts & alignment", href: "/performance/bone-cuts" },
          { label: "Gap assessment", href: "/performance/gaps" },
          { label: "Trialling & stability", href: "/performance/trialling" },
          { label: "Implantation", href: "/performance/implantation" },
          { label: "Patellar management", href: "/performance/patella" },
          { label: "Exposure & closure", href: "/performance/exposure" },
        ],
      },
    ],
  },
  {
    id: "training",
    label: "Training",
    href: "/programs",
    icon: ClipboardList,
    personas: ["learner"],
    groups: [
      {
        items: [
          { label: "Your Programs", href: "/programs" },
          { label: "Cases", href: "/cases" },
          { label: "Pre-op Plans", href: "/plans" },
          { label: "Sessions", href: "/sessions" },
        ],
      },
    ],
  },
  {
    id: "personal-space",
    label: "Personal Space",
    href: "/personal-cases",
    icon: FolderOpen,
    personas: ["learner"],
    groups: [
      {
        items: [
          { label: "My Cases", href: "/personal-cases" },
        ],
      },
    ],
  },
  {
    id: "programs",
    label: "Programs",
    href: "/programs",
    icon: GraduationCap,
    personas: ["instructor"],
    groups: [
      {
        items: [
          {
            label: "All Programs",
            href: "/programs",
            personas: ["instructor", "admin"],
          },
          {
            label: "Cohorts",
            href: "/programs?tab=cohorts",
            personas: ["instructor", "admin"],
          },
          {
            label: "Learners",
            href: "/learners",
            personas: ["instructor", "admin"],
          },
        ],
      },
      {
        label: "Sessions",
        items: [
          {
            label: "Sessions",
            href: "/sessions",
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
    personas: ["instructor"],
    groups: [
      {
        items: [
          {
            label: "Case Library",
            href: "/cases",
            personas: ["instructor", "admin"],
          },
          {
            label: "Procedures",
            href: "/content?tab=procedures",
            personas: ["instructor", "admin"],
          },
          {
            label: "Assessment Criteria",
            href: "/content?tab=criteria",
            personas: ["instructor", "admin"],
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
    id: "help",
    label: "Help & guides",
    href: "/library",
    icon: BookOpen,
    personas: ["learner"],
    groups: [
      {
        items: [
          { label: "Library", href: "/library" },
          { label: "Help", href: "/help" },
        ],
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    href: "/admin/instructors",
    icon: ShieldCheck,
    personas: ["admin"],
    groups: [
      {
        items: [
          { label: "Instructor accounts", href: "/admin/instructors" },
          { label: "Institutions", href: "/admin/institutions" },
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
  const on = (...prefixes: string[]) =>
    prefixes.some((prefix) => cleanPath === prefix || cleanPath.startsWith(prefix + "/"));

  if (cleanPath === "/" || on("/activity", "/reports", "/performance")) {
    return "overview";
  }

  // A learner's whole training path lives in one section.
  if (persona === "learner") {
    if (on("/programs", "/cases", "/plans", "/plan", "/sessions", "/simulations", "/setup")) {
      return "training";
    }
    if (on("/personal-cases")) {
      return "personal-space";
    }
    if (on("/library", "/help")) return "help";
    return "overview";
  }

  if (on("/admin")) return "admin";
  if (on("/programs", "/cohorts", "/learners", "/plans", "/sessions")) {
    return "programs";
  }
  if (on("/cases", "/content", "/library", "/simulations")) {
    return "content-library";
  }
  return "overview";
}
