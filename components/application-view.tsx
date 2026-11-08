"use client"

import { ApprovalSummary, NextTask } from "@/components/application-summary"
import { useDemo } from "@/components/demo-provider"
import { HistoryTable } from "@/components/history-table"
import { currentApproval } from "@/lib/demo-data"

/** Compose option B's application page from the currently selected sample records. */
export function ApplicationView({ applicationId }: { applicationId: number }) {
  const { requests, user } = useDemo()
  const history = requests.filter(
    (request) => request.application_id === applicationId
  )
  const approval = currentApproval(history)
  const pending = history.find((request) => request.status === "PENDING")
  const reviewer = user.role === "Reviewer"

  return (
    <div className="stack">
      <ApprovalSummary applicationId={applicationId} approval={approval} />
      <NextTask
        applicationId={applicationId}
        pending={pending}
        approval={approval}
        reviewer={reviewer}
      />
      <HistoryTable
        applicationId={applicationId}
        requests={history}
        approvalId={approval?.id}
        reviewer={reviewer}
      />
    </div>
  )
}
