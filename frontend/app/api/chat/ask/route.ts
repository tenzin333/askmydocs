import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { serverFetch } from "@/lib/serverFetch"

const API_URL = process.env.API_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const body = await req.json() 

  const res = await serverFetch(`/api/chat/ask`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  
  return NextResponse.json(res, { status: res.status })
}