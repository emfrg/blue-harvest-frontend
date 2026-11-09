import type { Page } from "@playwright/test"
import { expect, test } from "./api-fixture"
import { openApplication, signIn, signOut } from "./helpers"

/** UI-AC-02: Back and direct URLs cannot restore signed-out records or actions. */
test("signed-out navigation and Back stay behind sign-in", async ({
  page,
  api,
}) => {
  for (const path of [
    "/applications/1",
    "/applications/1/requests/new",
    "/applications/1/requests/101",
  ]) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole("combobox")).toBeVisible()
    await expect(page.locator(".identity")).toHaveCount(0)
  }
  expect(api.calls.every((call) => call.path === "/demo/users")).toBe(true)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Select an available user."
  )
  await expect(page).toHaveURL(/\/login$/)

  await signIn(page)
  await openApplication(page)
  await page.getByRole("link", { name: "View request 101" }).click()
  await signOut(page)
  const callsBeforeBack = api.calls.length
  await page.goBack()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator(".identity")).toHaveCount(0)
  await expect(page.locator(".reason")).toHaveCount(0)
  expect(
    api.calls
      .slice(callsBeforeBack)
      .every((call) => call.path === "/demo/users")
  ).toBe(true)
})

/** A reviewer cannot expose submission controls by entering the form URL directly. */
test("reviewer direct form URL remains read-only", async ({ page, api }) => {
  await signIn(page, 3)
  await page.goto("/applications/1/requests/new")
  await expect(
    page.getByRole("heading", { name: "Submission unavailable" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Submit request" })
  ).toHaveCount(0)
  await expect(page.getByLabel("Requested discount")).toHaveCount(0)
  expect(api.calls.filter((call) => call.method === "POST")).toHaveLength(0)
})

/** Choose a native option, then check Tab navigation and keyboard submission of sign-in. */
async function keyboardSignIn(page: Page, userId: number) {
  const user = page.getByRole("combobox")
  await user.selectOption(String(userId))
  await user.focus()
  await expect(user).toHaveValue(String(userId))
  await page.keyboard.press("Tab")
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true })
  ).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/applications$/)
}

/** Text input, Tab navigation, submission and approval work by keyboard at a narrow viewport. */
test("keyboard submission and review at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/login")
  await keyboardSignIn(page, 1)
  await page.getByRole("link", { name: "Application 1", exact: true }).focus()
  await page.keyboard.press("Enter")
  await page.getByRole("link", { name: "New request", exact: true }).focus()
  await page.keyboard.press("Enter")
  const discount = page.getByLabel("Requested discount", { exact: true })
  await expect(discount).toBeEditable()
  await discount.focus()
  await expect(discount).toBeFocused()
  await page.keyboard.type("25")
  await page.keyboard.press("Tab")
  await expect(
    page.getByLabel("Reason for the request", { exact: true })
  ).toBeFocused()
  await page.keyboard.type("Entered with the keyboard.")
  await page.keyboard.press("Tab")
  await expect(
    page.getByRole("button", { name: "Submit request", exact: true })
  ).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/requests\/103$/)
  await page.getByRole("button", { name: "Sign out", exact: true }).focus()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/login$/)
  await keyboardSignIn(page, 3)
  await page.getByRole("link", { name: "Application 1", exact: true }).focus()
  await page.keyboard.press("Enter")
  await page.getByRole("link", { name: "Review request 103" }).focus()
  await page.keyboard.press("Enter")
  await page.getByRole("button", { name: "Approve 25 bps" }).focus()
  await page.keyboard.press("Enter")
  await expect(
    page.getByRole("heading", { name: "Approved by User 3" })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
})
