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
  const { register, loginWithGoogle } = useAuth();
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
                <label htmlFor="reg-name" className="holo-label">Full Name / Company Name</label>
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
              <div className="holo-divider">or continue with</div>
              <button type="button" className="google-btn" onClick={() => loginWithGoogle(role, email, name, true)}>
                <svg className="google-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign up as {role === 'candidate' ? 'Job Seeker' : 'Company'} with Google
              </button>
              <div className="holo-links">
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
