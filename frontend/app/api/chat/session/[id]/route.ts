import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { serverFetch } from "@/lib/serverFetch";

const API_URL = process.env.API_URL || "http://localhost:8000"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  const session = await getSession()
  if (!session) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })


    const data = await serverFetch(`/api/chat/session/${id}`)
    return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params 
  const session = await getSession()
  if (!session) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const res = await fetch(`${API_URL}/api/chat/session/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.token}` }
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}