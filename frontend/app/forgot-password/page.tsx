import Link from "next/link"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import ForgotPasswordForm from "@/components/ForgotPasswordForm"

export default async function ForgotPasswordPage() {
  const session = await getSession()
  if (session) redirect("/dashboard")

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <Link href="/" className="auth-logo">
          <span className="logo-dot" />
          AskMyDocs
        </Link>
        <div>
          <p className="auth-quote">
            Happens to<br />
            the best of <em>us.</em>
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Reset password.</h1>
            <p className="auth-form-subtitle">
              Enter your email and we&apos;ll send a reset link
            </p>
          </div>
          <ForgotPasswordForm />
          <p className="auth-switch">
            Remembered it? <Link href="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
