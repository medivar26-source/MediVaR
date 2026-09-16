/**
 * `/help` and `/library`.
 *
 * Both read authored text for their *directory*, and both render their
 * *content* from the catalogue the rest of the product already runs on.
 * Nothing here restates a fact about the procedure that some other screen also
 * states — a reference that can disagree with the thing it describes is worse
 * than no reference.
 */

import { CATEGORY_META, PARTS, SCENES } from "@/lib/seed";
import {
  FIELD_STEP,
  HELP_ARTICLES,
  LIBRARY_RESOURCES,
  PLAN_STEP_META,
} from "./support-content";
import { STEP_OPTIONS } from "./planning-content";
import { PASS_MARK, TOLERANCE_BAND } from "@/lib/types";
import type { Difficulty } from "@/lib/types";

/* ─────────────────────────── help ─────────────────────────── */

export type HelpArticle = {
  slug: string;
  topic: string;
  title: string;
  paragraphs: string[];
  route?: string;
};

export type HelpTopic = {
  key: string;
  label: string;
  lede: string;
  articles: HelpArticle[];
};

/**
 * Topic labels are here rather than in the table because they are a property of
 * this screen's layout, not of the content — the table's `topic` is the key
 * that groups rows, and a key with no label simply titles itself.
 */
const TOPIC_META: Record<string, { label: string; lede: string }> = {
  pairing: {
    label: "Pairing a headset",
    lede: "A four-digit PIN, single use, thirty minutes. Most pairing problems are one of five things.",
  },
  session: {
    label: "During and after a session",
    lede: "What happens when a run is interrupted, and where the work goes.",
  },
  report: {
    label: "Reading a report",
    lede: "Why a score is what it is, and what the product withholds on purpose.",
  },
  account: {
    label: "Your account",
    lede: "What you can change yourself, and what an administrator changes for you.",
  },
};

export async function getHelp(query?: string): Promise<HelpTopic[]> {
  const needle = query?.trim().toLowerCase();

  const articles: HelpArticle[] = HELP_ARTICLES
    .filter(
      (row) =>
        !needle ||
        row.title.toLowerCase().includes(needle) ||
        row.body.toLowerCase().includes(needle),
    )
    .map((row) => ({
      slug: row.slug,
      topic: row.topic,
      title: row.title,
      // Prose with blank lines between paragraphs, deliberately not markdown:
      // nothing here needs a renderer, and one would invite formatting into
      // text that is read for its sentences.
      paragraphs: row.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
      route: row.route,
    }));

  const topics: HelpTopic[] = [];
  for (const article of articles) {
    let topic = topics.find((t) => t.key === article.topic);
    if (!topic) {
      const meta = TOPIC_META[article.topic];
      topic = {
        key: article.topic,
        label: meta?.label ?? article.topic,
        lede: meta?.lede ?? "",
        articles: [],
      };
      topics.push(topic);
    }
    topic.articles.push(article);
  }

  // Declared order, not insertion order, so a topic added later lands where
  // `TOPIC_META` says rather than wherever its first article was seen.
  const order = Object.keys(TOPIC_META);
  topics.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  return topics;
}

/* ───────────────────────── library ───────────────────────── */

export type LibraryEntry = {
  slug: string;
  kind: string;
  title: string;
  summary: string;
  derivedFrom: string;
};

export type LibraryIndex = {
  guides: LibraryEntry[];
  references: LibraryEntry[];
  /** Zero, today. The page reads the count; nothing tells it. */
  videos: number;
};

export async function getLibrary(): Promise<LibraryIndex> {
  const rows: LibraryEntry[] = LIBRARY_RESOURCES;

  return {
    guides: rows.filter((r) => r.kind === "guide"),
    references: rows.filter((r) => r.kind === "reference"),
    videos: rows.filter((r) => r.kind === "video").length,
  };
}

/* ──────────────── the five references, rendered ──────────────── */

export type WalkthroughPart = {
  part: string;
  name: string;
  variantNote?: string;
  scenes: {
    scene: string;
    name: string;
    category?: string;
    parTimeS: number;
    maxTimeS: number;
    isCritical: boolean;
    variantNote?: string;
    requiresDesign?: string;
    requiresFixation?: string;
    requiresPatella?: boolean;
  }[];
};

export type PlanningStep = {
  step: number;
  title: string;
  budgetLabel: string;
  parTimeS: number;
  maxTimeS: number;
  /** The differentials this step offers, grouped by the field they answer. */
  fields: { field: string; options: { label: string; detail?: string }[] }[];
};

