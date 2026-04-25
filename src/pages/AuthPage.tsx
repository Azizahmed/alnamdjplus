import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register';

interface AuthFormData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (mode === 'register') {
      if (!formData.name) {
        setError('يرجى إدخال الاسم');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('كلمات المرور غير متطابقة');
        return;
      }
      if (formData.password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        await signUp(formData.email, formData.password, formData.name);
      } else {
        await signIn(formData.email, formData.password);
      }
      navigate('/build', { replace: true });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول بجوجل');
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ email: '', name: '', password: '', confirmPassword: '' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #faf8f6 0%, #e8e4e0 100%)',
      padding: '24px',
      direction: 'rtl'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(74, 69, 64, 0.12)',
        border: '1px solid #e8e4e0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#4A4540',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#4A4540',
            marginBottom: '8px',
            fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
          }}>
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
          }}>
            {mode === 'login'
              ? 'أدخل بياناتك للوصول إلى حسابك'
              : 'أنشئ حساباً جديداً للبدء'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#dc2626',
            fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4A4540',
                marginBottom: '8px',
                fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
              }}>
                الاسم
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="أدخل اسمك"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e8e4e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4A4540'}
                onBlur={(e) => e.target.style.borderColor = '#e8e4e0'}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4A4540',
              marginBottom: '8px',
              fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
            }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              dir="ltr"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e8e4e0',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif',
                boxSizing: 'border-box',
                textAlign: 'left'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4A4540'}
              onBlur={(e) => e.target.style.borderColor = '#e8e4e0'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4A4540',
              marginBottom: '8px',
              fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
            }}>
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              dir="ltr"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e8e4e0',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif',
                boxSizing: 'border-box',
                textAlign: 'left'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4A4540'}
              onBlur={(e) => e.target.style.borderColor = '#e8e4e0'}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4A4540',
                marginBottom: '8px',
                fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
              }}>
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                dir="ltr"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e8e4e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif',
                  boxSizing: 'border-box',
                  textAlign: 'left'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4A4540'}
                onBlur={(e) => e.target.style.borderColor = '#e8e4e0'}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: loading ? '#9B8B7A' : '#4A4540',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif',
              marginBottom: '16px'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#3D3834';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#4A4540';
            }}
          >
            {loading ? 'جاري التحميل...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </button>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif' }}>
              أو
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#ffffff',
              color: '#4A4540',
              border: '1px solid #e8e4e0',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4A4540'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e8e4e0'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            تسجيل الدخول بجوجل
          </button>
        </form>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif' }}>
            {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
          </span>
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#4A4540',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '0 4px',
              fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
            }}
          >
            {mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#9B8B7A',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'TheYearofTheCamel, Noto Sans Arabic, sans-serif'
            }}
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
