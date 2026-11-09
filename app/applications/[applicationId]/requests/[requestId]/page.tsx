import { RequestView } from "@/components/request-view"

/** Show one saved request within its own application. */
export default async function RequestPage({
  params,
}: {
  params: Promise<{ applicationId: string; requestId: string }>
}) {
  const { applicationId, requestId } = await params
  return (
    <RequestView
      applicationId={Number(applicationId)}
      requestId={Number(requestId)}
    />
  )
}
