import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['uploaded','extracting','anonymizing','analyzing','matching','complete','error'];
const STATUS_COLOR = { uploaded: 'var(--muted)', extracting: 'var(--c2)', anonymizing: 'var(--c3)', analyzing: 'var(--warning)', matching: 'var(--c1)', ranked: 'var(--success)', complete: 'var(--success)', error: 'var(--danger)' };
const STATUS_ICON = { uploaded: 'fa-file', extracting: 'fa-file-lines', anonymizing: 'fa-user-secret', analyzing: 'fa-magnifying-glass', matching: 'fa-link', ranked: 'fa-ranking-star', complete: 'fa-circle-check', error: 'fa-circle-exclamation' };

export default function UploadResumes() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    API.get(`/jobs/${jobId}`).then(r => setJob(r.data.job)).catch(console.error);
    loadResumes();
  }, [jobId]);

  // Poll for status updates
  useEffect(() => {
    const interval = setInterval(loadResumes, 4000);
    return () => clearInterval(interval);
  }, [jobId]);

  async function loadResumes() {
    try {
      const { data } = await API.get(`/resumes/job/${jobId}`);
      setResumes(data.resumes || []);
    } catch {}
  }

  const onDrop = useCallback(accepted => {
    setFiles(prev => [...prev, ...accepted.filter(f => !prev.find(p => p.name === f.name))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (files.length === 0) return toast.error('Select files first');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('jobId', jobId);
      files.forEach(f => formData.append('resumes', f));
      const { data } = await API.post('/resumes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${data.resumes.length} resume(s) uploaded — processing started`);
      setFiles([]);
      loadResumes();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <div className="flex-between mb-2" style={{ alignItems: 'flex-start' }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Upload <span>Resumes</span></h1>
            <p className="page-sub">{job ? `For: ${job.title}` : 'Loading job…'}</p>
          </div>
          {resumes.length > 0 && (
            <Link to={`/jobs/${jobId}/ranking`} className="btn btn-primary"><i className="fa-solid fa-ranking-star"></i> View Ranking</Link>
          )}
        </div>

        <div className="grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Dropzone */}
            <div className="card">
              <div className="card-inner">
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="dropzone-icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
                  <div className="dropzone-text">{isDragActive ? 'Drop files here…' : 'Drag & drop resumes here'}</div>
                  <div className="dropzone-hint">PDF or DOCX · Max 10MB each · Up to 50 files</div>
                </div>

                {files.length > 0 && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      Selected: {files.length} file{files.length > 1 ? 's' : ''}
                    </div>
                    {files.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.4rem' }}>
                        <i className="fa-solid fa-file-pdf" style={{ color: 'var(--c1)' }}></i>
                        <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{(f.size / 1024).toFixed(0)} KB</span>
                        <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}>×</button>
                      </div>
                    ))}
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }} onClick={handleUpload} disabled={uploading}>
                      {uploading ? <><i className="fa-solid fa-spinner fa-spin"></i> Uploading…</> : <><i className="fa-solid fa-upload"></i> Upload {files.length} Resume{files.length > 1 ? 's' : ''}</>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline info */}
            <div className="card">
              <div className="card-inner">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Processing Pipeline</h3>
                <div className="steps">
                  {['Uploaded','Extracting','Anonymizing','Analyzing','Matching','Complete'].map((step, i) => (
                    <div key={step} className="step">
                      <i className={`fa-solid ${['fa-file','fa-file-lines','fa-user-secret','fa-magnifying-glass','fa-link','fa-circle-check'][i]}`}></i>
                      {step}
                    </div>
                  ))}
                </div>
                <div className="alert alert-info mt-2">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span style={{ fontSize: '0.83rem' }}>All PII (names, emails, addresses) is removed during the Anonymizing step before any scoring occurs.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resume list */}
          <div className="card">
            <div className="card-inner">
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Processed Resumes ({resumes.length})</h3>
                <button className="btn btn-secondary btn-sm" onClick={loadResumes}><i className="fa-solid fa-rotate"></i> Refresh</button>
              </div>
              {resumes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                  <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', marginBottom: '0.75rem', display: 'block' }}></i>
                  No resumes uploaded yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
                  {resumes.map(r => (
                    <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'grid', placeItems: 'center', color: STATUS_COLOR[r.status], flexShrink: 0 }}>
                        <i className={`fa-solid ${STATUS_ICON[r.status] || 'fa-file'}`} style={{ fontSize: '0.9rem' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.candidateId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.originalFilename}</div>
                      </div>
                      <span className={`badge ${r.status === 'complete' ? 'badge-success' : r.status === 'error' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                        {r.status}
                      </span>
                      {r.piiDetected?.length > 0 && <span className="badge badge-purple" title="PII removed"><i className="fa-solid fa-user-secret"></i> {r.piiDetected.length} PII</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
