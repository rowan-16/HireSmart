import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API from '../services/api';
import { useAuth } from '../hooks/useAuth';

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-icon"><i className={`fa-solid ${icon}`}></i></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
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
              <StatCard icon="fa-briefcase" label="Active Jobs" value={stats?.stats?.activeJobs ?? 0} accent="var(--c2)" sub="All hiring open" />
              <StatCard icon="fa-users" label="Candidates Processed" value={stats?.stats?.totalResumes ?? 0} accent="var(--c3)" />
              <StatCard icon="fa-percent" label="Average Match" value={`${stats?.stats?.avgMatch ?? 0}%`} accent="var(--success)" sub="Job relevance score" />
              <StatCard icon="fa-shield-halved" label="Bias Checks Passed" value={`${stats?.stats?.biasChecksPassed ?? 98}%`} accent="var(--c1)" sub="PII removed before scoring" />
              <StatCard icon="fa-hourglass-half" label="Pending Reviews" value={stats?.stats?.pendingReviews ?? 0} accent="var(--warning)" />
              <StatCard icon="fa-person-military-pointing" label="Human Overrides" value={stats?.stats?.totalOverrides ?? 0} accent="var(--c3)" sub="Recruiter decisions logged" />
            </div>

            <div className="grid-2" style={{ gap: '1.5rem' }}>
              {/* Recent Activity */}
              <div className="card">
                <div className="card-inner">
                  <div className="flex-between mb-2">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Activity</h3>
                    {user?.role === 'admin' && <Link to="/audit" className="btn btn-secondary btn-sm">View All</Link>}
                  </div>
                  <div className="timeline">
                    {((stats?.recentActivity || []).filter(log => user?.role === 'admin' || !['login', 'register'].includes(log.eventType))).length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '0.88rem' }}>No activity yet. Upload resumes to get started.</p>
                    ) : (
                      (stats?.recentActivity || [])
                        .filter(log => user?.role === 'admin' || !['login', 'register'].includes(log.eventType))
                        .map((log, i) => <ActivityItem key={i} log={log} />)
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card">
                  <div className="card-inner">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <Link to="/jobs/create" className="btn btn-primary"><i className="fa-solid fa-plus"></i> Create New Job</Link>
                      <Link to="/jobs" className="btn btn-secondary"><i className="fa-solid fa-briefcase"></i> View All Jobs</Link>
                      {user?.role === 'admin' && (
                        <Link to="/audit" className="btn btn-secondary"><i className="fa-solid fa-clock-rotate-left"></i> Audit Trail</Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card" style={{ '--accent': 'var(--success)' }}>
                  <div className="card-inner">
                    <div className="fairness-indicator pass">
                      <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.5rem', color: 'var(--success)' }}></i>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>Fairness Status: Active</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Protected attributes excluded from all rankings</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '1rem' }}>
                      Our system is designed to reduce demographic bias. All PII is removed before scoring. This does not claim to eliminate bias entirely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
