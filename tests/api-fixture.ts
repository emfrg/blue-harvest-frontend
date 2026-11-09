import { test as base, expect } from "@playwright/test"
import type { DemoUser, DiscountRequest } from "../lib/api-types"

export const initialRequests: DiscountRequest[] = [
  {
    id: 101,
    application_id: 1,
    discount_bps: 25,
    reason: "Original approved request.",
    submitted_by: 1,
    submitted_at: "2026-11-06T09:10:00Z",
    status: "APPROVED",
    reviewer_id: 3,
    decided_at: "2026-11-06T10:25:00Z",
  },
  {
    id: 102,
    application_id: 1,
    discount_bps: 30,
    reason: "Original declined request.",
    submitted_by: 2,
    submitted_at: "2026-11-07T11:20:00Z",
    status: "DECLINED",
    reviewer_id: 4,
    decided_at: "2026-11-07T13:15:00Z",
  },
]

export type ApiFixture = {
  users: DemoUser[]
  applicationIds: number[]
  requests: DiscountRequest[]
  submissions: Map<string, DiscountRequest>
  calls: { method: string; path: string; user: string | undefined }[]
}

/** Supply controlled HTTP responses for frontend checks; real-service verification is separate. */
export const test = base.extend<{ api: ApiFixture }>({
  api: [
    async ({ context }, use) => {
      const api: ApiFixture = {
        users: [
          { id: 1, role: "RELATIONSHIP_MANAGER" },
          { id: 2, role: "RELATIONSHIP_MANAGER" },
          { id: 3, role: "REVIEWER" },
          { id: 4, role: "REVIEWER" },
        ],
        applicationIds: [1, 2],
        requests: structuredClone(initialRequests),
        submissions: new Map(),
        calls: [],
      }
      await context.route("**/backend/**", async (route) => {
        const request = route.request()
        const path = new URL(request.url()).pathname.replace("/backend", "")
        const user = request.headers()["x-user-id"]
        api.calls.push({ method: request.method(), path, user })
        if (path === "/demo/users") {
          expect(request.method()).toBe("GET")
          expect(user).toBeUndefined()
          return route.fulfill({ json: api.users })
        }
        expect(api.users.map((item) => String(item.id))).toContain(user)
        if (path === "/demo/applications") {
          expect(request.method()).toBe("GET")
          return route.fulfill({ json: api.applicationIds })
        }
        if (request.method() === "GET") {
          const id = Number(path.split("/")[2])
          if (!api.applicationIds.includes(id))
            return route.fulfill({
              status: 404,
              json: { detail: "Application not found" },
            })
          const requests = api.requests.filter(
            (item) => item.application_id === id
          )
          if (path.endsWith("/requests"))
            return route.fulfill({ json: { application_id: id, requests } })
          const current = requests
            .filter((item) => item.status === "APPROVED")
            .sort((a, b) => b.id - a.id)[0]
          return route.fulfill({
            json: {
              application_id: id,
              approved_discount: current
                ? { request_id: current.id, discount_bps: current.discount_bps }
                : null,
            },
          })
        }
        if (path === "/requests") {
          const body = request.postDataJSON()
          expect(Object.keys(body).sort()).toEqual([
            "application_id",
            "discount_bps",
            "reason",
          ])
          const key = request.headers()["idempotency-key"]
          expect(key).toBeTruthy()
          const previous = api.submissions.get(`${user}:${key}`)
          if (previous) return route.fulfill({ status: 200, json: previous })
          if (
            api.requests.some(
              (item) =>
                item.application_id === body.application_id &&
                item.status === "PENDING"
            )
          ) {
            return route.fulfill({
              status: 409,
              json: { detail: "A request is already pending" },
            })
          }
          const saved: DiscountRequest = {
            ...body,
            id: Math.max(100, ...api.requests.map((item) => item.id)) + 1,
            status: "PENDING",
            submitted_by: Number(user),
            submitted_at: "2026-11-08T20:30:00.123456+00:00",
            reviewer_id: null,
            decided_at: null,
          }
          api.requests.push(saved)
          api.submissions.set(`${user}:${key}`, saved)
          return route.fulfill({ status: 201, json: saved })
        }
        const saved = api.requests.find(
          (item) => item.id === Number(path.split("/")[2])
        )!
        if (saved.status !== "PENDING")
          return route.fulfill({
            status: 409,
            json: { detail: "Request already decided" },
          })
        const body = request.postDataJSON()
        expect(Object.keys(body)).toEqual(["outcome"])
        saved.status = body.outcome
        saved.reviewer_id = Number(user)
        saved.decided_at = "2026-11-08T20:31:00.123456+00:00"
        await route.fulfill({ json: saved })
      })
      await use(api)
    },
    { auto: true },
  ],
})

export { expect }
