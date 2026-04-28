import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { serverFetch } from "@/lib/serverFetch"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const document_id = searchParams.get("document_id")

  const url = document_id
    ? `/api/chat/sessions?document_id=${document_id}`
    : `/api/chat/sessions`

  const data = await serverFetch(url)

  return NextResponse.json(data, { status: 200 })
}