import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API from '../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = { active: 'badge-success', closed: 'badge-danger', draft: 'badge-muted' };

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/jobs').then(r => setJobs(r.data.jobs || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${jobTitle}"? This will also remove associated candidate rankings for this job.`)) {
      return;
    }
    try {
      const { data } = await API.delete(`/jobs/${jobId}`);
      if (data.success) {
        toast.success(`Job "${jobTitle}" deleted successfully`);
        setJobs(prev => prev.filter(j => j._id !== jobId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job posting');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <Header title="Job Postings & Rankings" subtitle="Manage recruitment positions and view automated AI resume rankings" />

        <div className="flex-between mb-3" style={{ marginTop: '-0.5rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted)' }}>
            Showing {jobs.length} active positions
          </div>
          <Link to="/jobs/create" className="btn btn-primary"><i className="fa-solid fa-plus"></i> New Job</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i></div>
        ) : jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <i className="fa-solid fa-briefcase" style={{ fontSize: '3rem', color: 'var(--muted)', marginBottom: '1rem' }}></i>
            <h3>No jobs yet</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Create your first job posting to start recruiting.</p>
            <Link to="/jobs/create" className="btn btn-primary">Create Job</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map(job => (
              <div key={job._id} className="card">
                <div className="card-inner job-card-inner">
                  <div className="job-card-main" style={{ flex: 1 }}>
                    <div className="flex-center gap-2 mb-1" style={{ flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{job.title}</h3>
                      <span className={`badge ${STATUS_BADGE[job.status]}`}>{job.status}</span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                      {job.description?.substring(0, 140)}…
                    </p>
                    <div className="tags">
                      {(job.requiredSkills || []).slice(0, 6).map(s => <span key={s} className="tag">{s}</span>)}
                      {job.requiredSkills?.length > 6 && <span className="tag">+{job.requiredSkills.length - 6}</span>}
                    </div>
                  </div>
                  <div className="job-card-actions">
                    <div className="job-card-meta">
                      <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                        <i className="fa-solid fa-users" style={{ color: 'var(--c2)' }}></i> {job.candidateCount || 0} candidates
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                        {job.minExperience > 0 ? `${job.minExperience}+ yrs exp` : 'Any experience'}
                      </span>
                    </div>
                    <div className="job-card-buttons">
                      <Link to={`/jobs/applications?jobId=${job._id}`} className="btn btn-sm btn-primary" style={{ justifyContent: 'center' }}>
                        <i className="fa-solid fa-ranking-star"></i> Rank Resumes
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job._id, job.title)}
                        className="btn btn-sm"
                        style={{ background: 'rgba(255, 39, 112, 0.15)', color: '#ff2770', border: '1px solid rgba(255, 39, 112, 0.3)', borderRadius: '8px', justifyContent: 'center' }}
                        title="Delete Job Posting"
                      >
                        <i className="fa-solid fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
