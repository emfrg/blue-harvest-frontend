"use client"

import { useState, type FormEvent } from "react"

import { useSession } from "@/components/session-provider"
import { Button } from "@/components/ui/button"
import { formatRole } from "@/lib/format"

/** Select one existing user for the local session, with their role shown alongside. */
export function SignInForm() {
  const { users, signIn } = useSession()
  const [userId, setUserId] = useState("")
  const [error, setError] = useState<string | null>(null)

  /** Validate the selected user and start their session after it is retained. */
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const failure = signIn(Number(userId))
    setError(failure)
    if (failure) event.currentTarget.querySelector("select")?.focus()
  }

  return (
    <section className="entry card">
      <h1>Sign in</h1>
      <form onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor="user">User</label>
          <select
            id="user"
            value={userId}
            disabled={users.length === 0}
            onChange={(event) => setUserId(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "sign-in-error" : undefined}
          >
            <option value="" disabled>
              Select a user
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                User {user.id} — {formatRole(user.role)}
              </option>
            ))}
          </select>
          {users.length === 0 && <p role="status">No users available.</p>}
          {error && (
            <small id="sign-in-error" className="field-error" role="alert">
              {error}
            </small>
          )}
        </div>
        <Button type="submit" variant="primary" disabled={users.length === 0}>
          Sign in
        </Button>
      </form>
    </section>
  )
}
