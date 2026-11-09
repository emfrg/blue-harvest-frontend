import { expect, test } from "./api-fixture"
import { openApplication, signIn, signOut } from "./helpers"

/** UI-AC-01: API choices include users and applications absent from the seed. */
test("lists use returned users, roles and application IDs with the required headers", async ({
  page,
  api,
}) => {
  api.users = [
    { id: 7, role: "REVIEWER" },
    { id: 9, role: "RELATIONSHIP_MANAGER" },
  ]
  api.applicationIds = [12, 42]
  await page.goto("/login")
  await expect(page.getByRole("option")).toHaveText([
    "Select a user",
    "User 7 — Reviewer",
    "User 9 — Relationship manager",
  ])
  for (const userId of [9, 7]) {
    await signIn(page, userId)
    await expect(page.locator(".application-list a")).toHaveText([
      "Application 12",
      "Application 42",
    ])
    await openApplication(page, 42)
    await expect(
      page.getByRole("heading", { name: "No requests yet" })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "New request", exact: true })
    ).toHaveCount(userId === 9 ? 1 : 0)
    expect(api.calls).toContainEqual({
      method: "GET",
      path: "/demo/applications",
      user: String(userId),
    })
    expect(api.calls).toContainEqual({
      method: "GET",
      path: "/applications/42/requests",
      user: String(userId),
    })
    await signOut(page)
  }
  expect(
    api.calls
      .filter((call) => call.path === "/demo/users")
      .every((call) => call.user === undefined)
  ).toBe(true)
})

/** UI-AC-08: Failed user discovery offers retry without fallback identities. */
test("user loading and failed reads never show fallback choices", async ({
  page,
  context,
}) => {
  let release: () => void = () => {}
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  let calls = 0
  await context.route("**/backend/demo/users", async (route) => {
    calls += 1
    if (calls > 1) return route.fallback()
    await waiting
    await route.fulfill({
      status: 503,
      json: { detail: "Users temporarily unavailable" },
    })
  })
  await page.goto("/login")
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Loading users…"
  )
  await expect(page.getByRole("combobox")).toHaveCount(0)
  release()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Users temporarily unavailable"
  )
  await page.getByRole("button", { name: "Try again" }).click()
  await expect(page.getByRole("option")).toHaveCount(5)
  expect(calls).toBe(2)
})

/** Ending a session does not depend on the subsequent public user-list request succeeding. */
test("sign-out reaches login even when reloading users fails", async ({
  page,
  context,
}) => {
  await signIn(page, 2)
  await openApplication(page)
  await context.route("**/backend/demo/users", (route) =>
    route.fulfill({
      status: 503,
      json: { detail: "Users temporarily unavailable" },
    })
  )
  await page.getByRole("button", { name: "Sign out", exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator(".identity")).toHaveCount(0)
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Users temporarily unavailable"
  )
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("pricing-exceptions:session:v1")
    )
  ).toBeNull()
  await context.unroute("**/backend/demo/users")
  await page.getByRole("button", { name: "Try again" }).click()
  await expect(page.getByRole("combobox")).toHaveValue("")
  await expect(page.getByRole("option")).toHaveCount(5)
})

/** An empty user table is an empty sign-in screen, not a local fallback identity. */
test("empty user list disables sign-in", async ({ page, api }) => {
  api.users = []
  await page.goto("/login")
  await expect(
    page.getByText("No users available.", { exact: true })
  ).toBeVisible()
  await expect(page.getByRole("combobox")).toBeDisabled()
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true })
  ).toBeDisabled()
  await expect(page.getByRole("option")).toHaveCount(1)
  expect(
    api.calls.filter((call) => call.path === "/demo/applications")
  ).toHaveLength(0)
})

/** Application discovery preserves identity while loading and retrying a rejected read. */
test("application loading and rejected reads can be retried", async ({
  page,
  context,
}) => {
  let release: () => void = () => {}
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  let calls = 0
  await context.route("**/backend/demo/applications", async (route) => {
    expect(route.request().headers()["x-user-id"]).toBe("3")
    calls += 1
    if (calls > 1) return route.fallback()
    await waiting
    await route.fulfill({
      status: 403,
      json: { detail: "Application access denied" },
    })
  })
  await signIn(page, 3)
  await expect(
    page.getByText("Loading applications…", { exact: true })
  ).toBeVisible()
  await expect(page.locator(".application-list")).toHaveCount(0)
  release()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Application access denied"
  )
  await page.getByRole("button", { name: "Try again" }).click()
  await expect(page.locator(".application-list a")).toHaveCount(2)
  await expect(page.locator(".identity")).toContainText("User 3 · Reviewer")
  expect(calls).toBe(2)
})

/** An empty application table must not offer the former hardcoded IDs. */
test("empty application list offers no application links", async ({
  page,
  api,
}) => {
  api.applicationIds = []
  await signIn(page)
  await expect(
    page.getByText("No applications available.", { exact: true })
  ).toBeVisible()
  await expect(page.locator(".application-list")).toHaveCount(0)
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0)
})

/** UI-AC-01, UI-AC-02: Reload picks up role changes and removed users. */
test("session restoration uses current API users and roles", async ({
  page,
  api,
}) => {
  await signIn(page, 2)
  await openApplication(page)
  await expect(
    page.getByRole("link", { name: "New request", exact: true })
  ).toBeVisible()
  api.users[1].role = "REVIEWER"
  await page.reload()
  await expect(page.locator(".identity")).toContainText("User 2 · Reviewer")
  await expect(
    page.getByRole("link", { name: "New request", exact: true })
  ).toHaveCount(0)
  api.users = api.users.filter((user) => user.id !== 2)
  await page.reload()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("combobox")).toHaveValue("")
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("pricing-exceptions:session:v1")
    )
  ).toBeNull()
})

/** UI-AC-07: A previous user's late read cannot replace the new user's choices. */
test("sign-out reloads users and discards the previous identity's application read", async ({
  page,
  context,
  api,
}) => {
  let release: () => void = () => {}
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  await context.route("**/backend/demo/applications", async (route) => {
    if (route.request().headers()["x-user-id"] !== "1") return route.fallback()
    await waiting
    await route.fulfill({ json: [99] })
  })
  await signIn(page, 1)
  await expect(
    page.getByText("Loading applications…", { exact: true })
  ).toBeVisible()
  api.users.push({ id: 9, role: "REVIEWER" })
  await signOut(page)
  await expect(
    page.getByRole("option", { name: "User 9 — Reviewer" })
  ).toBeAttached()
  await signIn(page, 9)
  await expect(page.locator(".application-list a")).toHaveText([
    "Application 1",
    "Application 2",
  ])
  release()
  await expect(
    page.getByRole("link", { name: "Application 99", exact: true })
  ).toHaveCount(0)
  await expect(page.locator(".identity")).toContainText("User 9 · Reviewer")
})
