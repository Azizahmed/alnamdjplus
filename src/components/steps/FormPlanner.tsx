import React, { useState } from 'react';
import { useI18n } from '../../i18n';

interface FormPlannerProps {
  onComplete: (formData: any) => void;
}

export const FormPlanner: React.FC<FormPlannerProps> = ({ onComplete }) => {
  const { t } = useI18n();
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window width for responsive adjustments
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const examples = t.examples;

  const handleGenerate = () => {
    if (!description.trim()) {
      setError('يرجى وصف النموذج الذي تريد إنشاؤه');
      return;
    }

    // Navigate immediately to form builder with user query
    // Form builder will handle the generation and display
    onComplete({ 
      isGenerating: true, 
      user_query: description,
      title: 'جاري إنشاء النموذج...',
      description: description,
      questions: [],
      conditional_rules: []
    });
  };

  return (
    <div style={{
      minHeight: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: isMobile ? '8vh 16px 32px 16px' : isTablet ? '10vh 20px 36px 20px' : '12vh 20px 40px 20px',
      background: 'linear-gradient(135deg, #faf8f6 0%, #e8e4e0 100%)',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        flex: '0 1 auto'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '38px'
        }}>
          <h1 style={{
            fontSize: 'clamp(32px, 8vw, 48px)',
            fontWeight: '700',
            color: '#4A4540',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            lineHeight: '1.2',
            fontFamily: "'TheYearofTheCamel', 'Noto Sans Arabic', sans-serif"
          }}>
            {t.whatFormNeeded}
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 3vw, 18px)',
            color: '#6B6560',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.5',
            fontFamily: "'TheYearofTheCamel', 'Noto Sans Arabic', sans-serif"
          }}>
            {t.formDescription}
          </p>
        </div>

        <div style={{
          maxWidth: '900px',
          width: '100%'
        }}>
          <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A4540';
                e.target.style.boxShadow = '0 4px 12px rgba(74, 69, 64, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D4C5B0';
                e.target.style.boxShadow = '0 2px 8px rgba(74, 69, 64, 0.15)';
              }}
            placeholder={t.placeholder}
            dir="rtl"
            style={{
              width: '100%',
              minHeight: 'clamp(100px, 20vh, 140px)',
              padding: '20px',
              fontSize: 'clamp(15px, 3vw, 17px)',
              border: '1px solid #D4C5B0',
              borderRadius: '12px',
              resize: 'vertical',
              fontFamily: "'TheYearofTheCamel', 'Noto Sans Arabic', sans-serif",
              outline: 'none',
              transition: 'all 0.2s',
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(74, 69, 64, 0.15)',
              lineHeight: '1.6',
              textAlign: 'right'
            }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && description.trim()) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={!description.trim()}
              style={{
                position: 'absolute',
                bottom: '12px',
                insetInlineStart: '12px',
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                background: (!description.trim()) ? '#d1d5db' : '#4A4540',
                border: 'none',
                borderRadius: '8px',
                cursor: (!description.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: (!description.trim()) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (description.trim()) {
                  e.currentTarget.style.background = '#3D3834';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (description.trim()) {
                  e.currentTarget.style.background = '#4A4540';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {error && (
            <div style={{
              padding: '16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '16px',
              fontFamily: "'TheYearofTheCamel', 'Noto Sans Arabic', sans-serif",
              textAlign: 'right',
              direction: 'rtl'
            }}>
              {error}
            </div>
          )}

          {/* Suggestions as pills below button */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            direction: 'rtl'
          }}>
            {examples.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setDescription(example)}
                style={{
                  padding: '10px 16px',
                  fontSize: 'clamp(13px, 2.5vw, 14px)',
                  color: '#4A4540',
                  background: 'transparent',
                  border: '1px solid #D4C5B0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: '500',
                  textAlign: 'right',
                  fontFamily: "'TheYearofTheCamel', 'Noto Sans Arabic', sans-serif",
                  wordBreak: 'break-word',
                  lineHeight: '1.5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4A4540';
                  e.currentTarget.style.color = '#4A4540';
                  e.currentTarget.style.background = '#F5F3F0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#D4C5B0';
                  e.currentTarget.style.color = '#4A4540';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
