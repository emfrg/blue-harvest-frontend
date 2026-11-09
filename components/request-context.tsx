import Link from "next/link"

import { formatTimestamp } from "@/lib/format"
import type { DiscountRequest, ApprovedDiscount } from "@/lib/api-types"

/** Give each focused task a breadcrumb back to its own application. */
export function RequestBreadcrumb({
  applicationId,
  label,
}: {
  applicationId: number
  label: string
}) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link
        className="button text-button"
        href={`/applications/${applicationId}`}
      >
        ← Application {applicationId}
      </Link>
      <span aria-hidden="true">/</span>
      <span>{label}</span>
    </nav>
  )
}

/** Show current approval and recorded request activity with the latest event first. */
export function RequestContext({
  approval,
  request,
}: {
  approval: ApprovedDiscount | null
  request?: DiscountRequest
}) {
  return (
    <aside className="stack">
      <section
        className="card context-card"
        aria-label="Current approved discount"
      >
        <h3>Currently approved</h3>
        <strong>{approval ? `${approval.discount_bps} bps` : "None"}</strong>
        <p>
          {approval
            ? `From request #${approval.request_id}`
            : "No approved discount for this application."}
        </p>
      </section>
      {request && (
        <section
          className="card context-card"
          aria-labelledby="request-activity-heading"
        >
          <h3 id="request-activity-heading">Request activity</h3>
          <ol className="activity">
            {request.status !== "PENDING" && request.decided_at && (
              <li className="activity-latest">
                <div className="activity-heading">
                  <strong>
                    {request.status === "APPROVED" ? "Approved" : "Declined"} by
                    User {request.reviewer_id}
                  </strong>
                </div>
                <time dateTime={request.decided_at}>
                  {formatTimestamp(request.decided_at)}
                </time>
              </li>
            )}
            <li
              className={
                request.status === "PENDING" ? "activity-latest" : undefined
              }
            >
              <div className="activity-heading">
                <strong>Submitted by User {request.submitted_by}</strong>
              </div>
              <time dateTime={request.submitted_at}>
                {formatTimestamp(request.submitted_at)}
              </time>
            </li>
          </ol>
          {request.status === "PENDING" && <p>Awaiting a decision</p>}
        </section>
      )}
    </aside>
  )
}
