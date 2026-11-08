import type { RequestStatus as Status } from "@/lib/demo-data"

/** Display the status in text using the approved colour and badge shape. */
export function RequestStatus({ status }: { status: Status }) {
  return <span className={`badge ${status.toLowerCase()}`}>{status}</span>
}
