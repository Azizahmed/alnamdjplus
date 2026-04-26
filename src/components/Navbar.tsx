import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useI18n } from '../i18n';

interface NavbarProps {
  onAccountClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onAccountClick }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const logoSrc = '/logo.png?v=20260410';

  const isAuthenticated = !!user;
  const isPublicFormPath = /^\/forms\/[^/]+$/.test(location.pathname);
  const showSidebarToggle = isAuthenticated && ![
    '/',
    '/account'
  ].includes(location.pathname) && !isPublicFormPath;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAccountClick = () => {
    setMenuOpen(false);
    if (onAccountClick) {
      onAccountClick();
    }
  };

  const handleBuildClick = () => {
    setMenuOpen(false);
    navigate('/build', { state: { createNew: Date.now() } });
  };

  const getInitial = () => (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <nav className="navbar">
      <div className="navbar-branding">
        {showSidebarToggle && (
          <button
            onClick={toggleSidebar}
            title="تبديل الشريط الجانبي"
            className="navbar-icon-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img
            src={logoSrc}
            alt="النموذج"
            className="logo logo-navbar"
          />
        </div>
      </div>

      <div className="navbar-right">
      {user && (
        <div className="user-menu" ref={menuRef}>
          <button
            className="user-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="قائمة المستخدم"
          >
            <div className="user-avatar-placeholder">
              {getInitial()}
            </div>
            <div className="user-identity-inline">
              <span className="user-name">{user.name || user.email}</span>
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          {menuOpen && (
            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-menu-profile-row">
                  <div className="user-avatar-placeholder user-avatar-large">
                    {getInitial()}
                  </div>
                  <div className="user-menu-header-copy">
                    <div className="user-menu-name">{user.name || 'مستخدم'}</div>
                    <div className="user-menu-email">{user.email}</div>
                  </div>
                </div>
              </div>

              <div className="user-menu-section">
                <div className="user-menu-section-label">{t.workspace}</div>
                <button onClick={handleBuildClick} className="user-menu-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18" />
                    <path d="M12 3v18" />
                  </svg>
                  <span>{t.create}</span>
                </button>
              </div>

              <div className="user-menu-section">
                <div className="user-menu-section-label">{t.account}</div>
                <button onClick={handleAccountClick} className="user-menu-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{t.accountSettings}</span>
                </button>
              </div>

              <div className="user-menu-footer">
                <button onClick={handleLogout} className="user-menu-item logout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>{t.signOut}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </nav>
  );
};
