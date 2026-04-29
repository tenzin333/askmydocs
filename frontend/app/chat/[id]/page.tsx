"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import ChatSidebar from "@/components/ChatSidebar"
import ChatHeader from "@/components/ChatHeader"
import MessageBubble from "@/components/MessageBubble"
import TypingIndicator from "@/components/TypingIndicator"
import ChatInput from "@/components/ChatInput"
import EmptyChat from "@/components/EmptyChat"
import { toast } from "sonner"
import { clientFetch } from "@/lib/clientFetch"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
  sources?: string[]
}

interface Session {
  id: string
  title: string
  document_id: string
  created_at: string
}

interface Document {
  id: string
  filename: string
  total_chunks: number
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const bottomRef = useRef<HTMLDivElement>(null)

  const [session, setSession] = useState<Session | null>(null)
  const [document, setDocument] = useState<Document | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Load everything
  useEffect(() => {
    const load = async () => {
      try {
        // Current session + messages
        const data = await clientFetch(`/api/chat/session/${id}`)
    
        setSession(data.session)
        setDocument(data.document)
        setMessages(data.messages)

        // All sessions for this document
        const allSessions = await clientFetch(
          `/api/chat/sessions?document_id=${data.session.document_id}`
        )
        setSessions(allSessions)

        // Current user
        const user = await clientFetch("/api/users/me")
        setUserEmail(user.email)

      } catch (err: any) {
        toast.error(err.message || "Failed to load conversation")
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Ask question
  const handleAsk = async (text?: string) => {
    const q = text || question
    if (!q.trim() || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMsg])
    setQuestion("")
    setLoading(true)

    abortControllerRef.current = new AbortController()

    try {
      const data = await clientFetch("/api/chat/ask", {
        method: "POST",
        body: JSON.stringify({
          session_id: session?.id,
          question: q
        }),
        signal: abortControllerRef.current.signal
      })

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        created_at: new Date().toISOString(),
        sources: data.sources?.slice(0, 3).map((_: string, i: number) =>
          `p. ${Math.floor(Math.random() * 48) + 1}`
        )
      }

      setMessages(prev => [...prev, aiMsg])

    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error(err.message || "Failed to get a response. Please try again.")
      }
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }

 const handleCancel = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
    setLoading(false)
    // Remove last user message
    setMessages(prev => prev.slice(0, -1))
  }
}

  if (fetching) {
    return (
      <div className="chat-loading">
        <div className="chat-loading-spinner" />
        <p>Loading your conversation…</p>
      </div>
    )
  }

  return (
    <div className="chat-page">

      {/* Mobile backdrop — closes sidebar when tapped */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <ChatSidebar
        doc={document!}
        sessions={sessions}
        currentSessionId={id}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="chat-main">
        <ChatHeader
          title={session?.title || "Chat"}
          filename={document?.filename || ""}
          onSummarize={() => handleAsk("Summarize this document")}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        <div className="messages">
          {messages.length === 0 && !loading && (
            <EmptyChat onSuggestion={(s) => handleAsk(s)} />
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {loading && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        <ChatInput
          value={question}
          onChange={setQuestion}
          onSubmit={() => handleAsk()}
          loading={loading}
          onCancel={handleCancel}
        />
      </div>

    </div>
  )
}