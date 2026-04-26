"use client"

interface Props {
  onSuggestion: (text: string) => void
}

const suggestions = [
  "Summarize this document",
  "What are the key findings?",
  "List the main points",
  "What conclusions were drawn?"
]

export default function EmptyChat({ onSuggestion }: Props) {
  return (
    <div className="msg ai">
      <div className="msg-avatar ai">A</div>
      <div className="msg-content">
        <p className="msg-label">AskMyDocs</p>
        <div className="msg-bubble">
          I've read your document. Ask me anything — I'll give you
          precise, grounded answers.
        </div>
        <div className="suggestions-grid">
          {suggestions.map((s) => (
            <button
              key={s}
              className="suggestion-chip"
              onClick={() => onSuggestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}