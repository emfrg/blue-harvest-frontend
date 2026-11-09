"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useApplication } from "@/components/application-provider"
import { useSignedInUser } from "@/components/session-provider"
import { Button } from "@/components/ui/button"

/** Keep the application heading and ordinary loading, refresh and error controls together. */
export function ApplicationFrame({
  applicationId,
  children,
}: {
  applicationId: number
  children: ReactNode
}) {
  const user = useSignedInUser()
  const { loading, loaded, error, reload, notify } = useApplication()
  const overview = usePathname() === `/applications/${applicationId}`

  /** Announce refresh only after both service reads have succeeded. */
  async function refresh() {
    if (await reload()) notify("Records refreshed")
  }

  return (
    <>
      <div className="app-context">
        <h1>Application {applicationId}</h1>
        <div className="context-actions">
          <Button onClick={refresh} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
          {user.role === "RELATIONSHIP_MANAGER" &&
            overview &&
            loaded &&
            !error && (
              <Link
                className="button primary"
                href={`/applications/${applicationId}/requests/new`}
              >
                New request
              </Link>
            )}
        </div>
      </div>
      {error ? (
        <section className="card empty" role="alert">
          <h2>
            {error.status === 404
              ? "Application not found"
              : "Could not load application"}
          </h2>
          <p>{error.message}</p>
          <Button onClick={reload} disabled={loading}>
            Try again
          </Button>
        </section>
      ) : !loaded ? (
        <p className="muted small" role="status">
          Loading application…
        </p>
      ) : (
        children
      )}
    </>
  )
}
