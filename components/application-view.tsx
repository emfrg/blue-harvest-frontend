"use client"

import { ApprovalSummary } from "@/components/application-summary"
import { useApplication } from "@/components/application-provider"
import { useSignedInUser } from "@/components/session-provider"
import { HistoryTable } from "@/components/history-table"

/** Display the service's history and its separately supplied approved discount. */
export function ApplicationView({ applicationId }: { applicationId: number }) {
  const { requests, approval } = useApplication()
  const user = useSignedInUser()
  return (
    <div className="stack">
      <ApprovalSummary applicationId={applicationId} approval={approval} />
      <HistoryTable
        applicationId={applicationId}
        requests={requests}
        approvalId={approval?.request_id}
        reviewer={user.role === "REVIEWER"}
      />
    </div>
  )
}
