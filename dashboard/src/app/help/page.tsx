import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, SearchX } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Button, EmptyState } from "@/components/ui";
import { getHelp } from "@/lib/data/support";
import { getCurrentUser } from "@/lib/session";
import { HelpSearch } from "./HelpSearch";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Help" };

/**
 * Runbooks, written for the person standing next to the headset.
 *
 * Every article is a row, because a paragraph in JSX that names a
 * timing, an error code or a route drifts the first time a migration changes
 * one — and help text that is wrong about the product is worse than no help
 * text, since somebody acts on it.
 *
 * The search is a URL parameter, so a filtered view is a link somebody can be
 * sent. It is also why the search is a server round trip rather than a client
 * filter: the same reasoning as every other filter in the product.
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const topics = await getHelp(q);

  const found = topics.reduce((sum, t) => sum + t.articles.length, 0);

  return (
    <AppShell user={user} searchHint='Try searching "pairing"'>
      <PageHeader
        title="Help"
        lede="Pairing, sessions, reports and accounts. Every answer here describes what this build actually does."
        actions={
          <Button href="/library" variant="secondary">
            Library
          </Button>
        }
      />

      <HelpSearch query={q} />

      {found === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`Nothing matches “${q}”`}
          action={
            <Button href="/help" variant="primary">
              Show every article
            </Button>
          }
        >
          Search covers every article&rsquo;s title and text. If the thing you
          need is not here, an administrator can see the pairing lifecycle for
          every PIN in the product.
        </EmptyState>
      ) : (
        <>
          {q && (
            <p className={p.panelSub} style={{ marginBottom: "var(--s-5)" }}>
              {found} article{found === 1 ? "" : "s"} match &ldquo;{q}&rdquo;.
            </p>
          )}

          {topics.map((topic) => (
            <section key={topic.key} aria-label={topic.label}>
              <SectionHeader title={topic.label} />
              {topic.lede && !q && (
                <p className={p.panelSub} style={{ marginBottom: "var(--s-4)" }}>
                  {topic.lede}
                </p>
              )}

              <div className={p.panel}>
                {topic.articles.map((article) => (
                  <article
                    key={article.slug}
                    id={article.slug}
                    className={p.article}
                  >
                    <h3 className={p.articleTitle}>{article.title}</h3>
                    <div className={p.prose}>
                      {article.paragraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                    {article.route && (
                      <Link href={article.route} className={p.articleLink}>
                        Go to {article.route}
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}

          <SectionHeader title="Still stuck" />
          <section className={p.panel} aria-label="Still stuck">
            <div className={p.panelHead}>
              <div>
                <p className={p.panelTitle}>Contact your administrator</p>
                <p className={p.panelSub}>
                  Quote the session id from the report header, or the case and
                  the time you tried to pair. An administrator can see the
                  lifecycle of every PIN and every headset that has paired.
                </p>
              </div>
              <LifeBuoy size={28} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className={p.note}>
              There is no in-app messaging and no ticketing. Saying so is better
              than a contact form that posts nowhere.
            </p>
          </section>
        </>
      )}
    </AppShell>
  );
}
