"use client"

import Link from "next/link"

import { useSignedInUser } from "@/components/session-provider"
import { useApplication } from "@/components/application-provider"
import { RequestBreadcrumb, RequestContext } from "@/components/request-context"
import { RequestDecision } from "@/components/request-decision"
import { RequestStatus } from "@/components/request-status"
import { formatTimestamp } from "@/lib/format"

/** Render the approved request page with all original fields and role-aware decisions. */
export function RequestView({
  applicationId,
  requestId,
}: {
  applicationId: number
  requestId: number
}) {
  const user = useSignedInUser()
  const { requests, approval } = useApplication()
  const request = requests.find(
    (item) => item.id === requestId && item.application_id === applicationId
  )
  if (!request)
    return (
      <section className="card empty" role="alert">
        <h2>Request not found</h2>
        <p>This request is not available for application {applicationId}.</p>
        <Link
          className="button primary"
          href={`/applications/${applicationId}`}
        >
          Back to application
        </Link>
      </section>
    )

  return (
    <>
      <RequestBreadcrumb
        applicationId={applicationId}
        label={`Request #${request.id}`}
      />
      <div className="detail-layout">
        <article className="card pad">
          <header className="detail-heading">
            <div className="row between">
              <p className="eyebrow">
                APPLICATION {applicationId} · REQUEST #{request.id}
              </p>
              <RequestStatus status={request.status} />
            </div>
            <h2>
              {user.role === "REVIEWER" && request.status === "PENDING"
                ? "Review discount request"
                : "Discount request"}
            </h2>
            <p className="muted small">
              Submitted by User {request.submitted_by} ·{" "}
              {formatTimestamp(request.submitted_at)}
            </p>
          </header>
          <section className="field-group">
            <h3>Requested discount</h3>
            <div className="request-value">
              {request.discount_bps} <span>basis points</span>
            </div>
            <p className="muted small">
              {(request.discount_bps / 100).toFixed(2)} percentage points off
              the standard interest rate
            </p>
          </section>
          <section className="field-group">
            <h3>Reason for this request</h3>
            <p className="reason">{request.reason}</p>
          </section>
          <dl className="facts">
            <div>
              <dt>Request ID</dt>
              <dd>#{request.id}</dd>
            </div>
            <div>
              <dt>Application ID</dt>
              <dd>{applicationId}</dd>
            </div>
            <div>
              <dt>Reviewer</dt>
              <dd>
                {request.reviewer_id === null
                  ? "Not yet decided"
                  : `User ${request.reviewer_id}`}
              </dd>
            </div>
            <div>
              <dt>Decision time</dt>
              <dd>
                {request.decided_at
                  ? formatTimestamp(request.decided_at)
                  : "Not yet decided"}
              </dd>
            </div>
          </dl>
          <RequestDecision
            key={request.id}
            request={request}
            approvalId={approval?.request_id}
          />
        </article>
        <RequestContext approval={approval} request={request} />
      </div>
    </>
  )
}
