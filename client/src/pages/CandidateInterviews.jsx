import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API from '../services/api';

export default function CandidateInterviews() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/applications/my-applications')
      .then(r => {
        if (r.data.success) {
          const interviewApps = (r.data.applications || []).filter(a => a.status === 'interview');
          setApplications(interviewApps);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <Header 
          title="Scheduled Interviews" 
          subtitle="Access your video interview invitations and Google Meet links" 
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
            <p style={{ marginTop: '1rem' }}>Loading interview schedule…</p>
          </div>
        ) : (
          <div>
            {applications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--muted)' }}>
                <i className="fa-solid fa-video-slash" style={{ fontSize: '2.8rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.2)' }}></i>
                <h4 style={{ color: '#fff' }}>No upcoming interviews scheduled yet</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', maxWidth: '400px', margin: '0.4rem auto 0 auto' }}>
                  When companies review your job application and select you for an interview, meeting details & Google Meet links will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.2rem' }}>
                {applications.map((app) => (
                  <div key={app._id} className="card" style={{ borderTop: '4px solid #ffd166' }}>
                    <div className="card-inner">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <span style={{ background: 'rgba(255, 209, 102, 0.2)', border: '1px solid #ffd166', color: '#ffd166', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <i className="fa-solid fa-video"></i> Interview Confirmed
                          </span>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '8px' }}>
                            {app.jobId?.title || 'Applied Position'}
                          </h4>
                          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                            {app.jobId?.department || 'Tech'} · {app.jobId?.location || 'Remote'}
                          </div>
                        </div>

                        <span style={{
                          background: 'rgba(69, 243, 255, 0.12)',
                          border: '1px solid var(--c2, #45f3ff)',
                          color: 'var(--c2, #45f3ff)',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}>
                          {app.matchPercentage}% AI Match
                        </span>
                      </div>

                      {/* Date & Time Box */}
                      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <i className="fa-solid fa-calendar-day" style={{ color: '#ffd166', fontSize: '1.1rem' }}></i>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Interview Date</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{app.interviewDetails?.date || 'TBD'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className="fa-solid fa-clock" style={{ color: '#ffd166', fontSize: '1.1rem' }}></i>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Scheduled Time</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{app.interviewDetails?.time || 'TBD'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Join Google Meet Button */}
                      {app.interviewDetails?.meetLink && (
                        <a
                          href={app.interviewDetails.meetLink.startsWith('http') ? app.interviewDetails.meetLink : `https://${app.interviewDetails.meetLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn"
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(135deg, #00875a, #00b8d9)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            padding: '10px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                          }}
                        >
                          <i className="fa-solid fa-video"></i> Join Google Meet Meeting
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
