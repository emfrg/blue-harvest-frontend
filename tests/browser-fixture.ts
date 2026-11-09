import { test as base, expect, type Page } from "@playwright/test"

/** Fail every browser scenario on unexpected JavaScript exceptions, including in additional tabs. */
export const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ context, browserName }, use, testInfo) => {
      const errors: string[] = []
      /** Record runtime errors from each page without treating expected HTTP failures as crashes. */
      function observePage(page: Page) {
        let navigating = false
        page.on("request", (request) => {
          if (
            request.isNavigationRequest() &&
            request.frame() === page.mainFrame()
          )
            navigating = true
        })
        page.on("domcontentloaded", () => {
          navigating = false
        })
        page.on("pageerror", (error) => {
          // WebKit reports cancelled Next prefetches during document replacement as page errors.
          // Keep the known cancellation in the report; all other exceptions still fail the test.
          if (
            browserName === "webkit" &&
            navigating &&
            error.stack?.startsWith(
              `Fetch API cannot load ${new URL(page.url()).origin}/`
            ) &&
            error.message.includes("?_rsc=") &&
            error.message.endsWith("due to access control checks.")
          ) {
            testInfo.annotations.push({
              type: "webkit-navigation-cancellation",
              description:
                "https://github.com/microsoft/playwright/issues/43120",
            })
          } else {
            errors.push(error.message)
          }
        })
      }
      context.on("page", observePage)
      await use()
      context.off("page", observePage)
      expect(errors, "Unexpected browser exceptions").toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
