import Link from "next/link"

export default function Home() {
  return (
    <>
      {/* NAV */}
      <nav className="home-nav">
        <Link href="/" className="home-logo">
          <span className="logo-dot" />
          AskMyDocs
        </Link>
        <div className="nav-links">
          <Link href="/login" className="nav-link">Login</Link>
          <Link href="/register" className="nav-cta">Get Started →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-tag">AI Document Intelligence</div>
          <h1 className="hero-title">
            Your documents,<br />
            <em>finally</em> answering<br />
            back.
          </h1>
          <p className="hero-desc">
            Upload any PDF and have a real conversation with it.
            No more endless scrolling — just ask, and get precise answers.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn-primary">
              Start for free →
            </Link>
            <Link href="/login" className="btn-ghost">
              Login <span className="arrow">→</span>
            </Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-visual">

            {/* PDF floating card */}
            <div className="pdf-card">
              <div className="pdf-icon">📄</div>
              <div>
                <span className="pdf-name">annual_report_2024.pdf</span>
                <span className="pdf-size">2.4 MB · 48 pages</span>
              </div>
            </div>

            {/* Chat mockup */}
            <div className="chat-mockup">
              <div className="chat-header">
                <div className="mac-dots">
                  <div className="mac-dot" style={{ background: '#ff5f57' }} />
                  <div className="mac-dot" style={{ background: '#febc2e' }} />
                  <div className="mac-dot" style={{ background: '#28c840' }} />
                </div>
                <span className="chat-title-bar">annual_report_2024.pdf</span>
              </div>

              <div className="chat-body">
                <div className="msg">
                  <div className="msg-avatar avatar-user">T</div>
                  <div className="msg-bubble bubble-user">
                    What was the total revenue in Q3?
                  </div>
                </div>
                <div className="msg">
                  <div className="msg-avatar avatar-ai">AI</div>
                  <div className="msg-bubble bubble-ai">
                    Q3 revenue reached <strong>$4.2 billion</strong>, a 23% increase year-over-year, driven by cloud services.
                  </div>
                </div>
                <div className="msg">
                  <div className="msg-avatar avatar-user">T</div>
                  <div className="msg-bubble bubble-user">
                    Which region performed best?
                  </div>
                </div>
                <div className="msg">
                  <div className="msg-avatar avatar-ai">AI</div>
                  <div className="msg-bubble bubble-ai">
                    <div className="typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              </div>

              <div className="chat-input-row">
                <div className="chat-input-mock">
                  Ask anything about your document...
                </div>
                <div className="chat-send-btn">↑</div>
              </div>
            </div>

            {/* Stats card */}
            <div className="stats-card">
              <div className="stats-num">2.4s</div>
              <div className="stats-label">avg. response time</div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        {[
          {
            num: "01",
            title: "Upload any PDF",
            desc: "Drop your document and watch it get processed in seconds. Reports, contracts, research papers — anything works."
          },
          {
            num: "02",
            title: "Ask in plain English",
            desc: "No commands, no syntax. Just ask exactly what you want to know, the same way you'd ask a colleague."
          },
          {
            num: "03",
            title: "Get precise answers",
            desc: "Powered by RAG — answers grounded in your document, not hallucinated. Every response traceable to source."
          }
        ].map((f) => (
          <div key={f.num} className="feature">
            <div className="feature-num">{f.num}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">
          Ready to stop<br /><em>ctrl+F</em>-ing?
        </h2>
        <p className="cta-desc">
          Join thousands of people who've stopped scrolling and started asking.
        </p>
        <Link href="/register" className="btn-primary">
          Upload your first PDF →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-logo">AskMyDocs</div>
        <div className="footer-credit">
          Built by <span>Tenzin</span>
        </div>
      </footer>
    </>
  )
}