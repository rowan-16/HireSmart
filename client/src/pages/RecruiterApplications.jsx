import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API, { SERVER_BASE_URL } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RecruiterApplications() {
  const { user } = useAuth();
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const queryJobId = searchParams.get('jobId') || jobId || '';

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(queryJobId);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rankingInProgress, setRankingInProgress] = useState(false);

  // Interview Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [updating, setUpdating] = useState(false);

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAppForReject, setSelectedAppForReject] = useState(null);
  const [rejectionFeedbackText, setRejectionFeedbackText] = useState('');

  // Fetch jobs (admin gets all jobs, recruiters get created jobs)
  useEffect(() => {
    API.get('/jobs')
      .then(r => {
        if (r.data.success && r.data.jobs?.length) {
          setJobs(r.data.jobs);
          const jobWithApplicants = r.data.jobs.find(j => j.candidateCount > 0);
          const initialId = queryJobId || (jobWithApplicants ? jobWithApplicants._id : r.data.jobs[0]._id);
          setSelectedJobId(initialId);
        } else {
          setJobs([]);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Fetch jobs error:', err);
        setLoading(false);
      });
  }, []);

  // Fetch applications for selected job
  const fetchApplications = async (id) => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.get(`/applications/job/${id}`);
      if (data.success) {
        const sorted = (data.applications || []).sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
        setApplications(sorted);
      }
    } catch (err) {
      console.error('Fetch applications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchApplications(selectedJobId);
    } else {
      setLoading(false);
    }
  }, [selectedJobId]);

  const handleRankResumes = () => {
    setRankingInProgress(true);
    setTimeout(() => {
      const sorted = [...applications].sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
      setApplications(sorted);
      setRankingInProgress(false);
      toast.success('🎯 AI resume ranking complete! Candidates ordered by match score.');
    }, 400);
  };

  const handleUpdateStatus = async (appId, status, extra = {}) => {
    setUpdating(true);
    try {
      const { data } = await API.put(`/applications/${appId}/status`, {
        status,
        ...extra,
      });

      if (data.success) {
        toast.success(`Application updated to ${status}! Candidate notified.`);
        setInterviewModalOpen(false);
        fetchApplications(selectedJobId);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update application status');
    } finally {
      setUpdating(false);
    }
  };

  const openInterviewModal = (app) => {
    setSelectedApp(app);
    setInterviewDate(app.interviewDetails?.date || '');
    setInterviewTime(app.interviewDetails?.time || '');
    setMeetLink(app.interviewDetails?.meetLink || 'https://meet.google.com/abc-defg-hij');
    setInterviewModalOpen(true);
  };

  const openRejectModal = (app) => {
    setSelectedAppForReject(app);
    setRejectionFeedbackText(app.rejectionFeedback || 'Thank you for applying. We are seeking candidates with specific technical skills for this role.');
    setRejectModalOpen(true);
  };

  const handleScheduleInterviewSubmit = (e) => {
    e.preventDefault();
    if (!interviewDate || !interviewTime) {
      return toast.error('Please enter interview date and time');
    }
    if (!meetLink) {
      return toast.error('Please enter a Google Meet link');
    }
    handleUpdateStatus(selectedApp._id, 'interview', {
      date: interviewDate,
      time: interviewTime,
      meetLink,
    });
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionFeedbackText.trim()) {
      return toast.error('Please enter constructive feedback for the candidate');
    }
    handleUpdateStatus(selectedAppForReject._id, 'reject', {
      rejectionFeedback: rejectionFeedbackText,
    });
    setRejectModalOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <Header 
          title="Candidate Applications & Resume Ranking" 
          subtitle="Review candidates, view automated AI match scores, and rank resumes" 
        />

        {/* Job Filter Selector & Auto-Rank Button */}
        {jobs.length > 0 && (
          <div className="job-selector-bar">
            <div className="job-selector-group">
              <label className="job-selector-label">Select Job Posting:</label>
              <select
                className="job-selector-select"
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
              >
                {jobs.map(j => (
                  <option key={j._id} value={j._id} style={{ background: '#1a1a2e', color: '#fff' }}>
                    {j.title} ({j.candidateCount || 0} applicants)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRankResumes}
              disabled={rankingInProgress || applications.length === 0}
              className="btn btn-primary job-selector-btn"
            >
              {rankingInProgress ? (
                <><i className="fa-solid fa-spinner fa-spin"></i> Ranking Resumes…</>
              ) : (
                <><i className="fa-solid fa-ranking-star"></i> Auto-Rank AI Candidates</>
              )}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
            <p style={{ marginTop: '1rem' }}>Loading applicants…</p>
          </div>
        ) : (
          <div>
            {applications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--muted)' }}>
                <i className="fa-solid fa-users-slash" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.2)' }}></i>
                <h4>No applications received yet for this job</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>When candidates apply, their resumes & AI match ratings will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applications.map((app, index) => (
                  <div key={app._id} className="card" style={{
                    borderLeft: app.status === 'accepted' ? '4px solid var(--success)' : app.status === 'rejected' ? '4px solid var(--c1)' : app.status === 'interview' ? '4px solid #ffd166' : '4px solid var(--c2)',
                  }}>
                    <div className="card-inner">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        {/* Candidate Info & Rank Badge */}
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: index === 0 ? 'linear-gradient(135deg, #ffd166, #ff9f1c)' : (index === 1 ? 'linear-gradient(135deg, #e8e8ef, #9aa3b2)' : 'linear-gradient(135deg, var(--c2), var(--c3))'),
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            color: '#08070d',
                            boxShadow: index === 0 ? '0 0 12px rgba(255, 209, 102, 0.4)' : 'none',
                          }}>
                            {app.candidateName?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>{app.candidateName}</h4>
                              <span style={{
                                background: index === 0 ? 'rgba(255, 209, 102, 0.2)' : 'rgba(69, 243, 255, 0.15)',
                                color: index === 0 ? '#ffd166' : '#45f3ff',
                                border: index === 0 ? '1px solid rgba(255, 209, 102, 0.4)' : '1px solid rgba(69, 243, 255, 0.3)',
                                borderRadius: '12px',
                                padding: '2px 10px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}>
                                <i className="fa-solid fa-trophy" style={{ marginRight: '4px' }}></i>
                                #{index + 1} AI Rank
                              </span>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '2px' }}>
                              {app.candidateEmail} · Applied {new Date(app.appliedAt).toLocaleDateString()}
                            </p>

                            {/* View / Download Candidate Resume */}
                            {app.resumeUrl && (
                              <div style={{ marginTop: '6px' }}>
                                <a
                                  href={app.resumeUrl.startsWith('http') ? app.resumeUrl : `${SERVER_BASE_URL}${app.resumeUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--c2, #45f3ff)',
                                    textDecoration: 'none',
                                    background: 'rgba(69, 243, 255, 0.08)',
                                    border: '1px solid rgba(69, 243, 255, 0.2)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                  }}
                                >
                                  <i className="fa-solid fa-file-pdf"></i> View Candidate Resume
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* AI Match Badge */}
                        <div style={{
                          background: 'rgba(69, 243, 255, 0.12)',
                          border: '1px solid var(--c2, #45f3ff)',
                          padding: '6px 14px',
                          borderRadius: '999px',
                          color: 'var(--c2, #45f3ff)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}>
                          <i className="fa-solid fa-brain"></i> {app.matchPercentage}% AI Match
                        </div>
                      </div>

                      {/* Skills Tags */}
                      {app.parsedSkills?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '1rem' }}>
                          {app.parsedSkills.slice(0, 6).map((sk, idx) => (
                            <span key={idx} style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              color: 'rgba(255,255,255,0.85)',
                            }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Interview details if scheduled */}
                      {app.status === 'interview' && (
                        <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(255, 209, 102, 0.1)', borderRadius: '10px', border: '1px solid rgba(255, 209, 102, 0.3)', fontSize: '0.82rem', color: '#ffd166' }}>
                          <i className="fa-solid fa-calendar-check" style={{ marginRight: '6px' }}></i>
                          Interview Scheduled: <strong>{app.interviewDetails?.date} @ {app.interviewDetails?.time}</strong>
                          {app.interviewDetails?.meetLink && (
                            <span style={{ marginLeft: '12px' }}>
                              <a href={app.interviewDetails.meetLink} target="_blank" rel="noreferrer" style={{ color: '#fff', underline: 'always', fontWeight: 600 }}>
                                <i className="fa-solid fa-video"></i> Google Meet Link
                              </a>
                            </span>
                          )}
                        </div>
                      )}

                      {/* 3-OPTION DECISION BUTTONS (Recruiter / Company only) */}
                      {user?.role !== 'admin' ? (
                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {/* 1. Accept Button */}
                          <button
                            onClick={() => handleUpdateStatus(app._id, 'accept')}
                            disabled={updating || app.status === 'accepted'}
                            className="btn"
                            style={{
                              background: app.status === 'accepted' ? 'rgba(34, 227, 163, 0.3)' : 'linear-gradient(135deg, #22e3a3, #10b981)',
                              color: '#08070d',
                              fontWeight: 700,
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                            }}
                          >
                            <i className="fa-solid fa-check"></i> {app.status === 'accepted' ? 'Accepted' : 'Accept Candidate'}
                          </button>

                          {/* 2. Schedule Interview Button */}
                          <button
                            onClick={() => openInterviewModal(app)}
                            disabled={updating}
                            className="btn"
                            style={{
                              background: app.status === 'interview' ? 'rgba(255, 209, 102, 0.3)' : 'linear-gradient(135deg, #ffd166, #ffb703)',
                              color: '#08070d',
                              fontWeight: 700,
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                            }}
                          >
                            <i className="fa-solid fa-video"></i> {app.status === 'interview' ? 'Reschedule Interview' : 'Schedule Interview (Google Meet)'}
                          </button>

                          {/* 3. Reject Button */}
                          <button
                            onClick={() => openRejectModal(app)}
                            disabled={updating}
                            className="btn"
                            style={{
                              background: app.status === 'rejected' ? 'rgba(255, 39, 112, 0.25)' : 'rgba(255, 39, 112, 0.15)',
                              border: '1px solid var(--c1, #ff2770)',
                              color: 'var(--c1, #ff2770)',
                              fontWeight: 600,
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i> {app.status === 'rejected' ? 'Update Rejection Feedback' : 'Reject Candidate'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            background: 'rgba(255, 209, 102, 0.15)',
                            border: '1px solid #ffd166',
                            color: '#ffd166',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}>
                            <i className="fa-solid fa-shield-halved" style={{ marginRight: '6px' }}></i>
                            Admin Read-Only View · Status: <strong style={{ textTransform: 'capitalize', color: '#fff' }}>{app.status}</strong>
                          </span>
                        </div>
                      )}

                      {/* Display Rejection Feedback if rejected */}
                      {app.status === 'rejected' && app.rejectionFeedback && (
                        <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(255, 39, 112, 0.08)', borderRadius: '10px', border: '1px solid rgba(255, 39, 112, 0.2)', fontSize: '0.82rem', color: '#ff7597' }}>
                          <i className="fa-solid fa-comment-dots" style={{ marginRight: '6px' }}></i>
                          Rejection Feedback Sent to Candidate: <strong>"{app.rejectionFeedback}"</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE INTERVIEW MODAL */}
        {interviewModalOpen && selectedApp && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}>
            <div className="card" style={{ width: 'min(500px, 92vw)', borderTop: '4px solid #ffd166', animation: 'fadeIn 0.2s ease' }}>
              <div className="card-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-video" style={{ color: '#ffd166' }}></i> Schedule Interview & Google Meet
                  </h3>
                  <button onClick={() => setInterviewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.2rem' }}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.2rem' }}>
                  Candidate: <strong style={{ color: '#fff' }}>{selectedApp.candidateName}</strong> ({selectedApp.candidateEmail})
                </p>

                <form onSubmit={handleScheduleInterviewSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Interview Date</label>
                    <input
                      type="date"
                      required
                      value={interviewDate}
                      onChange={e => setInterviewDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: '10px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Interview Time</label>
                    <input
                      type="time"
                      required
                      value={interviewTime}
                      onChange={e => setInterviewTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: '10px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Google Meet Link</label>
                    <input
                      type="url"
                      required
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={meetLink}
                      onChange={e => setMeetLink(e.target.value)}
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
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setInterviewModalOpen(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={updating} className="btn" style={{ background: 'linear-gradient(135deg, #ffd166, #ffb703)', color: '#08070d', fontWeight: 700, borderRadius: '10px' }}>
                      {updating ? <><i className="fa-solid fa-spinner fa-spin"></i> Scheduling…</> : <><i className="fa-solid fa-paper-plane"></i> Send Invite & Notify Candidate</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* REJECTION FEEDBACK MODAL */}
        {rejectModalOpen && selectedAppForReject && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}>
            <div className="card" style={{ width: 'min(500px, 92vw)', borderTop: '4px solid var(--c1, #ff2770)', animation: 'fadeIn 0.2s ease' }}>
              <div className="card-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-comment-dots" style={{ color: 'var(--c1, #ff2770)' }}></i> Provide Rejection Feedback
                  </h3>
                  <button onClick={() => setRejectModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.2rem' }}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                  Candidate: <strong style={{ color: '#fff' }}>{selectedAppForReject.candidateName}</strong> ({selectedAppForReject.candidateEmail})
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>QUICK FEEDBACK PRESETS</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      'Seeking candidates with more hands-on React / Node.js experience.',
                      'Role requires higher minimum years of experience.',
                      'Looking for candidates with specialized cloud / DevOps background.',
                      'Position filled by another applicant.',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionFeedbackText(preset)}
                        style={{
                          background: 'rgba(255, 39, 112, 0.1)',
                          border: '1px solid rgba(255, 39, 112, 0.25)',
                          color: 'rgba(255,255,255,0.85)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleRejectSubmit}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Detailed Feedback for Candidate</label>
                    <textarea
                      rows={4}
                      required
                      value={rejectionFeedbackText}
                      onChange={e => setRejectionFeedbackText(e.target.value)}
                      placeholder="Write constructive feedback to help the candidate understand the decision..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.88rem',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setRejectModalOpen(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={updating} className="btn" style={{ background: 'linear-gradient(135deg, #ff2770, #ff5e62)', color: '#fff', fontWeight: 700, borderRadius: '10px' }}>
                      {updating ? <><i className="fa-solid fa-spinner fa-spin"></i> Sending…</> : <><i className="fa-solid fa-paper-plane"></i> Send Feedback & Reject</>}
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
