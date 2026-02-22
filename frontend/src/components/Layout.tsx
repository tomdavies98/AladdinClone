import { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import './Layout.css';

const NAV = [
  { path: 'portfolio', label: 'Whole-Portfolio Management' },
  { path: 'risk', label: 'Risk Analytics' },
  { path: 'trading', label: 'Trading and Order Management' },
  { path: 'operations', label: 'Operations and Accounting' },
  { path: 'private-markets', label: 'Private Markets and Alternatives' },
  { path: 'data-analytics', label: 'Data and Analytics' },
  { path: 'esg-climate', label: 'ESG and Climate' },
  { path: 'wealth', label: 'Wealth Management' },
  { path: 'ecosystem', label: 'Ecosystem and Infrastructure' },
  { path: 'design-principles', label: 'Design Principles' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { preferences } = usePreferences();
  const navigate = useNavigate();

  const theme = preferences.theme || 'dark';
  const layoutMode = preferences.dashboard_layout || 'sidebar';

  useEffect(() => {
    const root = document.documentElement;
    const resolveTheme = () =>
      theme === 'system'
        ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    root.setAttribute('data-theme', resolveTheme());
    if (theme === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => root.setAttribute('data-theme', resolveTheme());
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, [theme]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`layout layout--${layoutMode} ${layoutMode === 'sidebar' && sidebarOpen ? 'sidebar-open' : ''}`}>
      {layoutMode === 'sidebar' && (
        <>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {sidebarOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
          <div className="sidebar-overlay" aria-hidden="true" onClick={() => setSidebarOpen(false)} />
        </>
      )}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/app" className="sidebar-brand">Aladdin Clone</Link>
          <span className="sidebar-user">{user?.display_name || 'User'}</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => layoutMode === 'sidebar' && setSidebarOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
