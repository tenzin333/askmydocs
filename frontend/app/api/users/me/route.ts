import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { serverFetch } from "@/lib/serverFetch"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const user = await serverFetch("/api/users/me")  // ✅ no API_URL prefix
  return NextResponse.json(user)                    // ✅ wrap in NextResponse
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const body = await req.json()  // ✅ await req.json()

  const updatedUser = await serverFetch("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(body)
  })

  return NextResponse.json(updatedUser)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  await serverFetch("/api/users/me", { method: "DELETE" })

  // Clear cookie on account deletion
  const response = NextResponse.json({ success: true })
  response.cookies.delete("token")
  return response
}