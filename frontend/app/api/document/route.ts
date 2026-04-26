import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()

  const res = await fetch(
    `${process.env.API_URL}/documents/upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    }
  )

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json(data)
}