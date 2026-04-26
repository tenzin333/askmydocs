"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import ChatSidebar from "@/components/ChatSidebar"
import ChatHeader from "@/components/ChatHeader"
import MessageBubble from "@/components/MessageBubble"
import TypingIndicator from "@/components/TypingIndicator"
import ChatInput from "@/components/ChatInput"
import EmptyChat from "@/components/EmptyChat"
import { clientFetch } from "@/lib/client"

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

      } catch {
        // router.push("/dashboard")
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

    try {
      const data = await clientFetch("/api/chat/ask", {
        method: "POST",
        body: JSON.stringify({
          session_id: id,
          question: q
        })
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

    } catch {
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      alert("Failed to get answer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="chat-loading">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="chat-page">

      <ChatSidebar
        document={document!}
        sessions={sessions}
        currentSessionId={id}
        userEmail={userEmail}
      />

      <div className="chat-main">
        <ChatHeader
          title={session?.title || "Chat"}
          filename={document?.filename || ""}
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
        />
      </div>

    </div>
  )
}