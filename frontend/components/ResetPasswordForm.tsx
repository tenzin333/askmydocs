"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clientFetch } from "@/lib/clientFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  token: string
}

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="forgot-sent">
        <div className="forgot-sent-icon" style={{ background: "var(--accent)" }}>!</div>
        <h2 className="forgot-sent-title">Invalid link</h2>
        <p className="forgot-sent-desc">
          This reset link is missing or malformed. Please request a new one.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    } 

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      await clientFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      })
      toast.success("Password reset — please sign in")
      router.push("/login")
    } catch (err: any) {
      toast.error(err.message || "Reset failed. The link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <Label htmlFor="new">New password</Label>
        <Input
          id="new"
          type="password"
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Resetting…" : "Reset password →"}
      </Button>
    </form>
  )
}
