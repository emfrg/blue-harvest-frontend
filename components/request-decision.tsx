"use client"

import { useEffect, useRef, useState } from "react"

import { useSignedInUser } from "@/components/session-provider"
import { useApplication } from "@/components/application-provider"
import { ApiError, decideRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { formatTimestamp } from "@/lib/format"
import type { Decision, DiscountRequest } from "@/lib/api-types"

/** Show the allowed reviewer actions or the request's service-confirmed outcome. */
export function RequestDecision({
  request,
  approvalId,
}: {
  request: DiscountRequest
  approvalId?: number
}) {
  const user = useSignedInUser()
  const { loading, reload, notify } = useApplication()
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState("")
  const activeWrite = useRef<AbortController | null>(null)
  useEffect(() => () => activeWrite.current?.abort(), [])

  /** Wait for the API decision, then reload; reconcile service state after any failed response. */
  async function saveDecision(outcome: Decision) {
    if (activeWrite.current) return
    const controller = new AbortController()
    activeWrite.current = controller
    setSaving(true)
    setFailure("")
    try {
      const saved = await decideRequest(
        request.id,
        outcome,
        user.id,
        controller.signal
      )
      if (controller.signal.aborted) return
      notify(`Request #${saved.id} ${saved.status.toLowerCase()}`)
      await reload()
    } catch (error) {
      if (controller.signal.aborted) return
      // Read the saved outcome before offering another decision. (UI-FR-11)
      const refreshed = await reload()
      if (controller.signal.aborted) return
      if (error instanceof ApiError && error.status === 0 && refreshed) {
        setFailure(
          "The decision response was not received. The latest saved status is shown."
        )
      } else if (error instanceof ApiError) {
        setFailure(error.message)
      } else {
        setFailure(
          "The decision could not be confirmed. Refresh to check its status."
        )
      }
    } finally {
      if (!controller.signal.aborted) setSaving(false)
      activeWrite.current = null
    }
  }
  const feedback = failure && (
    <div className="notice error" role="alert">
      {failure}
    </div>
  )
  if (request.status === "PENDING")
    return (
      <section className="decision-area">
        {feedback}
        {user.role === "REVIEWER" ? (
          <>
            <h3>Your decision</h3>
            <p>This decision is final.</p>
            {saving && <p role="status">Saving decision…</p>}
            <div className="row">
              <Button
                variant="primary"
                disabled={saving || loading}
                onClick={() => saveDecision("APPROVED")}
              >
                {`Approve ${request.discount_bps} bps`}
              </Button>
              <Button
                variant="danger"
                disabled={saving || loading}
                onClick={() => saveDecision("DECLINED")}
              >
                Decline request
              </Button>
            </div>
          </>
        ) : (
          <h3>Waiting for a reviewer</h3>
        )}
      </section>
    )
  let description = "A later approval now supplies the current discount."
  if (request.status === "DECLINED") {
    description = "This request did not change the approved discount."
  } else if (approvalId === request.id) {
    description = "This is the current approved discount."
  }
  return (
    <section className="decision-area">
      {feedback}
      <h3>
        {request.status === "APPROVED" ? "Approved" : "Declined"} by User{" "}
        {request.reviewer_id}
      </h3>
      <p>
        {request.decided_at && formatTimestamp(request.decided_at)}.{" "}
        {description}
      </p>
    </section>
  )
}
