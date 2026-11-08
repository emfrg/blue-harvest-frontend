import { redirect } from "next/navigation"

/** Open the approved default view of sample application 1. */
export default function Page() {
  redirect("/applications/1")
}
