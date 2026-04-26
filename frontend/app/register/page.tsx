// app/register/page.tsx
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import AuthForm from "@/components/AuthForm"

export default async function RegisterPage() {
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
            Your documents have<br />
            <em>answers.</em> Start asking.
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create account.</h1>
            <p className="auth-form-subtitle">Free forever. No card required.</p>
          </div>
          <AuthForm mode="register" />  {/* 👈 just pass mode */}
          <p className="auth-switch">
            Have an account? <Link href="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}