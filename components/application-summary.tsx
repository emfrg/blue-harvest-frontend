import Link from "next/link"

import type { ApprovedDiscount } from "@/lib/api-types"

/** Group the current approved discount with the request that authorised it. */
export function ApprovalSummary({
  approval,
  applicationId,
}: {
  approval: ApprovedDiscount | null
  applicationId: number
}) {
  return (
    <section className="card approval" aria-label="Current approved discount">
      <span className="muted small">Approved discount</span>
      <strong>
        {approval ? `${approval.discount_bps} bps` : "No approved discount"}
      </strong>
      {approval && (
        <Link
          href={`/applications/${applicationId}/requests/${approval.request_id}`}
        >
          Request #{approval.request_id}
        </Link>
      )}
    </section>
  )
}
