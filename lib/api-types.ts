export type UserRole = "RELATIONSHIP_MANAGER" | "REVIEWER"
export type DemoUser = { id: number; role: UserRole }

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

export type Submission = {
  application_id: number
  discount_bps: number
  reason: string
}

export type RequestHistory = {
  application_id: number
  requests: DiscountRequest[]
}
export type ApprovedDiscount = { request_id: number; discount_bps: number }
export type CurrentApproval = {
  application_id: number
  approved_discount: ApprovedDiscount | null
}
