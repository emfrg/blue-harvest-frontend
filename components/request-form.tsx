"use client"

import Link from "next/link"

import { useApplication } from "@/components/application-provider"
import { useSignedInUser } from "@/components/session-provider"
import { RequestBreadcrumb, RequestContext } from "@/components/request-context"
import { Button } from "@/components/ui/button"
import { useRequestForm } from "@/hooks/use-request-form"

/** Render the request fields and feedback; the form hook owns validation and submission. */
export function RequestForm({ applicationId }: { applicationId: number }) {
  const user = useSignedInUser()
  const { approval } = useApplication()
  const form = useRequestForm(applicationId, user.id)
  let submitLabel = "Submit request"
  if (form.saving) submitLabel = "Submitting…"
  else if (form.attempt) submitLabel = "Retry submission"

  if (user.role !== "RELATIONSHIP_MANAGER")
    return (
      <section className="card empty">
        <h2>Submission unavailable</h2>
        <p>Only relationship managers can submit requests.</p>
        <Link className="button" href={`/applications/${applicationId}`}>
          View requests
        </Link>
      </section>
    )

  return (
    <>
      {form.attempt && !form.saving && (
        <div className="notice warning" role="alert">
          <strong>Submission not confirmed</strong>
          <p>
            {form.blocked
              ? `An earlier submission belongs to User ${form.attempt.userId} for application ${form.attempt.body.application_id}. Sign in as that user to retry it before starting another request.`
              : "The service has not confirmed the outcome. Retry the original submission to check it without creating a duplicate."}
          </p>
          {form.blocked && (
            <Link
              href={`/applications/${form.attempt.body.application_id}/requests/new`}
            >
              Open application {form.attempt.body.application_id}
            </Link>
          )}
        </div>
      )}
      {form.failure && (
        <div className="notice error" role="alert">
          <strong>{form.failure}</strong>
        </div>
      )}
      <RequestBreadcrumb applicationId={applicationId} label="New request" />
      <div className="detail-layout">
        <section className="card pad">
          <header className="form-heading">
            <h2>New request</h2>
          </header>
          <form onSubmit={form.submitForm} noValidate>
            <div className="form-field">
              <label htmlFor="discount">Requested discount</label>
              <div className="discount-input">
                <input
                  id="discount"
                  name="discount"
                  inputMode="numeric"
                  value={form.discount}
                  disabled={form.inputsDisabled}
                  onChange={(event) => form.setDiscount(event.target.value)}
                  aria-invalid={Boolean(form.errors.discount)}
                  aria-describedby={`discount-hint${form.errors.discount ? " discount-error" : ""}`}
                />
                <span>basis points</span>
              </div>
              <small id="discount-hint">
                For example, 25 basis points means 0.25 percentage points.
              </small>
              {form.errors.discount && (
                <small className="field-error" id="discount-error" role="alert">
                  {form.errors.discount}
                </small>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="reason">Reason for the request</label>
              <textarea
                id="reason"
                name="reason"
                value={form.reason}
                disabled={form.inputsDisabled}
                onChange={(event) => form.setReason(event.target.value)}
                aria-invalid={Boolean(form.errors.reason)}
                aria-describedby={
                  form.errors.reason ? "reason-error" : undefined
                }
              />
              {form.errors.reason && (
                <small className="field-error" id="reason-error" role="alert">
                  {form.errors.reason}
                </small>
              )}
            </div>
            <footer className="form-footer">
              <Button
                variant="primary"
                type="submit"
                disabled={form.submitDisabled}
              >
                {submitLabel}
              </Button>
              <Link className="button" href={`/applications/${applicationId}`}>
                Back to application
              </Link>
              <p>Submitted details cannot be edited.</p>
            </footer>
          </form>
        </section>
        <RequestContext approval={approval} />
      </div>
    </>
  )
}