export type ScoringCategory = {
  key: string;
  label: string;
  max: number;
  scenes: number;
};

export type LibraryDoc =
  | { slug: "tkr-walkthrough"; entry: LibraryEntry; parts: WalkthroughPart[] }
  | { slug: "preoperative-planning"; entry: LibraryEntry; steps: PlanningStep[] }
  | {
      slug: "scoring";
      entry: LibraryEntry;
      categories: ScoringCategory[];
      total: number;
      passMarks: { difficulty: Difficulty; mark: number }[];
    }
  | {
      slug: "tolerances";
      entry: LibraryEntry;
      bands: { difficulty: Difficulty; factor: number }[];
      scenes: { scene: string; name: string; parTimeS: number; maxTimeS: number }[];
    }
  | {
      slug: "implant-variants";
      entry: LibraryEntry;
      design: { CR: string[]; PS: string[] };
      fixation: { cemented: string[]; cementless: string[] };
      patella: string[];
      always: number;
    };

const PROCEDURE = "tkr";

export async function getLibraryDoc(slug: string): Promise<LibraryDoc | null> {
  const entry = LIBRARY_RESOURCES.find((row) => row.slug === slug);
  if (!entry) return null;

  const scenes = SCENES.filter((s) => s.procedureId === PROCEDURE);

  if (slug === "tkr-walkthrough") {
    return {
      slug: "tkr-walkthrough",
      entry,
      parts: PARTS.filter((p) => p.procedureId === PROCEDURE).map((p) => ({
        part: p.part,
        name: p.name,
        variantNote: p.variantNote,
        scenes: scenes
          .filter((s) => s.part === p.part)
          .map((s) => ({
            scene: s.scene,
            name: s.name,
            category: s.categoryKey ?? undefined,
            parTimeS: s.parTimeS,
            maxTimeS: s.maxTimeS,
            isCritical: s.isCritical,
            variantNote: s.variantNote,
            requiresDesign: s.requiresDesign,
            requiresFixation: s.requiresFixation,
            requiresPatella: s.requiresPatella,
          })),
      })),
    };
  }

  if (slug === "preoperative-planning") {
    return {
      slug: "preoperative-planning",
      entry,
      steps: PLAN_STEP_META.map((m) => ({
        ...m,
        fields: Object.entries(STEP_OPTIONS)
          .filter(([field]) => FIELD_STEP[field] === m.step)
          .map(([field, options]) => ({
            field,
            options: options.map((o) => ({ label: o.label, detail: o.detail })),
          })),
      })),
    };
  }

  if (slug === "scoring") {
    const rows = CATEGORY_META.map((c) => ({
      key: c.key,
      label: c.label,
      max: c.max,
      scenes: scenes.filter((s) => s.categoryKey === c.key).length,
    }));

    return {
      slug: "scoring",
      entry,
      categories: rows,
      // Summed, not stated. If a category's maximum ever changed, the page
      // would show the truth rather than the claim.
      total: rows.reduce((sum, c) => sum + c.max, 0),
      passMarks: (Object.keys(PASS_MARK) as Difficulty[]).map((d) => ({
        difficulty: d,
        mark: PASS_MARK[d],
      })),
    };
  }

  if (slug === "tolerances") {
    return {
      slug: "tolerances",
      entry,
      bands: (Object.keys(TOLERANCE_BAND) as Difficulty[]).map((d) => ({
        difficulty: d,
        factor: TOLERANCE_BAND[d],
      })),
      scenes: scenes.map((s) => ({
        scene: s.scene,
        name: s.name,
        parTimeS: s.parTimeS,
        maxTimeS: s.maxTimeS,
      })),
    };
  }

  if (slug === "implant-variants") {
    const label = (s: { scene: string; name: string }) => `${s.scene} ${s.name}`;

    return {
      slug: "implant-variants",
      entry,
      design: {
        CR: scenes.filter((s) => s.requiresDesign === "CR").map(label),
        PS: scenes.filter((s) => s.requiresDesign === "PS").map(label),
      },
      fixation: {
        cemented: scenes.filter((s) => s.requiresFixation === "cemented").map(label),
        cementless: scenes.filter((s) => s.requiresFixation === "cementless").map(label),
      },
      patella: scenes.filter((s) => s.requiresPatella).map(label),
      always: scenes.filter(
        (s) => !s.requiresDesign && !s.requiresFixation && !s.requiresPatella,
      ).length,
    };
  }

  return null;
}
