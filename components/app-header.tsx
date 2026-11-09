"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useSession } from "@/components/session-provider"
import { Button } from "@/components/ui/button"
import { formatRole } from "@/lib/format"

/** Show the linked application name, navigation and fixed signed-in identity. */
export function AppHeader() {
  const { user, signOut } = useSession()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  /** Report a failed sign-out instead of leaving a retained session unnoticed. */
  function endSession() {
    const failure = signOut()
    setError(failure)
    if (!failure) router.replace("/login")
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link
          className="brand"
          href={user ? "/applications" : "/login"}
          aria-label={`Discount requests, Mortgage pricing — ${user ? "Applications" : "Sign in"}`}
        >
          <span className="brand-mark" aria-hidden="true">
            ↘
          </span>
          <span>
            <strong>Discount requests</strong>
            <small>Mortgage pricing</small>
          </span>
        </Link>
        {user && (
          <nav className="session-nav" aria-label="Main navigation">
            <Link href="/applications">Applications</Link>
            <span className="identity">
              User {user.id} · {formatRole(user.role)}
            </span>
            <Button className="sign-out" onClick={endSession}>
              Sign out
            </Button>
            {error && (
              <span className="session-error" role="alert">
                {error}
              </span>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
