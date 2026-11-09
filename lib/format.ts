import type { UserRole } from "@/lib/api-types"

/** Display a readable label while keeping the API's role value unchanged. */
export function formatRole(role: UserRole) {
  return role === "RELATIONSHIP_MANAGER" ? "Relationship manager" : "Reviewer"
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
