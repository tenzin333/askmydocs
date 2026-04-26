"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { clientFetch } from "@/lib/client"
import PDFUploader from "@/components/PDFUploader"

interface Document {
  id: string
  filename: string
  total_chunks: number
  created_at: string
  file_url: string
}

interface Props {
  initialDocs: Document[]
  userEmail: string
}

export default function DashboardClient({ initialDocs, userEmail }: Props) {
  const router = useRouter()
  const [docs, setDocs] = useState<Document[]>(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // =====================
  // UPLOAD
  // =====================
  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      })

      if (!res.ok) throw new Error("Upload failed")

      const newDoc = await res.json()
      setDocs(prev => [newDoc, ...prev])

    } catch (err) {
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  // =====================
  // DELETE
  // =====================
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return
    setDeleting(id)
    try {
      await clientFetch(`/api/documents/${id}`, { method: "DELETE" })
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch {
      alert("Delete failed.")
    } finally {
      setDeleting(null)
    }
  }

  // =====================
  // START CHAT
  // =====================
  const handleChat = async (docId: string, filename: string) => {
    try {
      const session = await clientFetch("/api/chat/session", {
        method: "POST",
        body: JSON.stringify({
          document_id: docId,
          title: filename
        })
      })
      router.push(`/chat/${session.id}`)
    } catch {
      alert("Could not start chat.")
    }
  }

  // =====================
  // LOGOUT
  // =====================
  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="dashboard-wrap">

      {/* NAVBAR */}
      <nav className="dash-nav">
        <Link href="/" className="home-logo">
          <span className="logo-dot" />
          AskMyDocs
        </Link>
        <div className="dash-nav-right">
          <span className="dash-email">{userEmail}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </nav>

      <main className="dash-main">

        {/* HEADER */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Your Documents</h1>
            <p className="dash-subtitle">
              Upload a PDF to start asking questions
            </p>
          </div>
          <PDFUploader onUpload={handleUpload} uploading={uploading} />
        </div>

        {/* EMPTY STATE */}
        {docs.length === 0 && (
          <div className="dash-empty">
            <div className="dash-empty-icon">📄</div>
            <h2 className="dash-empty-title">No documents yet</h2>
            <p className="dash-empty-desc">
              Upload your first PDF to get started
            </p>
          </div>
        )}

        {/* DOCUMENTS GRID */}
        {docs.length > 0 && (
          <div className="docs-grid">
            {docs.map((doc) => (
              <div key={doc.id} className="doc-card">

                {/* CARD HEADER */}
                <div className="doc-card-header">
                  <div className="doc-icon">📄</div>
                  <button
                    className="doc-delete"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                  >
                    {deleting === doc.id ? "..." : "×"}
                  </button>
                </div>

                {/* CARD BODY */}
                <div className="doc-card-body">
                  <p className="doc-name">{doc.filename}</p>
                  <p className="doc-meta">
                    {doc.total_chunks} chunks ·{" "}
                    {new Date(doc.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                </div>

                {/* CARD FOOTER */}
                <div className="doc-card-footer">
                  <Button
                    className="w-full btn-primary"
                    onClick={() => handleChat(doc.id, doc.filename)}
                  >
                    Ask questions →
                  </Button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}