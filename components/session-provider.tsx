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
import { ApiError, getUsers } from "@/lib/api"
import type { DemoUser } from "@/lib/api-types"

const storageKey = "pricing-exceptions:session:v1"
type Session = {
  users: DemoUser[]
  user: DemoUser | null
  ready: boolean
  error: string
  restore: () => Promise<void>
  signIn: (id: number) => string | null
  signOut: () => string | null
}
const SessionContext = createContext<Session | null>(null)

/** Load available users and restore only the selected ID, taking its role from the API. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<DemoUser[]>([])
  const [user, setUser] = useState<DemoUser | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const activeRead = useRef<AbortController | null>(null)

  /** Restore identity using the current backend role (UI-FR-01). */
  const restore = useCallback(async function restore() {
    activeRead.current?.abort()
    const controller = new AbortController()
    activeRead.current = controller
    setReady(false)
    setError("")
    try {
      const id = Number(sessionStorage.getItem(storageKey))
      const availableUsers = await getUsers(controller.signal)
      if (controller.signal.aborted) return
      const selected = availableUsers.find((user) => user.id === id) ?? null
      if (id && !selected) sessionStorage.removeItem(storageKey)
      setUsers(availableUsers)
      setUser(selected)
      setReady(true)
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(
          failure instanceof ApiError
            ? failure.message
            : "Your selected user could not be restored. Try again."
        )
      }
    }
  }, [])

  useEffect(() => {
    // Browser storage cannot be read during SSR; the initial renders must match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restore()
    return () => activeRead.current?.abort()
  }, [restore])

  /** Start a local session for a user returned by the API; the service still checks permissions. */
  function signIn(id: number) {
    const selected = users.find((user) => user.id === id)
    if (!selected) return "Select an available user."
    try {
      sessionStorage.setItem(storageKey, String(id))
      setUser(selected)
      return null
    } catch {
      return "Sign-in could not be saved. Try again."
    }
  }

  /** End this identity without discarding an unresolved submission's retry details. */
  function signOut() {
    try {
      sessionStorage.removeItem(storageKey)
      setUser(null)
      void restore()
      return null
    } catch {
      return "Could not sign out. Try again."
    }
  }

  return (
    <SessionContext.Provider
      value={{ users, user, ready, error, restore, signIn, signOut }}
    >
      {children}
    </SessionContext.Provider>
  )
}

/** Read the selected identity within the application shell. */
export function useSession() {
  const session = useContext(SessionContext)
  if (!session) throw new Error("SessionProvider is missing.")
  return session
}

/** Require the user already checked by the session gate. */
export function useSignedInUser() {
  const { user } = useSession()
  if (!user) throw new Error("A signed-in user is required.")
  return user
}
