"use client"

import { clientFetch } from "@/lib/clientFetch"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Session {
  id: string
  title: string
  created_at: string
}

interface Doc {
  filename: string
  total_chunks: number
}

interface Props {
  doc: Doc | null
  sessions: Session[]
  currentSessionId: string
  userEmail: string
  isOpen?: boolean
  onClose?: () => void
}

function groupSessions(sessions: Session[]) {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  const groups: Record<string, Session[]> = {}
  const order: string[] = []

  for (const s of sessions) {
    const d = new Date(s.created_at)
    let label: string
    if (d.toDateString() === todayStr) label = "Today"
    else if (d.toDateString() === yesterdayStr) label = "Yesterday"
    else label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    if (!groups[label]) {
      groups[label] = []
      order.push(label)
    }
    groups[label].push(s)
  }

  return order.map(label => ({ label, items: groups[label] }))
}

function FileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function ChatSidebar({ doc, sessions = [], currentSessionId, userEmail, isOpen, onClose }: Props) {
  const router = useRouter()

  const handleLogout = async () => {
    await clientFetch("/api/auth/logout", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  const initials = userEmail?.slice(0, 1).toUpperCase() ?? "?"
  const username = userEmail?.split("@")[0] ?? ""
  const groups = groupSessions(sessions)

  return (
    <div className={`sidebar${isOpen ? " open" : ""}`}>

      {/* TOP */}
      <div className="sidebar-top">
        <div className="sidebar-logo-row">
          <Link href="/dashboard" className="sidebar-logo">
            <span className="logo-dot" />
            AskMyDocs
          </Link>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <XIcon />
          </button>
        </div>

        <div className="sidebar-doc">
          <div className="sidebar-doc-icon">
            <FileIcon />
          </div>
          <div className="sidebar-doc-info">
            <p className="sidebar-doc-label">Currently reading</p>
            <p className="doc-pill-name">{doc?.filename ?? "—"}</p>
            <p className="doc-pill-meta">{doc?.total_chunks ?? 0} chunks indexed</p>
          </div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="sidebar-section-row">
        <span className="sidebar-section-label">Conversations</span>
        <span className="sidebar-count">{sessions.length}</span>
      </div>

      {/* CONVERSATIONS */}
      <div className="sidebar-chats">
        {sessions.length === 0 && (
          <div className="sidebar-empty">
            <span>No conversations yet</span>
            <span>Ask a question to start</span>
          </div>
        )}

        {groups.map(({ label, items }) => (
          <div key={label} className="sidebar-date-group">
            <p className="sidebar-date-label">{label}</p>
            {items.map(s => (
              <Link
                key={s.id}
                href={`/chat/${s.id}`}
                className={`chat-item ${s.id === currentSessionId ? "active" : ""}`}
              >
                <div className="chat-item-body">
                  <p className="chat-item-title">{s.title}</p>
                  <p className="chat-item-time">
                    {new Date(s.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* USER FOOTER */}
      <div className="sidebar-bottom">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <p className="user-name">{username}</p>
            <p className="user-email">{userEmail}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Sign out">
          <SignOutIcon />
        </button>
      </div>

    </div>
  )
}
