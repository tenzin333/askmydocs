import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import ChangePasswordForm from "@/components/ChangePasswordForm"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <ChangePasswordForm userEmail={session.user.email} />
}
