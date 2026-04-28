import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { serverFetch } from "@/lib/serverFetch"


export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const data = await serverFetch(`/api/users/me/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    })

    return NextResponse.json(data)
  } catch (err) {
    console.error("Change password error:", err)
    return NextResponse.json({ detail: "Something went wrong" }, { status: 500 })
  }
}
