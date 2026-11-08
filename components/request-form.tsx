"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, type FormEvent } from "react"

import { useDemo } from "@/components/demo-provider"
import { RequestBreadcrumb, RequestContext } from "@/components/request-context"
import { Button } from "@/components/ui/button"
import { currentApproval } from "@/lib/demo-data"

/** Present option B's form and open the resulting fictional pending request. */
export function RequestForm({ applicationId }: { applicationId: number }) {
  const { user, requests, submit } = useDemo()
  const router = useRouter()
  const [discount, setDiscount] = useState("")
  const [reason, setReason] = useState("")
  const [errors, setErrors] = useState<{ discount?: string; reason?: string }>(
    {}
  )
  const [rejection, setRejection] = useState<{
    error: string
    pendingId?: number
  } | null>(null)
  const submitted = useRef(false)
  const approval = currentApproval(
    requests.filter((request) => request.application_id === applicationId)
  )

  /** Keep invalid or rejected inputs intact and navigate only after a local acceptance. */
  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted.current) return
    const value = Number(discount)
    const nextErrors = {
      discount:
        !Number.isSafeInteger(value) || value <= 0
          ? "Enter a positive whole number of basis points."
          : undefined,
      reason: !reason.trim() ? "Enter a reason for this request." : undefined,
    }
    setErrors(nextErrors)
    setRejection(null)
    if (nextErrors.discount || nextErrors.reason) {
      event.currentTarget
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(
          nextErrors.discount ? "input" : "textarea"
        )
        ?.focus()
      return
    }
    const result = submit({ applicationId, discount: value, reason })
    if ("error" in result) {
      setRejection(result)
      return
    }
    submitted.current = true
    router.push(`/applications/${applicationId}/requests/${result.id}`)
  }

  if (user.role !== "Relationship manager")
    return (
      <section className="card empty">
        <h2>Relationship managers submit requests</h2>
        <p>
          As a reviewer, you can inspect requests and decide those awaiting
          review.
        </p>
        <Link
          className="button primary"
          href={`/applications/${applicationId}`}
        >
          View requests
        </Link>
      </section>
    )

  return (
    <>
      {rejection && (
        <div className="notice error" role="alert">
          <strong>
            {rejection.pendingId
              ? "There’s already a pending request"
              : "Request not submitted"}
          </strong>
          <p>{rejection.error}</p>
          {rejection.pendingId && (
            <div className="row">
              <Link
                className="button"
                href={`/applications/${applicationId}/requests/${rejection.pendingId}`}
              >
                View pending request →
              </Link>
            </div>
          )}
        </div>
      )}
      <RequestBreadcrumb applicationId={applicationId} label="New request" />
      <div className="detail-layout">
        <section className="card pad">
          <header className="form-heading">
            <h2>Request a discount</h2>
            <p>Give the reviewer the proposed discount and your reason.</p>
          </header>
          <div className="form-context">
            <strong>Application {applicationId}</strong>
            <span>User {user.id} · Relationship manager</span>
          </div>
          <form onSubmit={submitForm} noValidate>
            <div className="form-field">
              <label htmlFor="discount">Requested discount</label>
              <div className="discount-input">
                <input
                  id="discount"
                  name="discount"
                  inputMode="numeric"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  aria-invalid={Boolean(errors.discount)}
                  aria-describedby={`discount-hint${errors.discount ? " discount-error" : ""}`}
                />
                <span>basis points</span>
              </div>
              <small id="discount-hint">
                For example, 25 basis points means 0.25 percentage points.
              </small>
              {errors.discount && (
                <small className="field-error" id="discount-error" role="alert">
                  {errors.discount}
                </small>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="reason">Reason for the request</label>
              <textarea
                id="reason"
                name="reason"
                placeholder="Explain why this discount is needed."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={`reason-hint${errors.reason ? " reason-error" : ""}`}
              />
              <small id="reason-hint">
                This will be shown to the reviewer exactly as entered.
              </small>
              {errors.reason && (
                <small className="field-error" id="reason-error" role="alert">
                  {errors.reason}
                </small>
              )}
            </div>
            <footer className="form-footer">
              <Button variant="primary" type="submit">
                Submit request
              </Button>
              <Link className="button" href={`/applications/${applicationId}`}>
                Back to application
              </Link>
              <p>
                Submitted details cannot be edited. A reviewer must decide the
                request.
              </p>
            </footer>
          </form>
        </section>
        <RequestContext approval={approval} />
      </div>
    </>
  )
}
