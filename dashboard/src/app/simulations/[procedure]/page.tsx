import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CircleHelp,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Play,
  Scissors,
  Settings,
  Stethoscope,
  User,
} from "lucide-react";
import { LaunchShell } from "@/components/shell";
import { getProcedure } from "@/lib/data/catalogue";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ procedure: string }>;
}): Promise<Metadata> {
  const { procedure } = await params;
  const detail = await getProcedure(procedure);
  return { title: detail?.name ?? "Procedure" };
}

/**
 * The procedure launcher — the second shell, and the doorway a kiosk machine
 * sits on. It started as literals at `/launch`; it is fed from the
 * catalogue row now, and `/launch` redirects here.
 *
 * An unpublished procedure still resolves: it is in the catalogue, so the
 * launcher renders with its primary action disabled and the reason stated,
 * rather than 404ing on a thing that visibly exists elsewhere in the product.
 */
export default async function ProcedureLauncherPage({
  params,
}: {
  params: Promise<{ procedure: string }>;
}) {
  const { procedure } = await params;
  const [detail] = await Promise.all([getProcedure(procedure), getCurrentUser()]);

  if (!detail) notFound();

  const published = detail.status === "published";

  return (
    <LaunchShell
      title={detail.name}
      subtitle={detail.tagline ?? "Plan. Simulate. Perform. Perfect."}
      actions={[
        {
          label: "Start procedure",
          href: "/setup",
          icon: Play,
          primary: true,
          disabled: !published,
          disabledReason: "This procedure is not published yet.",
        },
        { label: "Surgical planning", href: "/cases", icon: Stethoscope },
        { label: "Instruments", href: "/library", icon: Scissors },
        { label: "Training mode", href: "/setup?mode=training", icon: GraduationCap },
      ]}
      utilities={[
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
        { label: "Patient info", href: "/cases", icon: User },
        { label: "Case library", href: "/cases", icon: FolderOpen },
        { label: "Settings", href: "/settings", icon: Settings },
        { label: "Help", href: "/help", icon: CircleHelp },
      ]}
    />
  );
}
