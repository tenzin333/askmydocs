import { cookies } from "next/headers"

const API_URL = process.env.API_URL || "http://localhost:8000"

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("token")?.value || null
}

export async function serverFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = await getToken()

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Request failed")
  }

  return res.json()
}