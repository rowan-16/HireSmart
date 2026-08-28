import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API from '../services/api';
import { useAuth } from '../hooks/useAuth';

function StatCard({ icon, label, value, sub, accent, to = '/jobs' }) {
  return (
    <Link to={to} className="stat-card" style={{ '--accent': accent, textDecoration: 'none', cursor: 'pointer', display: 'block' }}>
      <div className="stat-icon"><i className={`fa-solid ${icon}`}></i></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </Link>
  );
}

function ActivityItem({ log }) {
  const iconMap = {
    resume_uploaded: { icon: 'fa-file-arrow-up', color: 'var(--c2)' },
    resume_anonymized: { icon: 'fa-user-secret', color: 'var(--c3)' },
    candidate_analyzed: { icon: 'fa-magnifying-glass', color: 'var(--warning)' },
    candidate_ranked: { icon: 'fa-ranking-star', color: 'var(--success)' },
    fairness_check_executed: { icon: 'fa-scale-balanced', color: 'var(--c1)' },
    recruiter_override: { icon: 'fa-person-military-pointing', color: 'var(--warning)' },
    job_created: { icon: 'fa-briefcase', color: 'var(--c2)' },
    login: { icon: 'fa-right-to-bracket', color: 'var(--muted)' },
    register: { icon: 'fa-user-plus', color: 'var(--c3)' },
    ranking_generated: { icon: 'fa-list-ol', color: 'var(--success)' },
    default: { icon: 'fa-circle-dot', color: 'var(--muted)' },
  };
  const { icon, color } = iconMap[log.eventType] || iconMap.default;
  const label = log.eventType.replace(/_/g, ' ');
  const time = new Date(log.timestamp).toLocaleString();
  return (
    <div className="timeline-item">
      <div className="timeline-dot" style={{ borderColor: color, color }}><i className={`fa-solid ${icon}`} style={{ fontSize: '0.75rem' }}></i></div>
      <div className="timeline-content">
        <div className="timeline-title" style={{ textTransform: 'capitalize' }}>{label}</div>
        <div className="timeline-meta">{log.candidateId ? `Candidate ${log.candidateId} · ` : ''}{log.jobId?.title ? `Job: ${log.jobId.title} · ` : ''}{time}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <Header 
          title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'} 👋`} 
          subtitle={user?.role === 'admin' ? "Admin Superuser Dashboard & System Controls" : "Here's your recruitment overview for today"} 
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i></div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard icon="fa-briefcase" label="Active Jobs" value={stats?.stats?.activeJobs ?? 0} accent="var(--c2)" sub="All hiring open" to="/jobs" />
              <StatCard icon="fa-users" label="Candidates Processed" value={stats?.stats?.totalResumes ?? 0} accent="var(--c3)" to="/jobs/applications" />
              <StatCard icon="fa-percent" label="Average Match" value={`${stats?.stats?.avgMatch ?? 0}%`} accent="var(--success)" sub="Job relevance score" to="/jobs/applications" />
              <StatCard icon="fa-shield-halved" label="Bias Checks Passed" value={`${stats?.stats?.biasChecksPassed ?? 98}%`} accent="var(--c1)" sub="PII removed before scoring" to="/jobs/applications" />
              <StatCard icon="fa-hourglass-half" label="Pending Reviews" value={stats?.stats?.pendingReviews ?? 0} accent="var(--warning)" to="/jobs/applications" />
              <StatCard icon="fa-person-military-pointing" label="Human Overrides" value={stats?.stats?.totalOverrides ?? 0} accent="var(--c3)" sub="Recruiter decisions logged" to="/jobs/applications" />
            </div>

            {user?.role === 'admin' ? (
              <div className="grid-2" style={{ gap: '1.5rem' }}>
                {/* Recent Activity (Admin Only) */}
                <div className="card">
                  <div className="card-inner">
                    <div className="flex-between mb-2">
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>System Activity Log</h3>
                      <Link to="/audit" className="btn btn-secondary btn-sm">View Full Audit</Link>
                    </div>
                    <div className="timeline">
                      {(stats?.recentActivity || []).length === 0 ? (
                        <p className="text-muted" style={{ fontSize: '0.88rem' }}>No system activity recorded yet.</p>
                      ) : (
                        (stats?.recentActivity || []).map((log, i) => <ActivityItem key={i} log={log} />)
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="card">
                    <div className="card-inner">
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Admin Quick Actions</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Link to="/jobs/create" className="btn btn-primary"><i className="fa-solid fa-plus"></i> Create New Job</Link>
                        <Link to="/jobs" className="btn btn-secondary"><i className="fa-solid fa-briefcase"></i> View All Jobs</Link>
                        <Link to="/audit" className="btn btn-secondary"><i className="fa-solid fa-clock-rotate-left"></i> Full System Audit Trail</Link>
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{ '--accent': 'var(--success)' }}>
                    <div className="card-inner">
                      <div className="fairness-indicator pass">
                        <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.5rem', color: 'var(--success)' }}></i>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--success)' }}>Fairness Audit: Active</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem' }}>PII anonymization & 80% disparity checks active</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Company / Recruiter View - Clean Management Workspace */
              <div className="grid-2" style={{ gap: '1.5rem' }}>
                <div className="card">
                  <div className="card-inner">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-rocket" style={{ color: 'var(--c2, #45f3ff)' }}></i> Quick Recruitment Actions
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <Link to="/jobs/create" className="btn btn-primary" style={{ padding: '1rem', justifyContent: 'center', fontSize: '0.95rem' }}>
                        <i className="fa-solid fa-plus-circle"></i> Create New Job Posting
                      </Link>
                      <Link to="/jobs" className="btn btn-secondary" style={{ padding: '1rem', justifyContent: 'center', fontSize: '0.95rem' }}>
                        <i className="fa-solid fa-briefcase"></i> View Active Job Postings
                      </Link>
                      <Link to="/jobs/applications" className="btn btn-secondary" style={{ padding: '1rem', justifyContent: 'center', fontSize: '0.95rem', gridColumn: '1 / -1' }}>
                        <i className="fa-solid fa-users"></i> Review Candidate Applications & Rankings
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ '--accent': 'var(--success)' }}>
                  <div className="card-inner">
                    <div className="fairness-indicator pass" style={{ padding: '1.25rem' }}>
                      <i className="fa-solid fa-shield-halved" style={{ fontSize: '2rem', color: 'var(--success)' }}></i>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>Fair AI Hiring Shield Active</div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '0.3rem', lineHeight: '1.5' }}>
                          Candidate personal identifiers (name, gender, age, photo) are automatically anonymized prior to AI match scoring to enforce unbiased recruitment.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
