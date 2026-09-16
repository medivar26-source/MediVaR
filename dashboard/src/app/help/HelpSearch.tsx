"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui";
import p from "../panels.module.css";

/**
 * Search writes to the URL and the server re-runs the query.
 *
 * A client-side filter over an already-fetched list would be less code and one
 * fewer round trip, and it would also make the result unlinkable. `/help?q=pin`
 * is the thing somebody pastes into a message, which is most of what a help
 * screen is for.
 *
 * Submitting is a form, not a keystroke handler: a search that navigates on
 * every character makes the back button unusable.
 */
export function HelpSearch({ query }: { query?: string }) {
  const router = useRouter();

  return (
    <form
      className={p.filters}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        const next = String(value ?? "").trim();
        router.replace(next ? `/help?q=${encodeURIComponent(next)}` : "/help", {
          scroll: false,
        });
      }}
    >
      <Input
        label="Search help"
        name="q"
        type="search"
        defaultValue={query ?? ""}
        placeholder="PIN, report, cohort…"
        className={p.spacer}
      />
      {query && (
        <Link href="/help" replace scroll={false} className={p.clear}>
          Clear
        </Link>
      )}
    </form>
  );
}
