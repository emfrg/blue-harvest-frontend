import { expect, test, type Page } from "@playwright/test"

/** Submit a fictional request through the visible manager form. */
async function submitRequest(
  page: Page,
  discount = "40",
  reason = "Match the competing offer."
) {
  await page.getByRole("link", { name: "+ New request", exact: true }).click()
  await page.getByLabel("Requested discount", { exact: true }).fill(discount)
  await page.getByLabel("Reason for the request", { exact: true }).fill(reason)
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(page).toHaveURL(/\/requests\/103$/)
}

/** Check the complete sample journey without any mortgage API calls. */
test("submit, review and approve across real pages", async ({ page }) => {
  const mortgageCalls: string[] = []
  page.on("request", (request) => {
    if (
      request.method() === "POST" ||
      /\/backend\/|:8000\//.test(request.url())
    )
      mortgageCalls.push(request.url())
  })
  await page.goto("/")
  await expect(page).toHaveURL(/\/applications\/1$/)
  await submitRequest(
    page,
    "40",
    "  Match the competing offer.\nKeep this reason intact.  "
  )
  await expect(
    page.getByRole("heading", { name: "Waiting for a reviewer" })
  ).toBeVisible()
  await expect(page.locator(".reason")).toHaveText(
    "  Match the competing offer.\nKeep this reason intact.  ",
    { useInnerText: false }
  )
  expect(await page.locator(".reason").textContent()).toBe(
    "  Match the competing offer.\nKeep this reason intact.  "
  )
  await expect(
    page.getByRole("button", { name: "Approve 40 bps" })
  ).toHaveCount(0)
  await page.getByLabel("Demo user").selectOption("3")
  await page.getByRole("button", { name: "Approve 40 bps" }).click()
  await expect(
    page.getByRole("heading", { name: "Approved by User 3" })
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Current approved discount" })
  ).toContainText("40 bps")
  await expect(
    page.getByRole("button", { name: "Decline request" })
  ).toHaveCount(0)
  await page.getByRole("link", { name: "← Application 1" }).click()
  await expect(
    page.getByRole("region", { name: "Request history" }).locator("tbody tr")
  ).toHaveCount(3)
  await expect(
    page.getByRole("region", { name: "Current approved discount" })
  ).toContainText("From request #103")
  await page
    .getByRole("link", { name: "View request 101", exact: true })
    .click()
  await expect(
    page.getByText("A later approval now supplies the current discount.", {
      exact: false,
    })
  ).toBeVisible()
  await expect(page.locator("article input, article textarea")).toHaveCount(0)
  expect(mortgageCalls).toEqual([])
})

/** Ensure decline preserves the prior approval and records the chosen reviewer. */
test("decline retains the current approval", async ({ page }) => {
  await page.goto("/")
  await submitRequest(page)
  await page.getByLabel("Demo user").selectOption("4")
  await page.getByRole("button", { name: "Decline request" }).click()
  await expect(
    page.getByRole("heading", { name: "Declined by User 4" })
  ).toBeVisible()
  await expect(page.locator(".facts")).toContainText("User 4")
  await expect(
    page.getByRole("region", { name: "Current approved discount" })
  ).toContainText("25 bps")
  await expect(page.getByRole("link", { name: "+ New request" })).toHaveCount(0)
})

