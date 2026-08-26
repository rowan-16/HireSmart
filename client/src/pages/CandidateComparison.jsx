import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

const COLORS = ['var(--c2)', 'var(--c1)', 'var(--c3)', '#ffd166', '#22e3a3'];

export default function CandidateComparison() {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length < 2) return setLoading(false);
    API.get(`/ranking/compare?ids=${ids.join(',')}&jobId=${jobId}`)
      .then(async r => {
        const { analyses, rankings } = r.data;
        const combined = analyses.map(a => {
          const rank = rankings.find(rk => rk.candidateId === a.candidateId);
          return { analysis: a, ranking: rank };
        }).filter(c => c.ranking);
        setData(combined);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  const barData = ['skillScore','experienceScore','projectScore','educationScore','semanticScore'].map(key => ({
    name: key.replace('Score','').replace(/([A-Z])/g,' $1').trim(),
    ...Object.fromEntries(data.map((d, i) => [d.analysis.candidateId, d.ranking?.scoreBreakdown?.[key] || 0])),
  }));

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <div className="flex-between mb-2">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Candidate <span>Comparison</span></h1>
            <p className="page-sub">Anonymous side-by-side comparison — no PII shown</p>
          </div>
          <Link to={`/jobs/${jobId}/ranking`} className="btn btn-secondary"><i className="fa-solid fa-arrow-left"></i> Back</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--c2)' }}></i></div>
        ) : data.length < 2 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-muted">Select 2–5 candidates from the ranking page to compare.</p>
            <Link to={`/jobs/${jobId}/ranking`} className="btn btn-primary" style={{ marginTop: '1rem' }}>Go to Ranking</Link>
          </div>
        ) : (
          <>
            {/* Bar chart */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-inner">
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Score Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(232,232,239,0.6)', fontSize: 11 }} />
                    <YAxis domain={[0,100]} tick={{ fill: 'rgba(232,232,239,0.5)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {data.map((d, i) => (
                      <Bar key={d.analysis.candidateId} dataKey={d.analysis.candidateId} fill={COLORS[i]} radius={[4,4,0,0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side-by-side cards */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: '1rem' }}>
              {data.map((d, i) => {
                const { analysis: a, ranking: r } = d;
                return (
                  <div key={a.candidateId} className="card">
                    <div className="card-inner">
                      <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: COLORS[i], fontFamily: 'Outfit,sans-serif' }}>{a.candidateId}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.5rem' }}>{r?.finalScore?.toFixed(1)}%</div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>Rank #{r?.rank} · {r?.matchCategory}</div>
                      </div>

                      <div style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                        <div className="flex-between"><span className="text-muted">Confidence</span><strong style={{ color: r?.confidence >= 75 ? 'var(--success)' : 'var(--warning)' }}>{r?.confidence?.toFixed(0)}%</strong></div>
                        <div className="flex-between mt-1"><span className="text-muted">Experience</span><strong>{a.extractedData?.yearsOfExperience || 0} yrs</strong></div>
                        <div className="flex-between mt-1"><span className="text-muted">Skills</span><strong>{a.extractedData?.technicalSkills?.length || 0}</strong></div>
                        <div className="flex-between mt-1"><span className="text-muted">Projects</span><strong>{a.extractedData?.projects?.length || 0}</strong></div>
                        <div className="flex-between mt-1"><span className="text-muted">Skill Match</span><strong style={{ color: 'var(--c2)' }}>{r?.scoreBreakdown?.skillScore?.toFixed(0)}%</strong></div>
                        <div className="flex-between mt-1"><span className="text-muted">Semantic</span><strong style={{ color: 'var(--c3)' }}>{r?.scoreBreakdown?.semanticScore?.toFixed(0)}%</strong></div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Top Skills</div>
                        <div className="tags">
                          {(a.extractedData?.technicalSkills || []).slice(0, 6).map(s => <span key={s} className="tag" style={{ fontSize: '0.7rem' }}>{s}</span>)}
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Missing Required</div>
                        {(a.missingRequiredSkills || []).length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>✓ All required skills found</span>
                        ) : (
                          <div className="tags">
                            {(a.missingRequiredSkills || []).slice(0, 4).map(s => <span key={s} className="tag" style={{ background: 'rgba(255,39,112,0.1)', color: 'var(--danger)', borderColor: 'rgba(255,39,112,0.25)', fontSize: '0.7rem' }}>{s}</span>)}
                          </div>
                        )}
                      </div>

                      <Link to={`/jobs/${jobId}/candidate/${a.candidateId}`} className="btn btn-sm btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                        View Full Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
