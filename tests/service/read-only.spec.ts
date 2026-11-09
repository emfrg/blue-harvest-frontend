import { expect, test } from "../browser-fixture"
import { openApplication, signIn, signOut } from "../helpers"
import type {
  CurrentApproval,
  DemoUser,
  RequestHistory,
} from "../../lib/api-types"

/** Compare both roles' screens with the real service, allowing reads only and no prepared responses. */
test("real API users, applications, history and details", async ({
  page,
  context,
  request,
}) => {
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000"
  await context.route("**/backend/**", async (route) => {
    expect(
      route.request().method(),
      "The service smoke test must never write records"
    ).toBe("GET")
    await route.continue()
  })
  const usersResponse = await request.get(`${backend}/demo/users`)
  expect(
    usersResponse.ok(),
    "Start the backend before running test:service"
  ).toBe(true)
  const users = (await usersResponse.json()) as DemoUser[]
  await page.goto("/login")
  await expect(page.getByRole("option")).toHaveCount(users.length + 1)

  for (const role of ["RELATIONSHIP_MANAGER", "REVIEWER"] as const) {
    const user = users.find((item) => item.role === role)
    if (!user)
      throw new Error(`The service smoke test requires a seeded ${role} user.`)
    await signIn(page, user.id)
    const headers = { "X-User-Id": String(user.id) }
    const applicationsResponse = await request.get(
      `${backend}/demo/applications`,
      { headers }
    )
    expect(applicationsResponse.ok()).toBe(true)
    const applicationIds = (await applicationsResponse.json()) as number[]
    expect(
      applicationIds.length,
      "The service smoke test requires a seeded application"
    ).toBeGreaterThan(0)
    await expect(page.locator(".application-list a")).toHaveText(
      applicationIds.map((id) => `Application ${id}`)
    )
    const applicationId = applicationIds[0]
    const historyResponse = await request.get(
      `${backend}/applications/${applicationId}/requests`,
      { headers }
    )
    const approvalResponse = await request.get(
      `${backend}/applications/${applicationId}/approved-discount`,
      { headers }
    )
    expect(historyResponse.ok()).toBe(true)
    expect(approvalResponse.ok()).toBe(true)
    const history = (await historyResponse.json()) as RequestHistory
    const { approved_discount: approval } =
      (await approvalResponse.json()) as CurrentApproval
    await openApplication(page, applicationId)
    await expect(
      page.getByRole("region", { name: "Current approved discount" })
    ).toContainText(
      approval ? `${approval.discount_bps} bps` : "No approved discount"
    )
    if (history.requests.length) {
      const sorted = [...history.requests].sort((a, b) => b.id - a.id)
      await expect(page.locator("tbody tr td:first-child strong")).toHaveText(
        sorted.map((item) => `#${item.id}`)
      )
      const latest = sorted[0]
      const action =
        role === "REVIEWER" && latest.status === "PENDING" ? "Review" : "View"
      await page
        .getByRole("link", {
          name: `${action} request ${latest.id}`,
          exact: true,
        })
        .click()
      await expect(page.locator(".reason")).toHaveText(latest.reason)
      await expect(page.locator(".detail-heading")).toContainText(latest.status)
      await expect(page.locator(".detail-heading")).toContainText(
        `Submitted by User ${latest.submitted_by}`
      )
    } else {
      await expect(
        page.getByRole("heading", { name: "No requests yet" })
      ).toBeVisible()
    }
    await signOut(page)
  }
})
