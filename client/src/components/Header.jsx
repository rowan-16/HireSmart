import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';

export default function Header({ title, subtitle }) {
  const { user, logout, deleteAccount } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('⚠️ Are you sure you want to delete your account? This action is permanent and cannot be undone.');
    if (!confirmed) return;
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete account');
    }
  };

  const roleLabel = user?.role === 'admin' 
    ? 'Admin (The Head)' 
    : user?.role === 'candidate' 
    ? 'Job Seeker' 
    : 'Company / Recruiter';

  const roleBadgeColor = user?.role === 'admin'
    ? 'linear-gradient(135deg, #ff2770, #8a5cff)'
    : user?.role === 'candidate'
    ? 'linear-gradient(135deg, #22e3a3, #00b4d8)'
    : 'linear-gradient(135deg, #45f3ff, #0077b6)';

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4285F4&color=fff&size=128&bold=true`;

  const toggleMobileSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  return (
    <header className="main-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.75rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="mobile-menu-toggle" onClick={toggleMobileSidebar} aria-label="Toggle menu">
          <i className="fa-solid fa-bars"></i>
        </button>
        <div>
          {title ? (
            <h1 className="page-title" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
              {title}
            </h1>
          ) : (
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Hire<span style={{ color: 'var(--c2, #45f3ff)' }}>Smart</span>
            </div>
          )}
          {subtitle && <p className="page-sub" style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>{subtitle}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Avatar & Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(p => !p)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '30px',
              padding: '4px 14px 4px 5px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: dropdownOpen ? '0 0 15px rgba(69, 243, 255, 0.3)' : 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(69, 243, 255, 0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
          >
            <img
              src={avatarUrl}
              alt={user?.name || 'Google Profile'}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(69, 243, 255, 0.4)' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4285F4&color=fff&bold=true`;
              }}
            />

            <div style={{ textAlign: 'left', lineHeight: '1.25' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User Account'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted, #9aa3b2)' }}>
                {roleLabel}
              </div>
            </div>

            <i className={`fa-solid fa-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '4px' }}></i>
          </button>

          {/* Floating Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="animate-fade"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                background: '#121624',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(69, 243, 255, 0.1)',
                padding: '0.75rem',
                zIndex: 1000,
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* User Details Header */}
              <div style={{ padding: '0.5rem 0.75rem 0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{user?.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', wordBreak: 'break-all' }}>{user?.email}</div>
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: roleBadgeColor,
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {roleLabel}
                </div>
              </div>

              {/* Menu Links */}
              <div style={{ padding: '0.5rem 0' }}>
                {user?.role === 'candidate' ? (
                  <Link
                    to="/candidate/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      color: 'var(--text-main, #e8e8ef)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="fa-solid fa-id-card" style={{ color: 'var(--c2, #45f3ff)' }}></i> My Resume & Profile
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      color: 'var(--text-main, #e8e8ef)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="fa-solid fa-gauge-high" style={{ color: 'var(--c2, #45f3ff)' }}></i> Dashboard Overview
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/audit"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      color: 'var(--text-main, #e8e8ef)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="fa-solid fa-crown" style={{ color: '#ffd166' }}></i> Audit Trail (Admin)
                  </Link>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="fa-solid fa-right-from-bracket" style={{ color: '#45f3ff' }}></i> Log out
                </button>

                {user?.role !== 'admin' && (
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: '#ff4d4d',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 77, 77, 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="fa-solid fa-trash-can" style={{ color: '#ff4d4d' }}></i> Delete Account
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
