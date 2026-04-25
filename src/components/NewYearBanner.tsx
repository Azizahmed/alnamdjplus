import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const NewYearBanner: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('newyear_banner_dismissed') === 'true';
  });
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const newYear = new Date('2026-02-28T23:59:59');
      const now = new Date();
      const difference = newYear.getTime() - now.getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('newyear_banner_dismissed', 'true');
  };

  const handlePromoClick = () => {
    // Navigate to pricing with promo code in URL (Stripe convention)
    navigate('/pricing?prefilled_promo_code=FIRST100');
  };

  // Don't show if dismissed or if it's already past Feb 28th, 2026
  if (dismissed || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) {
    return null;
  }

  return (
    <div style={{
      background: 'white',
      color: '#1a1a2e',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      position: 'relative',
      overflow: 'hidden',
      flexWrap: 'wrap',
      borderBottom: '1px solid rgba(147, 51, 234, 0.2)',
      boxShadow: '0 2px 8px rgba(147, 51, 234, 0.1)',
    }}>
      {/* Countdown section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
        <span style={{ fontSize: '20px' }}>🎆</span>
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#b45309' }}>{t.newYearExtendedSale}</span>
        <div style={{ display: 'flex', gap: '6px', marginInlineStart: '8px' }}>
          <TimeBlock value={timeLeft.days} label="d" />
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>:</span>
          <TimeBlock value={timeLeft.hours} label="h" />
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>:</span>
          <TimeBlock value={timeLeft.minutes} label="m" />
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>:</span>
          <TimeBlock value={timeLeft.seconds} label="s" />
        </div>
      </div>

      {/* Promo section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
        <span style={{
          background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '0.5px',
        }}>
          30% OFF
        </span>
        <span style={{ fontSize: '13px', color: '#666' }}>
          {t.useCode} <code style={{
            background: 'rgba(147, 51, 234, 0.1)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600,
            color: '#b45309',
            border: '1px dashed rgba(147, 51, 234, 0.4)',
          }}>FIRST100</code>
        </span>
        <button
          onClick={handlePromoClick}
          style={{
            background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '25px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(147, 51, 234, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(147, 51, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(147, 51, 234, 0.3)';
          }}
        >
          {t.goToPlan}
        </button>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          insetInlineEnd: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(147, 51, 234, 0.1)',
          border: 'none',
          color: '#b45309',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          opacity: 0.7,
          transition: 'opacity 0.2s ease',
          zIndex: 1,
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        aria-label={t.dismissBanner}
      >
        ✕
      </button>
    </div>
  );
};

const TimeBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div style={{
    background: 'rgba(147, 51, 234, 0.1)',
    border: '1px solid rgba(147, 51, 234, 0.3)',
    borderRadius: '6px',
    padding: '4px 8px',
    minWidth: '36px',
    textAlign: 'center',
  }}>
    <span style={{
      fontWeight: 700,
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#b45309',
    }}>
      {String(value).padStart(2, '0')}
    </span>
    <span style={{ fontSize: '10px', color: '#999', marginInlineStart: '2px' }}>{label}</span>
  </div>
);
