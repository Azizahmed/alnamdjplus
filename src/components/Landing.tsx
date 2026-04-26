import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InteractiveDemo } from './landing/InteractiveDemo';
import { useAuth } from '../contexts/AuthContext';

const capabilities = [
  {
    value: '01',
    title: 'إنشاء النموذج من الوصف',
    text: 'اكتب فكرة النموذج بالعربية، ثم ابدأ من مسودة قابلة للتعديل بدل صفحة فارغة.'
  },
  {
    value: '02',
    title: 'تحرير وتشغيل في نفس المكان',
    text: 'عدّل الأسئلة، الألوان، المنطق الشرطي، والمعاينة من مساحة عمل واحدة واضحة.'
  },
  {
    value: '03',
    title: 'قراءة الردود بسرعة',
    text: 'انتقل من الرابط المنشور إلى الردود والتحليلات وأسئلة الذكاء الاصطناعي على البيانات.'
  }
];

const useCases = [
  'استبيانات رضا العملاء',
  'طلبات التوظيف',
  'نماذج التسجيل',
  'جمع الملاحظات',
  'طلبات الخدمة',
  'تقييم الفعاليات'
];

export const Landing: React.FC = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/build', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

    const targets = landingRef.current?.querySelectorAll(
      '.landing-hero, .landing-panel, .feature-card, .workflow-step, .final-cta'
    );
    targets?.forEach((target) => observer.observe(target));

    window.setTimeout(() => {
      landingRef.current?.querySelector('.landing-hero')?.classList.add('animate-in');
    }, 80);

    return () => observer.disconnect();
  }, []);

  return (
    <main className="landing redesigned-landing" ref={landingRef}>
      <section className="landing-hero product-hero">
        <div className="product-hero-copy">
          <span className="landing-badge">منشئ نماذج عربي مدعوم بالذكاء الاصطناعي</span>
          <h1 className="landing-title">حوّل فكرة النموذج إلى تجربة جمع بيانات منظمة</h1>
          <p className="landing-subtitle">
            واجهة عملية لبناء النماذج ونشرها وقراءة الردود بدون تشتيت. التصميم الجديد يضع
            الإنشاء والتحليل والمشاركة في مسار واحد واضح للفِرق التي تحتاج السرعة والدقة.
          </p>
          <div className="landing-actions">
            <button onClick={() => navigate('/auth')} className="cta-button-primary">
              ابدأ بناء نموذج
            </button>
            <button onClick={() => navigate('/auth')} className="cta-button-secondary">
              دخول المستخدمين
            </button>
          </div>
        </div>

        <div className="hero-product-board" aria-hidden="true">
          <div className="hero-visual-orbit" />
          <div className="hero-brand-panel">
            <div className="hero-brand-mark">النموذج +</div>
            <div className="hero-brand-word">alnamdjplus</div>
            <div className="hero-brand-subtitle">مساحة عمل ذكية للنماذج</div>
          </div>
          <div className="hero-flow-card hero-flow-prompt">
            <span />
            <strong>AI</strong>
            <i />
          </div>
          <div className="hero-flow-card hero-flow-data">
            <span />
            <i />
            <i />
            <i />
          </div>
          <div className="hero-board-card hero-board-main">
            <div className="hero-board-topline">
              <span>نموذج رضا العملاء</span>
              <strong>جاهز للنشر</strong>
            </div>
            <div className="hero-form-line wide" />
            <div className="hero-form-line" />
            <div className="hero-form-grid">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="hero-board-card hero-board-stats">
            <span>معدل الإكمال</span>
            <strong>84%</strong>
            <div className="mini-bars">
              <i style={{ height: '42%' }} />
              <i style={{ height: '68%' }} />
              <i style={{ height: '55%' }} />
              <i style={{ height: '86%' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-panel capability-panel">
        <div className="section-container">
          <div className="section-kicker">أفضل ممارسات التجربة</div>
          <h2 className="section-heading">واجهة هادئة لعمل يتكرر يومياً</h2>
          <p className="section-subheading">
            الألوان أصبحت مناسبة لتطبيقات الإنتاجية وتحليل البيانات: تباين عال للقراءة،
            أزرق مخضر للثقة والإجراء، ولمسات كهرمانية للتنبيه فقط.
          </p>
          <div className="features-grid operational-grid">
            {capabilities.map((item) => (
              <article className="feature-card" key={item.value}>
                <div className="feature-icon">{item.value}</div>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-description">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="demo-section landing-panel">
        <div className="section-container">
          <div className="demo-header">
            <span className="demo-badge">عرض تفاعلي</span>
            <h2 className="section-heading">جرّب المسار كما سيستخدمه فريقك</h2>
            <p className="section-subheading">
              نموذج، ردود، تحليلات، ومحادثة ذكية في مساحة واحدة حتى لا يضيع المستخدم بين أدوات متعددة.
            </p>
          </div>
          <InteractiveDemo />
        </div>
      </section>

      <section className="landing-panel workflow-section">
        <div className="section-container split-section">
          <div>
            <div className="section-kicker">حالات الاستخدام</div>
            <h2 className="section-heading">مناسب للنماذج التشغيلية وليس للصفحات الدعائية فقط</h2>
            <p className="section-subheading align-start">
              كل قرار بصري يخدم القراءة السريعة، تقليل الأخطاء، وإظهار البيانات المهمة بدون ازدحام.
            </p>
          </div>
          <div className="use-case-cloud">
            {useCases.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="cta-content">
          <h2>ابدأ بنموذج واضح، ثم حسّنه من البيانات</h2>
          <p>أنشئ، انشر، واقرأ الردود من واجهة واحدة مصممة للفرق العربية.</p>
          <button onClick={() => navigate('/auth')} className="cta-button-primary">
            إنشاء أول نموذج
          </button>
        </div>
      </section>
    </main>
  );
};
