"use client"

import Link from "next/link"

interface Props {
  title: string
  filename: string
  onSummarize: () => void
  onToggleSidebar?: () => void
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export default function ChatHeader({ title, filename, onSummarize, onToggleSidebar }: Props) {
  return (
    <div className="chat-top">
      <div className="chat-header-left">
        <button className="sidebar-menu-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <MenuIcon />
        </button>
        <Link href="/dashboard" className="chat-back">
          ← Back
        </Link>
        <div className="chat-header-info">
          <p className="chat-top-title">{title}</p>
          <p className="chat-top-meta">📄 {filename}</p>
        </div>
      </div>
      <div className="chat-header-right">
        <div className="chat-status">
          <span className="status-dot" />
          Ready
        </div>
      </div>
    </div>
  )
}
