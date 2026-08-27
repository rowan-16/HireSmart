import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function GoogleSuccess() {
  const [params] = useSearchParams();
  const { loginFromToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const name = params.get('name');
    const email = params.get('email');
    const role = params.get('role');
    const avatar = params.get('avatar') || '';

    if (token) {
      const userData = { name, email, role, avatar };
      if (window.opener) {
        // Send login payload to main window and close popup
        window.opener.postMessage({
          type: 'GOOGLE_LOGIN_SUCCESS',
          token,
          user: userData,
        }, '*');
        window.close();
      } else {
        loginFromToken(token, userData);
        toast.success(`Welcome, ${name}!`);
        const targetPath = role === 'candidate' ? '/candidate/dashboard' : '/dashboard';
        navigate(targetPath, { replace: true });
      }
    } else {
      toast.error('Google login failed');
      if (window.opener) window.close();
      else navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#ffffff', color: '#202124', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Signing in...</div>
        <p style={{ fontSize: '0.88rem', color: '#5f6368' }}>Please wait while Google authenticates your account.</p>
      </div>
    </div>
  );
}
