import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

function ConfidenceRing({ value, label }) {
  const r = 34; const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 75 ? '#22e3a3' : value >= 50 ? '#ffd166' : '#ff2770';
  return (
    <div className="conf-ring" style={{ width: 90, height: 90 }}>
      <svg className="conf-svg" width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="conf-val" style={{ color }}>{value?.toFixed(0)}%</div>
    </div>
  );
}

function ScoreRow({ label, value, color }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{value?.toFixed(1)}%</span>
      </div>
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{ width: `${Math.min(value,100)}%`, background: color }}></div>
      </div>
    </div>
  );
}

export default function CandidateDetails() {
  const { jobId, candidateId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/ranking/candidates/${candidateId}/explanation?jobId=${jobId}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [candidateId, jobId]);

  if (loading) return (
    <div className="app-layout"><Sidebar />
      <main className="main-content" style={{ display: 'grid', placeItems: 'center' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--c2)' }}></i>
      </main>
    </div>
  );

  if (!data) return (
    <div className="app-layout"><Sidebar />
      <main className="main-content"><p className="text-muted">Candidate not found.</p></main>
    </div>
  );

  const { analysis, ranking, explanation } = data;
  const scores = ranking?.scoreBreakdown || {};
  const radarData = [
    { subject: 'Skills', value: scores.skillScore || 0 },
    { subject: 'Experience', value: scores.experienceScore || 0 },
    { subject: 'Projects', value: scores.projectScore || 0 },
    { subject: 'Education', value: scores.educationScore || 0 },
    { subject: 'Semantic', value: scores.semanticScore || 0 },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        {/* Header */}
        <div className="flex-between mb-2" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Candidate <span>{candidateId}</span></h1>
            <p className="page-sub">Rank #{ranking?.rank} · {ranking?.matchCategory}</p>
          </div>
          <Link to={`/jobs/${jobId}/ranking`} className="btn btn-secondary"><i className="fa-solid fa-arrow-left"></i> Back to Ranking</Link>
        </div>

        {/* Score Overview */}
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <div className="card-inner">
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Outfit,sans-serif', background: 'linear-gradient(135deg,var(--c2),var(--c3))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {ranking?.finalScore?.toFixed(1)}%
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>Overall Match</div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <ConfidenceRing value={ranking?.confidence || 0} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>Confidence</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{ranking?.confidence >= 75 ? 'High' : ranking?.confidence >= 50 ? 'Medium' : 'Low'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Ranking</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit,sans-serif', color: ranking?.rank === 1 ? '#ffd166' : ranking?.rank <= 3 ? '#c8c8dc' : 'var(--text)' }}>#{ranking?.rank}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fairness flags */}
          <div className="card">
            <div className="card-inner">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Fairness Audit</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div className="fairness-indicator pass">
                  <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i>
                  <span style={{ fontSize: '0.85rem' }}>Protected attributes used in ranking: <strong style={{ color: 'var(--success)' }}>NONE</strong></span>
                </div>
                <div className="fairness-indicator pass">
                  <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i>
                  <span style={{ fontSize: '0.85rem' }}>PII removed before scoring: <strong style={{ color: 'var(--success)' }}>YES</strong></span>
                </div>
                <div className={`fairness-indicator ${(ranking?.proxyRiskLevel || 'Low') === 'Low' ? 'pass' : 'warn'}`}>
                  <i className={`fa-solid ${(ranking?.proxyRiskLevel || 'Low') === 'Low' ? 'fa-check' : 'fa-triangle-exclamation'}`} style={{ color: (ranking?.proxyRiskLevel || 'Low') === 'Low' ? 'var(--success)' : 'var(--warning)' }}></i>
                  <span style={{ fontSize: '0.85rem' }}>Proxy-risk level: <strong>{ranking?.proxyRiskLevel || 'Low'}</strong></span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.75rem' }}>{explanation?.fairnessStatement}</p>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Score breakdown */}
          <div className="card">
            <div className="card-inner">
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Score Breakdown</h3>
              <ScoreRow label="Skills Match" value={scores.skillScore} color="var(--c2)" />
              <ScoreRow label="Experience" value={scores.experienceScore} color="var(--success)" />
              <ScoreRow label="Projects" value={scores.projectScore} color="var(--c3)" />
              <ScoreRow label="Education" value={scores.educationScore} color="var(--warning)" />
              <ScoreRow label="Semantic Match" value={scores.semanticScore} color="var(--c1)" />
              <div className="divider"></div>
              <div className="flex-between">
                <span style={{ fontWeight: 700 }}>Overall Score</span>
                <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--c2)' }}>{ranking?.finalScore?.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Radar */}
          <div className="card chart-card">
            <div className="chart-title">Score Radar</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(232,232,239,0.6)', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="var(--c2)" fill="var(--c2)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explanation */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-inner">
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Why was this candidate ranked #{ranking?.rank}?</h3>
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <i className="fa-solid fa-quote-left"></i>
              <span style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>{explanation?.summary}</span>
            </div>
            <div className="grid-2">
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--success)' }}>Strengths</h4>
                {(explanation?.reasons || []).map((r, i) => (
                  <div key={i} className="reason-item positive"><span>{r.text}</span></div>
                ))}
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--warning)' }}>Gaps & Notes</h4>
                {(explanation?.warnings || []).length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>No significant gaps found.</p>
                ) : (explanation?.warnings || []).map((w, i) => (
                  <div key={i} className="reason-item warning"><span>{w.text}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Skills */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-inner">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Extracted Skills & Data</h3>
            <div className="grid-2">
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Technical Skills</h4>
                <div className="tags">
                  {(analysis?.extractedData?.technicalSkills || []).map(s => <span key={s} className="tag">{s}</span>)}
                </div>
                {analysis?.extractedData?.softSkills?.length > 0 && (
                  <>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.75rem 0 0.5rem' }}>Soft Skills</h4>
                    <div className="tags">
                      {analysis.extractedData.softSkills.map(s => <span key={s} className="tag" style={{ background: 'rgba(255,209,102,0.1)', color: '#ffd166', borderColor: 'rgba(255,209,102,0.25)' }}>{s}</span>)}
                    </div>
                  </>
                )}
              </div>
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>Experience: </span>
                  <strong>{analysis?.extractedData?.yearsOfExperience || 0} years</strong>
                </div>
                {(analysis?.extractedData?.education || []).length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>Education: </span>
                    <strong>{analysis.extractedData.education.map(e => `${e.degree}${e.field ? ' in ' + e.field : ''}`).join(', ')}</strong>
                  </div>
                )}
                {(analysis?.extractedData?.certifications || []).length > 0 && (
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>Certifications: </span>
                    <div className="tags" style={{ marginTop: '0.3rem' }}>
                      {analysis.extractedData.certifications.map(c => <span key={c} className="tag" style={{ background: 'rgba(34,227,163,0.1)', color: 'var(--success)', borderColor: 'rgba(34,227,163,0.25)' }}>{c}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confidence note */}
        <div className="alert alert-warning" style={{ marginTop: '1.5rem' }}>
          <i className="fa-solid fa-circle-info"></i>
          <span style={{ fontSize: '0.85rem' }}>Confidence reflects the strength and completeness of evidence available to the ranking system — not a guarantee of candidate quality or future success.</span>
        </div>
      </main>
    </div>
  );
}
