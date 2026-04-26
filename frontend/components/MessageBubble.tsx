interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
  sources?: string[]
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={`msg ${isUser ? "user" : "ai"}`}>
      <div className={`msg-avatar ${isUser ? "user" : "ai"}`}>
        {isUser ? "T" : "A"}
      </div>
      <div className="msg-content">
        {!isUser && <p className="msg-label">AskMyDocs</p>}
        <div className="msg-bubble">
          <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="msg-sources">
            <span className="source-label">Sources:</span>
            {message.sources.map((s, i) => (
              <span key={i} className="source-chip">{s}</span>
            ))}
          </div>
        )}

        <p className="msg-time">
          {new Date(message.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>
      </div>
    </div>
  )
}