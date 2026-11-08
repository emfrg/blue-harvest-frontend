import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { ApplicationFrame } from "@/components/application-frame"

/** Keep application context shared across its overview, form and request pages. */
export default async function ApplicationLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ applicationId: string }>
}) {
  const id = Number((await params).applicationId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  return <ApplicationFrame applicationId={id}>{children}</ApplicationFrame>
}
