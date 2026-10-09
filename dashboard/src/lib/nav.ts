import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Building2,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  Compass,
  FilePlus,
  FileText,
  FolderOpen,
  GraduationCap,
  ShieldCheck,
  UserCog,
  CalendarDays,
} from "lucide-react";
import type { BadgeKey, NavData } from "./data/nav";
import type { Persona } from "./roles";

/**
 * One labeled sidebar. Each SECTION is a heading and lists its destinations
 * beneath it. The section icon and each item's icon are what remain when the
 * sidebar is collapsed. Help and Settings live in the account menu.
 */

export type SectionId =
  | "assigned-activities"
  | "overview"
  | "programs"
  | "content-library"
  | "performance"
  | "admin";

export type PanelItem = {
  label: string;
  href: string;
  /** Shown when the sidebar is collapsed to icons, so every top-level item needs one. */
  icon?: LucideIcon;
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

/**
 * Learner: Assigned Activities, Content Library, Performance.
 * Instructor: Programs, Content Library, Performance.
 * Admin: Admin.
 *
 * The dashboard is not a section. It is its own page at `/`, reached from the logo at the top
 * of the rail, and it differs by persona (see app/page.tsx).
 *
 * The order here is the order of the rail for every persona that sees a section.
 */
const SKILL_ITEMS: PanelItem[] = [
  { label: "Pre-op planning", href: "/performance/planning" },
  { label: "Bone cuts & alignment", href: "/performance/bone-cuts" },
  { label: "Gap assessment", href: "/performance/gaps" },
  { label: "Trialling & stability", href: "/performance/trialling" },
  { label: "Implantation", href: "/performance/implantation" },
  { label: "Patellar management", href: "/performance/patella" },
  { label: "Exposure & closure", href: "/performance/exposure" },
];

export const SECTIONS: NavSection[] = [
  {
    id: "assigned-activities",
    label: "Training",
    href: "/programs",
    icon: ClipboardList,
    personas: ["learner"],
    groups: [
      {
        items: [
          { label: "Your Programs", href: "/programs", icon: GraduationCap },
          { label: "Sessions", href: "/sessions", icon: CalendarDays },
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
            icon: GraduationCap,
            personas: ["instructor", "admin"],
            // Cohorts sit inside programs, so the menu shows them nested.
            children: [
              {
                label: "Cohorts",
                href: "/programs?tab=cohorts",
                personas: ["instructor", "admin"],
              },
            ],
          },
          { label: "Sessions", href: "/sessions", icon: CalendarDays },
        ],
      },
    ],
  },
  {
    id: "content-library",
    label: "Content Library",
    href: "/content?tab=procedures",
    icon: FolderOpen,
    personas: ["learner", "instructor"],
    groups: [
      {
        items: [
          { label: "Procedures", href: "/content?tab=procedures", icon: BookOpen },
          { label: "Case Library", href: "/cases", icon: FileText },
          // Learners can plan the same case more than once; their plans live here.
          { label: "Pre-op plans", href: "/plans", icon: ClipboardCheck, personas: ["learner"] },
          { label: "My Cases", href: "/personal-cases", icon: FilePlus, personas: ["learner"] },
        ],
      },
    ],
  },
  {
    id: "overview",
    label: "Insights",
    href: "/performance",
    icon: Compass,
    personas: ["instructor"],
    groups: [
      {
        items: [
          { label: "Activity", href: "/activity", icon: Activity },
          { label: "Performance", href: "/performance", icon: ChartColumn },
          { label: "Reports", href: "/reports", icon: FileText },
        ],
      },
      {
        label: "By skill",
        items: SKILL_ITEMS,
      },
    ],
  },
  {
    id: "performance",
    label: "Progress",
    href: "/performance",
    icon: BookOpen,
    personas: ["learner"],
    groups: [
      {
        items: [
          { label: "Activity", href: "/activity", icon: Activity },
          { label: "Overview", href: "/performance", icon: ChartColumn },
          { label: "Reports", href: "/reports", icon: FileText },
        ],
      },
      {
        label: "By skill",
        items: SKILL_ITEMS,
      },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    href: "/admin/instructors",
    icon: ShieldCheck,
    personas: ["admin"],
    groups: [
      {
        items: [
          { label: "Instructor accounts", href: "/admin/instructors", icon: UserCog },
          { label: "Institutions", href: "/admin/institutions", icon: Building2 },
        ],
      },
    ],
  },
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
      if ((section.id === "overview" || section.id === "performance") && data?.pinned.length) {
        groups.push({ label: "Pinned", items: data.pinned });
      }

      return { ...section, groups };
    },
  );
}

/**
 * Which section owns a route — used to open the right panel on load. `null` means the route is
 * not part of any section (the dashboard at `/`, Settings, Help), and the panel then offers
 * every section's destinations instead.
 */
export function sectionForPath(path: string, persona: Persona): SectionId | null {
  const cleanPath = path.split("?")[0];
  const on = (...prefixes: string[]) =>
    prefixes.some((prefix) => cleanPath === prefix || cleanPath.startsWith(prefix + "/"));

  if (cleanPath === "/" || on("/settings", "/help")) return null;

  if (persona === "learner") {
    if (on("/programs", "/sessions", "/simulations", "/setup")) return "assigned-activities";
    // Cases, the plans a learner makes against them, and their own authored cases.
    if (on("/cases", "/plans", "/plan", "/content", "/library", "/personal-cases")) {
      return "content-library";
    }
    return "performance";
  }

  if (on("/activity", "/reports", "/performance")) {
    return "overview";
  }
  if (on("/admin")) return "admin";
  if (on("/programs", "/cohorts", "/learners", "/plans", "/sessions")) {
    return "programs";
  }
  if (on("/cases", "/content", "/simulations")) {
    return "content-library";
  }
  return "overview";
}
