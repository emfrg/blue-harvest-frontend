import { expect, test } from "./api-fixture"
import { openApplication, signIn, signOut, submitRequest } from "./helpers"

/** All four users sign in explicitly; role affects actions, not visible application records. */
test("user selection, header navigation and role controls", async ({
  page,
}) => {
  for (const id of [1, 2, 3, 4]) {
    await signIn(page, id)
    await openApplication(page)
    await expect(page.locator("tbody tr")).toHaveCount(2)
    await expect(page.getByRole("combobox")).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "New request", exact: true })
    ).toHaveCount(id < 3 ? 1 : 0)
    await page.locator(".brand").focus()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/applications$/)
    await expect(page.locator(".identity")).toContainText(`User ${id}`)
    await signOut(page)
  }
  await page.goto("/applications/1")
  await expect(page).toHaveURL(/\/login$/)
})

/** Read the same API data from independent manager and reviewer tabs. */
test("submit, review in another tab, and refresh the service outcome", async ({
  page,
  context,
  api,
}) => {
  const reviewer = await context.newPage()
  await signIn(page, 2)
  await openApplication(page)
  await signIn(reviewer, 3)
  await openApplication(reviewer)
  await submitRequest(page, "4", "  Keep the exact reason.\nSecond line.  ")
  await expect(page.locator(".reason")).toHaveText(
    "  Keep the exact reason.\nSecond line.  "
  )
  await expect(page.locator(".detail-heading")).toContainText(
    "8 Nov 2026, 20:30 UTC"
  )
  await reviewer.getByRole("button", { name: "Refresh", exact: true }).click()
  await reviewer.getByRole("link", { name: "Review request 103" }).click()
  await reviewer.getByRole("button", { name: "Approve 4 bps" }).click()
  await expect(
    reviewer.getByRole("heading", { name: "Approved by User 3" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Refresh", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Approved by User 3" })
  ).toBeVisible()
  await expect(page.locator(".identity")).toContainText("User 2")
  await expect(
    page.getByRole("region", { name: "Current approved discount" })
  ).toContainText("4 bps")
  expect(api.requests).toHaveLength(3)
  expect(api.requests[2].reviewer_id).toBe(3)
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Approved by User 3" })
  ).toBeVisible()
})

/** A decline preserves the approval supplied by the API and permits a later submission. */
test("decline preserves approval and records retain their history", async ({
  page,
}) => {
  await signIn(page)
  await openApplication(page)
  await submitRequest(page)
  await signOut(page)
  await signIn(page, 4)
  await openApplication(page)
  await page.getByRole("link", { name: "Review request 103" }).click()
  await page.getByRole("button", { name: "Decline request" }).click()
  await expect(
    page.getByRole("heading", { name: "Declined by User 4" })
  ).toBeVisible()
  await expect(page.locator(".activity li strong")).toHaveText([
    "Declined by User 4",
    "Submitted by User 1",
  ])
  await expect(page.locator(".activity")).not.toContainText("Latest")
  await expect(
    page.getByRole("region", { name: "Current approved discount" })
  ).toContainText("25 bps")
  await page.getByRole("link", { name: "← Application 1" }).click()
  await expect(page.locator("tbody tr td:first-child strong")).toHaveText([
    "#103",
    "#102",
    "#101",
  ])
})

/** Superseded browser record stores cannot alter or block API-backed screens. */
test("old browser records and conflicts are ignored", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "pricing-exceptions:records:v1",
      "broken old shared data"
    )
    sessionStorage.setItem(
      "pricing-exceptions:records:v1",
      "different old tab data"
    )
  })
  await signIn(page, 3)
  await openApplication(page)
  await expect(page.locator("tbody tr")).toHaveCount(2)
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0)
  await page.reload()
  await expect(page.locator("tbody tr")).toHaveCount(2)
})

/** Read missing and empty applications distinctly, and recover a failed read through Try again. */
test("empty history, missing application and unavailable service", async ({
  page,
  context,
}) => {
  await signIn(page)
  await openApplication(page, 2)
  await expect(
    page.getByRole("heading", { name: "No requests yet" })
  ).toBeVisible()
  await page.goto("/applications/999")
  await expect(
    page.getByRole("heading", { name: "Application not found" })
  ).toBeVisible()
  await context.route("**/backend/applications/**", (route) => route.abort())
  await page.goto("/applications/1")
  await expect(
    page.getByRole("heading", { name: "Could not load application" })
  ).toBeVisible()
  await context.unroute("**/backend/applications/**")
  // Restore the controlled read responses removed with the unavailable-service override.
  await context.route("**/backend/applications/**", (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith(
        "approved-discount"
      )
        ? { application_id: 1, approved_discount: null }
        : { application_id: 1, requests: [] },
    })
  )
  await page.getByRole("button", { name: "Try again" }).click()
  await expect(
    page.getByRole("heading", { name: "No requests yet" })
  ).toBeVisible()
})

/** Reject invalid fields locally and retain their values without making a submission call. */
test("form validation keeps entered details", async ({ page, api }) => {
  await signIn(page)
  await openApplication(page)
  await page.getByRole("link", { name: "New request", exact: true }).click()
  await page.getByLabel("Requested discount", { exact: true }).fill("1.5")
  await page
    .getByLabel("Reason for the request", { exact: true })
    .fill("Keep this reason.")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(page.locator("#discount-error")).toBeVisible()
  await expect(
    page.getByLabel("Reason for the request", { exact: true })
  ).toHaveValue("Keep this reason.")
  expect(api.calls.filter((call) => call.method === "POST")).toHaveLength(0)
})

/** Successful Refresh is brief, dismissible and does not move the application content. */
test("refresh toast expires and can be dismissed", async ({ page }) => {
  await page.clock.install()
  await signIn(page)
  await openApplication(page)
  const summary = page.getByRole("region", {
    name: "Current approved discount",
  })
  await expect(summary).toBeVisible()
  const before = await summary.boundingBox()
  await page.getByRole("button", { name: "Refresh", exact: true }).click()
  await expect(page.locator(".success-toast")).toContainText(
    "Records refreshed"
  )
  expect(await summary.boundingBox()).toEqual(before)
  await page.clock.runFor(4100)
  await expect(page.locator(".success-toast")).toHaveCount(0)
  await page.getByRole("button", { name: "Refresh", exact: true }).click()
  await page.getByRole("button", { name: "Dismiss notification" }).click()
  await expect(page.locator(".success-toast")).toHaveCount(0)
})
