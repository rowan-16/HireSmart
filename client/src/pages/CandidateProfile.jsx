import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import API from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function CandidateProfile() {
  const { user, setUser } = useAuth();
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
        if (setUser && data.user) setUser(data.user);
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

      const { data } = await API.post('/candidate/analyze-resume', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Resume file uploaded & skills updated!');
        if (data.extractedData?.skills?.length) {
          setFormData(prev => ({
            ...prev,
            skills: data.extractedData.skills.join(', '),
            yearsOfExperience: data.extractedData.yearsOfExperience || prev.yearsOfExperience,
          }));
        }
      }
    } catch (err) {
      toast.error('Resume upload failed');
    } finally {
      setUploadingResume(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Job Seeker Profile & Resume</h1>
            <p className="page-sub">Manage your personal information, skills, and default resume for 1-click job applications</p>
          </div>
          <NotificationBell />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Form Card */}
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

          {/* Resume Upload Card */}
          <div className="card">
            <div className="card-inner">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-file-pdf" style={{ color: 'var(--c1, #ff2770)' }}></i> Default Resume File
              </h3>

              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.15)', textAlign: 'center', marginBottom: '1.2rem' }}>
                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '2rem', color: 'var(--c2, #45f3ff)', marginBottom: '0.8rem', display: 'block' }}></i>
                <h5 style={{ color: '#fff', fontWeight: 600, fontSize: '0.92rem' }}>
                  {resumeFile ? resumeFile.name : 'Upload Latest Resume PDF/DOCX'}
                </h5>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '4px' }}>
                  This file will be attached when applying for jobs and stored securely in Cloudinary.
                </p>

                <label className="btn btn-secondary" style={{ marginTop: '1rem', cursor: 'pointer', display: 'inline-block', borderRadius: '10px' }}>
                  {uploadingResume ? <><i className="fa-solid fa-spinner fa-spin"></i> Uploading…</> : <><i className="fa-solid fa-upload"></i> Choose Resume File</>}
                  <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload} style={{ display: 'none' }} />
                </label>
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
      </main>
    </div>
  );
}
