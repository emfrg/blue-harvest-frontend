import { ApplicationView } from "@/components/application-view"

/** Show the selected application’s saved approval and history. */
export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = await params
  return <ApplicationView applicationId={Number(applicationId)} />
}
