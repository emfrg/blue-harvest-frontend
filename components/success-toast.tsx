import { Button } from "@/components/ui/button"

/** Announce a brief success without moving page content or taking keyboard focus. */
export function SuccessToast({
  title,
  onDismiss,
}: {
  title: string
  onDismiss: () => void
}) {
  return (
    <div className="success-toast">
      <div role="status" aria-live="polite" aria-atomic="true">
        <strong>{title}</strong>
      </div>
      <Button
        className="toast-dismiss"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <span aria-hidden="true">×</span>
      </Button>
    </div>
  )
}
