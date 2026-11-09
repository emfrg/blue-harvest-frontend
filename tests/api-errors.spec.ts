import { expect, test } from "./api-fixture"
import { openApplication, signIn, signOut, submitRequest } from "./helpers"

for (const { trigger, read } of [
  { trigger: "Refresh", read: "requests" },
  { trigger: "tab focus", read: "approved-discount" },
]) {
  /** Failed reads and retries preserve an unsent draft until recovery, navigation or sign-out. */
  test(`${trigger} failure preserves the draft through retries`, async ({
    page,
    context,
    api,
  }) => {
    await signIn(page)
    await openApplication(page)
    await page.getByRole("link", { name: "New request", exact: true }).click()
    const discount = page.getByLabel("Requested discount", { exact: true })
    const reason = page.getByLabel("Reason for the request", { exact: true })
    await discount.fill("40")
    await reason.fill("  Keep this draft.\nAnd its second line.  ")

    let failing = true
    let release: () => void = () => {}
    const waiting = new Promise<void>((resolve) => {
      release = resolve
    })
    await context.route(`**/backend/applications/1/${read}`, async (route) => {
      if (failing)
        return route.fulfill({
          status: 503,
          json: { detail: "Temporary read failure" },
        })
      await waiting
      return route.fallback()
    })
    if (trigger === "Refresh") {
      await page.getByRole("button", { name: "Refresh", exact: true }).click()
    } else {
      await page.evaluate(() => window.dispatchEvent(new Event("focus")))
    }
    const error = page.getByRole("heading", {
      name: "Could not load application",
    })
    const retry = page.getByRole("button", { name: "Try again", exact: true })
    await expect(error).toBeVisible()
    await expect(reason).toBeHidden()
    await retry.click()
    await expect(retry).toBeEnabled()
    await expect(error).toBeVisible()
    await expect(reason).toBeHidden()

    failing = false
    await retry.click()
    await expect(retry).toBeDisabled()
    await expect(error).toBeVisible()
    await expect(reason).toBeHidden()
    release()
    await expect(reason).toBeVisible()
    await expect(error).toHaveCount(0)
    await expect(discount).toHaveValue("40")
    await expect(reason).toHaveValue(
      "  Keep this draft.\nAnd its second line.  "
    )
    await expect(reason).toBeEditable()
    expect(api.calls.filter((call) => call.method === "POST")).toHaveLength(0)

    if (trigger === "Refresh") {
      await page.getByRole("link", { name: "Back to application" }).click()
      await expect(page).toHaveURL(/\/applications\/1$/)
    } else {
      await signOut(page)
      await signIn(page)
      await openApplication(page)
    }
    await page.getByRole("link", { name: "New request", exact: true }).click()
    await expect(discount).toHaveValue("")
    await expect(reason).toHaveValue("")
  })
}

/** A failed read after approval must not expose old decision buttons during recovery. */
test("decision controls stay unavailable until failed reads recover", async ({
  page,
  context,
  api,
}) => {
  api.requests.push({
    ...api.requests[0],
    id: 103,
    status: "PENDING",
    reviewer_id: null,
    decided_at: null,
  })
  await signIn(page, 3)
  await openApplication(page)
  await page.getByRole("link", { name: "Review request 103" }).click()

  let failing = true
  let release: () => void = () => {}
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  await context.route("**/backend/applications/1/requests", async (route) => {
    if (failing)
      return route.fulfill({
        status: 503,
        json: { detail: "Temporary read failure" },
      })
    await waiting
    return route.fallback()
  })
  await page.getByRole("button", { name: "Approve 25 bps" }).click()
  const retry = page.getByRole("button", { name: "Try again", exact: true })
  await expect(retry).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Approve 25 bps" })
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Decline request" })
  ).toHaveCount(0)

  failing = false
  await retry.click()
  await expect(retry).toBeDisabled()
  await expect(
    page.getByRole("button", { name: "Approve 25 bps" })
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Decline request" })
  ).toHaveCount(0)
  release()
  await expect(
    page.getByRole("heading", { name: "Approved by User 3" })
  ).toBeVisible()
  expect(api.calls.filter((call) => call.method === "POST")).toHaveLength(1)
})

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

for (const outcome of ["PENDING", "APPROVED", "DECLINED"] as const) {
  /** A lost response allows another decision only when the reloaded service status is still pending. */
  test(`lost decision response reloads saved ${outcome} status`, async ({
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
      if (outcome !== "PENDING")
        Object.assign(api.requests[2], {
          status: outcome,
          reviewer_id: 3,
          decided_at: "2026-11-08T20:31:00Z",
        })
      await route.abort()
    })
    await page.getByRole("button", { name: "Approve 40 bps" }).click()
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible()
    if (outcome === "PENDING") {
      await expect(
        page.getByRole("button", { name: "Approve 40 bps" })
      ).toBeEnabled()
      await expect(
        page.getByRole("button", { name: "Decline request" })
      ).toBeEnabled()
    } else {
      await expect(
        page.getByRole("heading", {
          name: `${outcome === "APPROVED" ? "Approved" : "Declined"} by User 3`,
        })
      ).toBeVisible()
      await expect(
        page.getByRole("button", { name: "Decline request" })
      ).toHaveCount(0)
    }
    await expect(page.locator(".success-toast")).toHaveCount(0)
  })
}

/** A competing reviewer wins; the stale page explains the conflict and displays the saved outcome. */
test("decision conflict reloads the other reviewer's decision", async ({
  page,
  api,
}) => {
  await signIn(page)
  await openApplication(page)
  await submitRequest(page)
  await signOut(page)
  await signIn(page, 3)
  await openApplication(page)
  await page.getByRole("link", { name: "Review request 103" }).click()
  Object.assign(api.requests[2], {
    status: "APPROVED",
    reviewer_id: 4,
    decided_at: "2026-11-09T10:00:00Z",
  })
  await page.getByRole("button", { name: "Decline request" }).click()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Request already decided"
  )
  await expect(
    page.getByRole("heading", { name: "Approved by User 4" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Decline request" })
  ).toHaveCount(0)
  await expect(
    page.getByRole("region", { name: "Current approved discount" })
  ).toContainText("40 bps")
  await expect(page.locator(".success-toast")).toHaveCount(0)
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
