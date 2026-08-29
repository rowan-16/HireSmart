import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './Login.css';

const THEMES = [
  { key: 'theme-neon',    c1: '#ff2770', c2: '#45f3ff', c3: '#8a5cff', sw1: '#ff2770', sw2: '#45f3ff' },
  { key: 'theme-aurora',  c1: '#8a5cff', c2: '#3ad6ff', c3: '#ff6ad5', sw1: '#8a5cff', sw2: '#3ad6ff' },
  { key: 'theme-sunset',  c1: '#ff6a3d', c2: '#ffd166', c3: '#ff3d77', sw1: '#ff6a3d', sw2: '#ffd166' },
  { key: 'theme-emerald', c1: '#22e3a3', c2: '#7dff9b', c3: '#33c0ff', sw1: '#22e3a3', sw2: '#7dff9b' },
];

export default function Register() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialRole = location.state?.role || searchParams.get('role') || 'candidate';
  const initialEmail = location.state?.email || searchParams.get('email') || '';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(THEMES[0]);
  const cardRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('error') === 'account_not_found') {
      toast.error('Account does not exist. Please sign up to create your account.');
    }
  }, [searchParams]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !window.matchMedia('(pointer: fine)').matches) return;
    const MAX = 6;
    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const ry = (px - 0.5) * 2 * MAX;
      const rx = (0.5 - py) * 2 * MAX;
      requestAnimationFrame(() => {
        card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
    };
    const reset = () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', reset);
    reset();
    return () => { card.removeEventListener('pointermove', onMove); card.removeEventListener('pointerleave', reset); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('All fields required');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(name, email, password, role);
      toast.success(`Account created as ${role === 'recruiter' ? 'Company' : 'Job Seeker'}!`);
      navigate(role === 'candidate' ? '/candidate/dashboard' : '/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const cardStyle = { '--c1': theme.c1, '--c2': theme.c2, '--c3': theme.c3 };

  return (
    <div className="login-root" style={cardStyle}>
      <div className="stage">
        <div className="holo-card" ref={cardRef} tabIndex="-1" style={{ ...cardStyle, height: undefined }}>
          <div className="layer aurora" aria-hidden="true">
            <span className="blob blob-a"></span><span className="blob blob-b"></span><span className="blob blob-c"></span>
          </div>
          <div className="layer rings" aria-hidden="true"></div>
          <div className="layer panel"></div>
          <div className="layer beam" aria-hidden="true"></div>
          <div className="layer sheen" aria-hidden="true"></div>
          <div className="layer reveal">
            <div className="holo-title">
              <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
              <span>Register</span>
              <i className="fa-solid fa-star heart" aria-hidden="true" style={{ animation: 'beat 1.5s ease-in-out infinite' }}></i>
            </div>
            <form className="holo-fields" onSubmit={handleSubmit} noValidate>
              {/* Role Toggle Tabs */}
              <div className="role-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'candidate'}
                  className={`role-tab ${role === 'candidate' ? 'active' : ''}`}
                  onClick={() => setRole('candidate')}
                >
                  <i className="fa-solid fa-user"></i> Job Seeker
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'recruiter'}
                  className={`role-tab ${role === 'recruiter' ? 'active' : ''}`}
                  onClick={() => setRole('recruiter')}
                >
                  <i className="fa-solid fa-building"></i> Company
                </button>
              </div>

              <div className="holo-field">
                <i className="fa-solid fa-user holo-field-icon"></i>
                <input id="reg-name" type="text" className="holo-input" placeholder=" " required value={name} onChange={e => setName(e.target.value)} />
                <label htmlFor="reg-name" className="holo-label">Full Name</label>
              </div>
              <div className="holo-field">
                <i className="fa-solid fa-envelope holo-field-icon"></i>
                <input id="reg-email" type="email" className="holo-input" placeholder=" " required value={email} onChange={e => setEmail(e.target.value)} />
                <label htmlFor="reg-email" className="holo-label">Email</label>
              </div>
              <div className="holo-field">
                <i className="fa-solid fa-lock holo-field-icon"></i>
                <input id="reg-password" type={showPw ? 'text' : 'password'} className="holo-input" placeholder=" " required value={password} onChange={e => setPassword(e.target.value)} />
                <label htmlFor="reg-password" className="holo-label">Password</label>
                <button type="button" className="toggle-pw" onClick={() => setShowPw(p => !p)}>
                  <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <button type="submit" className="holo-submit" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Creating account…</> : <><span>Register as {role === 'candidate' ? 'Job Seeker' : 'Company'}</span><i className="fa-solid fa-arrow-right-long"></i></>}
              </button>
              <div className="holo-links" style={{ marginTop: '1.25rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>Already have an account?</span>
                <Link to="/login" className="accent">Sign in</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="themes">
        {THEMES.map(t => (
          <button key={t.key} title={t.key} className={theme.key === t.key ? 'active-theme' : ''} style={{ '--sw1': t.sw1, '--sw2': t.sw2 }} onClick={() => setTheme(t)} />
        ))}
      </div>
    </div>
  );
}
