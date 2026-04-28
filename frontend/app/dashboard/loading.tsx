export default function DashboardLoading() {
  return (
    <div className="dashboard-wrap">

      {/* NAV */}
      <nav className="dash-nav">
        <div className="skel" style={{ width: 130, height: 22, borderRadius: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <div className="skel" style={{ width: 32, height: 32, borderRadius: "50%" }} />
          <div className="skel" style={{ width: 32, height: 32, borderRadius: 8 }} />
        </div>
      </nav>

      <main className="dash-main">

        {/* HEADER */}
        <div className="dash-header">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="skel" style={{ width: 210, height: 46, borderRadius: 10 }} />
            <div className="skel" style={{ width: 290, height: 15, borderRadius: 6 }} />
          </div>
          <div className="skel" style={{ width: 128, height: 44, borderRadius: 12 }} />
        </div>

        {/* CARD GRID */}
        <div className="docs-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="doc-card" style={{ animation: "none" }}>
              {/* Banner */}
              <div className="skel" style={{ height: 96, borderRadius: 0, animation: "shimmer 1.6s ease infinite" }} />
              {/* Body */}
              <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skel" style={{ width: "72%", height: 14 }} />
                <div className="skel" style={{ width: "48%", height: 12 }} />
                <div className="skel" style={{ width: "100%", height: 38, borderRadius: 11, marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
