import type { Submission } from "@/lib/api-types"

export type PendingSubmission = {
  userId: number
  retryKey: string
  body: Submission
}
const storageKey = "pricing-exceptions:pending-submission:v1"

/** Restore one unresolved attempt so reloads never generate a new key for the same write. */
export function readPendingSubmission(): PendingSubmission | null {
  const saved = sessionStorage.getItem(storageKey)
  if (!saved) return null
  const value = JSON.parse(saved) as PendingSubmission
  if (
    !Number.isSafeInteger(value.userId) ||
    typeof value.retryKey !== "string" ||
    !value.retryKey ||
    !Number.isSafeInteger(value.body?.application_id) ||
    !Number.isSafeInteger(value.body?.discount_bps) ||
    typeof value.body?.reason !== "string"
  )
    throw new Error("The unconfirmed submission could not be read.")
  return value
}

/** Save retry details before sending, or clear them only after a confirmed API outcome. */
export function savePendingSubmission(attempt: PendingSubmission | null) {
  if (attempt) sessionStorage.setItem(storageKey, JSON.stringify(attempt))
  else sessionStorage.removeItem(storageKey)
}
