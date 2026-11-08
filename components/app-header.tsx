"use client"

import { usePathname, useRouter } from "next/navigation"
import type { ChangeEvent } from "react"

import { useDemo } from "@/components/demo-provider"
import { demoUsers } from "@/lib/demo-users"

/** Render option B's shared masthead and compact demonstration identity control. */
export function AppHeader() {
  const { user, selectUser } = useDemo()
  const pathname = usePathname()
  const router = useRouter()

  /** Switch roles and leave the manager form when selecting a reviewer. */
  function changeIdentity(event: ChangeEvent<HTMLSelectElement>) {
    const id = Number(event.target.value)
    selectUser(id)
    if (id > 2 && pathname.endsWith("/requests/new")) {
      router.replace(pathname.replace(/\/requests\/new$/, ""))
    }
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            ↘
          </div>
          <div>
            <strong>Pricing exceptions</strong>
            <small>Mortgage applications</small>
          </div>
        </div>
        <div className="identity">
          <label htmlFor="identity">Demo user</label>
          <select id="identity" value={user.id} onChange={changeIdentity}>
            {demoUsers.map((identity) => (
              <option key={identity.id} value={identity.id}>
                User {identity.id} · {identity.role}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}
