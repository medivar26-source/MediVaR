import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { AppShell, Breadcrumbs, PageHeader, SectionHeader } from "@/components/shell";
import {
  Banner,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { listInstitutions, listInstructors } from "@/lib/data/admin";
import { shortDate } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { InstructorForm } from "./InstructorForm";
import p from "../../panels.module.css";

export const metadata: Metadata = { title: "Instructor accounts" };

/**
 * Administrator-only: create instructor logins without the terminal.
 *
 * The hidden nav item is a convenience, not the gate: this page redirects
 * anyone who is not an administrator, and the API refuses them independently.
 */
export default async function InstructorAccountsPage() {
  const user = await getCurrentUser();
  if (personaFor(user.role) !== "admin") redirect("/");

  const [{ staff, error }, { institutions }] = await Promise.all([
    listInstructors(),
    listInstitutions(),
  ]);

  return (
    <AppShell user={user} searchHint="Search pages, cases, cohorts, learners">
      <Breadcrumbs items={[{ label: "Admin" }, { label: "Instructor accounts" }]} />

      <PageHeader
        eyebrow="Administration"
        title="Instructor accounts"
        lede="Create sign-in details for an instructor at any institution. Each instructor, and the learners they create, belong to one institution and are never visible to another. Instructors sign in on the Instructor tab and can change the temporary password in Settings."
      />

      <SectionHeader title="New instructor" />
      <section className={p.panel} aria-label="New instructor">
        <InstructorForm institutions={institutions} />
      </section>

      <SectionHeader title="Existing accounts" />
      {error ? (
        <Banner tone="fail" title="Accounts couldn't be loaded">
          {error}
        </Banner>
      ) : staff.length === 0 ? (
        <EmptyState icon={Users} title="No instructor accounts yet">
          Create the first one above.
        </EmptyState>
      ) : (
        <Table label="Instructor and administrator accounts">
          <THead>
            <Tr>
              <Th>Name</Th>
              <Th>Institution</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
            </Tr>
          </THead>
          <TBody>
            {staff.map((m) => (
              <Tr key={m.id}>
                <Td head>
                  {m.firstName} {m.lastName}
                </Td>
                <Td>{m.institutionName ?? "—"}</Td>
                <Td>{m.email ?? "—"}</Td>
                <Td>
                  <Chip tone="muted">{m.role === "admin" ? "Administrator" : "Instructor"}</Chip>
                </Td>
                <Td>{m.status === "active" ? "Active" : m.status}</Td>
                <Td>{m.createdAt ? shortDate(m.createdAt) : "—"}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}
