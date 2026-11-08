import { RequestForm } from "@/components/request-form"

/** Show the approved submission form for the application in the route. */
export default async function NewRequestPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = await params
  return (
    <RequestForm key={applicationId} applicationId={Number(applicationId)} />
  )
}
