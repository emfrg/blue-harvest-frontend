"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

import { useSignedInUser } from "@/components/session-provider"
import { Button } from "@/components/ui/button"
import { getApplications } from "@/lib/api"

/** Load the signed-in user's application choices and open a selected overview. */
export function ApplicationEntry() {
  const user = useSignedInUser()
  const [applicationIds, setApplicationIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const activeRead = useRef<AbortController | null>(null)

  /** Load current IDs, keeping failed reads distinct from a successful empty list. */
  const loadApplications = useCallback(
    async function loadApplications() {
      activeRead.current?.abort()
      const controller = new AbortController()
      activeRead.current = controller
      setLoading(true)
      setError("")
      try {
        const ids = await getApplications(user.id, controller.signal)
        if (!controller.signal.aborted) setApplicationIds(ids)
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Applications could not be loaded. Try again."
          )
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    },
    [user.id]
  )

  useEffect(() => {
    // Read the external list on entry; cancel it when leaving this user's screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadApplications()
    return () => activeRead.current?.abort()
  }, [loadApplications])

  let content
  if (loading) {
    content = <p role="status">Loading applications…</p>
  } else if (error) {
    content = (
      <div role="alert">
        <p>{error}</p>
        <Button onClick={loadApplications}>Try again</Button>
      </div>
    )
  } else if (applicationIds.length === 0) {
    content = <p role="status">No applications available.</p>
  } else {
    content = (
      <ul className="application-list">
        {applicationIds.map((id) => (
          <li key={id}>
            <Link href={`/applications/${id}`}>Application {id}</Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="entry card">
      <h1>Open an application</h1>
      <section
        className="application-options"
        aria-labelledby="available-applications"
      >
        <h2 id="available-applications">Available applications</h2>
        {content}
      </section>
    </section>
  )
}
