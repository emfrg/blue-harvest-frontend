"use client"

import Link from "next/link"

import { useDemo } from "@/components/demo-provider"
import { RequestBreadcrumb, RequestContext } from "@/components/request-context"
import { RequestStatus } from "@/components/request-status"
import { Button } from "@/components/ui/button"
import {
  currentApproval,
  formatTimestamp,
  type DiscountRequest,
} from "@/lib/demo-data"

/** Show the allowed reviewer actions or the request's saved local outcome. */
function DecisionArea({
  request,
  approvalId,
}: {
  request: DiscountRequest
  approvalId?: number
}) {
  const { user, decide } = useDemo()
  if (request.status === "PENDING")
    return (
      <section className="decision-area">
        {user.role === "Reviewer" ? (
          <>
            <h3>Your decision</h3>
            <p>
              Approval applies to these exact details. The decision is final.
            </p>
            <div className="row">
              <Button
                variant="primary"
                onClick={() => decide(request.id, "APPROVED")}
              >
                {`Approve ${request.discount_bps} bps`}
              </Button>
              <Button
                variant="danger"
                onClick={() => decide(request.id, "DECLINED")}
              >
                Decline request
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3>Waiting for a reviewer</h3>
            <p>
              This request has been submitted. Its discount and reason are saved
              and cannot be edited.
            </p>
          </>
        )}
      </section>
    )
  const description =
    request.status === "DECLINED"
      ? "This request did not change the approved discount."
      : approvalId === request.id
        ? "This is the current approved discount."
        : "A later approval now supplies the current discount."
  return (
    <section className="decision-area">
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

/** Render the approved request page with all original fields and role-aware decisions. */
export function RequestView({
  applicationId,
  requestId,
}: {
  applicationId: number
  requestId: number
}) {
  const { requests, user } = useDemo()
  const history = requests.filter(
    (request) => request.application_id === applicationId
  )
  const request = history.find((item) => item.id === requestId)
  const approval = currentApproval(history)
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
              {user.role === "Reviewer" && request.status === "PENDING"
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
          <DecisionArea request={request} approvalId={approval?.id} />
        </article>
        <RequestContext approval={approval} request={request} />
      </div>
    </>
  )
}
