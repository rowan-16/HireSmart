import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import toast from 'react-hot-toast';

function ScoreBar({ value, color }) {
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{ width: `${Math.min(value,100)}%`, background: color || 'linear-gradient(90deg,var(--c2),var(--c3))' }}></div>
      </div>
      <span className="score-label" style={{ color: color || 'var(--c2)' }}>{value?.toFixed(1)}%</span>
    </div>
  );
}

function RankBadge({ rank }) {
  const cls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'normal';
  return <div className={`rank-badge ${cls}`}>#{rank}</div>;
}

const MATCH_COLOR = { 'Strong Match': 'var(--success)', 'Moderate Match': 'var(--warning)', 'Weak Match': '#ff6a3d', 'Low Match': 'var(--danger)' };

export default function CandidateRanking() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState([]);
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideRank, setOverrideRank] = useState('');

  useEffect(() => {
    Promise.all([API.get(`/jobs/${jobId}`), API.get(`/ranking/job/${jobId}`)]).then(([j, r]) => {
      setJob(j.data.job); setRanking(r.data.ranking || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [jobId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await API.post(`/ranking/job/${jobId}/generate`);
      setRanking(data.ranking || []);
      toast.success('Ranking generated!');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to generate ranking'); }
    finally { setGenerating(false); }
  };

  const handleOverride = async () => {
    if (!overrideReason || !overrideRank) return toast.error('Reason and new rank required');
    try {
      await API.post(`/ranking/candidates/${overrideModal.candidateId}/override`, { jobId, newRank: parseInt(overrideRank), reason: overrideReason });
      toast.success('Override recorded');
      setOverrideModal(null); setOverrideReason(''); setOverrideRank('');
      const { data } = await API.get(`/ranking/job/${jobId}`);
      setRanking(data.ranking || []);
    } catch (err) { toast.error(err?.response?.data?.message || 'Override failed'); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 5 ? [...s, id] : s);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <div className="flex-between mb-2" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Candidate <span>Ranking</span></h1>
            <p className="page-sub">{job ? job.title : 'Loading…'} · Anonymous candidates only</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {selected.length >= 2 && (
              <button className="btn btn-secondary" onClick={() => navigate(`/jobs/${jobId}/compare?ids=${selected.join(',')}`)}>
                <i className="fa-solid fa-code-compare"></i> Compare ({selected.length})
              </button>
            )}
            <Link to={`/jobs/${jobId}/fairness`} className="btn btn-secondary"><i className="fa-solid fa-scale-balanced"></i> Fairness</Link>
            <Link to={`/jobs/${jobId}/evaluation`} className="btn btn-secondary"><i className="fa-solid fa-chart-line"></i> Evaluation</Link>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? <><i className="fa-solid fa-spinner fa-spin"></i> Ranking…</> : <><i className="fa-solid fa-ranking-star"></i> Generate Ranking</>}
            </button>
          </div>
        </div>

        <div className="alert alert-info mb-2">
          <i className="fa-solid fa-shield-halved"></i>
          <span>Candidates are displayed with anonymous IDs only. All PII has been removed. Protected attributes were not used in scoring.</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i></div>
        ) : ranking.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <i className="fa-solid fa-ranking-star" style={{ fontSize: '3rem', color: 'var(--muted)', marginBottom: '1rem' }}></i>
            <h3>No ranking yet</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Upload resumes first, then generate the ranking.</p>
            <Link to={`/jobs/${jobId}/upload`} className="btn btn-primary">Upload Resumes</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Compare</th>
                  <th>Rank</th>
                  <th>Candidate ID</th>
                  <th>Overall Score</th>
                  <th>Confidence</th>
                  <th>Skill Match</th>
                  <th>Exp. Score</th>
                  <th>Semantic</th>
                  <th>Status</th>
                  <th>Override</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(r => (
                  <tr key={r._id}>
                    <td><input type="checkbox" checked={selected.includes(r.candidateId)} onChange={() => toggleSelect(r.candidateId)} /></td>
                    <td><RankBadge rank={r.rank} /></td>
                    <td><strong style={{ color: 'var(--c2)' }}>{r.candidateId}</strong></td>
                    <td>
                      <ScoreBar value={r.finalScore} color={`linear-gradient(90deg,var(--c2),var(--c3))`} />
                    </td>
                    <td>
                      <span style={{ color: r.confidence >= 75 ? 'var(--success)' : r.confidence >= 50 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700, fontSize: '0.88rem' }}>
                        {r.confidence?.toFixed(1)}%
                      </span>
                    </td>
                    <td><ScoreBar value={r.scoreBreakdown?.skillScore} color="var(--c2)" /></td>
                    <td><ScoreBar value={r.scoreBreakdown?.experienceScore} color="var(--success)" /></td>
                    <td><ScoreBar value={r.scoreBreakdown?.semanticScore} color="var(--c3)" /></td>
                    <td>
                      <span className="badge" style={{ background: `${MATCH_COLOR[r.matchCategory]}22`, color: MATCH_COLOR[r.matchCategory], fontSize: '0.72rem' }}>
                        {r.matchCategory || 'Unknown'}
                      </span>
                      {r.isOverridden && <span className="badge badge-warning" style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}>Overridden</span>}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setOverrideModal(r)} title="Override rank">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                    </td>
                    <td>
                      <Link to={`/jobs/${jobId}/candidate/${r.candidateId}`} className="btn btn-sm btn-primary">
                        <i className="fa-solid fa-eye"></i> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Override Modal */}
        {overrideModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setOverrideModal(null)}>
            <div className="modal">
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Override Ranking</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <strong>{overrideModal.candidateId}</strong> · Current rank: <strong>#{overrideModal.rank}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">New Rank</label>
                <input className="form-input" type="number" min="1" max={ranking.length} placeholder={`1 – ${ranking.length}`} value={overrideRank} onChange={e => setOverrideRank(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Reason (required)</label>
                <textarea className="form-textarea" rows={3} placeholder="e.g. Insufficient production experience in target domain" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setOverrideModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleOverride}><i className="fa-solid fa-check"></i> Confirm Override</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
