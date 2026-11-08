import { ApplicationView } from "@/components/application-view"

/** Show the selected sample application's approval, next task and history. */
export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = await params
  return <ApplicationView applicationId={Number(applicationId)} />
}
