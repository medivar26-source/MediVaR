import type { UserRole } from "./types";

/**
 * There are SIX role values and only THREE dashboards, because
 * the four learner roles all answer the same question — they differ in default
 * difficulty and which parts are mandatory, not in what their home screen is
 * for. `Persona` is that collapse, and it exists only in the UI layer; the
 * database still stores the precise role.
 *
 * Navigation hides what a persona cannot reach. That is convenience, not
 * security; the store is the actual boundary. Never
 * treat a hidden nav item as a permission.
 */
export type Persona = "learner" | "instructor" | "admin";

export const LEARNER_ROLES: UserRole[] = [
  "student",
  "intern",
  "resident",
  "surgeon",
];

export function personaFor(role: UserRole): Persona {
  if (role === "admin") return "admin";
  if (role === "instructor") return "instructor";
  return "learner";
}

export const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  intern: "Intern",
  resident: "Resident",
  surgeon: "Surgeon",
  instructor: "Instructor",
  admin: "Administrator",
};

export const PERSONA_LABEL: Record<Persona, string> = {
  learner: "Learner",
  instructor: "Instructor",
  admin: "Administrator",
};

/** The single question each dashboard exists to answer. */
export const PERSONA_QUESTION: Record<Persona, string> = {
  learner: "What do I do next, and where am I weak?",
  instructor: "Who in my cohort needs me?",
  admin: "Is the system healthy?",
};
