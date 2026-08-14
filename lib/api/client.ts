/**
 * Lumo Network API Client Seam
 * Connects frontend hooks & components directly to real server APIs.
 */

export type ApiResponse<T> = {
  data: T
  meta?: { page: number; perPage: number; total: number }
}

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(message: string, status = 400, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type RequestOptions<TBody> = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: TBody
  headers?: Record<string, string>
  /** Optional mock resolver for local offline testing */
  mock?: (body: TBody) => Promise<unknown> | unknown
  latency?: number
}

export async function apiRequest<TResult, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResult> {
  const { method = 'GET', body, mock, headers = {} } = options

  // If a mock is explicitly passed and we're offline/testing, run mock
  if (mock && process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return (await mock(body as TBody)) as TResult
  }

  // Construct real HTTP request to Next.js API route
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include', // Include httpOnly session cookies
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(path, fetchOptions)
  const contentType = response.headers.get('content-type') || ''

  let responseData: any = null
  if (contentType.includes('application/json')) {
    responseData = await response.json()
  } else {
    responseData = await response.text()
  }

  if (!response.ok) {
    const message = responseData?.error || responseData?.message || `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, responseData?.details)
  }

  return responseData as TResult
}
