import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import API from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended' | 'applications' | 'analyzer'
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasViewedApplications, setHasViewedApplications] = useState(false);

  // Resume Analyzer state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Apply modal / loading
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [applyResumeFile, setApplyResumeFile] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        API.get('/candidate/recommended-jobs'),
        API.get('/applications/my-applications'),
      ]);
      if (jobsRes.data.success) setRecommendedJobs(jobsRes.data.jobs || []);
      if (appsRes.data.success) setApplications(appsRes.data.applications || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAnalyzeResume = async (e) => {
    e.preventDefault();
    if (!resumeFile && !resumeText.trim()) {
      return toast.error('Please upload a PDF/DOCX resume or paste your resume text');
    }
    setAnalyzing(true);
    try {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      if (resumeText) formData.append('resumeText', resumeText);

      const { data } = await API.post('/candidate/analyze-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        setAnalysisResult(data);
        if (data.recommendedJobs?.length) setRecommendedJobs(data.recommendedJobs);
        toast.success('Resume analyzed successfully!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Resume analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const openApplyModal = (job) => {
    setSelectedJobForApply(job);
    setApplyResumeFile(null);
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedJobForApply) return;
    setApplyingJobId(selectedJobForApply._id);
    try {
      const formData = new FormData();
      formData.append('jobId', selectedJobForApply._id);
      if (applyResumeFile) {
        formData.append('resume', applyResumeFile);
      }
      const textToPass = analysisResult?.extractedData?.skills?.join(', ') || resumeText;
      if (textToPass) formData.append('resumeText', textToPass);

      const { data } = await API.post('/applications/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Applied successfully! Resume uploaded and company notified.');
        setApplyModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to apply for job');
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        {/* Page Top Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Candidate Hub, <span>{user?.name?.split(' ')[0]}</span></h1>
            <p className="page-sub">Explore AI-matched job opportunities and track your interviews</p>
          </div>
          <NotificationBell />
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '1.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`btn ${activeTab === 'recommended' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '12px', fontSize: '0.88rem' }}
          >
            <i className="fa-solid fa-sparkles"></i> AI Recommended Jobs
          </button>
          <button
            onClick={() => {
              setActiveTab('applications');
              setHasViewedApplications(true);
            }}
            className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '12px', fontSize: '0.88rem', position: 'relative' }}
          >
            <i className="fa-solid fa-file-contract"></i> My Applications
            {applications.length > 0 && !hasViewedApplications && activeTab !== 'applications' && (
              <span style={{ marginLeft: '8px', background: 'linear-gradient(135deg, #ff2770, #ff5e62)', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                {applications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`btn ${activeTab === 'analyzer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '12px', fontSize: '0.88rem' }}
          >
            <i className="fa-solid fa-robot"></i> AI Resume Analyzer
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
            <p style={{ marginTop: '1rem' }}>Loading opportunities…</p>
          </div>
        ) : (
          <>
            {/* TAB 1: RECOMMENDED JOBS */}
            {activeTab === 'recommended' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-bullseye" style={{ color: 'var(--c2, #45f3ff)' }}></i> Top AI Job Matches for You
                </h3>

                {recommendedJobs.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--muted)' }}>
                    <i className="fa-solid fa-briefcase" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.2)' }}></i>
                    <h4>No active jobs listed yet</h4>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>When companies post new jobs, AI recommendations will appear here automatically.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
                    {recommendedJobs.map((job) => (
                      <div key={job._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid var(--c2, #45f3ff)' }}>
                        <div className="card-inner">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{job.title}</h4>
                            <span style={{
                              background: 'linear-gradient(135deg, rgba(69, 243, 255, 0.2), rgba(138, 92, 255, 0.2))',
                              border: '1px solid var(--c2, #45f3ff)',
                              color: 'var(--c2, #45f3ff)',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}>
                              <i className="fa-solid fa-sparkles"></i> {job.matchPercentage || 85}% Match
                            </span>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '12px' }}>
                            <span><i className="fa-solid fa-building" style={{ marginRight: '4px' }}></i> {job.department || 'Tech'}</span>
                            <span style={{ margin: '0 8px' }}>•</span>
                            <span><i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i> {job.location || 'Remote'}</span>
                          </div>

                          {/* Skills badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                            {(job.requiredSkills || []).slice(0, 4).map((skill, idx) => (
                              <span key={idx} style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.85)',
                              }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
                          {job.hasApplied ? (
                            <button className="btn btn-secondary" disabled style={{ width: '100%', opacity: 0.8 }}>
                              <i className="fa-solid fa-circle-check" style={{ color: 'var(--success)' }}></i> Applied ({job.applicationStatus})
                            </button>
                          ) : (
                            <button
                              onClick={() => openApplyModal(job)}
                              disabled={applyingJobId === job._id}
                              className="btn btn-primary"
                              style={{ width: '100%', borderRadius: '10px' }}
                            >
                              {applyingJobId === job._id ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting…</> : <><i className="fa-solid fa-paper-plane"></i> Apply Now</>}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY APPLICATIONS & INTERVIEW INBOX */}
            {activeTab === 'applications' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-list-check" style={{ color: 'var(--c1, #ff2770)' }}></i> Tracked Applications & Interview Invites
                </h3>

                {applications.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--muted)' }}>
                    <i className="fa-solid fa-folder-open" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.2)' }}></i>
                    <h4>You haven't applied for any jobs yet</h4>
                    <button onClick={() => setActiveTab('recommended')} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                      Browse Recommended Jobs
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {applications.map((app) => (
                      <div key={app._id} className="card">
                        <div className="card-inner">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{app.jobId?.title || 'Applied Position'}</h4>
                              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '4px' }}>
                                Applied on {new Date(app.createdAt).toLocaleDateString()} · Match Score: <strong style={{ color: 'var(--c2, #45f3ff)' }}>{app.matchPercentage}%</strong>
                              </p>
                            </div>

                            {/* Status Pills */}
                            <div>
                              {app.status === 'applied' && (
                                <span style={{ background: 'rgba(69, 243, 255, 0.15)', border: '1px solid var(--c2, #45f3ff)', color: 'var(--c2, #45f3ff)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
                                  <i className="fa-solid fa-clock"></i> Application Under Review
                                </span>
                              )}
                              {app.status === 'interview' && (
                                <span style={{ background: 'rgba(255, 209, 102, 0.2)', border: '1px solid #ffd166', color: '#ffd166', padding: '6px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700 }}>
                                  <i className="fa-solid fa-video"></i> Interview Scheduled!
                                </span>
                              )}
                              {app.status === 'accepted' && (
                                <span style={{ background: 'rgba(34, 227, 163, 0.2)', border: '1px solid var(--success)', color: 'var(--success)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700 }}>
                                  <i className="fa-solid fa-circle-check"></i> Application Accepted
                                </span>
                              )}
                              {app.status === 'rejected' && (
                                <span style={{ background: 'rgba(255, 39, 112, 0.15)', border: '1px solid var(--c1)', color: 'var(--c1)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
                                  <i className="fa-solid fa-circle-xmark"></i> Decision Finalized
                                </span>
                              )}
                            </div>
                          </div>

                          {/* INTERVIEW CARD DETAILS (When Status is 'interview') */}
                          {app.status === 'interview' && (
                            <div style={{
                              marginTop: '1.2rem',
                              padding: '1.2rem',
                              borderRadius: '14px',
                              background: 'linear-gradient(135deg, rgba(255, 209, 102, 0.1), rgba(255, 106, 61, 0.1))',
                              border: '1px solid rgba(255, 209, 102, 0.3)',
                            }}>
                              <h5 style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-calendar-check"></i> Interview Schedule & Google Meet Link
                              </h5>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '10px' }}>
                                <div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>DATE & TIME</div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                                    {app.interviewDetails?.date || 'TBD'} @ {app.interviewDetails?.time || 'TBD'}
                                  </div>
                                </div>
                                {app.interviewDetails?.meetLink && (
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>GOOGLE MEET LINK</div>
                                    <a
                                      href={app.interviewDetails.meetLink.startsWith('http') ? app.interviewDetails.meetLink : `https://${app.interviewDetails.meetLink}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginTop: '4px',
                                        background: 'linear-gradient(135deg, #00875a, #00b8d9)',
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        textDecoration: 'none',
                                      }}
                                    >
                                      <i className="fa-solid fa-video"></i> Join Google Meet
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* REJECTION FEEDBACK DISPLAY (When Status is 'rejected') */}
                          {app.status === 'rejected' && app.rejectionFeedback && (
                            <div style={{
                              marginTop: '1.2rem',
                              padding: '1.2rem',
                              borderRadius: '14px',
                              background: 'linear-gradient(135deg, rgba(255, 39, 112, 0.1), rgba(255, 94, 98, 0.1))',
                              border: '1px solid rgba(255, 39, 112, 0.3)',
                            }}>
                              <h5 style={{ color: '#ff7597', fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-comment-dots"></i> Feedback from Hiring Team
                              </h5>
                              <div style={{ fontSize: '0.88rem', color: '#fff', lineHeight: 1.5, marginTop: '4px', fontStyle: 'italic' }}>
                                "{app.rejectionFeedback}"
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RESUME ANALYZER */}
            {activeTab === 'analyzer' && (
              <div style={{ maxWidth: '800px' }}>
                <div className="card">
                  <div className="card-inner">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      <i className="fa-solid fa-robot" style={{ color: 'var(--c2, #45f3ff)' }}></i> AI Resume Feature Extractor & Skill Scoring
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
                      Upload your PDF/DOCX resume to automatically extract your skills, compute your profile rating, and get personalized job suggestions.
                    </p>

                    <form onSubmit={handleAnalyzeResume}>
                      <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Upload Resume File (PDF / DOCX)</label>
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          onChange={e => setResumeFile(e.target.files[0])}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            borderRadius: '10px',
                            color: '#fff',
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Or Paste Resume Text</label>
                        <textarea
                          rows={5}
                          value={resumeText}
                          onChange={e => setResumeText(e.target.value)}
                          placeholder="Paste your skills, experience, and education here..."
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.88rem',
                          }}
                        />
                      </div>

                      <button type="submit" disabled={analyzing} className="btn btn-primary" style={{ borderRadius: '10px' }}>
                        {analyzing ? <><i className="fa-solid fa-spinner fa-spin"></i> Extracting & Scoring…</> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Analyze Resume</>}
                      </button>
                    </form>

                    {/* Analysis Results Display */}
                    {analysisResult && (
                      <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                        <h4 style={{ color: 'var(--c2, #45f3ff)', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                          <i className="fa-solid fa-circle-check"></i> Extracted Profile & Skills
                        </h4>
                        
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>EXTRACTED EXPERIENCE</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{analysisResult.extractedData?.yearsOfExperience || 0} Years</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>SKILLS DETECTED</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c2, #45f3ff)' }}>{analysisResult.extractedData?.skills?.length || 0} Skills</div>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Extracted Technical Skills:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(analysisResult.extractedData?.technicalSkills || []).map((sk, i) => (
                              <span key={i} style={{ background: 'rgba(69, 243, 255, 0.15)', border: '1px solid var(--c2, #45f3ff)', color: 'var(--c2, #45f3ff)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* APPLY JOB MODAL (Attach Resume File) */}
        {applyModalOpen && selectedJobForApply && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}>
            <div className="card" style={{ width: 'min(500px, 92vw)', borderTop: '4px solid var(--c2, #45f3ff)', animation: 'fadeIn 0.2s ease' }}>
              <div className="card-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-paper-plane" style={{ color: 'var(--c2, #45f3ff)' }}></i> Apply for Position
                  </h3>
                  <button onClick={() => setApplyModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.2rem' }}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div style={{ padding: '10px 14px', background: 'rgba(69, 243, 255, 0.08)', borderRadius: '10px', marginBottom: '1.2rem', border: '1px solid rgba(69, 243, 255, 0.2)' }}>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{selectedJobForApply.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>{selectedJobForApply.department || 'Tech'} · {selectedJobForApply.location || 'Remote'}</div>
                </div>

                <form onSubmit={handleApplySubmit}>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      <i className="fa-solid fa-file-arrow-up" style={{ color: 'var(--c2, #45f3ff)', marginRight: '6px' }}></i>
                      Attach Resume File (PDF / DOCX)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={e => setApplyResumeFile(e.target.files[0])}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.88rem',
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                      Your resume will be anonymized & analyzed by AI and sent directly to the hiring company.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setApplyModalOpen(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={applyingJobId === selectedJobForApply._id} className="btn btn-primary" style={{ borderRadius: '10px' }}>
                      {applyingJobId === selectedJobForApply._id ? <><i className="fa-solid fa-spinner fa-spin"></i> Uploading & Applying…</> : <><i className="fa-solid fa-paper-plane"></i> Submit Application</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
