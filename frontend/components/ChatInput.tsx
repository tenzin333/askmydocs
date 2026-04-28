"use client"

import { useRef } from "react"

interface Props {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  onCancel: () => void
  loading: boolean
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  )
}

export default function ChatInput({ value, onChange, onSubmit, onCancel, loading }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!loading) onSubmit()
    }
    if (e.key === "Escape" && loading) {
      onCancel()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    if (ref.current) {
      ref.current.style.height = "auto"
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`
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
          placeholder="Ask anything about your document…"
          rows={1}
          disabled={loading}
          className="chat-textarea"
        />
        <div className="input-bottom">
          {loading ? (
            <button onClick={onCancel} className="cancel-btn" title="Stop generating">
              <StopIcon />
            </button>
          ) : (
            <button onClick={onSubmit} disabled={!value.trim()} className="send-btn" title="Send">
              <SendIcon />
            </button>
          )}
        </div>
      </div>
      <p className="input-hint">
        {loading ? "Generating… Esc to stop" : "Enter to send · Shift+Enter for new line"}
      </p>
    </div>
  )
}
