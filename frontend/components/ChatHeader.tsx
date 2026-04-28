"use client"

import Link from "next/link"

interface Props {
  title: string
  filename: string
  onSummarize: () => void
}

export default function ChatHeader({ title, filename, onSummarize }: Props) {
  return (
    <div className="chat-top">
      <div className="chat-header-left">
        <Link href="/dashboard" className="chat-back">
          ← Back
        </Link>
        <div className="chat-header-info">
          <p className="chat-top-title">{title}</p>
          <p className="chat-top-meta">📄 {filename}</p>
        </div>
      </div>
      <div className="chat-header-right">
        {/* <button className="summarize-btn" onClick={onSummarize}>
          Summarize this document
        </button> */}
        <div className="chat-status">
          <span className="status-dot" />
          Ready
        </div>
      </div>
    </div>
  )
}
