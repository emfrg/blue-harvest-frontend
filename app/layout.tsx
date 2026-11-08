import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AppHeader } from "@/components/app-header"
import { DemoProvider } from "@/components/demo-provider"

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
        <DemoProvider>
          <AppHeader />
          <main className="app-main">
            {children}
            <footer className="app-footer">
              <span>
                Fictional preview data · Actions only change this mockup
              </span>
            </footer>
          </main>
        </DemoProvider>
      </body>
    </html>
  )
}
