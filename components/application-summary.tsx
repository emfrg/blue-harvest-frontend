import Link from "next/link"

import type { DiscountRequest } from "@/lib/demo-data"

/** Distinguish the applicable approval from the discount being requested. */
export function ApprovalSummary({
  approval,
  applicationId,
}: {
  approval?: DiscountRequest
  applicationId: number
}) {
  return (
    <section className="card approval" aria-label="Current approved discount">
      <div>
        <p className="eyebrow">CURRENTLY APPROVED</p>
        <div className="approval-value">
          <strong>
            {approval ? `${approval.discount_bps} bps` : "No approved discount"}
          </strong>
          {approval && (
            <span>
              {(approval.discount_bps / 100).toFixed(2)} percentage points
            </span>
          )}
        </div>
      </div>
      <div className="approval-side">
        <p>
          {approval
            ? "Discount available for this application"
            : "An approved request will appear here"}
        </p>
        {approval && (
          <Link
            className="button text-button"
            href={`/applications/${applicationId}/requests/${approval.id}`}
          >
            From request #{approval.id} →
          </Link>
        )}
      </div>
    </section>
  )
}

/** Make the next task visible for the selected role and pending state. */
export function NextTask({
  applicationId,
  pending,
  approval,
  reviewer,
}: {
  applicationId: number
  pending?: DiscountRequest
  approval?: DiscountRequest
  reviewer: boolean
}) {
  const heading = pending
    ? reviewer
      ? "A request is ready for your review"
      : "Your application has a request awaiting review"
    : reviewer
      ? "No requests awaiting review"
      : "Need a different discount?"
  const description = pending
    ? `Request #${pending.id} asks for ${pending.discount_bps} bps. ${approval ? "The existing approved discount stays in effect until a new request is approved." : "No discount is approved yet."}`
    : reviewer
      ? "You can inspect previous requests and their decisions below."
      : "Submit a discount and a reason for a reviewer to consider."

  return (
    <section className="next-task">
      <div>
        <p className="eyebrow">{pending ? "NEXT STEP" : "PRICING REQUESTS"}</p>
        <h2>{heading}</h2>
        <p>{description}</p>
      </div>
      {pending ? (
        <Link
          className="button primary"
          href={`/applications/${applicationId}/requests/${pending.id}`}
        >
          {reviewer ? "Review request →" : "View pending request →"}
        </Link>
      ) : (
        !reviewer && (
          <Link
            className="button primary"
            href={`/applications/${applicationId}/requests/new`}
          >
            Create a request
          </Link>
        )
      )}
    </section>
  )
}
