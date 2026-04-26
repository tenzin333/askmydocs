"use client"

import { useRef } from "react"

interface Props {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  loading
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    if (ref.current) {
      ref.current.style.height = "auto"
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 120)}px`
    }
  }

  return (
    <div className="chat-input">
      <div className="input-wrap">
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your document..."
          rows={1}
          disabled={loading}
          className="chat-textarea"
        />
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="send-btn"
        >
          ↑
        </button>
      </div>
      <p className="input-hint">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}