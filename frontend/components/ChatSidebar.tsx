"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

interface Session {
  id: string
  title: string
  created_at: string
}

interface Document {
  filename: string
  total_chunks: number
}

interface Props {
  document: Document
  sessions: Session[]
  currentSessionId: string
  userEmail: string
}

export default function ChatSidebar({
  document,
  sessions,
  currentSessionId,
  userEmail
}: Props) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  const initials = userEmail.slice(0, 1).toUpperCase()

  return (
    <div className="sidebar">

      {/* TOP */}
      <div className="sidebar-top">
        <Link href="/dashboard" className="sidebar-logo">
          <span className="logo-dot" />
          AskMyDocs
        </Link>

        {/* DOC PILL */}
        <div className="doc-pill">
          <div className="doc-pill-icon">📄</div>
          <div>
            <p className="doc-pill-name">{document?.filename ?? ""}</p>
            <p className="doc-pill-meta">
              {document?.total_chunks ?? 0} chunks
            </p>
          </div>
        </div>
      </div>

      {/* SESSIONS */}
      <p className="sidebar-section">Conversations</p>

      <div className="sidebar-chats">
        {sessions.length === 0 && (
          <p className="sidebar-empty">No conversations yet</p>
        )}
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/chat/${s.id}`}
            className={`chat-item ${s.id === currentSessionId ? "active" : ""}`}
          >
            <p className="chat-item-title">{s.title}</p>
            <p className="chat-item-time">
              {new Date(s.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              })}
            </p>
          </Link>
        ))}
      </div>

      {/* BOTTOM */}
      <div className="sidebar-bottom">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <p className="user-email">{userEmail}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Out
        </button>
      </div>

    </div>
  )
}