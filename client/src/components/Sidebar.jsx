import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const RECRUITER_NAV = [
  { section: 'Main', items: [
    { to: '/dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
    { to: '/jobs', icon: 'fa-briefcase', label: 'Jobs' },
    { to: '/jobs/create', icon: 'fa-plus-circle', label: 'Create Job' },
    { to: '/jobs/applications', icon: 'fa-users', label: 'Applicants' },
  ]},
  { section: 'Audit', items: [
    { to: '/audit', icon: 'fa-clock-rotate-left', label: 'Audit Trail' },
  ]},
];

const CANDIDATE_NAV = [
  { section: 'Job Seeker Hub', items: [
    { to: '/candidate/dashboard', icon: 'fa-sparkles', label: 'Recommended Jobs' },
    { to: '/candidate/profile', icon: 'fa-id-card', label: 'My Resume & Profile' },
    { to: '/candidate/interviews', icon: 'fa-video', label: 'My Interviews' },
  ]},
];

export default function Sidebar() {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action is permanent and cannot be undone.');
    if (!confirmed) return;
    try {
      await deleteAccount();
      toast.success('Your account has been deleted');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete account');
    }
  };

  const currentNav = user?.role === 'candidate' ? CANDIDATE_NAV : RECRUITER_NAV;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><i className="fa-solid fa-brain"></i></div>
        <div>
          <div className="logo-text">Hire<span>Smart</span></div>
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>Fair AI Recruiting</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {currentNav.map(section => (
          <div key={section.section}>
            <div className="nav-section">{section.section}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <i className={`fa-solid ${item.icon}`}></i>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role === 'candidate' ? 'Job Seeker' : user?.role}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleDeleteAccount}
              style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.95rem', padding: '4px', opacity: 0.85, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
              title="Delete Account"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: '4px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              title="Logout"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
