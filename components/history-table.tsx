import Link from "next/link"

import { RequestStatus } from "@/components/request-status"
import { formatTimestamp } from "@/lib/format"
import type { DiscountRequest } from "@/lib/api-types"

type Props = {
  applicationId: number
  requests: DiscountRequest[]
  approvalId?: number
  reviewer: boolean
}

/** List every saved request with its status and an explicit View or Review link. */
export function HistoryTable({
  applicationId,
  requests,
  approvalId,
  reviewer,
}: Props) {
  if (!requests.length)
    return (
      <section className="card empty">
        <h2>No requests yet</h2>
        <p>No requests have been submitted for this application.</p>
      </section>
    )

  return (
    <section className="card" aria-labelledby="history-heading">
      <header className="card-header">
        <div>
          <h2 id="history-heading">Request history</h2>
          <p className="muted small">
            {requests.length} {requests.length === 1 ? "request" : "requests"} ·
            Newest first
          </p>
        </div>
      </header>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">
            All requests for application {applicationId}
          </caption>
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col">Discount</th>
              <th scope="col">Status</th>
              <th scope="col" className="secondary-column">
                Submitted
              </th>
              <th scope="col">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...requests]
              .sort((left, right) => right.id - left.id)
              .map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>#{request.id}</strong>
                    <small>User {request.submitted_by}</small>
                  </td>
                  <td>{request.discount_bps} bps</td>
                  <td>
                    <RequestStatus status={request.status} />
                    {approvalId === request.id && (
                      <span className="current-note">Current discount</span>
                    )}
                  </td>
                  <td className="secondary-column">
                    {formatTimestamp(request.submitted_at)}
                  </td>
                  <td>
                    <Link
                      className="button text-button"
                      href={`/applications/${applicationId}/requests/${request.id}`}
                      aria-label={`${reviewer && request.status === "PENDING" ? "Review" : "View"} request ${request.id}`}
                    >
                      {reviewer && request.status === "PENDING"
                        ? "Review"
                        : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
