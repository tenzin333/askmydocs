"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clientFetch } from "@/lib/clientFetch"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await clientFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="forgot-sent">
        <div className="forgot-sent-icon">✓</div>
        <h2 className="forgot-sent-title">Check your inbox</h2>
        <p className="forgot-sent-desc">
          If <strong>{email}</strong> is registered, you&apos;ll receive a
          password reset link shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {error && <p className="form-error">⚠ {error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Send reset link →"}
      </Button>
    </form>
  )
}
