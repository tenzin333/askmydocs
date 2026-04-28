import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Register
    const registerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: body.email,
        password: body.password
      })
    })

    const registerData = await registerRes.json()

    if (!registerRes.ok) {
      return NextResponse.json(
        { detail: registerData.detail || "Registration failed" },
        { status: registerRes.status }
      )
    }

    // 2. Auto login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: body.email,
        password: body.password
      })
    })

    const loginData = await loginRes.json()

    if (!loginRes.ok) {
      return NextResponse.json(
        { detail: "Registered but login failed" },
        { status: loginRes.status }
      )
    }

    // 3.  Set httpOnly cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("token", loginData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/"
    })

    return response

  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json(
      { detail: "Something went wrong" },
      { status: 500 }
    )
  }
}