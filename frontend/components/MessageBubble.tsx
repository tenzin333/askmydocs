interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
  sources?: string[]
}

function applyInline(text: string, key: string | number) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return (
    <span key={key}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i}>{part.slice(1, -1)}</code>
        }
        return part
      })}
    </span>
  )
}

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`ul-${listKey++}`}>{listItems}</ul>)
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    if (/^\s*[\*\-]\s+/.test(line)) {
      const content = line.replace(/^\s*[\*\-]\s+/, "")
      listItems.push(<li key={i}>{applyInline(content, i)}</li>)
    } else {
      flushList()
      if (line.trim()) {
        elements.push(<p key={i}>{applyInline(line, i)}</p>)
      }
    }
  })

  flushList()
  return elements
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
          {isUser
            ? <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
            : renderMarkdown(message.content)
          }
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="msg-sources">
            <span className="source-label">Sources</span>
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
