import { expect, test } from "./api-fixture"
import { openApplication, signIn, signOut, submitRequest } from "./helpers"

for (const status of [403, 409, 422]) {
  /** A confirmed API rejection preserves editable input and never reports a saved request. */
  test(`submission rejected with ${status} retains entered values`, async ({
    page,
    context,
  }) => {
    await context.route("**/backend/requests", (route) =>
      route.fulfill({ status, json: { detail: `Rejected with ${status}` } })
    )
    await signIn(page)
    await openApplication(page)
    await page.getByRole("link", { name: "New request", exact: true }).click()
    await page.getByLabel("Requested discount", { exact: true }).fill("40")
    await page
      .getByLabel("Reason for the request", { exact: true })
      .fill("Keep these values.")
    await page
      .getByRole("button", { name: "Submit request", exact: true })
      .click()
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      `Rejected with ${status}`
    )
    await expect(
      page.getByLabel("Reason for the request", { exact: true })
    ).toHaveValue("Keep these values.")
    await expect(
      page.getByLabel("Reason for the request", { exact: true })
    ).toBeEnabled()
    await expect(page.locator(".success-toast")).toHaveCount(0)
  })
}

/** A lost success response survives reload and user changes, then reuses the exact original request. */
test("unconfirmed submission retries the original identity, key and body", async ({
  page,
  context,
  api,
}) => {
  const attempts: { user: string; key: string; body: unknown }[] = []
  await context.route("**/backend/requests", async (route) => {
    const request = route.request()
    const headers = request.headers()
    attempts.push({
      user: headers["x-user-id"],
      key: headers["idempotency-key"],
      body: request.postDataJSON(),
    })
    if (attempts.length === 1) {
      const saved = {
        ...request.postDataJSON(),
        id: 103,
        submitted_by: 2,
        submitted_at: "2026-11-08T20:30:00Z",
        status: "PENDING",
        reviewer_id: null,
        decided_at: null,
      }
      api.requests.push(saved)
      api.submissions.set(
        `${headers["x-user-id"]}:${headers["idempotency-key"]}`,
        saved
      )
      return route.abort()
    }
    return route.fallback()
  })
  await signIn(page, 2)
  await openApplication(page)
  await page.getByRole("link", { name: "New request", exact: true }).click()
  await page.getByLabel("Requested discount", { exact: true }).fill("40")
  await page
    .getByLabel("Reason for the request", { exact: true })
    .fill("  Exact original reason.  ")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByText("Submission not confirmed", { exact: true })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByLabel("Reason for the request", { exact: true })
  ).toHaveValue("  Exact original reason.  ")
  await expect(
    page.getByLabel("Reason for the request", { exact: true })
  ).toBeDisabled()
  await signOut(page)
  await signIn(page, 1)
  await openApplication(page)
  await page.getByRole("link", { name: "New request", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Retry submission" })
  ).toBeDisabled()
  await expect(
    page.getByText(/An earlier submission belongs to User 2/)
  ).toBeVisible()
  expect(attempts).toHaveLength(1)
  await signOut(page)
  await signIn(page, 2)
  await openApplication(page)
  await page.getByRole("link", { name: "New request", exact: true }).click()
  await page.getByRole("button", { name: "Retry submission" }).click()
  await expect(page).toHaveURL(/\/requests\/103$/)
  expect(attempts).toHaveLength(2)
  expect(attempts[1]).toEqual(attempts[0])
  expect(api.requests).toHaveLength(3)
})

/** Reconcile a response lost after a successful decision instead of offering another decision. */
test("lost decision response reloads the saved status", async ({
  page,
  context,
  api,
}) => {
  await signIn(page, 2)
  await openApplication(page)
  await submitRequest(page)
  await signOut(page)
  await signIn(page, 3)
  await openApplication(page)
  await page.getByRole("link", { name: "Review request 103" }).click()
  await context.route("**/backend/requests/103/decision", async (route) => {
    Object.assign(api.requests[2], {
      status: "APPROVED",
      reviewer_id: 3,
      decided_at: "2026-11-08T20:31:00Z",
    })
    await route.abort()
  })
  await page.getByRole("button", { name: "Approve 40 bps" }).click()
  await expect(
    page.getByRole("heading", { name: "Approved by User 3" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Decline request" })
  ).toHaveCount(0)
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible()
})

/** Repeated clicks while a write is outstanding send exactly one request. */
test("submission stays disabled while awaiting the service", async ({
  page,
  context,
}) => {
  let release: () => void = () => {}
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  let calls = 0
  await context.route("**/backend/requests", async (route) => {
    calls += 1
    await waiting
    await route.fallback()
  })
  await signIn(page)
  await openApplication(page)
  await page.getByRole("link", { name: "New request", exact: true }).click()
  await page.getByLabel("Requested discount", { exact: true }).fill("40")
  await page
    .getByLabel("Reason for the request", { exact: true })
    .fill("Wait for confirmation.")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(page.getByRole("button", { name: "Submitting…" })).toBeDisabled()
  expect(calls).toBe(1)
  release()
  await expect(page).toHaveURL(/\/requests\/103$/)
})
