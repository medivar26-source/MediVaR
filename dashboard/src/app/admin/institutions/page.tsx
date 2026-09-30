import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import {
  Banner,
  Button,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { listInstitutions, listInstructors } from "@/lib/data/admin";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Institutions" };

/**
 * Administrator-only: every institution and the instructors in it.
 *
 * An instructor, and every learner they create, belongs to exactly one
 * institution and is never visible to another, so this page shows accounts,
 * never learner records.
 */
export default async function InstitutionsPage() {
  const user = await getCurrentUser();
  if (personaFor(user.role) !== "admin") redirect("/");

  const [{ institutions, error: instError }, { staff, error: staffError }] =
    await Promise.all([listInstitutions(), listInstructors()]);

  const error = instError ?? staffError;
  const membersOf = (id: string) => staff.filter((m) => m.institutionId === id);

  return (
    <AppShell user={user} searchHint="Search pages">
      <Breadcrumbs items={[{ label: "Admin" }, { label: "Institutions" }]} />

      <PageHeader
        eyebrow="Administration"
        title="Institutions"
        lede="Every institution and the instructors and administrators in it. Learners belong to the institution of the instructor who created them and are visible only within it."
        actions={
          <Button variant="primary" href="/admin/instructors">
            Add an instructor
          </Button>
        }
      />

      {error ? (
        <Banner tone="fail" title="Institutions couldn't be loaded">
          {error}
        </Banner>
      ) : institutions.length === 0 ? (
        <EmptyState icon={Building2} title="No institutions yet">
          Adding the first instructor creates the institution.
        </EmptyState>
      ) : (
        <Table label="Institutions">
          <THead>
            <Tr>
              <Th>Institution</Th>
              <Th numeric>Instructors</Th>
              <Th numeric>Administrators</Th>
              <Th>People</Th>
            </Tr>
          </THead>
          <TBody>
            {institutions.map((inst) => {
              const members = membersOf(inst.id);
              return (
                <Tr key={inst.id}>
                  <Td head>{inst.name}</Td>
                  <Td numeric>{members.filter((m) => m.role === "instructor").length}</Td>
                  <Td numeric>{members.filter((m) => m.role === "admin").length}</Td>
                  <Td>
                    {members.length === 0
                      ? "—"
                      : members.map((m) => `${m.firstName} ${m.lastName}`).join(", ")}
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}
