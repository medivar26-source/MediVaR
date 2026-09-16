import type { Metadata } from "next";
import Link from "next/link";
import { Film } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Button, Chip, EmptyState } from "@/components/ui";
import { getLibrary } from "@/lib/data/support";
import { getCurrentUser } from "@/lib/session";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Library" };

/**
 * Everything in this library renders from the tables the product already runs
 * on — the procedure catalogue, the planning steps, the report categories, the
 * scene time bands. None of it is authored prose about the operation.
 *
 * That is the whole design. A reference written separately from the thing it
 * describes is a second copy of the contract, and the two disagree the first
 * time a migration changes one. The tolerance table on this screen is the
 * tolerance table a session is scored against, read from the same rows.
 */
export default async function LibraryPage() {
  const user = await getCurrentUser();
  const library = await getLibrary();

  return (
    <AppShell user={user} searchHint='Try searching "library"'>
      <PageHeader
        title="Library"
        lede="Guides and references, each rendered from the same rows the product enforces — so nothing here can disagree with what a headset is handed."
        actions={
          <Button href="/help" variant="secondary">
            Help
          </Button>
        }
      />

      <SectionHeader title="Guides" />
      <div className={p.cards}>
        {library.guides.map((entry) => (
          <Link key={entry.slug} href={`/library/${entry.slug}`} className={p.card}>
            <p className={p.cardTitle}>{entry.title}</p>
            <p className={p.cardBody}>{entry.summary}</p>
            <div className={p.cardFoot}>
              <Chip tone="muted">Guide</Chip>
              <span>{entry.derivedFrom}</span>
            </div>
          </Link>
        ))}
      </div>

      <SectionHeader title="References" />
      <div className={p.cards}>
        {library.references.map((entry) => (
          <Link key={entry.slug} href={`/library/${entry.slug}`} className={p.card}>
            <p className={p.cardTitle}>{entry.title}</p>
            <p className={p.cardBody}>{entry.summary}</p>
            <div className={p.cardFoot}>
              <Chip tone="muted">Reference</Chip>
              <span>{entry.derivedFrom}</span>
            </div>
          </Link>
        ))}
      </div>

      <SectionHeader title="Scene videos" />
      {library.videos === 0 ? (
        <EmptyState icon={Film} title="No scene videos yet">
          Nothing in this product records a video — the `replays` storage bucket
          exists and is empty, and no scene has been authored in Unity. A
          placeholder thumbnail here would be a lie about the state of the build.
          When a video is authored, it appears in this section without a change
          to this page.
        </EmptyState>
      ) : null}
    </AppShell>
  );
}