/** Retain typed values through invalid input and a pending-request rejection. */
test("corrections and rejection keep the form values", async ({ page }) => {
  await page.goto("/applications/1/requests/new")
  await page.getByLabel("Requested discount", { exact: true }).fill("0")
  await page
    .getByLabel("Reason for the request", { exact: true })
    .fill("Keep this explanation.")
  await page.getByRole("button", { name: "Submit request" }).click()
  await expect(page.locator("#discount-error")).toBeVisible()
  await expect(
    page.getByLabel("Reason for the request", { exact: true })
  ).toHaveValue("Keep this explanation.")
  await page.getByLabel("Requested discount", { exact: true }).fill("1.5")
  await page.getByRole("button", { name: "Submit request" }).click()
  await expect(page.locator("#discount-error")).toBeVisible()
  await page.getByLabel("Requested discount", { exact: true }).fill("40")
  await page.getByLabel("Reason for the request", { exact: true }).fill(" ")
  await page.getByRole("button", { name: "Submit request" }).click()
  await expect(page.locator("#reason-error")).toBeVisible()
  await page
    .getByLabel("Reason for the request", { exact: true })
    .fill("Keep this explanation.")
  await page.getByRole("button", { name: "Submit request" }).click()
  await expect(page).toHaveURL(/\/requests\/103$/)
  await page.getByRole("link", { name: "+ New request" }).click()
  await page.getByLabel("Requested discount", { exact: true }).fill("35")
  await page
    .getByLabel("Reason for the request", { exact: true })
    .fill("Second explanation.")
  await page.getByRole("button", { name: "Submit request" }).click()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "There’s already a pending request"
  )
  await expect(
    page.getByLabel("Requested discount", { exact: true })
  ).toHaveValue("35")
  await expect(
    page.getByLabel("Reason for the request", { exact: true })
  ).toHaveValue("Second explanation.")
  await page.getByRole("link", { name: "View pending request" }).click()
  await expect(page).toHaveURL(/\/requests\/103$/)
})

/** Keep role and sample records across browser back/forward and refresh actions. */
test("navigation preserves the selected identity and reload restores fixtures", async ({
  page,
}) => {
  await page.goto("/")
  await submitRequest(page)
  await page.getByLabel("Demo user").selectOption("2")
  await page.getByRole("link", { name: "← Application 1" }).click()
  await expect(page).toHaveURL(/\/applications\/1$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/requests\/103$/)
  await expect(page.getByLabel("Demo user")).toHaveValue("2")
  await page.goForward()
  await expect(page).toHaveURL(/\/applications\/1$/)
  await page.getByRole("button", { name: "Refresh", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("Records refreshed")
  await expect(
    page.getByRole("region", { name: "Request history" }).locator("tbody tr")
  ).toHaveCount(3)
  await page.reload()
  await expect(page.getByLabel("Demo user")).toHaveValue("1")
  await expect(
    page.getByRole("region", { name: "Request history" }).locator("tbody tr")
  ).toHaveCount(2)
})

/** Distinguish an empty application from a missing application or mismatched request. */
test("application entry, empty results and missing records", async ({
  page,
}) => {
  await page.goto("/applications")
  await page.getByLabel("Application ID", { exact: true }).fill("0")
  await page.getByRole("button", { name: "Open application" }).click()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "positive whole-number"
  )
  await page.getByLabel("Application ID", { exact: true }).fill("2")
  await page.getByRole("button", { name: "Open application" }).click()
  await expect(
    page.getByRole("heading", { name: "No requests yet" })
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Current approved discount" })
  ).toContainText("No approved discount")
  await page.getByRole("link", { name: "Change application" }).click()
  await page.getByLabel("Application ID", { exact: true }).fill("99")
  await page.getByRole("button", { name: "Open application" }).click()
  await expect(
    page.getByRole("heading", { name: "Application not found" })
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Current approved discount" })
  ).toHaveCount(0)
  await page.goto("/applications/2/requests/101")
  await expect(
    page.getByRole("heading", { name: "Request not found" })
  ).toBeVisible()
})

/** Exercise the form by keyboard at a phone width and verify role switching. */
test("keyboard and phone layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/applications")
  await page.getByLabel("Application ID", { exact: true }).focus()
  await page.keyboard.type("1")
  await page.keyboard.press("Enter")
  await page.getByRole("link", { name: "+ New request" }).focus()
  await page.keyboard.press("Enter")
  await page.getByLabel("Requested discount", { exact: true }).focus()
  await page.keyboard.type("40")
  await page.keyboard.press("Tab")
  await expect(
    page.getByLabel("Reason for the request", { exact: true })
  ).toBeFocused()
  await page.keyboard.type("Match the competing offer.")
  await page.keyboard.press("Tab")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/requests\/103$/)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await page.getByRole("link", { name: "+ New request" }).click()
  await expect(page).toHaveURL(/\/requests\/new$/)
  await page.getByLabel("Demo user").selectOption("3")
  await expect(page).toHaveURL(/\/applications\/1$/)
  await expect(page.getByRole("link", { name: "+ New request" })).toHaveCount(0)
  await page
    .getByRole("link", { name: "Review request →", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Approve 40 bps" })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
})
