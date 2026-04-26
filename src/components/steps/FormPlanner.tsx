import React, { useState } from 'react';
import { useI18n } from '../../i18n';

interface FormPlannerProps {
  onComplete: (formData: any) => void;
}

export const FormPlanner: React.FC<FormPlannerProps> = ({ onComplete }) => {
  const { t } = useI18n();
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const examples = t.examples;

  const handleGenerate = () => {
    if (!description.trim()) {
      setError('يرجى وصف النموذج الذي تريد إنشاءه');
      return;
    }

    onComplete({
      isGenerating: true,
      user_query: description,
      title: 'جاري إنشاء النموذج...',
      description,
      questions: [],
      conditional_rules: []
    });
  };

  return (
    <section className="planner-page">
      <div className="planner-shell">
        <div className="planner-copy">
          <span className="section-kicker">مساحة الإنشاء</span>
          <h1>{t.whatFormNeeded}</h1>
          <p>{t.formDescription}</p>
        </div>

        <div className="planner-compose">
          <div className="planner-compose-header">
            <span>وصف النموذج</span>
            <small>Enter للإرسال، Shift + Enter لسطر جديد</small>
          </div>
          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setError('');
            }}
            placeholder={t.placeholder}
            dir="rtl"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && description.trim()) {
                event.preventDefault();
                handleGenerate();
              }
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={!description.trim()}
            className="planner-send-button"
            aria-label="إنشاء النموذج"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {error && <div className="planner-error">{error}</div>}

        <div className="planner-examples" aria-label="أمثلة سريعة">
          {examples.map((example, index) => (
            <button key={index} type="button" onClick={() => setDescription(example)}>
              {example}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
