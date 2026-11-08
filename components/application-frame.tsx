"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { useDemo } from "@/components/demo-provider"
import { Button } from "@/components/ui/button"
import { isDemoApplication } from "@/lib/demo-data"

/** Keep application identity, navigation and feedback above each focused page. */
export function ApplicationFrame({
  applicationId,
  children,
}: {
  applicationId: number
  children: ReactNode
}) {
  const { user, notice, refresh, clearNotice } = useDemo()
  const pathname = usePathname()
  const exists = isDemoApplication(applicationId)

  return (
    <>
      <div className="app-context">
        <div>
          <p className="eyebrow">MORTGAGE APPLICATION</p>
          <h1>Application {applicationId}</h1>
          <p className="muted small">
            User {user.id} · {user.role}
          </p>
        </div>
        <div className="context-actions">
          <Link className="button" href="/applications" onClick={clearNotice}>
            Change application
          </Link>
          <Button onClick={() => refresh(pathname)} disabled={!exists}>
            Refresh
          </Button>
          {user.role === "Relationship manager" && exists && (
            <Link
              className="button primary"
              href={`/applications/${applicationId}/requests/new`}
              onClick={clearNotice}
            >
              + New request
            </Link>
          )}
        </div>
      </div>
      {notice?.path === pathname && exists && (
        <div className="notice success" role="status">
          <strong>{notice.title}</strong>
          <p>{notice.message}</p>
        </div>
      )}
      {exists ? (
        children
      ) : (
        <section className="card empty" role="alert">
          <h2>Application not found</h2>
          <p>
            We couldn’t find application {applicationId}. Check the ID and try
            again.
          </p>
          <Link className="button primary" href="/applications">
            Change application
          </Link>
        </section>
      )}
    </>
  )
}
