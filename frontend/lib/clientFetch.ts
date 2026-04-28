
export async function clientFetch(
  endpoint: string,
  options: RequestInit = {}
) {
const isFormData = options.body instanceof FormData
  const res = await fetch(endpoint, {  // Next.js API routes → no base URL
    ...options,
    headers: {
      // skip Content-Type for FormData
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"  // 👈 SSR safe check
    }
    return
  }

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Request failed")
  }

  return res.json()
}