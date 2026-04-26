"use server"
import { cookies } from "next/headers"

const API_URL = process.env.API_URL || "http://localhost:8000"

// =====================
// GET TOKEN FROM COOKIE
// =====================
async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("token")?.value || null
}

// =====================
// SERVER FETCH
// For server components — reads cookie automatically
// =====================
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
    cache: "no-store", // always fresh data
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Request failed")
  }

  return res.json()
}

// =====================
// CLIENT FETCH
// For client components — goes through Next.js API routes
// =====================
export async function clientFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (res.status === 401) {
    window.location.href = "/login"
    return
  }

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Request failed")
  }

  return res.json()
}