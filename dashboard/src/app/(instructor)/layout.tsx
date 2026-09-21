import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { getCurrentUser } from "@/lib/session";
import { personaFor } from "@/lib/roles";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") {
    redirect("/");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
