import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { detail: "No file provided" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const blob = new Blob([bytes], { type: "application/pdf" })

    const newFormData = new FormData()
    newFormData.append("file", blob, file.name)

    const res = await fetch(`${API_URL}/api/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`
      },
      body: newFormData
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)

  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json(
      { detail: "Something went wrong" },
      { status: 500 }
    )
  }
}