export type RequestStatus = "PENDING" | "APPROVED" | "DECLINED"
export type Decision = Exclude<RequestStatus, "PENDING">

export type DiscountRequest = {
  id: number
  application_id: number
  discount_bps: number
  reason: string
  submitted_by: number
  submitted_at: string
  status: RequestStatus
  reviewer_id: number | null
  decided_at: string | null
}

// Fictional fixtures for this UI-only piece. Reloading restores these records.
export const sampleRequests: DiscountRequest[] = [
  {
    id: 101,
    application_id: 1,
    discount_bps: 25,
    reason:
      "Requesting a discount to match the rate offered by a competing lender.",
    submitted_by: 1,
    submitted_at: "2026-11-06T09:10:00Z",
    status: "APPROVED",
    reviewer_id: 3,
    decided_at: "2026-11-06T10:25:00Z",
  },
  {
    id: 102,
    application_id: 1,
    discount_bps: 30,
    reason:
      "Requesting an additional rate reduction following the customer's revised offer.",
    submitted_by: 2,
    submitted_at: "2026-11-07T11:20:00Z",
    status: "DECLINED",
    reviewer_id: 4,
    decided_at: "2026-11-07T13:15:00Z",
  },
]

/** Identify the two existing applications in the local demonstration. */
export function isDemoApplication(id: number) {
  return id === 1 || id === 2
}

/** Find the latest approval in the sample application's ordered records. */
export function currentApproval(requests: DiscountRequest[]) {
  return requests.findLast((request) => request.status === "APPROVED")
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/** Render identical UTC text on the server and browser, independent of locale data. */
export function formatTimestamp(value: string) {
  const date = new Date(value)
  const day = date.getUTCDate()
  const month = monthNames[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`
}
