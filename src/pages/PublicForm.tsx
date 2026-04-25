import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { QuestionRenderer } from '../components/QuestionRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';

export const PublicForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get('review') === 'true';
  const [formData, setFormData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [utmParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined
    };
  });
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveInFlightRef = useRef(false);

  // Extract colors from form settings
  const backgroundColor = formData?.settings?.background_color || '#ffffff';
  const textColor = formData?.settings?.text_color || '#1f2937';
  const accentColor = formData?.settings?.accent_color || '#b45309';
  const boldTextColor = formData?.settings?.bold_text_color || accentColor;
  
  // In review mode, use grayscale colors
  const isAuthenticated = !!localStorage.getItem('auth_token');
  const displayBackgroundColor = isReviewMode ? '#f5f5f5' : backgroundColor;
  const displayTextColor = isReviewMode ? '#333333' : textColor;
  const displayAccentColor = isReviewMode ? '#666666' : accentColor;
  const displayBoldTextColor = isReviewMode ? '#444444' : boldTextColor;

  useEffect(() => {
    loadForm();
  }, [token]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const loadForm = async () => {
    try {
      const { data, error } = await api.publicForms.get(token!);
      if (error) throw new Error('Form not found or no longer accepting responses');
      
      const form = (data as any)?.forms;
      if (!form) throw new Error('Form not found');
      
      setFormData(form);
      setLoading(false);
      
      trackEvent('form_viewed');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, questionId?: string, timeSpent?: number) => {
    try {
      const formId = formData?.id || token;
      await api.publicForms.trackEvent(formId, eventType, {
        session_id: sessionId,
        question_id: questionId,
        time_spent: timeSpent
      });
    } catch (err) {
      console.error('Analytics tracking failed:', err);
    }
  };

  const evaluateConditionalLogic = () => {
    const visibleQuestions = new Set<number>();

    formData.questions?.forEach((q: any) => {
      visibleQuestions.add(q.id);
    });

    formData.conditional_rules?.forEach((rule: any) => {
      const triggerAnswer = answers[rule.trigger_question_id];
      let conditionMet = false;

      if (triggerAnswer) {
        switch (rule.condition_type) {
          case 'equals':
            conditionMet = triggerAnswer.text === rule.condition_value ||
                          triggerAnswer.number?.toString() === rule.condition_value;
            break;
          case 'not_equals':
            conditionMet = triggerAnswer.text !== rule.condition_value;
            break;
          case 'contains':
            conditionMet = triggerAnswer.text?.includes(rule.condition_value);
            break;
          case 'is_not_empty':
            conditionMet = !!triggerAnswer.text || !!triggerAnswer.number || 
                          (triggerAnswer.choices && triggerAnswer.choices.length > 0);
            break;
          case 'is_empty':
            conditionMet = !triggerAnswer.text && !triggerAnswer.number && 
                          (!triggerAnswer.choices || triggerAnswer.choices.length === 0);
            break;
        }
      }

      if (conditionMet) {
        if (rule.action === 'show') {
          visibleQuestions.add(rule.target_question_id);
        } else if (rule.action === 'hide') {
          visibleQuestions.delete(rule.target_question_id);
        }
      } else {
        if (rule.action === 'show') {
          visibleQuestions.delete(rule.target_question_id);
        }
      }
    });

    return visibleQuestions;
  };

  const visibleQuestionIds = formData ? evaluateConditionalLogic() : new Set();

  const scheduleAutosave = (nextAnswers: Record<string, any>) => {
    if (submitted || submitting || !formData) return;
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    
    autosaveTimerRef.current = window.setTimeout(async () => {
      if (autosaveInFlightRef.current) return;
      if (Object.keys(nextAnswers).length === 0) return;
      
      autosaveInFlightRef.current = true;
      try {
        const answerArray = Object.entries(nextAnswers).map(([questionId, value]) => ({
          question_id: questionId,
          value: value
        }));
        
        await api.responses.submit(token!, answerArray, {
          session_id: sessionId,
          form_version: formData?.version,
          status: 'draft',
          ...utmParams
        });
      } catch (err) {
        console.error('Autosave failed:', err);
      } finally {
        autosaveInFlightRef.current = false;
      }
    }, 800);
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    // Use functional update to ensure we're working with latest state
    // This prevents race conditions when user clicks checkboxes rapidly
    setAnswers(prevAnswers => {
      const isFirstAnswer = Object.keys(prevAnswers).length === 0;
      
      const updatedAnswers = {
        ...prevAnswers,
        [questionId]: value
      };
      
      // Track first answer as form started
      if (isFirstAnswer) {
        trackEvent('form_started');
      }
      
      // Track question answered
      trackEvent('question_answered', String(questionId));
      
      // Schedule autosave with the new state
      scheduleAutosave(updatedAnswers);
      
      return updatedAnswers;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const visibleQuestions = formData.questions.filter((q: any) => visibleQuestionIds.has(q.id));
      const missingRequired = visibleQuestions.filter((q: any) => {
        if (!q.required) return false;
        const answer = answers[q.id];
        if (!answer) return true;
        
        if (answer.text !== undefined) return !answer.text;
        if (answer.number !== undefined) return answer.number === null;
        if (answer.choices !== undefined) return answer.choices.length === 0;
        if (answer.rating !== undefined) return !answer.rating;
        if (answer.files !== undefined) return !answer.files || answer.files.length === 0;
        
        return false;
      });

    if (missingRequired.length > 0) {
      const missingNames = missingRequired.map((q: any) => q.label).slice(0, 3);
      const moreCount = missingRequired.length - 3;
      let errorMsg = `Please complete: ${missingNames.join(', ')}`;
      if (moreCount > 0) {
        errorMsg += ` and ${moreCount} more required field${moreCount > 1 ? 's' : ''}`;
      }
      setError(errorMsg);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const answerArray = Object.entries(answers).map(([questionId, value]) => ({
        question_id: questionId,
        value: value
      }));

      const { data, error: submitError } = await api.responses.submit(token!, answerArray, {
        session_id: sessionId,
        ...utmParams
      });

      if (submitError) throw new Error(submitError.message || 'Failed to submit form');

      trackEvent('form_submitted_complete');

      setThankYouMessage(data?.message || 'Your response has been submitted successfully.');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: displayBackgroundColor
      }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: displayBackgroundColor
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '40px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#dc2626',
            marginBottom: '12px'
          }}>
            Form Not Found
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: displayBackgroundColor,
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          padding: '60px 40px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            background: displayBoldTextColor,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: '#ffffff'
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: displayTextColor,
            marginBottom: '12px'
          }}>
            Thank You!
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            {thankYouMessage || 'Your response has been submitted successfully.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: displayBackgroundColor,
      padding: '40px 24px 40px 64px',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Back to Builder Button - only shown for authenticated users */}
      {isAuthenticated && (
        <button
          onClick={() => navigate('/build', { state: { formId: formData?.id } })}
          style={{
            position: 'fixed',
            top: '20px',
            insetInlineStart: '20px',
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            zIndex: 1001,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {isReviewMode ? 'Exit Review' : 'Back to Builder'}
        </button>
      )}

      {/* Floating Alnamodj Branding Widget */}
      <a
        href="https://alnamodj.app"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '20px',
          insetInlineEnd: '20px',
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(12px)',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 1000,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          textDecoration: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
        }}
      >
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#6b7280',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.005em'
        }}>
          made with <span style={{ color: displayAccentColor, fontWeight: '600' }}>Alnamodj</span>
        </span>
      </a>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '100px'
      }}>
        {/* Header - matches edit view */}
        <div style={{
          marginBottom: '48px',
          paddingTop: '20px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '600',
            color: displayTextColor,
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                strong: ({ children }) => <strong style={{ color: displayBoldTextColor }}>{children}</strong>
              }}
            >
              {formData.title}
            </ReactMarkdown>
          </h1>
          {formData.description && (
            <div style={{
              fontSize: '17px',
              color: displayTextColor,
              opacity: 0.7,
              lineHeight: '1.6'
            }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                  strong: ({ children }) => <strong style={{ color: displayBoldTextColor }}>{children}</strong>
                }}
              >
                {formData.description}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {formData.questions
              ?.filter((q: any) => visibleQuestionIds.has(q.id))
              .sort((a: any, b: any) => a.question_order - b.question_order)
              .map((question: any, index: number) => (
                <div
                  key={question.id}
                  style={{
                    padding: '48px 0',
                    borderBottom: index < formData.questions.length - 1 ? '1px solid #e5e7eb' : 'none',
                    position: 'relative'
                  }}
                >
                  {/* Question Text - matches edit view with markdown */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: displayTextColor,
                      marginBottom: '8px',
                      lineHeight: '1.4'
                    }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                          strong: ({ children }) => <strong style={{ color: displayBoldTextColor }}>{children}</strong>
                        }}
                      >
                        {question.question_text}
                      </ReactMarkdown>
                      {question.required && <span style={{ color: displayBoldTextColor, marginInlineStart: '4px' }}>*</span>}
                    </div>
                    
                    {/* Description - matches edit view with markdown */}
                    {question.description && (
                      <div style={{
                        fontSize: '14px',
                        color: displayTextColor,
                        opacity: 0.7,
                        lineHeight: '1.5'
                      }}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                            strong: ({ children }) => <strong style={{ color: displayBoldTextColor }}>{children}</strong>
                          }}
                        >
                          {question.description}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Question Input - using QuestionRenderer without labels */}
                  <div style={{ marginTop: '8px' }}>
                    <QuestionRenderer
                      question={question}
                      value={answers[question.id] || {}}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                      disabled={false}
                      hideLabel={true}
                      accentColor={displayAccentColor}
                      boldTextColor={displayBoldTextColor}
                      uploadContext={{ token }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {error && (
            <div style={{
              marginTop: '24px',
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: '48px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              background: submitting ? '#d1d5db' : displayBoldTextColor,
              border: 'none',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {submitting ? 'Submitting...' : (formData.settings?.submit_button_text || 'Submit')}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          color: displayTextColor,
          opacity: 0.5,
          marginTop: '48px'
        }}>
          Made using{' '}
          <a
            href="https://alnamodj.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: displayAccentColor,
              textDecoration: 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Alnamodj
          </a>
        </div>
      </div>
    </div>
  );
};
