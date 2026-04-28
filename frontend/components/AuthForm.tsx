"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clientFetch } from "@/lib/clientFetch"

interface AuthFormProps {
  mode: "login" | "register"
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const isLogin = mode === "login"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isLogin) {
        // Login → set httpOnly cookie
        await clientFetch("/api/auth/login", {
            method: 'POST',
            body: JSON.stringify({ email, password })
        })
      } else {
        await clientFetch("/api/auth/register", {
            method: 'POST',
            body: JSON.stringify({ email, password })
        })
      }

      router.push("/dashboard")
      router.refresh()

    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">

      <div className="form-group">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="form-error">⚠ {error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading
          ? "Please wait..."
          : isLogin ? "Sign in →" : "Create account →"
        }
      </Button>

      {isLogin && (
        <p className="auth-divider">
          <Link href="/forgot-password" className="auth-switch-link">
            Forgot password?
          </Link>
        </p>
      )}

    </form>
  )
}