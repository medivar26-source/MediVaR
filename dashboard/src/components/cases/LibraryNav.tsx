import Link from "next/link";
import { cx } from "@/lib/cx";
import s from "./LibraryNav.module.css";

/** A row of pill links; the one whose id is `current` is highlighted. */
export function PillNav<T extends string>({
  label,
  items,
  current,
}: {
  label: string;
  items: { id: T; label: string; href: string }[];
  current: T | null;
}) {
  return (
    <nav className={s.tabs} aria-label={label}>
      {items.map((item) => (
        <Link
          prefetch={false}
          key={item.id}
          href={item.href}
          className={cx(s.tab, current === item.id && s.tabOn)}
          aria-current={current === item.id ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * A learner's Content Library has two parts: the procedures (each one holds its cases and the learner's
 * pre-op plans for them) and My Cases, their own private space. The side navigation has one "Content
 * Library" link, so this row is how a learner moves between the two. `current` is null on a page that
 * belongs to the library but is neither part, such as a single case.
 */
export type LibraryPart = "procedures" | "personal";

const PARTS: { id: LibraryPart; label: string; href: string }[] = [
  { id: "procedures", label: "Procedures", href: "/content?tab=procedures" },
  { id: "personal", label: "My Cases", href: "/personal-cases" },
];

export function LibraryNav({ current }: { current: LibraryPart | null }) {
  return <PillNav label="Content Library" items={PARTS} current={current} />;
}
