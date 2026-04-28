import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { serverFetch } from "@/lib/serverFetch";

const API_URL = process.env.API_URL || "http://localhost:8000"

export async function GET(req: NextRequest, params: Promise<{ document_id: string}> ) {
  const document_id = (await params).document_id;
  const session = await getSession()
  if (!session) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const url = document_id ? `/api/chat/sessions?document_id=${document_id}` : `/api/chat/sessions`
  const data = await serverFetch(url)
  return NextResponse.json(data, { status: 200 })
}
