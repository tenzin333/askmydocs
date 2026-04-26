"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  onUpload: (file: File) => void
  uploading: boolean
}

export default function PDFUploader({ onUpload, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported")
      return
    }
    onUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
      />

      <div
        className={`uploader ${dragging ? "uploader-drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <p className="uploader-text">Processing PDF...</p>
        ) : (
          <>
            <p className="uploader-text">
              Drop PDF here or{" "}
              <span className="uploader-link">browse</span>
            </p>
            <p className="uploader-hint">PDF files only</p>
          </>
        )}
      </div>
    </>
  )
}