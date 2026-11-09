"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { useApplication } from "@/components/application-provider"
import { ApiError, submitRequest } from "@/lib/api"
import {
  readPendingSubmission,
  savePendingSubmission,
  type PendingSubmission,
} from "@/lib/pending-submission"

type FieldErrors = { discount?: string; reason?: string }

/** Check editable input without changing the reason that will be sent to the API. */
function validateFields(discount: string, reason: string): FieldErrors {
  const errors: FieldErrors = {}
  const value = Number(discount)
  if (!Number.isSafeInteger(value) || value <= 0) {
    errors.discount = "Enter a positive whole number of basis points."
  }
  if (!reason.trim()) {
    errors.reason = "Enter a reason for this request."
  }
  return errors
}

/** Own this form's input, validation and submission lifecycle, including exact retries. */
export function useRequestForm(applicationId: number, userId: number) {
  const { reload, notify } = useApplication()
  const router = useRouter()
  const [discount, setDiscount] = useState("")
  const [reason, setReason] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [failure, setFailure] = useState("")
  const [attempt, setAttempt] = useState<PendingSubmission | null>(null)
  const [restoring, setRestoring] = useState(true)
  const [storageError, setStorageError] = useState("")
  const [saving, setSaving] = useState(false)
  const activeWrite = useRef<AbortController | null>(null)
  const blocked =
    attempt !== null &&
    (attempt.userId !== userId || attempt.body.application_id !== applicationId)
  const submitDisabled = saving || restoring || blocked || Boolean(storageError)

  useEffect(() => {
    /** Restore the exact original input before allowing a retry or a new submission. */
    function restoreAttempt() {
      try {
        const saved = readPendingSubmission()
        setAttempt(saved)
        if (
          saved &&
          saved.userId === userId &&
          saved.body.application_id === applicationId
        ) {
          setDiscount(String(saved.body.discount_bps))
          setReason(saved.body.reason)
        }
      } catch {
        setStorageError(
          "The unconfirmed submission could not be read. Reload to try again."
        )
      }
      setRestoring(false)
    }
    // Browser-only retry details must be read after hydration.
    restoreAttempt()
    return () => activeWrite.current?.abort()
  }, [applicationId, userId])

  /** Release the rejected attempt so its original input can be corrected and resubmitted. */
  function clearRejectedAttempt() {
    try {
      savePendingSubmission(null)
      setAttempt(null)
    } catch {
      setStorageError(
        "The rejected submission's retry details could not be cleared. Reload to try again."
      )
    }
  }

  /** Show a failed submission while retaining retry details unless the service rejected it. */
  function handleFailure(error: unknown) {
    if (
      error instanceof ApiError &&
      error.status >= 400 &&
      error.status < 500
    ) {
      clearRejectedAttempt()
    }
    setFailure(
      error instanceof Error
        ? error.message
        : "The submission could not be completed. Try again."
    )
  }

  /** Submit once; uncertain retries reuse original details (UI-FR-10). */
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (activeWrite.current || submitDisabled) return

    const nextErrors = validateFields(discount, reason)
    setErrors(nextErrors)
    setFailure("")
    if (nextErrors.discount || nextErrors.reason) {
      event.currentTarget
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(
          nextErrors.discount ? "input" : "textarea"
        )
        ?.focus()
      return
    }

    const pending = attempt ?? {
      userId,
      retryKey: crypto.randomUUID(),
      body: {
        application_id: applicationId,
        discount_bps: Number(discount),
        reason,
      },
    }
    const controller = new AbortController()
    activeWrite.current = controller
    setSaving(true)
    try {
      savePendingSubmission(pending)
      setAttempt(pending)
      const saved = await submitRequest(
        pending.body,
        pending.userId,
        pending.retryKey,
        controller.signal
      )
      if (controller.signal.aborted) return
      savePendingSubmission(null)
      setAttempt(null)
      notify(`Request #${saved.id} submitted`)
      await reload()
      if (controller.signal.aborted) return
      router.push(`/applications/${applicationId}/requests/${saved.id}`)
    } catch (error) {
      if (!controller.signal.aborted) handleFailure(error)
    } finally {
      if (!controller.signal.aborted) setSaving(false)
      activeWrite.current = null
    }
  }

  return {
    discount,
    reason,
    errors,
    failure: failure || storageError,
    attempt,
    saving,
    blocked,
    inputsDisabled: saving || restoring || attempt !== null,
    submitDisabled,
    setDiscount,
    setReason,
    submitForm,
  }
}
