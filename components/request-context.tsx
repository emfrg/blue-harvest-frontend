import Link from "next/link"

import { formatTimestamp, type DiscountRequest } from "@/lib/demo-data"

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

/** Keep current approval and the request's two lifecycle events beside its details. */
export function RequestContext({
  approval,
  request,
}: {
  approval?: DiscountRequest
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
            ? `From request #${approval.id}`
            : "No approved discount for this application."}
        </p>
        {request?.status === "PENDING" && (
          <p>This pending request does not change the approved discount.</p>
        )}
      </section>
      {request ? (
        <section className="card context-card">
          <h3>Request activity</h3>
          <ol className="activity">
            <li>
              <strong>Submitted by User {request.submitted_by}</strong>
              <span>{formatTimestamp(request.submitted_at)}</span>
            </li>
            <li>
              <strong>
                {request.status === "PENDING"
                  ? "Awaiting a decision"
                  : `${request.status === "APPROVED" ? "Approved" : "Declined"} by User ${request.reviewer_id}`}
              </strong>
              <span>
                {request.decided_at
                  ? formatTimestamp(request.decided_at)
                  : "Not yet decided"}
              </span>
            </li>
          </ol>
        </section>
      ) : (
        <section className="context-card">
          <h3>After you submit</h3>
          <p>
            A reviewer will approve or decline the exact discount and reason you
            submit.
          </p>
          <p>The saved request will open so you can check its status.</p>
        </section>
      )}
    </aside>
  )
}
