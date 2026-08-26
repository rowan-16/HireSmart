import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

const EVENT_META = {
  resume_uploaded: { icon: 'fa-file-arrow-up', color: 'var(--c2)', label: 'Resume Uploaded' },
  resume_extracted: { icon: 'fa-file-lines', color: 'var(--c3)', label: 'Text Extracted' },
  resume_anonymized: { icon: 'fa-user-secret', color: 'var(--c3)', label: 'Resume Anonymized' },
  candidate_analyzed: { icon: 'fa-magnifying-glass', color: 'var(--warning)', label: 'Candidate Analyzed' },
  candidate_ranked: { icon: 'fa-ranking-star', color: 'var(--success)', label: 'Candidate Ranked' },
  fairness_check_executed: { icon: 'fa-scale-balanced', color: 'var(--c1)', label: 'Fairness Check' },
  recruiter_viewed_explanation: { icon: 'fa-eye', color: 'var(--c2)', label: 'Explanation Viewed' },
  recruiter_viewed_candidate: { icon: 'fa-user', color: 'var(--muted)', label: 'Candidate Viewed' },
  recruiter_override: { icon: 'fa-person-military-pointing', color: 'var(--warning)', label: 'Recruiter Override' },
  job_created: { icon: 'fa-briefcase', color: 'var(--c2)', label: 'Job Created' },
  ranking_generated: { icon: 'fa-list-ol', color: 'var(--success)', label: 'Ranking Generated' },
  evaluation_run: { icon: 'fa-chart-line', color: 'var(--c3)', label: 'Evaluation Run' },
  login: { icon: 'fa-right-to-bracket', color: 'var(--muted)', label: 'Login' },
  register: { icon: 'fa-user-plus', color: 'var(--c3)', label: 'Register' },
};

export default function AuditDashboard() {
  const [logs, setLogs] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ eventType: '', candidateId: '', page: 1 });
  const [total, setTotal] = useState(0);

  useEffect(() => { loadLogs(); }, [filter]);
  useEffect(() => { API.get('/audit/overrides').then(r => setOverrides(r.data.overrides || [])).catch(console.error); }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20, page: filter.page });
      if (filter.eventType) params.set('eventType', filter.eventType);
      if (filter.candidateId) params.set('candidateId', filter.candidateId);
      const { data } = await API.get(`/audit?${params}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <div className="page-header">
          <h1 className="page-title">Audit <span>Trail</span></h1>
          <p className="page-sub">Complete log of all system actions — tamper-evident and searchable</p>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-inner" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
              <label className="form-label">Event Type</label>
              <select className="form-select" value={filter.eventType} onChange={e => setFilter(f => ({ ...f, eventType: e.target.value, page: 1 }))}>
                <option value="">All Events</option>
                {Object.entries(EVENT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 140 }}>
              <label className="form-label">Candidate ID</label>
              <input className="form-input" placeholder="e.g. C-024" value={filter.candidateId} onChange={e => setFilter(f => ({ ...f, candidateId: e.target.value, page: 1 }))} />
            </div>
            <button className="btn btn-secondary" onClick={() => setFilter({ eventType: '', candidateId: '', page: 1 })}>
              <i className="fa-solid fa-rotate"></i> Reset
            </button>
          </div>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Main audit log */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>User</th>
                    <th>Protected Attrs</th>
                    <th>Model Version</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}><i className="fa-solid fa-spinner fa-spin"></i></td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No audit events found</td></tr>
                  ) : logs.map(log => {
                    const meta = EVENT_META[log.eventType] || { icon: 'fa-circle-dot', color: 'var(--muted)', label: log.eventType };
                    return (
                      <tr key={log._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className={`fa-solid ${meta.icon}`} style={{ color: meta.color, fontSize: '0.9rem' }}></i>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{meta.label}</span>
                          </div>
                        </td>
                        <td><code style={{ fontSize: '0.82rem', color: 'var(--c2)' }}>{log.candidateId || '—'}</code></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{log.jobId?.title || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{log.userId?.name || 'System'}</td>
                        <td>
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            <i className="fa-solid fa-check"></i> None
                          </span>
                        </td>
                        <td><code style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{log.modelVersion}</code></td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button className="btn btn-sm btn-secondary" disabled={filter.page <= 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
                <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>Page {filter.page} of {Math.ceil(total / 20)}</span>
                <button className="btn btn-sm btn-secondary" disabled={filter.page >= Math.ceil(total / 20)} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
              </div>
            )}
          </div>

          {/* Overrides */}
          {overrides.length > 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', marginTop: '1.5rem' }}>
              <div className="card-inner">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recruiter Overrides ({overrides.length})</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Candidate</th><th>Job</th><th>Original Rank</th><th>New Rank</th><th>Reason</th><th>By</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {overrides.map(o => (
                        <tr key={o._id}>
                          <td><strong style={{ color: 'var(--c2)' }}>{o.candidateId}</strong></td>
                          <td style={{ fontSize: '0.85rem' }}>{o.jobId?.title || '—'}</td>
                          <td><span className="badge badge-muted">#{o.originalRank}</span></td>
                          <td><span className="badge badge-warning">#{o.newRank}</span></td>
                          <td style={{ fontSize: '0.83rem', color: 'var(--muted)', maxWidth: 240 }}>{o.reason}</td>
                          <td style={{ fontSize: '0.82rem' }}>{o.overriddenBy?.name || '—'}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{new Date(o.overrideTimestamp).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
