import { redirect } from "next/navigation";

/** The administrator area currently has one screen: instructor accounts. */
export default function AdminIndex() {
  redirect("/admin/instructors");
}
