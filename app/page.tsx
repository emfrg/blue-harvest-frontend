import { redirect } from "next/navigation"

/** Start at application lookup, with unsigned-in visits handled by the session guard. */
export default function Page() {
  redirect("/applications")
}
