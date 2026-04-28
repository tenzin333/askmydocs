"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { clientFetch } from "@/lib/clientFetch"

interface Doc {
  id: string
  filename: string
  total_chunks: number
  created_at: string
  file_url: string
}

interface Props {
  initialDocs: Doc[]
  userEmail: string
}

function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function DocIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function DashboardClient({ initialDocs, userEmail }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<Doc[]>(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") { alert("Only PDF files are supported"); return }
    await handleUpload(file)
    e.target.value = ""
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const newDoc = await clientFetch("/api/documents", { method: "POST", body: formData })
      setDocs(prev => [newDoc, ...prev])
    } catch (err: any) {
      alert(err.message || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return
    setDeleting(id)
    try {
      await clientFetch(`/api/documents/${id}`, { method: "DELETE" })
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch {
      alert("Delete failed. Please try again.")
    } finally {
      setDeleting(null)
    }
  }

  const handleChat = async (docId: string, filename: string) => {
    setChatLoading(docId)
    try {
      const chatSession = await clientFetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: docId, title: filename })
      })
      router.push(`/chat/${chatSession.id}`)
    } catch {
      alert("Could not start chat. Please try again.")
      setChatLoading(null)
    }
  }

  const handleLogout = async () => {
    await clientFetch("/api/auth/logout", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") { alert("Only PDF files are supported"); return }
    await handleUpload(file)
  }

  const initials = userEmail?.slice(0, 1).toUpperCase() ?? "?"

  return (
    <div
      className="dashboard-wrap"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

      {/* DRAG OVERLAY */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-box">
            <div className="drag-overlay-icon">
              <UploadIcon />
            </div>
            <p className="drag-overlay-title">Drop your PDF here</p>
            <p className="drag-overlay-sub">PDF files only</p>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="dash-nav">
        <Link href="/" className="home-logo">
          <span className="logo-dot" />
          AskMyDocs
        </Link>
        <div className="dash-nav-right">
          <div className="dash-avatar" title={userEmail}>{initials}</div>
          <button className="dash-logout-btn" onClick={handleLogout} title="Sign out">
            <SignOutIcon />
          </button>
        </div>
      </nav>

      <main className="dash-main">

        {/* HEADER */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Your library.</h1>
            <p className="dash-subtitle">
              {docs.length === 0
                ? "Upload a PDF to start asking questions"
                : `${docs.length} document${docs.length !== 1 ? "s" : ""} · drag & drop or click to add more`}
            </p>
          </div>
          <button className="dash-upload-btn" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon />
            Upload PDF
          </button>
        </div>

        {/* UPLOADING CARD — shows in grid */}
        {uploading && (
          <div className="docs-grid" style={{ marginBottom: 18 }}>
            <div className="uploading-card">
              <div className="uploading-banner">
                <div className="uploading-spinner" />
              </div>
              <div className="uploading-body">
                <p className="uploading-name">Processing PDF…</p>
                <p className="uploading-sub">Extracting text and generating embeddings</p>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {docs.length === 0 && !uploading && (
          <div className="dash-empty" onClick={() => fileInputRef.current?.click()}>
            <div className="dash-empty-icon-wrap">
              <DocIcon size={28} />
            </div>
            <h2 className="dash-empty-title">No documents yet</h2>
            <p className="dash-empty-desc">
              Click to upload your first PDF, or drag one anywhere onto this page
            </p>
          </div>
        )}

        {/* DOCS GRID */}
        {docs.length > 0 && (
          <div className="docs-grid">
            {docs.map((doc) => (
              <div key={doc.id} className="doc-card">

                <div className="doc-card-banner">
                  <div className="doc-banner-icon">
                    <DocIcon size={88} />
                  </div>
                  <button
                    className="doc-delete"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    title="Delete document"
                  >
                    {deleting === doc.id ? "…" : <TrashIcon />}
                  </button>
                </div>

                <div className="doc-card-body">
                  <p className="doc-name" title={doc.filename}>{doc.filename}</p>
                  <p className="doc-meta">
                    {doc.total_chunks} chunks · {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <div className="doc-card-footer">
                  <button
                    className="doc-chat-btn"
                    onClick={() => handleChat(doc.id, doc.filename)}
                    disabled={chatLoading === doc.id}
                  >
                    <span>{chatLoading === doc.id ? "Opening…" : "Ask questions"}</span>
                    <ArrowIcon />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
