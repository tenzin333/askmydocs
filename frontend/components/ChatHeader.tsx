"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Props {
  title: string
  filename: string
}

export default function ChatHeader({ title, filename }: Props) {
  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <Link href="/dashboard" className="chat-back">
          ← Back
        </Link>
        <div className="chat-header-info">
          <p className="chat-header-title">{title}</p>
          <p className="chat-header-filename">📄 {filename}</p>
        </div>
      </div>
      <div className="chat-header-right">
        <div className="chat-status">
          <span className="chat-status-dot" />
          Ready
        </div>
      </div>
    </div>
  )
}