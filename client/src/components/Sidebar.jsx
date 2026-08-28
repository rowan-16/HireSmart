import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const RECRUITER_NAV = [
  { section: 'Company Hub', items: [
    { to: '/dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
    { to: '/jobs', icon: 'fa-briefcase', label: 'Jobs & Rankings' },
    { to: '/jobs/create', icon: 'fa-plus-circle', label: 'Create Job' },
    { to: '/jobs/applications', icon: 'fa-users', label: 'Applicants' },
  ]},
];

const ADMIN_NAV = [
  { section: 'Admin (Head)', items: [
    { to: '/dashboard', icon: 'fa-gauge-high', label: 'System Overview' },
    { to: '/jobs', icon: 'fa-briefcase', label: 'All Jobs' },
    { to: '/jobs/applications', icon: 'fa-users', label: 'All Applicants' },
  ]},
  { section: 'Audit & Governance', items: [
    { to: '/audit', icon: 'fa-clock-rotate-left', label: 'Audit Trail' },
  ]},
];

const CANDIDATE_NAV = [
  { section: 'Job Seeker Hub', items: [
    { to: '/candidate/dashboard', icon: 'fa-sparkles', label: 'AI Recommended Jobs' },
    { to: '/candidate/profile', icon: 'fa-file-lines', label: 'AI Resume Analyser' },
    { to: '/candidate/interviews', icon: 'fa-briefcase', label: 'My Applications & Interviews' },
  ]},
];

export default function Sidebar() {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action is permanent and cannot be undone.');
    if (!confirmed) return;
    try {
      await deleteAccount();
      toast.success('Your account has been deleted');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete account');
    }
  };

  const currentNav = user?.role === 'candidate' 
    ? CANDIDATE_NAV 
    : (user?.role === 'admin' ? ADMIN_NAV : RECRUITER_NAV);

  const closeMobileSidebar = () => {
    document.body.classList.remove('sidebar-open');
  };

  return (
    <>
      <div className="sidebar-backdrop" onClick={closeMobileSidebar}></div>
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon"><i className="fa-solid fa-brain"></i></div>
            <div>
              <div className="logo-text">Hire<span>Smart</span></div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>Fair AI Recruiting</div>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={closeMobileSidebar}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {currentNav.map(section => (
            <div key={section.section}>
              <div className="nav-section">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
