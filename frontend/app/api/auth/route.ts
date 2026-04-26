import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL || "http://localhost:8000"

// =====================
// LOGIN
// =====================
export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(
      { detail: data.detail },
      { status: res.status }
    )
  }

  // Set JWT in httpOnly cookie
  const response = NextResponse.json({ success: true })

  response.cookies.set("token", data.access_token, {
    httpOnly: true,      // 👈 JS cannot access this
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24  // 24 hours
  })

  return response
}

// =====================
// LOGOUT
// =====================
export async function DELETE() {
  const response = NextResponse.json({ success: true })

  response.cookies.delete("token")

  return response
}