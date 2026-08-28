import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function MobileNav() {
  const { user } = useAuth();

  if (!user) return null;

  const recruiterNav = [
    { to: '/dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
    { to: '/jobs', icon: 'fa-briefcase', label: 'Jobs' },
    { to: '/jobs/create', icon: 'fa-plus-circle', label: 'Create' },
    { to: '/jobs/applications', icon: 'fa-users', label: 'Applicants' },
  ];

  const candidateNav = [
    { to: '/candidate/dashboard', icon: 'fa-sparkles', label: 'Jobs' },
    { to: '/candidate/profile', icon: 'fa-id-card', label: 'Profile' },
    { to: '/candidate/interviews', icon: 'fa-video', label: 'Interviews' },
  ];

  const adminNav = [
    { to: '/dashboard', icon: 'fa-gauge-high', label: 'Overview' },
    { to: '/jobs', icon: 'fa-briefcase', label: 'Jobs' },
    { to: '/jobs/applications', icon: 'fa-users', label: 'Applicants' },
    { to: '/audit', icon: 'fa-clock-rotate-left', label: 'Audit' },
  ];

  const navItems = user.role === 'candidate' 
    ? candidateNav 
    : (user.role === 'admin' ? adminNav : recruiterNav);

  const closeSidebar = () => {
    document.body.classList.remove('sidebar-open');
  };

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={closeSidebar}
          className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
        >
          <i className={`fa-solid ${item.icon}`}></i>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
