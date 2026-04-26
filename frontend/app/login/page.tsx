// app/login/page.tsx
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import AuthForm from "@/components/AuthForm"

export default async function LoginPage() {
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
            Stop searching.<br />
            Start <em>asking.</em>
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome back.</h1>
            <p className="auth-form-subtitle">Sign in to continue</p>
          </div>
          <AuthForm mode="login" />  {/* 👈 just pass mode */}
          <p className="auth-switch">
            No account? <Link href="/register">Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}