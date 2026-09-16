import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Not built yet" };

/**
 * Catch-all for an address the product intends to answer but does not yet.
 *
 * The navigation describes the shape the product is heading for, so an item can
 * be clickable before the screen behind it exists. Landing here names what is
 * planned for the address rather than dead-ending on a 404, and it keeps the
 * shell, so nobody is stranded.
 */
const PLANNED: { match: RegExp; what: string }[] = [
  { match: /^telemetry|^replay/, what: "Raw event log and scene replay" },
  { match: /^assessments/, what: "Assessment-mode sessions" },
  { match: /^presets/, what: "Instructor configuration presets" },
  { match: /^admin/, what: "Users, devices and the activity log" },
  { match: /^join/, what: "Following a cohort invite" },
];

export default async function NotBuiltPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const path = slug.join("/");
  const entry = PLANNED.find((g) => g.match.test(path));

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={entry ? "Planned" : "Not found"}
        title={entry?.what ?? "This screen does not exist"}
        lede={`/${path}`}
        actions={
          <Link href="/">
            <Button variant="secondary" icon={ArrowLeft}>
              Back to dashboard
            </Button>
          </Link>
        }
      />

      <EmptyState
        icon={Hammer}
        title={entry ? "Not built yet" : "No such screen"}
        action={
          <Link href="/">
            <Button variant="primary">Back to dashboard</Button>
          </Link>
        }
      >
        {entry
          ? "The address is real and the screen behind it is still being built. Nothing is lost by trying it again later."
          : "Check the address, or use search (⌘K) to find the screen you meant."}
      </EmptyState>
    </AppShell>
  );
}
