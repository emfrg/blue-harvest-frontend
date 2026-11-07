"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

/** Show the starter page and a small interaction for manual verification. */
export default function Page() {
  const [checked, setChecked] = useState(false)

  /** Confirm that the browser has connected the button to React. */
  function checkInteraction() {
    setChecked(true)
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-5 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Frontend starter</h1>
        <p className="text-muted-foreground">
          A separate workspace for the mortgage pricing exception interface.
        </p>
      </div>
      <Button className="w-fit" onClick={checkInteraction}>
        Check interaction
      </Button>
      <p role="status" className="min-h-6 text-sm">
        {checked
          ? "The button works."
          : "Select the button to try the starter."}
      </p>
    </main>
  )
}
