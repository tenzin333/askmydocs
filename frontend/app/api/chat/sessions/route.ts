import { serverFetch } from "@/lib/serverFetch";
import { getSession } from "@/lib/session";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: { document_id?: string } }
) {
  const document_id = context.params?.document_id;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const url = document_id
    ? `/api/chat/sessions?document_id=${document_id}`
    : `/api/chat/sessions`;

  const data = await serverFetch(url);

  return NextResponse.json(data, { status: 200 });
}