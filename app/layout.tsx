import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AppHeader } from "@/components/app-header"
import { SessionProvider } from "@/components/session-provider"
import { SessionGate } from "@/components/session-gate"

import "./globals.css"

export const metadata: Metadata = {
  title: "Mortgage pricing exceptions",
  description: "A local interface for mortgage pricing exception requests.",
}

/** Provide the document structure and shared styles for every page. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AppHeader />
          <main className="app-main">
            <SessionGate>{children}</SessionGate>
          </main>
        </SessionProvider>
      </body>
    </html>
  )
}
