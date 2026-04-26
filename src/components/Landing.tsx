import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ------------------------------------------------------------------ */
/*  Reusable animation hook                                             */
/* ------------------------------------------------------------------ */
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px', ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ------------------------------------------------------------------ */
/*  Hero animated background canvas                                     */
/* ------------------------------------------------------------------ */
const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const particles: { x: number; y: number; r: number; dx: number; dy: number; alpha: number }[] = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(14,124,134,${0.08 * (1 - dist / 180)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      // Draw particles
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14,124,134,${p.alpha})`;
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  CSS mock-up of the AI prompt card (Image 1)                        */
/* ------------------------------------------------------------------ */
const MockPromptCard: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div className={`landing-mock-card mock-prompt ${className || ''}`} style={style}>
    <div className="mock-header">
      <span className="mock-badge">مساحة الإنشاء</span>
    </div>
    <h4 className="mock-title">ما النموذج الذي تحتاجه؟</h4>
    <p className="mock-subtitle">أضف وصفاً للنموذج...</p>
    <div className="mock-input-box">
      <span className="mock-input-label">وصف النموذج</span>
      <div className="mock-input-line" />
      <div className="mock-input-hint">Shift + Enter لسطر جديد، Enter للإرسال</div>
      <div className="mock-send-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      </div>
    </div>
    <div className="mock-chips">
      <span>أنشئ نموذج ملاحظات العملاء مع التقييم والتعليقات</span>
      <span>أنشئ نموذج تسجيل حدث مع الاسم والبريد والتفضيلات الغذائية</span>
      <span>أنشئ استبيان رضا المنتج مع اختيار متعدد والتقييمات</span>
      <span>ابنِ نموذج طلب وظيفة مع رفع السيرة الذاتية والخبرة العملية</span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  CSS mock-up of the builder card (Image 2)                          */
/* ------------------------------------------------------------------ */
const MockBuilderCard: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div className={`landing-mock-card mock-builder ${className || ''}`} style={style}>
    <div className="mock-toolbar">
      <span className="mock-tb-btn active">نشر</span>
      <span className="mock-tb-btn">T</span>
      <span className="mock-tb-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></span>
      <span className="mock-tb-btn active-dot">التصميم</span>
      <span className="mock-tb-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span>
      <span className="mock-tb-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>
      <span className="mock-tb-btn">معاينة</span>
      <span className="mock-tb-btn primary">+ إضافة</span>
    </div>
    <div className="mock-builder-body">
      <h4 className="mock-builder-title">نموذج ملاحظات العملاء</h4>
      <p className="mock-builder-desc">نحن نقدر رأيك! يرجى تقييم تجربتك وتقديم تعليقاتك لمساعدتنا على التحسين.</p>
      <div className="mock-question">
        <div className="mock-q-drag"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg></div>
        <div className="mock-q-content">
          <div className="mock-q-text">ما مدى رضاك العام عن خدماتنا؟</div>
          <div className="mock-q-hint">غير راضٍ على الإطلاق، 5 = راضٍ جداً</div>
          <div className="mock-stars">★★★★★</div>
        </div>
      </div>
      <div className="mock-question">
        <div className="mock-q-drag"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg></div>
        <div className="mock-q-content">
          <div className="mock-q-text">ما مدى احتمالية أن توصي بنا للآخرين؟</div>
          <div className="mock-q-hint">من 0 (غير محتمل) إلى 10 (محتمل جداً)</div>
          <div className="mock-scale">
            <span>القيمة الدنيا</span>
            <span>القيمة القصوى</span>
          </div>
          <div className="mock-scale-inputs">
            <div className="mock-si">1</div>
            <div className="mock-si">5</div>
          </div>
          <div className="mock-scale-labels">
            <span>تسمية الحد الأدنى (اختياري)</span>
            <span>تسمية الحد الأقصى (اختياري)</span>
          </div>
          <div className="mock-scale-nums">
            {['5','4','3','2','1'].map(n => <span key={n}>{n}</span>)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  CSS mock-up of the theme picker card (Image 3)                     */
/* ------------------------------------------------------------------ */
const MockThemeCard: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div className={`landing-mock-card mock-theme ${className || ''}`} style={style}>
    <div className="mock-theme-title">اختر مظهر النموذج</div>
    <div className="mock-theme-grid">
      {[
        { name: 'Executive Ink', colors: ['#2D3436','#636E72','#DFE6E9','#F5F6FA'] },
        { name: 'Alnamdj Core', colors: ['#123A3F','#0E7C86','#EEF3F2','#FFFFFF'], active: true },
        { name: 'Civic Blue', colors: ['#0984E3','#2D3436','#DFE6E9','#F5F6FA'] },
        { name: 'Calm Mint', colors: ['#00B894','#2D3436','#DFE6E9','#F5F6FA'] },
        { name: 'Clinic Green', colors: ['#10AC84','#2D3436','#DFE6E9','#F5F6FA'] },
        { name: 'Warm Paper', colors: ['#E17055','#2D3436','#DFE6E9','#F5F6FA'] },
        { name: 'Minimal Slate', colors: ['#57606F','#2F3542','#DFE6E9','#F5F6FA'] },
        { name: 'Event Night', colors: ['#2F3542','#57606F','#DFE6E9','#F5F6FA'] },
      ].map((t) => (
        <div key={t.name} className={`mock-theme-item ${t.active ? 'active' : ''}`}>
          <div className="mock-theme-dots">
            {t.colors.map((c, i) => <span key={i} style={{ background: c }} />)}
          </div>
          <div className="mock-theme-name">{t.name}</div>
        </div>
      ))}
    </div>
    <div className="mock-theme-actions">
      <span>صورة الترويسة</span>
      <span>الشعار</span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  CSS mock-up of the AI assistant card (Image 4)                     */
/* ------------------------------------------------------------------ */
const MockAssistantCard: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div className={`landing-mock-card mock-assistant ${className || ''}`} style={style}>
    <div className="mock-asst-header">
      <div className="mock-asst-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div>
        <div className="mock-asst-title">مساعد النموذج</div>
        <div className="mock-asst-sub">عدل النموذج أو حلل البيانات</div>
      </div>
      <button className="mock-asst-close">×</button>
    </div>
    <div className="mock-asst-body">
      <div className="mock-asst-empty">
        <div className="mock-asst-orb">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </div>
        <div className="mock-asst-empty-title">عدل نموذجك أو حلل الردود</div>
        <div className="mock-asst-empty-hint">"أضف حقلاً للبريد الإلكتروني أو "لخص ردودي</div>
      </div>
    </div>
    <div className="mock-asst-footer">
      <div className="mock-asst-input">
        <span>عدل نموذجك أو حلل الردود</span>
        <div className="mock-asst-send">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Landing Component                                              */
/* ------------------------------------------------------------------ */
export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user) { navigate('/build', { replace: true }); }
  }, [user, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Scroll-triggered sections */
  const heroAnim    = useInView<HTMLDivElement>();
  const logosAnim   = useInView<HTMLDivElement>();
  const feat1Anim   = useInView<HTMLDivElement>();
  const feat2Anim   = useInView<HTMLDivElement>();
  const feat3Anim   = useInView<HTMLDivElement>();
  const feat4Anim   = useInView<HTMLDivElement>();
  const stepsAnim   = useInView<HTMLDivElement>();
  const statsAnim   = useInView<HTMLDivElement>();
  const ctaAnim     = useInView<HTMLDivElement>();

  const scrollToProduct = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="landing-v2">
      {/* Floating navbar for landing only */}
      <header className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png?v=20260410" alt="النموذج" className="landing-nav-logo" />
          </div>
          <nav className="landing-nav-links">
            <button onClick={scrollToProduct}>المنتج</button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>كيف يعمل</button>
            <button onClick={() => navigate('/auth')}>تسجيل الدخول</button>
          </nav>
          <button className="landing-nav-cta" onClick={() => navigate('/auth')}>ابدأ مجاناً</button>
        </div>
      </header>

      {/* ========== HERO ========== */}
      <section className="landing-hero-v2" ref={heroRef}>
        <HeroCanvas />
        <div className={`landing-hero-content ${heroAnim.visible ? 'in' : ''}`} ref={heroAnim.ref}>
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="hero-badge-pulse" />
              منشئ نماذج عربي مدعوم بالذكاء الاصطناعي
            </div>
            <h1 className="hero-title">
              <span className="hero-line">حوّل فكرتك</span>
              <span className="hero-line">إلى <em>نموذج</em> جاهز</span>
              <span className="hero-line">في ثوانٍ</span>
            </h1>
            <p className="hero-desc">
              اكتب وصفاً بالعربية، واترك الذكاء الاصطناعي يبني لك نموذجاً احترافياً قابلاً للتعديل والنشر والتحليل — كل ذلك من مكان واحد.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-primary" onClick={() => navigate('/auth')}>
                <span>ابدأ بناء نموذج</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </button>
              <button className="hero-btn-secondary" onClick={scrollToProduct}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>شاهد المنتج</span>
              </button>
            </div>
            <div className="hero-trust">
              <div className="hero-avatars">
                {['A','B','C','D'].map((l,i) => (
                  <div key={i} className="hero-avatar" style={{ background: `hsl(${170 + i*15}, 55%, ${32 + i*4}%)` }}>{l}</div>
                ))}
              </div>
              <span>انضم إلى مئات المستخدمين العرب</span>
            </div>
          </div>

          {/* Floating product cards */}
          <div className="hero-visuals">
            <MockPromptCard className="float-card fc-1" />
            <MockBuilderCard className="float-card fc-2" />
            <MockThemeCard className="float-card fc-3" />
            <MockAssistantCard className="float-card fc-4" />
          </div>
        </div>

        <div className="hero-scroll-hint">
          <div className="scroll-mouse"><div className="scroll-wheel" /></div>
        </div>
      </section>

      {/* ========== LOGO TICKER ========== */}
      <section className={`landing-ticker ${logosAnim.visible ? 'in' : ''}`} ref={logosAnim.ref}>
        <div className="ticker-fade-left" />
        <div className="ticker-track">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="ticker-set">
              {['استبيانات رضا العملاء','طلبات التوظيف','نماذج التسجيل','جمع الملاحظات','طلبات الخدمة','تقييم الفعاليات','البحث العلمي','التسجيل في الدورات','الاقتراحات والشكاوى','استبيانات السوق'].map((t) => (
                <span key={`${setIdx}-${t}`} className="ticker-item">{t}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="ticker-fade-right" />
      </section>

      {/* ========== FEATURE 1: AI PROMPT ========== */}
      <section className={`landing-feature ${feat1Anim.visible ? 'in' : ''}`} ref={feat1Anim.ref}>
        <div className="feature-content">
          <div className="feature-badge">الذكاء الاصطناعي</div>
          <h2 className="feature-title">ما النموذج الذي تحتاجه؟<br />فقط اكتب وصفاً...</h2>
          <p className="feature-desc">
            لا حاجة للبدء من صفحة فارغة. اكتب فكرة النموذج بالعربية، وسيولّد لك الذكاء الاصطناعي بنية كاملة من الأسئلة والمنطق الشرطي والتصميم.
          </p>
          <ul className="feature-list">
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> أكثر من 15 نوع سؤال</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> دعم كامل للغة العربية</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> منطق شرطي ذكي</li>
          </ul>
        </div>
        <div className="feature-visual feature-visual-left">
          <MockPromptCard />
          <div className="feature-glow" />
        </div>
      </section>

      {/* ========== FEATURE 2: BUILDER ========== */}
      <section className={`landing-feature alt ${feat2Anim.visible ? 'in' : ''}`} ref={feat2Anim.ref}>
        <div className="feature-visual feature-visual-right">
          <MockBuilderCard />
          <div className="feature-glow" />
        </div>
        <div className="feature-content">
          <div className="feature-badge">المحرر</div>
          <h2 className="feature-title">حرّر، صمّم، ونشر<br />من مساحة عمل واحدة</h2>
          <p className="feature-desc">
            واجهة عملية تضع الإنشاء والمعاينة والتصميم في مسار واحد واضح. عدّل الأسئلة بسحب وإفلات، وطبّق المنطق الشرطي، وشاهد التغييرات لحظياً.
          </p>
          <ul className="feature-list">
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> سحب وإفلات بديهي</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> معاينة حية أثناء التحرير</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> منطق شرطي متقدم</li>
          </ul>
        </div>
      </section>

      {/* ========== FEATURE 3: THEMES ========== */}
      <section className={`landing-feature ${feat3Anim.visible ? 'in' : ''}`} ref={feat3Anim.ref}>
        <div className="feature-content">
          <div className="feature-badge">التصميم</div>
          <h2 className="feature-title">مظهر يناسب<br />هويتك البصرية</h2>
          <p className="feature-desc">
            اختر من بين مجموعة من الثيمات الجاهزة المصممة للاستخدامات المختلفة، أو صمّم ألوانك الخاصة. كل ثيم يحافظ على وضوح القراءة وجمالية التجربة.
          </p>
          <ul className="feature-list">
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> 8 ثيمات جاهزة</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> تخصيص الألوان بالكامل</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> شعار وترويسة مخصصة</li>
          </ul>
        </div>
        <div className="feature-visual feature-visual-left">
          <MockThemeCard />
          <div className="feature-glow" />
        </div>
      </section>

      {/* ========== FEATURE 4: AI ASSISTANT ========== */}
      <section className={`landing-feature alt ${feat4Anim.visible ? 'in' : ''}`} ref={feat4Anim.ref}>
        <div className="feature-visual feature-visual-right">
          <MockAssistantCard />
          <div className="feature-glow" />
        </div>
        <div className="feature-content">
          <div className="feature-badge">المساعد الذكي</div>
          <h2 className="feature-title">محلل بياناتك<br />وصانع نماذجك</h2>
          <p className="feature-desc">
            تحدث مع مساعدك الذكي لتحليل الردود، استخلاص الرؤى، إضافة حقول جديدة، أو تلخيص النتائج — كل ذلك باللغة العربية.
          </p>
          <ul className="feature-list">
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> تحليل الردود بالذكاء الاصطناعي</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> توليد رسائل البريد التلقائية</li>
            <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> تعديل النماذج بالمحادثة</li>
          </ul>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className={`landing-steps ${stepsAnim.visible ? 'in' : ''}`} ref={stepsAnim.ref}>
        <div className="steps-header">
          <div className="steps-badge">كيف يعمل</div>
          <h2 className="steps-title">من الفكرة إلى البيانات<br />في 3 خطوات</h2>
        </div>
        <div className="steps-grid">
          {[
            { num: '01', title: 'صِف نموذجك', text: 'اكتب وصفاً بالعربية لما تحتاجه، وستولّد الذكاء الاصطناعي نموذجاً كاملاً من الأسئلة والتصميم.' },
            { num: '02', title: 'حرّر وصمّم', text: 'عدّل الأسئلة بالسحب والإفلات، طبّق الثيم المناسب، وأضف المنطق الشرطي ببضع نقرات.' },
            { num: '03', title: 'انشر وحلّل', text: 'احصل على رابط فوري، شاركه مع جمهورك، وتابع الردود والتحليلات ومحادثة الذكاء الاصطناعي.' },
          ].map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
        <div className="steps-connector" aria-hidden="true">
          <div className="steps-line" />
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className={`landing-stats ${statsAnim.visible ? 'in' : ''}`} ref={statsAnim.ref}>
        <div className="stats-grid">
          {[
            { value: '15+', label: 'نوع سؤال' },
            { value: '100%', label: 'دعم العربية' },
            { value: '3x', label: 'أسرع في الإنشاء' },
            { value: '∞', label: 'نماذج غير محدودة' },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className={`landing-final-cta ${ctaAnim.visible ? 'in' : ''}`} ref={ctaAnim.ref}>
        <div className="final-cta-bg" aria-hidden="true">
          <div className="cta-orb cta-orb-1" />
          <div className="cta-orb cta-orb-2" />
          <div className="cta-orb cta-orb-3" />
        </div>
        <div className="final-cta-content">
          <h2>ابدأ بـ <em>نموذج</em> واضح<br />وحسّنه من البيانات</h2>
          <p>أنشئ، انشر، واقرأ الردود من واجهة واحدة مصممة للفرق العربية.</p>
          <button className="final-cta-btn" onClick={() => navigate('/auth')}>
            <span>إنشاء أول نموذج</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
          <div className="final-cta-note">مجاني تماماً — لا يحتاج بطاقة ائتمان</div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="landing-footer-v2">
        <div className="landing-footer-inner">
          <div className="footer-brand">
            <img src="/logo.png?v=20260410" alt="النموذج" className="footer-logo" />
          </div>
          <div className="footer-copy">© 2026 النموذج+. جميع الحقوق محفوظة.</div>
        </div>
      </footer>
    </main>
  );
};
