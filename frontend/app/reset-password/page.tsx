import Link from "next/link"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import ResetPasswordForm from "@/components/ResetPasswordForm"

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const session = await getSession()
  if (session) redirect("/dashboard")

  const { token } = await searchParams

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <Link href="/" className="auth-logo">
          <span className="logo-dot" />
          AskMyDocs
        </Link>
        <div>
          <p className="auth-quote">
            Almost<br />
            <em>there.</em>
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">New password.</h1>
            <p className="auth-form-subtitle">Choose a strong password to secure your account</p>
          </div>
          <ResetPasswordForm token={token ?? ""} />
          <p className="auth-switch">
            Back to <Link href="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
