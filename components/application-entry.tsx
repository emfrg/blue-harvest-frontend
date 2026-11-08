"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"

/** Open a sample application through the approved, labelled entry screen. */
export function ApplicationEntry() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState("")

  /** Validate the entered ID before navigating to its application page. */
  function openApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(value)
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError("Enter a positive whole-number application ID.")
      event.currentTarget.querySelector("input")?.focus()
      return
    }
    router.push(`/applications/${id}`)
  }

  return (
    <section className="entry card">
      <p className="eyebrow">PRICING EXCEPTIONS</p>
      <h1>Open an application</h1>
      <p>
        Enter the mortgage application ID to view its requests or start a new
        one.
      </p>
      <form onSubmit={openApplication} noValidate>
        <div className="form-field">
          <label htmlFor="application-id">Application ID</label>
          <input
            id="application-id"
            inputMode="numeric"
            placeholder="e.g. 1"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`application-help${error ? " application-error" : ""}`}
          />
          <small id="application-help">
            Use the ID from the existing mortgage application.
          </small>
          {error && (
            <small id="application-error" className="field-error" role="alert">
              {error}
            </small>
          )}
        </div>
        <Button type="submit" variant="primary">
          Open application →
        </Button>
      </form>
      <div className="sample-links">
        <span>Local demonstration examples</span>
        <Link className="button text-button" href="/applications/1">
          Application 1
        </Link>
        <Link className="button text-button" href="/applications/2">
          Application 2
        </Link>
      </div>
    </section>
  )
}
