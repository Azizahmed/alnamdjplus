import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useI18n } from '../i18n';

interface QuestionEditorProps {
  question: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
  onRegenerate: (question: any, prompt: string) => void;
}

const QUESTION_TYPES = [
  { id: 'short_answer' },
  { id: 'long_answer' },
  { id: 'multiple_choice' },
  { id: 'checkboxes' },
  { id: 'dropdown' },
  { id: 'multi_select' },
  { id: 'number' },
  { id: 'email' },
  { id: 'phone' },
  { id: 'link' },
  { id: 'file_upload' },
  { id: 'date' },
  { id: 'time' },
  { id: 'linear_scale' },
  { id: 'matrix' },
  { id: 'rating' },
  { id: 'payment' },
  { id: 'signature' },
  { id: 'ranking' },
  { id: 'wallet_connect' },
];

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
  onRegenerate
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'edit' | 'ai'>('edit');
  const [questionText, setQuestionText] = useState(question.question_text || '');
  const [description, setDescription] = useState(question.description || '');
  const [questionType, setQuestionType] = useState(question.question_type || 'short_answer');
  const [required, setRequired] = useState(question.required || false);
  const [choices, setChoices] = useState<string[]>(question.settings?.choices || ['خيار 1', 'خيار 2']);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Reset form when question changes
  useEffect(() => {
    setQuestionText(question.question_text || '');
    setDescription(question.description || '');
    setQuestionType(question.question_type || 'short_answer');
    setRequired(question.required || false);
    setChoices(question.settings?.choices || ['خيار 1', 'خيار 2']);
    setAiPrompt('');
  }, [question]);

  const hasChoices = ['multiple_choice', 'checkboxes', 'dropdown', 'multi_select'].includes(questionType);

  const handleSave = () => {
    const updates: any = {
      question_text: questionText,
      description: description,
      question_type: questionType,
      required: required,
    };

    if (hasChoices) {
      updates.settings = { ...question.settings, choices: choices.filter(c => c.trim()) };
    }

    onSave(updates);
    onClose();
  };

  const handleAiEdit = async () => {
    if (!aiPrompt.trim()) return;

    setIsApplying(true);
    try {
      await onRegenerate(question, aiPrompt);
      setAiPrompt('');
      onClose();
    } catch (err) {
      console.error('Failed to apply AI changes:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const addChoice = () => {
    setChoices([...choices, `خيار ${choices.length + 1}`]);
  };

  const removeChoice = (index: number) => {
    if (choices.length > 1) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };

  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        style={{ position: 'relative', zIndex: 20000 }}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0, 0, 0, 0.4)' }} />
        </Transition.Child>

        <div style={{ position: 'fixed', inset: 0, zIndex: 20001, overflow: 'auto' }}>
          <div style={{ display: 'flex', minHeight: '100%', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                style={{
                  width: '100%',
                  maxWidth: '720px',
                  maxHeight: 'calc(100vh - 32px)',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '12px',
                  borderBottom: '1px solid #e5e7eb',
                  background: '#F7FAF8',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => setActiveTab('edit')}
                    style={{
                      flex: 1,
                      minHeight: '56px',
                      padding: '14px 18px',
                      fontSize: '15px',
                      fontWeight: '800',
                      color: activeTab === 'edit' ? '#0E7C86' : '#52666B',
                      background: activeTab === 'edit' ? '#ffffff' : 'transparent',
                      border: `1px solid ${activeTab === 'edit' ? '#0E7C86' : '#D9E4E1'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: activeTab === 'edit' ? '0 10px 24px rgba(14, 124, 134, 0.12)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {t.editTab}
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    style={{
                      flex: 1,
                      minHeight: '56px',
                      padding: '14px 18px',
                      fontSize: '15px',
                      fontWeight: '800',
                      color: activeTab === 'ai' ? '#0E7C86' : '#52666B',
                      background: activeTab === 'ai' ? '#ffffff' : 'transparent',
                      border: `1px solid ${activeTab === 'ai' ? '#0E7C86' : '#D9E4E1'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: activeTab === 'ai' ? '0 10px 24px rgba(14, 124, 134, 0.12)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    {t.editWithAI}
                  </button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', minHeight: 0 }}>
                  {activeTab === 'edit' ? (
                    /* Normal Edit Tab */
                    <div>
                      {/* Question Text */}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          {t.questionLabel}
                        </label>
                        <input
                          type="text"
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder={t.enterYourQuestion}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '15px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            outline: 'none',
                            fontFamily: 'inherit'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0E7C86'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          {t.descriptionLabel} <span style={{ fontWeight: '400', color: '#9ca3af' }}>{t.optionalLabel}</span>
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={t.addDescriptionPlaceholder}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0E7C86'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />
                      </div>

                      {/* Question Type */}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          {t.type}
                        </label>
                        <select
                          value={questionType}
                          onChange={(e) => setQuestionType(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            background: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          {QUESTION_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>{(t.questionTypes as any)[type.id]}</option>
                          ))}
                        </select>
                      </div>

                      {/* Choices for choice-based questions */}
                      {hasChoices && (
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '6px'
                          }}>
                            {t.optionsLabel}
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {choices.map((choice, index) => (
                              <div key={index} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="text"
                                  value={choice}
                                  onChange={(e) => updateChoice(index, e.target.value)}
                                  placeholder={`${t.option} ${index + 1}`}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                  }}
                                />
                                <button
                                  onClick={() => removeChoice(index)}
                                  disabled={choices.length <= 1}
                                  style={{
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    color: choices.length <= 1 ? '#d1d5db' : '#ef4444',
                                    background: 'transparent',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    cursor: choices.length <= 1 ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={addChoice}
                              style={{
                                padding: '8px 12px',
                                fontSize: '14px',
                                color: '#0E7C86',
                                background: '#E7F5F4',
                                border: '1px dashed #D9E4E1',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginTop: '4px'
                              }}
                            >
                              + {t.addOption}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Required toggle */}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={required}
                            onChange={(e) => setRequired(e.target.checked)}
                            style={{
                              width: '18px',
                              height: '18px',
                              accentColor: '#0E7C86'
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#374151' }}>
                            {t.requiredQuestion}
                          </span>
                        </label>
                      </div>

                      {/* Save button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button
                          onClick={onClose}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#6b7280',
                            background: 'transparent',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          {t.cancel}
                        </button>
                        <button
                          onClick={handleSave}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ffffff',
                            background: '#0E7C86',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          {t.saveChanges}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* AI Edit Tab */
                    <div>
                      {/* Current question preview */}
                      <div style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#9ca3af',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>
                          {t.currentQuestion}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {question.question_text}
                        </div>
                        {question.description && (
                          <div style={{
                            fontSize: '13px',
                            color: '#6b7280',
                            marginTop: '4px'
                          }}>
                            {question.description}
                          </div>
                        )}
                      </div>

                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '12px'
                      }}>
                        {t.describeChanges}
                      </p>

                      {/* AI prompt input */}
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t.aiEditPlaceholder}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '15px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          marginBottom: '16px'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#0E7C86'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey && aiPrompt.trim() && !isApplying) {
                            handleAiEdit();
                          }
                        }}
                        autoFocus
                      />

                      {/* Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                          onClick={onClose}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#6b7280',
                            background: 'transparent',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          {t.cancel}
                        </button>
                        <button
                          onClick={handleAiEdit}
                          disabled={!aiPrompt.trim() || isApplying}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ffffff',
                            background: (!aiPrompt.trim() || isApplying) ? '#d1d5db' : '#0E7C86',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: (!aiPrompt.trim() || isApplying) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {isApplying ? t.applying : t.applyWithAI}
                        </button>
                      </div>

                      <p style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        marginTop: '12px',
                        textAlign: 'center'
                      }}>
                        {t.pressCtrlEnter}
                      </p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
