import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API from '../services/api';

const PIE_COLORS = ['#22e3a3', '#ff2770', '#8a5cff', '#ffd166', '#45f3ff'];

export default function FairnessDashboard() {
  const { jobId } = useParams();
  const [report, setReport] = useState(null);
  const [fairness, setFairness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/fairness/${jobId}`)
      .then(r => { setReport(r.data.report); setFairness(r.data.fairnessAssessment); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  const piiData = (report?.piiCategories || []).map((c, i) => ({ name: c, value: 1, color: PIE_COLORS[i % 5] }));
  const proxyData = (report?.proxyRiskCategories || []).map(c => ({ name: c.category?.replace(/_/g, ' '), value: c.count }));

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <Header 
          title="Fairness & Demographic Bias Dashboard" 
          subtitle="Bias auditing and fairness metrics — protected attributes excluded from all scoring" 
        />

        <div className="alert alert-info mb-2">
          <i className="fa-solid fa-circle-info"></i>
          <span style={{ fontSize: '0.85rem' }}>Our system is designed to <strong>reduce</strong> demographic bias by excluding protected attributes from ranking and auditing model outcomes. It does not claim to eliminate bias entirely.</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--c2)' }}></i></div>
        ) : !report ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-muted">No fairness data yet. Generate a ranking first.</p>
          </div>
        ) : (
          <>
            {/* Fairness status banner */}
            <div className={`card fairness-indicator ${report.fairnessStatus === 'Passed' ? 'pass' : 'warn'}`} style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <i className={`fa-solid fa-${report.fairnessStatus === 'Passed' ? 'shield-halved' : 'triangle-exclamation'}`} style={{ fontSize: '1.75rem', color: report.fairnessStatus === 'Passed' ? 'var(--success)' : 'var(--warning)' }}></i>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: report.fairnessStatus === 'Passed' ? 'var(--success)' : 'var(--warning)' }}>
                  {report.fairnessStatus === 'Passed' ? 'Fairness Check Passed' : 'Review Recommended'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>{fairness?.message}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
              {[
                { label: 'Protected Attrs Used', value: '0', icon: 'fa-ban', accent: 'var(--success)' },
                { label: 'PII Types Removed', value: report.piiCategories?.length || 0, icon: 'fa-user-secret', accent: 'var(--c2)' },
                { label: 'PII Items Removed', value: report.piiRemovedCount || 0, icon: 'fa-eraser', accent: 'var(--c3)' },
                { label: 'Proxy Risks Detected', value: report.proxyRisksDetected || 0, icon: 'fa-triangle-exclamation', accent: report.proxyRisksDetected > 0 ? 'var(--warning)' : 'var(--success)' },
                { label: 'Total Candidates', value: report.totalCandidates || 0, icon: 'fa-users', accent: 'var(--c2)' },
                { label: 'Selected (threshold)', value: report.selectedCandidates || 0, icon: 'fa-check-circle', accent: 'var(--success)' },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ '--accent': s.accent }}>
                  <div className="stat-icon"><i className={`fa-solid ${s.icon}`}></i></div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2">
              {/* PII types pie */}
              <div className="card chart-card">
                <div className="chart-title">PII Categories Removed</div>
                {piiData.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>No PII detected — resumes may be already anonymous or processing is pending.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={piiData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                        {piiData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Proxy risks */}
              <div className="card chart-card">
                <div className="chart-title">Proxy Risk Categories</div>
                {proxyData.length === 0 ? (
                  <div className="fairness-indicator pass" style={{ marginTop: '1rem' }}>
                    <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i>
                    <span>No proxy risks detected in uploaded resumes.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={proxyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(232,232,239,0.6)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'rgba(232,232,239,0.5)', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                      <Bar dataKey="value" fill="var(--warning)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Fairness metrics — only if demographic data provided */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-inner">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Demographic Fairness Metrics</h3>
                {!report.demographicParityDifference && !report.disparateImpactRatio ? (
                  <div className="alert alert-warning">
                    <i className="fa-solid fa-circle-info"></i>
                    <div>
                      <strong>Evaluation dataset not configured.</strong><br />
                      <span style={{ fontSize: '0.83rem' }}>To compute demographic parity difference and disparate impact ratio, provide labelled group data via the evaluation API. This requires a separate audit dataset with group membership labels — these labels are never used in ranking.</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid-2">
                    <div className="stat-card" style={{ '--accent': Math.abs(report.demographicParityDifference) < 0.1 ? 'var(--success)' : 'var(--warning)' }}>
                      <div className="stat-icon"><i className="fa-solid fa-left-right"></i></div>
                      <div className="stat-value">{report.demographicParityDifference?.toFixed(3)}</div>
                      <div className="stat-label">Demographic Parity Difference</div>
                      <div className="stat-sub">{Math.abs(report.demographicParityDifference) < 0.1 ? '✓ Low disparity' : '⚠ Review recommended'}</div>
                    </div>
                    <div className="stat-card" style={{ '--accent': report.disparateImpactRatio >= 0.8 ? 'var(--success)' : 'var(--warning)' }}>
                      <div className="stat-icon"><i className="fa-solid fa-divide"></i></div>
                      <div className="stat-value">{report.disparateImpactRatio?.toFixed(3)}</div>
                      <div className="stat-label">Disparate Impact Ratio</div>
                      <div className="stat-sub">{report.disparateImpactRatio >= 0.8 ? '✓ Above 0.8 threshold' : '⚠ Below 0.8 (80% rule)'}</div>
                    </div>
                  </div>
                )}

                <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                  <i className="fa-solid fa-shield-halved"></i>
                  <span style={{ fontSize: '0.83rem' }}>Protected attributes are <strong>never</strong> used as ranking features. Group membership data, if provided for auditing, is stored separately and used only for fairness evaluation — not for scoring.</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
