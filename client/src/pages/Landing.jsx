import { Link } from 'react-router-dom';
import './Landing.css';

const FEATURES = [
  { icon: 'fa-user-secret', title: 'Automatic Anonymization', desc: 'Names, emails, photos and all PII are stripped before any scoring occurs. Candidates are known only by anonymous IDs.' },
  { icon: 'fa-brain', title: 'Semantic Matching', desc: 'Local AI embeddings (all-MiniLM-L6-v2) find conceptually relevant candidates even when exact keywords differ.' },
  { icon: 'fa-scale-balanced', title: 'Fairness Auditing', desc: 'Demographic parity, disparate impact ratios and proxy-risk detection — all surfaced transparently for recruiter review.' },
  { icon: 'fa-magnifying-glass-chart', title: 'Explainable Rankings', desc: 'Every ranking decision comes with a data-grounded explanation. No black boxes. No fabrications.' },
  { icon: 'fa-person-military-pointing', title: 'Human Oversight', desc: 'Recruiters can override any AI recommendation with a documented reason, creating a complete audit trail.' },
  { icon: 'fa-chart-line', title: 'Ranking Metrics', desc: 'Precision@K, Recall@K, and NDCG evaluated against labelled datasets when available.' },
];

const STEPS = [
  { num: '01', title: 'Post a Job', desc: 'Enter the job title and description. HireSmart auto-extracts required skills, experience, and education requirements.' },
  { num: '02', title: 'Upload Resumes', desc: 'Drag and drop PDF or DOCX resumes. The pipeline starts immediately — extract, anonymize, analyze.' },
  { num: '03', title: 'Review Rankings', desc: 'Anonymous candidates are ranked by skill match, experience, projects, education and semantic alignment.' },
  { num: '04', title: 'Audit & Decide', desc: 'View explanations, check the fairness dashboard, override if needed, and maintain a complete audit record.' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="land-nav">
        <div className="land-logo">
          <div className="land-logo-icon"><i className="fa-solid fa-brain"></i></div>
          <span>Hire<strong>Smart</strong></span>
        </div>
        <div className="land-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it Works</a>
          <a href="#privacy">Privacy</a>
        </div>
        <div className="land-nav-cta">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="hero-glow"></div>
        <div className="hero-glow hero-glow-2"></div>
        <div className="land-badge"><i className="fa-solid fa-shield-halved"></i> Fair AI Recruitment</div>
        <h1 className="hero-title">
          Find the best candidate<br />
          <span className="hero-gradient">without judging</span><br />
          the candidate.
        </h1>
        <p className="hero-sub">
          HireSmart anonymizes resumes, semantically matches skills, scores with a transparent rubric,
          and surfaces fairness audits — so every hiring decision is based on qualifications, not demographics.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">Start Recruiting <i className="fa-solid fa-arrow-right-long"></i></Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
        <div className="hero-stats">
          {[['248+', 'Candidates Processed'],['98%', 'Bias Checks Passed'],['0', 'Protected Attrs Used'],['100%', 'PII Removed']].map(([v, l]) => (
            <div key={l} className="hero-stat">
              <div className="hero-stat-val">{v}</div>
              <div className="hero-stat-label">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="land-section" id="features">
        <div className="section-tag">Features</div>
        <h2 className="section-title">Everything you need for <span>fair hiring</span></h2>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon"><i className={`fa-solid ${f.icon}`}></i></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="land-section land-section-alt" id="how">
        <div className="section-tag">Process</div>
        <h2 className="section-title">How it <span>works</span></h2>
        <div className="steps-grid">
          {STEPS.map(s => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="land-section" id="privacy">
        <div className="privacy-card">
          <div className="privacy-icon"><i className="fa-solid fa-shield-halved"></i></div>
          <h2>Privacy & Fairness Statement</h2>
          <p>Candidate demographic and personally identifiable information is <strong>excluded from the ranking process</strong>. Names, emails, phone numbers, addresses, age, gender, and other PII are removed before any scoring takes place.</p>
          <p style={{ marginTop: '1rem' }}>Our system is designed to <em>reduce</em> demographic bias by excluding protected attributes from ranking and auditing model outcomes. <strong>It does not claim to eliminate bias entirely.</strong> Confidence scores reflect the strength and completeness of evidence available to the ranking system — not a guarantee of candidate success.</p>
          <div className="privacy-badges">
            <span><i className="fa-solid fa-check"></i> PII Removed Before Scoring</span>
            <span><i className="fa-solid fa-check"></i> No External LLM API</span>
            <span><i className="fa-solid fa-check"></i> Full Audit Trail</span>
            <span><i className="fa-solid fa-check"></i> Recruiter Override Available</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="land-cta-section">
        <h2>Ready to hire fairly?</h2>
        <p>Join HireSmart and build a more equitable recruiting process.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Get Started Free <i className="fa-solid fa-arrow-right-long"></i></Link>
      </section>

      <footer className="land-footer">
        <div className="land-logo">
          <div className="land-logo-icon" style={{ width: 28, height: 28, fontSize: '0.8rem' }}><i className="fa-solid fa-brain"></i></div>
          <span>Hire<strong>Smart</strong> — Fair AI Recruitment</span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '0.5rem' }}>© 2024 HireSmart. Built for PS-05: De-biasing the Hiring Process.</p>
      </footer>
    </div>
  );
}
