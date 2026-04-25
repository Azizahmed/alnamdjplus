import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeatureCard } from './landing/FeatureCard';
import { WorkflowStep } from './landing/WorkflowStep';
import { InteractiveDemo } from './landing/InteractiveDemo';
import { useAuth } from '../contexts/AuthContext';

export const Landing: React.FC = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const logoSrc = '/logo.png?v=20260410';

  // Check if user is already logged in and redirect
  useEffect(() => {
    if (user) {
      navigate('/build', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all sections and cards
    const elementsToAnimate = landingRef.current?.querySelectorAll(
      '.landing-hero, .features-section, .workflow-section, .demo-section, .showcase-section, .benefits-section, .final-cta, .feature-card, .workflow-step, .viz-card, .benefit-card'
    );

    elementsToAnimate?.forEach(el => observer.observe(el));

    // Animate hero section immediately on mount
    setTimeout(() => {
      const hero = landingRef.current?.querySelector('.landing-hero');
      hero?.classList.add('animate-in');
    }, 100);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing" ref={landingRef}>
      {/* Hero */}
      <header className="landing-hero" style={{
          maxWidth: '1400px',
          padding: '60px 32px 40px',
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: 0,
        }}>
        <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            color: '#1f2937',
            marginBottom: '24px',
            lineHeight: 1.2
          }}>
            منشئ النماذج الذكي بالذكاء الاصطناعي
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            marginBottom: '40px',
            lineHeight: 1.6
          }}>
            أنشئ نماذج من أوصاف بلغة طبيعية. بدون برمجة. بدون تعقيد. فقط نماذج.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/auth')}
              className="cta-button-primary"
            >
              جرب منشئ النماذج بالذكاء الاصطناعي
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Demo */}
      <section className="demo-section" style={{ backgroundColor: 'white' }}>
        <div className="section-container">
          <div className="demo-header">
            <span className="demo-badge">عرض تفاعلي مباشر</span>
            <h2 className="section-heading">شاهد كيف يعمل</h2>
            <p className="section-subheading">
              جرب العرض التفاعلي الكامل: املأ النموذج، استكشف التحليلات، شاهد الردود، واطلع على تحليل الردود بالذكاء الاصطناعي.
              <br />
              <strong>جميع الميزات تفاعلية بالكامل</strong> - بالضبط ما ستستخدمه مع نموذجك.
            </p>
          </div>
          <InteractiveDemo />
          <div className="demo-cta">
            <p className="demo-cta-text">
              <strong>تحليل مدعوم بالذكاء الاصطناعي:</strong> استكشف أكثر من 20 نوع سؤال، تتبع التحليلات في الوقت الفعلي، واحصل على رؤى فورية بالذكاء الاصطناعي على ردودك.
              أضف منطق شرطي، قواعد تحقق، سمات مخصصة، وحلل البيانات دون تصدير.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="cta-button-primary"
            >
              أنشئ نموذجك الخاص
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-heading">افعل كل شيء بالذكاء الاصطناعي</h2>
          <p className="section-subheading" style={{ marginBottom: '3rem', fontSize: '1.1rem', color: '#6b7280' }}>
            أنشئ نماذج فورياً. عدل المكونات باللغة العربية. حلل الردود بوكيل ذكاء اصطناعي متخصص.
            <br />بدون خوادم MCP. بدون ميزات مخفية. الذكاء الاصطناعي مدمج في كل خطوة.
          </p>
          <div className="features-grid">
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              }
              title="أنشئ نماذج فورياً باللغة العربية"
              description="صف نموذجك باللغة العربية ودع الذكاء الاصطناعي ينشئه فوراً. لا حاجة لتهيئة الحقول يدوياً أو السحب والإفلات."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.71 4.63a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75L23 8.29a1 1 0 0 0 0-1.41z"/>
                  <path d="M16 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  <path d="M20 21v-8"/>
                  <path d="M16 17H8"/>
                </svg>
              }
              title="أضف وعدل المكونات باللغة العربية"
              description="أخبر الذكاء الاصطناعي بما تريد إضافته أو إزالته أو تغييره. لا حاجة للنقر عبر القوائم أو تهيئة الحقول يدوياً."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              title="تحليل الردود بالذكاء الاصطناعي"
              description="بعد النشر، اسأل الذكاء الاصطناعي أي شيء عن ردودك. الوكيل التحليلي المتخصص يفهم بنية نموذجك ويوفر رؤى فورية."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              }
              title="قواعد التحقق"
              description="تحقق مدمج للبريد الإلكتروني، أرقام الهاتف، الروابط، والمزيد. ضمان جودة البيانات من البداية."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
              }
              title="19 نوع سؤال"
              description="نص، بريد إلكتروني، هاتف، قوائم منسدلة، رفع ملفات، تقييمات، تواريخ، والمزيد. كل نوع حقل تحتاجه، كلها مولدة بالذكاء الاصطناعي."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.71 4.63a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75L23 8.29a1 1 0 0 0 0-1.41z"/>
                  <path d="M16 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  <path d="M20 21v-8"/>
                  <path d="M16 17H8"/>
                </svg>
              }
              title="المنطق الشرطي"
              description="أضف منطق التخطي وقواعد الإظهار/الإخفاء. النماذج تتكيف بناءً على ردود المستخدمين لجمع بيانات أكثر ذكاءً."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              title="تصميم جميل"
              description="سمة أنيقة بالأبيض/البني. نماذج متجاوبة مع الجوال تعمل بشكل مثالي على أي جهاز."
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="workflow-section">
        <div className="section-container">
          <h2 className="section-heading">بناء النماذج بالذكاء الاصطناعي أولاً</h2>
          <p className="section-subheading">
            من الفكرة إلى الرؤى في دقائق. كل شيء مدعوم بالذكاء الاصطناعي - لا حاجة للتهيئة اليدوية.
          </p>
          <div className="workflow-steps">
            <WorkflowStep
              number="01"
              title="أنشئ نماذج فورياً باللغة العربية"
              description="أخبر الذكاء الاصطناعي بما تحتاجه من نموذجك. لا سحب وإفلات، لا تهيئة يدوية."
              details={[
                "فهم اللغة الطبيعية",
                "الذكاء الاصطناعي يولد أنواع الأسئلة المناسبة",
                "أمثلة: 'استبيان رضا العملاء'",
                "إنشاء فوري للنموذج"
              ]}
            />
            <WorkflowStep
              number="02"
              title="أضف وعدل المكونات باللغة العربية"
              description="أخبر الذكاء الاصطناعي بما تريد إضافته أو إزالته أو تغييره. لا حاجة للنقر عبر القوائم."
              details={[
                "عدل الأسئلة باللغة العربية",
                "أضف مكونات فورياً",
                "أزل أو أعد الترتيب بأوامر بسيطة",
                "الذكاء الاصطناعي يفهم بنية نموذجك"
              ]}
            />
            <WorkflowStep
              number="03"
              title="انشر وحلل بالذكاء الاصطناعي"
              description="انشر نموذجك واسأل الذكاء الاصطناعي أي شيء عن ردودك."
              details={[
                "ولد رابط قابل للمشاركة فورياً",
                "وكيل تحليلات متخصص بالذكاء الاصطناعي",
                "اسأل أسئلة مثل 'كم عدد الردود؟'",
                "احصل على رؤى فورية دون تصدير البيانات"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Publish with the World */}
      <section className="sharing-section" style={{
        padding: '80px 20px',
        background: '#ffffff'
      }}>
        <div className="section-container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '60px',
            maxWidth: '1100px',
            margin: '0 auto',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* Illustration */}
            <div style={{
              flex: '1 1 300px',
              maxWidth: '400px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'relative',
                width: '300px',
                height: '220px'
              }}>
                {/* Main form card */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  insetInlineStart: '30px',
                  width: '200px',
                  height: '140px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(74, 69, 64, 0.08)',
                  border: '1px solid #e8e4e0',
                  padding: '12px',
                  zIndex: 2
                }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4A4540' }}></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9B8B7A' }}></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D4C5B0' }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, height: '24px', backgroundColor: '#f5f3f0', borderRadius: '4px' }}></div>
                    <div style={{ flex: 1, height: '24px', backgroundColor: '#f5f3f0', borderRadius: '4px' }}></div>
                    <div style={{ flex: 1, height: '24px', backgroundColor: '#f5f3f0', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ height: '60px', backgroundColor: '#faf8f6', borderRadius: '6px', display: 'flex', alignItems: 'flex-end', padding: '8px', gap: '4px' }}>
                    <div style={{ flex: 1, height: '70%', backgroundColor: '#4A4540', borderRadius: '2px', opacity: 0.8 }}></div>
                    <div style={{ flex: 1, height: '90%', backgroundColor: '#4A4540', borderRadius: '2px', opacity: 0.8 }}></div>
                    <div style={{ flex: 1, height: '50%', backgroundColor: '#4A4540', borderRadius: '2px', opacity: 0.8 }}></div>
                    <div style={{ flex: 1, height: '80%', backgroundColor: '#4A4540', borderRadius: '2px', opacity: 0.8 }}></div>
                  </div>
                </div>

                {/* Share icon floating */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  insetInlineEnd: '40px',
                  width: '50px',
                  height: '50px',
                  backgroundColor: '#4A4540',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(74, 69, 64, 0.15)',
                  zIndex: 3
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>

                {/* Globe icon */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  insetInlineEnd: '20px',
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  border: '2px solid #e8e4e0',
                  zIndex: 1
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A4540" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>

                {/* Link floating */}
                <div style={{
                  position: 'absolute',
                  bottom: '40px',
                  insetInlineStart: '0',
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '8px 14px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A4540" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  example.com/shared/...
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{
              flex: '1 1 400px',
              maxWidth: '500px'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '6px 12px',
                backgroundColor: 'rgba(74, 69, 64, 0.05)',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4A4540',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                نشر فوري
              </div>
              <h2 style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: '16px',
                lineHeight: 1.2
              }}>
                شارك نماذجك مع الجميع
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: '#6b7280',
                lineHeight: 1.7,
                marginBottom: '24px'
              }}>
                ولد رابط عام وشارك نماذجك مع أي شخص - لا يتطلب تسجيل دخول للمستجيبين.
                مثالي للاستبيانات، التسجيلات، الطلبات، وجمع التعليقات من أي شخص.
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f5f3f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A4540" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: '#374151', fontSize: '15px' }}>روابط قابلة للمشاركة بنقرة واحدة</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f5f3f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A4540" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: '#374151', fontSize: '15px' }}>لا يتطلب تسجيل دخول للمستجيبين</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f5f3f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A4540" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: '#374151', fontSize: '15px' }}>النماذج تعمل بشكل مثالي على أي جهاز</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f5f3f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A4540" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: '#374151', fontSize: '15px' }}>تتبع جميع الردود في الوقت الفعلي</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Types Showcase */}
      <section className="showcase-section">
        <div className="section-container">
          <h2 className="section-heading">ابنِ أي نوع من النماذج</h2>
          <p className="section-subheading">
            من الاستبيانات البسيطة إلى الطلبات المعقدة
          </p>
          <div className="viz-showcase-grid">
            <div className="viz-card">
              <div className="viz-preview" style={{background: '#ffffff', border: '2px solid #e5e7eb'}}>
                <svg viewBox="0 0 200 120" className="viz-svg">
                  <rect x="30" y="30" width="140" height="15" fill="#4A4540" opacity="0.3" rx="4" />
                  <rect x="30" y="55" width="140" height="15" fill="#4A4540" opacity="0.3" rx="4" />
                  <rect x="30" y="80" width="140" height="15" fill="#4A4540" opacity="0.3" rx="4" />
                  <circle cx="40" cy="37.5" r="4" fill="#4A4540" />
                  <circle cx="40" cy="62.5" r="4" fill="#4A4540" />
                  <circle cx="40" cy="87.5" r="4" fill="#4A4540" />
                </svg>
              </div>
              <h4>الاستبيانات والتعليقات</h4>
              <p>اجمع آراء العملاء والتقييمات</p>
            </div>

            <div className="viz-card">
              <div className="viz-preview" style={{background: '#ffffff', border: '2px solid #e5e7eb'}}>
                <svg viewBox="0 0 200 120" className="viz-svg">
                  <rect x="30" y="25" width="140" height="12" fill="#4A4540" opacity="0.2" rx="3" />
                  <rect x="30" y="45" width="140" height="12" fill="#4A4540" opacity="0.2" rx="3" />
                  <rect x="30" y="65" width="65" height="12" fill="#4A4540" opacity="0.2" rx="3" />
                  <rect x="105" y="65" width="65" height="12" fill="#4A4540" opacity="0.2" rx="3" />
                  <rect x="30" y="85" width="140" height="20" fill="#4A4540" opacity="0.3" rx="3" />
                </svg>
              </div>
              <h4>نماذج التسجيل</h4>
              <p>تسجيل الفعاليات والمستخدمين</p>
            </div>

            <div className="viz-card">
              <div className="viz-preview" style={{background: '#ffffff', border: '2px solid #e5e7eb'}}>
                <svg viewBox="0 0 200 120" className="viz-svg">
                  <rect x="30" y="20" width="140" height="10" fill="#4A4540" opacity="0.2" rx="3" />
                  <rect x="30" y="38" width="140" height="10" fill="#4A4540" opacity="0.2" rx="3" />
                  <rect x="30" y="56" width="140" height="25" fill="#4A4540" opacity="0.2" rx="3" />
                  <rect x="30" y="89" width="50" height="18" fill="#4A4540" opacity="0.5" rx="3" />
                  <path d="M 50,95 L 55,100 L 65,90" stroke="#ffffff" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h4>الطلبات</h4>
              <p>طلبات التوظيف ونماذج التواصل</p>
            </div>
          </div>
          <div className="showcase-features">
            <div className="showcase-feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>تحقق مدمج</span>
            </div>
            <div className="showcase-feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>المنطق الشرطي</span>
            </div>
            <div className="showcase-feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>مشاركة سهلة</span>
            </div>
            <div className="showcase-feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <span>متجاوب مع الجوال</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits-section">
        <div className="section-container">
          <div className="benefits-grid">
            <div className="benefit-card">
            <h3>تحليلات بالذكاء الاصطناعي</h3>
            <p>اسأل الذكاء الاصطناعي أي شيء عن ردودك. لا حاجة لتصدير البيانات أو رفعها إلى ChatGPT. الوكيل التحليلي المتخصص يفهم بنية نموذجك ويوفر رؤى فورية.</p>
            </div>
            <div className="benefit-card">
              <h3>سريع وموثوق</h3>
              <p>أنشئ نماذج فورياً باللغة العربية. عدل المكونات باللغة الطبيعية. احصل على رؤى في ثوانٍ. كل شيء مدعوم بالذكاء الاصطناعي.</p>
            </div>
            <div className="benefit-card">
              <h3>الذكاء الاصطناعي هو المنتج الأساسي</h3>
              <p>ليس خادم MCP. ليس أداة دردشة مخفية. الذكاء الاصطناعي مدمج في كل خطوة - الإنشاء، التعديل، والتحليل. هكذا يجب أن تعمل النماذج في عصر الذكاء الاصطناعي.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>مستعد لبناء النماذج بالطريقة الصحيحة؟</h2>
          <p>انضم إلى منشئ النماذج الذكي بالذكاء الاصطناعي. أنشئ، عدل، وحلل - كل ذلك باللغة العربية.</p>
          <button
            onClick={() => navigate('/auth')}
            className="cta-button-primary"
          >
            ابدأ البناء بالذكاء الاصطناعي - مجاناً
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
              <img
                src={logoSrc}
                alt="النموذج بلس"
                style={{
                  width: '120px',
                height: 'auto',
                marginBottom: '10px'
              }}
            />
          </div>
          <div className="footer-links">
            <a href="https://github.com/FireBird-Technologies/Alnamodj" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="/privacy">سياسة الخصوصية</a>
            <a href="/terms">شروط الخدمة</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
