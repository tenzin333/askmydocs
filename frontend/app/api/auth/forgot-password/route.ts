import { serverFetch } from "@/lib/serverFetch"
import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const data = await serverFetch(`/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })

  return NextResponse.json(data, { status: 201 })
}