"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clientFetch } from "@/lib/clientFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  userEmail: string
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function ChangePasswordForm({ userEmail }: Props) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const initials = userEmail?.slice(0, 1).toUpperCase() ?? "?"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password")
      return
    }

    setLoading(true)
    try {
      await clientFetch("/api/users/me/password", {
        method: "PUT",
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
        }),
      })
      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await clientFetch("/api/auth/logout", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="settings-wrap">
      <nav className="dash-nav">
        <Link href="/" className="home-logo">
          <span className="logo-dot" />
          AskMyDocs
        </Link>
        <div className="dash-nav-right">
          <Link href="/dashboard" className="settings-back-link">
            ← Library
          </Link>
          <div className="dash-avatar" title={userEmail}>{initials}</div>
          <button className="dash-logout-btn" onClick={handleLogout} title="Sign out">
            <SignOutIcon />
          </button>
        </div>
      </nav>

      <main className="settings-main">
        <div className="settings-card">
          <div className="settings-header">
            <h1 className="settings-title">Change password</h1>
            <p className="settings-subtitle">{userEmail}</p>
          </div>

          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-group">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="settings-divider" />

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
              <Label htmlFor="confirm">Confirm new password</Label>
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
              {loading ? "Saving…" : "Update password →"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
