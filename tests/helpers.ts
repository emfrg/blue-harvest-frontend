import { expect, type Page } from "@playwright/test"

/** Enter the application as one of its existing users through the sign-in screen. */
export async function signIn(page: Page, userId = 1) {
  if (!page.url().endsWith("/login")) await page.goto("/login")
  await page.getByLabel("User", { exact: true }).selectOption(String(userId))
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/applications$/)
  await expect(page.locator(".identity")).toContainText(`User ${userId} ·`)
}

/** End the session through its only user-changing control. */
export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out", exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel("User", { exact: true })).toHaveValue("")
}

/** Open the selected application directly from the available-applications list. */
export async function openApplication(page: Page, id = 1) {
  await page
    .getByRole("link", { name: `Application ${id}`, exact: true })
    .click()
  await expect(page).toHaveURL(new RegExp(`/applications/${id}$`))
}

/** Submit a local request through the manager's focused form. */
export async function submitRequest(
  page: Page,
  discount = "40",
  reason = "Match the competing offer."
) {
  await page.getByRole("link", { name: "New request", exact: true }).click()
  await page.getByLabel("Requested discount", { exact: true }).fill(discount)
  await page.getByLabel("Reason for the request", { exact: true }).fill(reason)
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(page).toHaveURL(/\/requests\/103$/)
}
