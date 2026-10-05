import { redirect } from "next/navigation";

/**
 * There is no standalone list of learners. Learners are read against their performance, inside
 * a program: Programs → a program → "Learners & Performance". An individual learner's profile
 * is still at `/learners/[id]`.
 */
export default function LearnersPage() {
  redirect("/programs");
}
