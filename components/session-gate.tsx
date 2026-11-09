"use client"

import { usePathname, useRouter } from "next/navigation"
import { Fragment, useEffect, type ReactNode } from "react"

import { useSession } from "@/components/session-provider"
import { Button } from "@/components/ui/button"

/** Keep local working screens unavailable until the tab has an active session. */
export function SessionGate({ children }: { children: ReactNode }) {
  const { user, ready, error, restore } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  let destination: string | null = null
  if (ready) {
    if (!user && pathname !== "/login") destination = "/login"
    else if (user && pathname === "/login") destination = "/applications"
  }

  useEffect(() => {
    if (destination) router.replace(destination)
  }, [destination, router])

  if (error)
    return (
      <section className="entry card" role="alert">
        <h1>Unable to open the application</h1>
        <p>{error}</p>
        <Button onClick={restore}>Try again</Button>
      </section>
    )

  if (!ready || destination)
    return (
      <p className="muted small" role="status">
        {ready ? "Loading…" : "Loading users…"}
      </p>
    )

  // Removing this subtree on sign-out also discards ordinary unsent form drafts.
  return <Fragment key={user?.id ?? "signed-out"}>{children}</Fragment>
}
