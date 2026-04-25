import React from 'react';
import { useNavigate } from 'react-router-dom';

interface GoogleAuthButtonProps {
  onSuccess?: (token: string) => void;
  className?: string;
  children?: React.ReactNode;
  redirectTo?: string; // URL to redirect to after login
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  className = 'cta-button-primary',
  children = 'ابدأ الآن',
  redirectTo
}) => {
  const navigate = useNavigate();

  const handleAuth = () => {
    // Store callback for after login
    if (onSuccess) {
      sessionStorage.setItem('auth_callback', 'true');
    }

    // Store redirect URL if provided
    if (redirectTo) {
      sessionStorage.setItem('auth_redirect_to', redirectTo);
    }

    // Navigate to auth page
    navigate('/auth');
  };

  return (
    <button className={className} onClick={handleAuth}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginInlineEnd: '8px' }}>
        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
      {children}
    </button>
  );
};
