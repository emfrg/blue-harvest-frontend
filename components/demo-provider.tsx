"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { demoUsers } from "@/lib/demo-users"
import {
  isDemoApplication,
  sampleRequests,
  type Decision,
  type DiscountRequest,
} from "@/lib/demo-data"

type Submission = { applicationId: number; discount: number; reason: string }
type SubmissionResult = { id: number } | { error: string; pendingId?: number }
type Notice = { path: string; title: string; message: string }
type DemoContextValue = {
  user: (typeof demoUsers)[number]
  requests: DiscountRequest[]
  notice: Notice | null
  selectUser: (id: number) => void
  submit: (submission: Submission) => SubmissionResult
  decide: (requestId: number, outcome: Decision) => void
  refresh: (path: string) => void
  clearNotice: () => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

/** Keep sample identities and records alive across Next.js page navigation. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(1)
  const [requests, setRequests] = useState(sampleRequests)
  const [notice, setNotice] = useState<Notice | null>(null)
  const user = demoUsers.find((item) => item.id === userId)!

  /** Change the visible demonstration identity without changing shared records. */
  function selectUser(id: number) {
    if (demoUsers.some((item) => item.id === id)) setUserId(id)
    setNotice(null)
  }

  /** Add a fictional pending request for the form's local demonstration. */
  function submit({
    applicationId,
    discount,
    reason,
  }: Submission): SubmissionResult {
    if (
      user.role !== "Relationship manager" ||
      !isDemoApplication(applicationId)
    ) {
      return {
        error: "This user cannot submit a request for this application.",
      }
    }
    const pending = requests.find(
      (request) =>
        request.application_id === applicationId && request.status === "PENDING"
    )
    if (pending)
      return {
        error: `Request #${pending.id} must be decided before another request can be saved. Your entered details are still below.`,
        pendingId: pending.id,
      }
    const id = Math.max(...requests.map((request) => request.id)) + 1
    setRequests((previous) => [
      ...previous,
      {
        id,
        application_id: applicationId,
        discount_bps: discount,
        reason,
        submitted_by: userId,
        submitted_at: "2026-11-08T09:30:00Z",
        status: "PENDING",
        reviewer_id: null,
        decided_at: null,
      },
    ])
    setNotice({
      path: `/applications/${applicationId}/requests/${id}`,
      title: `Request #${id} submitted`,
      message:
        "It is now waiting for a reviewer. The current approved discount is unchanged.",
    })
    return { id }
  }

  /** Update only a pending sample request using the selected reviewer. */
  function decide(requestId: number, outcome: Decision) {
    const request = requests.find((item) => item.id === requestId)
    if (user.role !== "Reviewer" || request?.status !== "PENDING") return
    setRequests((previous) =>
      previous.map((item) =>
        item.id === requestId && item.status === "PENDING"
          ? {
              ...item,
              status: outcome,
              reviewer_id: userId,
              decided_at: "2026-11-08T10:05:00Z",
            }
          : item
      )
    )
    setNotice({
      path: `/applications/${request.application_id}/requests/${requestId}`,
      title: `Request #${requestId} ${outcome.toLowerCase()}`,
      message:
        outcome === "APPROVED"
          ? `The current approved discount is now ${request.discount_bps} bps.`
          : "The current approved discount is unchanged.",
    })
  }

  /** Confirm that the displayed local sample records are already current. */
  function refresh(path: string) {
    setNotice({
      path,
      title: "Records refreshed",
      message:
        "The request history and current approval are up to date in this example.",
    })
  }

  /** Clear action feedback when navigating to another task. */
  function clearNotice() {
    setNotice(null)
  }

  return (
    <DemoContext.Provider
      value={{
        user,
        requests,
        notice,
        selectUser,
        submit,
        decide,
        refresh,
        clearNotice,
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

/** Read the shared sample state from within the application shell. */
export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error("useDemo must be used inside DemoProvider")
  return context
}
