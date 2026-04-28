import { getSession } from "@/lib/session"
import { serverFetch } from "@/lib/serverFetch"
import { redirect } from "next/navigation"
import DashboardClient from "@/components/DashboardClient"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const docs = await serverFetch("/api/documents/").catch(() => [])

  return (
    <DashboardClient
      initialDocs={docs}
      userEmail={session.user.email}
    />
  )
}