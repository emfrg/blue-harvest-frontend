import type {
  CurrentApproval,
  Decision,
  DemoUser,
  DiscountRequest,
  RequestHistory,
  Submission,
} from "@/lib/api-types"

/** Carry the HTTP status so callers can distinguish rejection from an uncertain write. */
export class ApiError extends Error {
  /** Keep the service's readable message and status together. Zero means no usable response. */
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
  }
}

/** Prefer the service's error detail, falling back to a short message for its HTTP status. */
async function readErrorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null)
  if (typeof body?.detail === "string") return body.detail

  switch (response.status) {
    case 422:
      return "Check the entered values and try again."
    case 403:
      return "This user cannot perform that operation."
    case 404:
      return "Record not found."
    default:
      return "The service could not complete the operation. Try again."
  }
}

/** Send one API call; only public reads omit identity, and writes are never retried automatically. */
async function send<T>(
  path: string,
  userId: number | undefined,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)
  if (userId !== undefined) headers.set("X-User-Id", String(userId))
  if (options.body) headers.set("Content-Type", "application/json")
  const timeout = AbortSignal.timeout(20000)
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout
  let response: Response
  try {
    response = await fetch(`/backend${path}`, {
      ...options,
      headers,
      signal,
      cache: "no-store",
    })
  } catch {
    throw new ApiError(
      0,
      "The service could not be reached. Check that the backend is running and try again."
    )
  }
  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new ApiError(response.status, message)
  }
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(
      0,
      "The service response could not be read. The outcome is not confirmed."
    )
  }
}

/** Load the public user choices and their stored roles before sign-in. */
export function getUsers(signal?: AbortSignal) {
  return send<DemoUser[]>("/demo/users", undefined, { signal })
}

/** Load all application IDs available to the selected user. */
export function getApplications(userId: number, signal?: AbortSignal) {
  return send<number[]>("/demo/applications", userId, { signal })
}

/** Read every saved request for one application. */
export function getHistory(
  applicationId: number,
  userId: number,
  signal?: AbortSignal
) {
  return send<RequestHistory>(
    `/applications/${applicationId}/requests`,
    userId,
    { signal }
  )
}

/** Read the approved discount selected by the service. */
export function getApproval(
  applicationId: number,
  userId: number,
  signal?: AbortSignal
) {
  return send<CurrentApproval>(
    `/applications/${applicationId}/approved-discount`,
    userId,
    { signal }
  )
}

/** Submit the exact original body and retry key, including when retrying an uncertain response. */
export function submitRequest(
  body: Submission,
  userId: number,
  retryKey: string,
  signal?: AbortSignal
) {
  return send<DiscountRequest>("/requests", userId, {
    method: "POST",
    headers: { "Idempotency-Key": retryKey },
    body: JSON.stringify(body),
    signal,
  })
}

/** Ask the service to decide a pending request; it supplies the final actor and time. */
export function decideRequest(
  requestId: number,
  outcome: Decision,
  userId: number,
  signal?: AbortSignal
) {
  return send<DiscountRequest>(`/requests/${requestId}/decision`, userId, {
    method: "POST",
    body: JSON.stringify({ outcome }),
    signal,
  })
}
