import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function EvaluationDashboard() {
  const { jobId } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [k, setK] = useState(5);
  const [labelledInput, setLabelledInput] = useState('');

  useEffect(() => {
    API.get(`/evaluation/${jobId}`)
      .then(r => setEvaluation(r.data.evaluation))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleRun = async () => {
    let labelledData;
    try { labelledData = JSON.parse(labelledInput); } catch { return toast.error('Invalid JSON format'); }
    setRunning(true);
    try {
      const { data } = await API.post(`/evaluation/${jobId}`, { labelledData, k });
      setEvaluation(data.evaluation);
      toast.success('Evaluation complete!');
    } catch (err) { toast.error(err?.response?.data?.message || 'Evaluation failed'); }
    finally { setRunning(false); }
  };

  const metric = (val, label, note) => (
    <div className="stat-card" style={{ '--accent': val !== null ? 'var(--c2)' : 'var(--muted)' }}>
      <div className="stat-value" style={{ fontSize: '1.8rem' }}>{val !== null ? val.toFixed(3) : '—'}</div>
      <div className="stat-label">{label}</div>
      {note && <div className="stat-sub">{note}</div>}
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <div className="flex-between mb-2">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Ranking <span>Evaluation</span></h1>
            <p className="page-sub">Precision@K, Recall@K, NDCG — only computed when labelled data is available</p>
          </div>
          <Link to={`/jobs/${jobId}/ranking`} className="btn btn-secondary"><i className="fa-solid fa-arrow-left"></i> Back</Link>
        </div>

        {!evaluation?.hasLabelledData && (
          <div className="alert alert-warning mb-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <strong>Evaluation dataset not configured.</strong> Provide labelled data below to compute ranking metrics.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--c2)' }}></i></div>
        ) : (
          <>
            {/* Metrics */}
            {evaluation?.hasLabelledData ? (
              <>
                <div style={{ marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.85rem' }}>K = {evaluation.k} · Model: {evaluation.modelVersion} · {new Date(evaluation.evaluatedAt).toLocaleString()}</div>
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                  {metric(evaluation.precisionAtK, `Precision@${evaluation.k}`, 'Fraction of top-K that are relevant')}
                  {metric(evaluation.recallAtK, `Recall@${evaluation.k}`, 'Fraction of relevant in top-K')}
                  {metric(evaluation.ndcg, `NDCG@${evaluation.k}`, 'Ranking quality weighted by position')}
                  {metric(evaluation.topKRelevance, `Top-K Relevance`, 'Average relevance in top-K')}
                </div>
                <div className="alert alert-success">
                  <i className="fa-solid fa-circle-check"></i>
                  <span>These metrics are computed from actual labelled evaluation data. Metrics reflect ranking quality — not candidate quality.</span>
                </div>
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', marginBottom: '1.5rem' }}>
                <i className="fa-solid fa-chart-line" style={{ fontSize: '3rem', color: 'var(--muted)', marginBottom: '1rem' }}></i>
                <h3>No Evaluation Data</h3>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>Evaluation dataset not configured. Provide labelled data below to compute metrics.</p>
              </div>
            )}

            {/* Run evaluation */}
            <div className="card">
              <div className="card-inner">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Run Evaluation with Labelled Data</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Provide a JSON array of <code>&#123; candidateId, relevant &#125;</code> objects. The system will calculate P@K, Recall@K, and NDCG against the current ranking.
                </p>
                <div className="form-group">
                  <label className="form-label">K (top-K positions to evaluate)</label>
                  <input className="form-input" type="number" min="1" max="20" value={k} onChange={e => setK(parseInt(e.target.value))} style={{ maxWidth: 120 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Labelled Data (JSON)</label>
                  <textarea className="form-textarea" rows={6}
                    placeholder={`[\n  { "candidateId": "C-024", "relevant": true },\n  { "candidateId": "C-087", "relevant": false }\n]`}
                    value={labelledInput} onChange={e => setLabelledInput(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
                  <div className="form-hint">Set relevant: true for candidates you consider qualified for the role.</div>
                </div>
                <button className="btn btn-primary" onClick={handleRun} disabled={running || !labelledInput}>
                  {running ? <><i className="fa-solid fa-spinner fa-spin"></i> Running…</> : <><i className="fa-solid fa-play"></i> Run Evaluation</>}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
