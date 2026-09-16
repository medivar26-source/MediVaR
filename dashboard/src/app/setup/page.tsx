import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/shell";
import { getSetupDefaults } from "@/lib/data/setup";
import { getCurrentUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/roles";
import { SetupForm } from "./SetupForm";
import s from "./setup.module.css";

export const metadata: Metadata = { title: "Session setup" };

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const user = await getCurrentUser();
  const defaults = await getSetupDefaults(user);

  return (
    <AppShell user={user}>
      <div className={s.page}>
        <PageHeader
          eyebrow="Step 1 of 2"
          title="Session setup"
          lede={`Defaulted from your account — ${ROLE_LABEL[user.role]}, ${user.defaultDifficulty} difficulty. Most people change nothing and press Continue.`}
        />

        <SetupForm
          defaults={defaults}
          initialMode={mode === "assessment" ? "assessment" : undefined}
        />

        {/* The rail already states that the headset reads these back, so this
            note carries only what the rail cannot: why the axes exist. */}
        <p className={s.note}>
          Every scene behaves differently under all six axes — mode, difficulty,
          implant design, fixation, patella and user role. Nothing is saved on
          this screen; the plan is written when you submit planning step 1.
        </p>
      </div>
    </AppShell>
  );
}
