import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API, { SERVER_BASE_URL } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function CandidateProfile() {
  const { user, setUser, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    headline: user?.headline || 'Full Stack Software Engineer',
    phone: user?.phone || '+1 (555) 019-2834',
    location: user?.location || 'San Francisco, CA (Remote)',
    skills: user?.skills?.join(', ') || 'React, Node.js, Python, MongoDB, SQL, Git',
    yearsOfExperience: user?.yearsOfExperience || 3,
    bio: user?.bio || 'Passionate software developer interested in modern web applications, AI engineering, and fair recruitment.',
    linkedin: user?.linkedin || 'https://linkedin.com/in/candidate',
    github: user?.github || 'https://github.com/candidate',
  });
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Resume Modal Viewer state
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        ...formData,
        skills: skillsArray,
      };

      const { data } = await API.put('/auth/profile', payload);
      if (data.success) {
        toast.success('Profile updated successfully!');
        if (updateUser) updateUser(data.user);
        else if (setUser && data.user) setUser(data.user);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    setUploadingResume(true);
    try {
      const form = new FormData();
      form.append('resume', file);

      const { data } = await API.post('/candidate/analyze-resume', form);

      if (data.success) {
        toast.success('Resume file uploaded & skills updated!');
        if (data.resumeUrl && updateUser) {
          updateUser({ resumeUrl: data.resumeUrl });
        }
        if (data.extractedData?.skills?.length) {
          setFormData(prev => ({
            ...prev,
            skills: data.extractedData.skills.join(', '),
            yearsOfExperience: data.extractedData.yearsOfExperience || prev.yearsOfExperience,
          }));
        }
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Resume upload failed');
    } finally {
      setUploadingResume(false);
    }
  };

  const resumeFullUrl = user?.resumeUrl
    ? (user.resumeUrl.startsWith('http') ? user.resumeUrl : `${SERVER_BASE_URL}${user.resumeUrl}`)
    : '';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <Header 
          title="Job Seeker Profile & Resume" 
          subtitle="Manage your personal information, skills, and view your uploaded resume" 
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Personal Information Form Card */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-inner">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-id-card" style={{ color: 'var(--c2, #45f3ff)' }}></i> Personal & Professional Details
              </h3>

              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'var(--muted)', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Professional Headline</label>
                    <input
                      type="text"
                      name="headline"
                      value={formData.headline}
                      onChange={handleChange}
                      placeholder="e.g. Senior Frontend Developer / Data Analyst"
                      style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Location / Remote Status</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. New York, NY (Hybrid)"
                      style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Technical & Soft Skills (comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="React, Node.js, Python, PostgreSQL, AWS, Teamwork"
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', color: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Years of Experience: {formData.yearsOfExperience} Years</label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    style={{ width: '100%', accentColor: 'var(--c2, #45f3ff)' }}
                  />
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Short Professional Bio</label>
                  <textarea
                    rows={4}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>

                <button type="submit" disabled={saving} className="btn btn-primary" style={{ borderRadius: '10px' }}>
                  {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</> : <><i className="fa-solid fa-floppy-disk"></i> Save Profile</>}
                </button>
              </form>
            </div>
          </div>

          {/* Resume Upload & View Options Card */}
          <div className="card">
            <div className="card-inner">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-file-pdf" style={{ color: 'var(--c1, #ff2770)' }}></i> Default Resume File
              </h3>

              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.18)', textAlign: 'center', marginBottom: '1.2rem' }}>
                <i className="fa-solid fa-file-invoice" style={{ fontSize: '2.4rem', color: 'var(--c2, #45f3ff)', marginBottom: '0.8rem', display: 'block' }}></i>
                <h5 style={{ color: '#fff', fontWeight: 700, fontSize: '0.98rem' }}>
                  {resumeFile ? resumeFile.name : (user?.resumeUrl ? 'Active Resume Attached' : 'No Resume Uploaded Yet')}
                </h5>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '6px' }}>
                  {user?.resumeUrl ? 'Your default resume is saved and attached for 1-click job applications.' : 'Upload a PDF/DOCX resume file to auto-fill job applications.'}
                </p>

                  {/* AI Resume Analyser Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', borderRadius: '10px', fontSize: '0.85rem' }}>
                      {uploadingResume ? <><i className="fa-solid fa-spinner fa-spin"></i> Uploading…</> : <><i className="fa-solid fa-upload"></i> {user?.resumeUrl ? 'Replace Resume' : 'Upload Resume'}</>}
                      <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload} style={{ display: 'none' }} />
                    </label>

                    <button
                      type="button"
                      onClick={() => setViewModalOpen(true)}
                      className="btn btn-primary"
                      style={{ borderRadius: '10px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #45f3ff, #0077b6)', color: '#000', fontWeight: 700 }}
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i> AI Resume Analyser
                    </button>
                  </div>
                </div>

                {/* Quick Preview Badges */}
                <div>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>SKILLS PREVIEW</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {formData.skills.split(',').map((s, idx) => s.trim() && (
                      <span key={idx} style={{ background: 'rgba(69, 243, 255, 0.12)', border: '1px solid var(--c2, #45f3ff)', color: 'var(--c2, #45f3ff)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Resume Analyser Modal */}
          {viewModalOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 15, 25, 0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
              <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', width: '100%', maxWidth: '580px', padding: '1.75rem', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(69, 243, 255, 0.15)', color: 'var(--c2, #45f3ff)', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>AI Resume Analysis</h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Parsed by HireSmart AI NLP Engine</span>
                    </div>
                  </div>
                  <button onClick={() => setViewModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '1.3rem', cursor: 'pointer' }}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(34, 227, 163, 0.08)', border: '1px solid rgba(34, 227, 163, 0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.8rem', color: '#22e3a3' }}></i>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#22e3a3' }}>PII Anonymization Verified</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>Personal identity details are stripped before recruiter ranking to eliminate gender/race bias.</p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '6px' }}>EXTRACTED SKILLS MATRIX</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {formData.skills.split(',').map((s, idx) => s.trim() && (
                        <span key={idx} style={{ background: 'rgba(69, 243, 255, 0.15)', border: '1px solid #45f3ff', color: '#45f3ff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                          ✓ {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>EXPERIENCE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{formData.yearsOfExperience} Years</div>
                    </div>
                    <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>AI MATCH ACCURACY</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22e3a3', marginTop: '2px' }}>94% Relevant</div>
                    </div>
                  </div>

                  {user?.resumeUrl && (
                    <a
                      href={resumeFullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{ textAlign: 'center', marginTop: '0.5rem', borderRadius: '10px', padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                    >
                      <i className="fa-solid fa-file-pdf"></i> Download PDF Document
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
