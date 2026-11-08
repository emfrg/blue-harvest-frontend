import { expect, test } from "@playwright/test"

import { formatTimestamp } from "../lib/demo-data"

/** Keep the approved date labels stable, including midnight and UTC date changes. */
test("timestamps use the fixed UTC display format", () => {
  expect(formatTimestamp("2026-11-06T09:10:00Z")).toBe("6 Nov 2026, 09:10 UTC")
  expect(formatTimestamp("2026-01-01T00:05:00Z")).toBe("1 Jan 2026, 00:05 UTC")
  expect(formatTimestamp("2026-01-01T00:05:00+02:00")).toBe(
    "31 Dec 2025, 22:05 UTC"
  )
  expect(formatTimestamp("2026-11-06T23:10:00-02:00")).toBe(
    "7 Nov 2026, 01:10 UTC"
  )
})

/** Reproduce a browser whose Intl date punctuation differs from the Node server. */
test("history and details hydrate even when browser date conventions differ", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.addInitScript(() => {
    const original = Object.getOwnPropertyDescriptor(
      Intl.DateTimeFormat.prototype,
      "format"
    )!.get!
    Object.defineProperty(Intl.DateTimeFormat.prototype, "format", {
      configurable: true,
      /** Emulate the screenshot's browser formatting without changing the server. */
      get() {
        const format = original.call(this) as (value?: Date | number) => string
        return (value?: Date | number) =>
          format(value).replace(/(\d{4}), /, "$1 at ")
      },
    })
  })

  await page.goto("/applications/1")
  // An identity change confirms hydration and triggers another client render.
  await page.getByLabel("Demo user").selectOption("3")
  await expect(page.locator(".app-context")).toContainText("User 3 · Reviewer")
  await expect(page.locator("tbody .secondary-column")).toHaveText([
    "6 Nov 2026, 09:10 UTC",
    "7 Nov 2026, 11:20 UTC",
  ])

  await page.goto("/applications/1/requests/101")
  await page.getByLabel("Demo user").selectOption("3")
  await expect(page.locator(".app-context")).toContainText("User 3 · Reviewer")
  await expect(page.locator(".activity span")).toHaveText([
    "6 Nov 2026, 09:10 UTC",
    "6 Nov 2026, 10:25 UTC",
  ])
  await expect(page.locator(".facts")).toContainText("6 Nov 2026, 10:25 UTC")
  expect(errors).toEqual([])
})
