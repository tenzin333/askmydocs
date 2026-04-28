export default function ChatLoading() {
  return (
    <div className="chat-page">

      {/* ── SIDEBAR ── */}
      <div className="sidebar">

        {/* Top: logo + doc pill */}
        <div className="sidebar-top">
          <div className="skel-dark" style={{ width: 120, height: 20, borderRadius: 6 }} />
          <div className="skel-dark" style={{ height: 62, borderRadius: 12 }} />
        </div>

        {/* Section row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 6px" }}>
          <div className="skel-dark" style={{ width: 80, height: 10 }} />
          <div className="skel-dark" style={{ width: 22, height: 16, borderRadius: 20 }} />
        </div>

        {/* Conversation items */}
        <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="skel-dark"
              style={{ height: 42, borderRadius: 9, opacity: Math.max(1 - i * 0.13, 0.2) }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 16px", display: "flex", gap: 10, alignItems: "center" }}>
          <div className="skel-dark" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
            <div className="skel-dark" style={{ width: "55%", height: 11 }} />
            <div className="skel-dark" style={{ width: "80%", height: 10 }} />
          </div>
          <div className="skel-dark" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="chat-main">

        {/* Header */}
        <div className="chat-top">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
            <div className="skel" style={{ width: 64, height: 32, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <div className="skel" style={{ width: 180, height: 15, borderRadius: 5 }} />
              <div className="skel" style={{ width: 130, height: 11, borderRadius: 4 }} />
            </div>
          </div>
          <div className="skel" style={{ width: 68, height: 28, borderRadius: 20, flexShrink: 0 }} />
        </div>

        {/* Messages — one faint AI bubble to show layout */}
        <div className="messages">
          <div className="msg ai">
            <div className="skel" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="skel" style={{ width: 64, height: 10 }} />
              <div className="skel" style={{ width: "100%", height: 88, borderRadius: 18, borderBottomLeftRadius: 5 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                <div className="skel" style={{ height: 40, borderRadius: 10 }} />
                <div className="skel" style={{ height: 40, borderRadius: 10 }} />
                <div className="skel" style={{ height: 40, borderRadius: 10 }} />
                <div className="skel" style={{ height: 40, borderRadius: 10 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="chat-input">
          <div className="skel" style={{ height: 94, borderRadius: 20, maxWidth: 820, margin: "0 auto" }} />
        </div>

      </div>
    </div>
  )
}
