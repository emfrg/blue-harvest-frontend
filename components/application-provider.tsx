"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useSignedInUser } from "@/components/session-provider"
import { SuccessToast } from "@/components/success-toast"
import { ApiError, getApproval, getHistory } from "@/lib/api"
import type { ApprovedDiscount, DiscountRequest } from "@/lib/api-types"

type ApplicationData = {
  requests: DiscountRequest[]
  approval: ApprovedDiscount | null
  loading: boolean
  loaded: boolean
  error: ApiError | null
  reload: () => Promise<boolean>
  notify: (message: string) => void
}
const ApplicationContext = createContext<ApplicationData | null>(null)

/** Load one application's API records and provide refresh and brief success feedback to its screens. */
export function ApplicationProvider({
  applicationId,
  children,
}: {
  applicationId: number
  children: ReactNode
}) {
  const user = useSignedInUser()
  const [requests, setRequests] = useState<DiscountRequest[]>([])
  const [approval, setApproval] = useState<ApprovedDiscount | null>(null)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [notice, setNotice] = useState<{ title: string } | null>(null)
  const activeRead = useRef<AbortController | null>(null)

  /** Reload records while ignoring obsolete responses (UI-FR-08). */
  const reload = useCallback(
    async function reload() {
      activeRead.current?.abort()
      const controller = new AbortController()
      activeRead.current = controller
      setLoading(true)
      try {
        const [history, current] = await Promise.all([
          getHistory(applicationId, user.id, controller.signal),
          getApproval(applicationId, user.id, controller.signal),
        ])
        if (controller.signal.aborted) return false
        setRequests(history.requests)
        setApproval(current.approved_discount)
        setLoaded(true)
        setError(null)
        return true
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(
            failure instanceof ApiError
              ? failure
              : new ApiError(0, "Records could not be loaded. Try again.")
          )
        return false
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    },
    [applicationId, user.id]
  )

  useEffect(() => {
    // Synchronize this screen with an external service on entry and when returning to the tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
    /** Reload other users' changes when returning to this tab (UI-FR-03). */
    function onFocus() {
      void reload()
    }
    window.addEventListener("focus", onFocus)
    return () => {
      activeRead.current?.abort()
      window.removeEventListener("focus", onFocus)
    }
  }, [reload])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  /** Restart the four-second toast for each confirmed success (UI-FR-12). */
  function notify(title: string) {
    setNotice({ title })
  }

  return (
    <ApplicationContext.Provider
      value={{ requests, approval, loading, loaded, error, reload, notify }}
    >
      {children}
      {notice && (
        <SuccessToast title={notice.title} onDismiss={() => setNotice(null)} />
      )}
    </ApplicationContext.Provider>
  )
}

/** Read the API-backed state for the application currently open. */
export function useApplication() {
  const application = useContext(ApplicationContext)
  if (!application) throw new Error("ApplicationProvider is missing.")
  return application
}
