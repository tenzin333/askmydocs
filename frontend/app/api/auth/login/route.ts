import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: body.email,
        password: body.password
      })
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { detail: data.detail || "Invalid credentials" },
        { status: res.status }
      )
    }

    //  Set httpOnly cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/"
    })

    return response

  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json(
      { detail: "Something went wrong" },
      { status: 500 }
    )
  }
}