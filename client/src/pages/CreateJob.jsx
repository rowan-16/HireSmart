import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function CreateJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'Engineering',
    minExperience: 0, educationRequirement: '', minScreeningScore: 70,
    scoringWeights: { skills: 0.5, experience: 0.25, projects: 0.15, education: 0.10 },
  });
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [preferredSkills, setPreferredSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [prefInput, setPrefInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag = (list, setList, input, setInput) => {
    const val = input.trim();
    if (val && !list.includes(val)) setList(l => [...l, val]);
    setInput('');
  };
  const removeTag = (setList, val) => setList(l => l.filter(x => x !== val));

  const handleExtract = async () => {
    if (!form.description) return toast.error('Enter a job description first');
    setExtracting(true);
    try {
      const { data } = await API.post('/jobs/extract-requirements', { description: form.description });
      if (data.extractedSkills?.length) {
        setRequiredSkills(s => [...new Set([...s, ...data.extractedSkills])]);
        toast.success(`Extracted ${data.extractedSkills.length} skills`);
      }
      if (data.minExperience > 0) updateForm('minExperience', data.minExperience);
      if (data.educationRequirement) updateForm('educationRequirement', data.educationRequirement);
    } catch { toast.error('Extraction failed'); }
    finally { setExtracting(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Title and description required');
    setLoading(true);
    try {
      const { data } = await API.post('/jobs', { ...form, requiredSkills, preferredSkills, certifications });
      toast.success('Job created!');
      navigate('/jobs/applications');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to create job'); }
    finally { setLoading(false); }
  };

  const weightTotal = Object.values(form.scoringWeights).reduce((s, v) => s + Number(v), 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-fade">
        <Header 
          title="Create Job Posting" 
          subtitle="Define the role and let HireSmart extract requirements automatically" 
        />

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <div className="card-inner">
                  <h3 style={{ marginBottom: '1.25rem', fontWeight: 700 }}>Basic Information</h3>
                  <div className="form-group">
                    <label className="form-label">Job Title *</label>
                    <input className="form-input" placeholder="e.g. Machine Learning Engineer" value={form.title} onChange={e => updateForm('title', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={e => updateForm('category', e.target.value)}>
                      {['Engineering','Data Science','Design','Marketing','Finance','Operations','HR','Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Description *</label>
                    <textarea className="form-textarea" rows={6} placeholder="Describe the role, responsibilities, and requirements…" value={form.description} onChange={e => updateForm('description', e.target.value)} required />
                    <div className="form-hint">HireSmart will auto-extract skills and requirements from this description.</div>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={handleExtract} disabled={extracting}>
                    {extracting ? <><i className="fa-solid fa-spinner fa-spin"></i> Extracting…</> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Auto-Extract Requirements</>}
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-inner">
                  <h3 style={{ marginBottom: '1.25rem', fontWeight: 700 }}>Requirements</h3>
                  <div className="form-group">
                    <label className="form-label">Required Skills</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="form-input" placeholder="Add skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(requiredSkills, setRequiredSkills, skillInput, setSkillInput))} />
                      <button type="button" className="btn btn-secondary" onClick={() => addTag(requiredSkills, setRequiredSkills, skillInput, setSkillInput)}><i className="fa-solid fa-plus"></i></button>
                    </div>
                    <div className="tags">
                      {requiredSkills.map(s => <span key={s} className="tag">{s} <span className="tag-remove" onClick={() => removeTag(setRequiredSkills, s)}>×</span></span>)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Skills</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="form-input" placeholder="Add preferred skill…" value={prefInput} onChange={e => setPrefInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(preferredSkills, setPreferredSkills, prefInput, setPrefInput))} />
                      <button type="button" className="btn btn-secondary" onClick={() => addTag(preferredSkills, setPreferredSkills, prefInput, setPrefInput)}><i className="fa-solid fa-plus"></i></button>
                    </div>
                    <div className="tags">
                      {preferredSkills.map(s => <span key={s} className="tag" style={{ '--c3': '#ffd166', background: 'rgba(255,209,102,0.1)', color: '#ffd166', border: '1px solid rgba(255,209,102,0.25)' }}>{s} <span className="tag-remove" onClick={() => removeTag(setPreferredSkills, s)}>×</span></span>)}
                    </div>
                  </div>
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Min. Experience (years)</label>
                      <input className="form-input" type="number" min="0" max="20" value={form.minExperience} onChange={e => updateForm('minExperience', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Education Requirement</label>
                      <input className="form-input" placeholder="e.g. Bachelor's, Master's" value={form.educationRequirement} onChange={e => updateForm('educationRequirement', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <div className="card-inner">
                  <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Scoring Weights</h3>
                  <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>Configure how each factor contributes to the final score. Weights must sum to 1.0</p>
                  {[['skills','Skills (required + preferred)','var(--c2)'],['experience','Experience (years)','var(--success)'],['projects','Projects (relevance)','var(--c3)'],['education','Education (level)','var(--warning)']].map(([k, label, color]) => (
                    <div key={k} className="form-group">
                      <div className="flex-between">
                        <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{(Number(form.scoringWeights[k]) * 100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min="0.05" max="0.80" step="0.05" value={form.scoringWeights[k]}
                        onChange={e => setForm(f => ({ ...f, scoringWeights: { ...f.scoringWeights, [k]: Number(e.target.value) } }))}
                        style={{ width: '100%', accentColor: color, marginTop: '0.4rem' }} />
                    </div>
                  ))}
                  {Math.abs(weightTotal - 1) > 0.02 && (
                    <div className="alert alert-warning"><i className="fa-solid fa-triangle-exclamation"></i> Weights sum to {(weightTotal * 100).toFixed(0)}% — adjust to total 100%</div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-inner">
                  <h3 style={{ marginBottom: '1.25rem', fontWeight: 700 }}>Screening Threshold</h3>
                  <div className="form-group">
                    <label className="form-label">Minimum Score to Qualify: <strong style={{ color: 'var(--c2)' }}>{form.minScreeningScore}%</strong></label>
                    <input type="range" min="0" max="100" step="5" value={form.minScreeningScore}
                      onChange={e => updateForm('minScreeningScore', Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--c2)' }} />
                    <div className="form-hint">Candidates below this threshold will be marked as low match.</div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info">
                <i className="fa-solid fa-shield-halved"></i>
                <div>
                  <strong>Privacy Notice</strong><br />
                  <span style={{ fontSize: '0.83rem' }}>All resumes will be anonymized before scoring. Protected attributes will never be used as ranking features.</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Creating…</> : <><i className="fa-solid fa-check"></i> Create Job Posting</>}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
