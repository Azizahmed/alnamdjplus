import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n';

interface ComponentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (questionType: string, customization?: { text?: string; description?: string; options?: string[]; aiPrompt?: string }) => void;
  onGenerate?: (prompt: string) => void;
}

interface QuestionTypeItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  hasOptions?: boolean;
}

const QUESTION_TYPES: QuestionTypeItem[] = [
  { id: 'short_answer', name: 'إجابة قصيرة', icon: '≡', category: 'questions', description: 'حقل نصي لسطر واحد' },
  { id: 'long_answer', name: 'إجابة طويلة', icon: '☰', category: 'questions', description: 'منطقة نص متعددة الأسطر' },
  { id: 'multiple_choice', name: 'اختيار متعدد', icon: '◉', category: 'questions', description: 'اختر خياراً واحداً', hasOptions: true },
  { id: 'checkboxes', name: 'خانات اختيار', icon: '☑', category: 'questions', description: 'اختر خيارات متعددة', hasOptions: true },
  { id: 'dropdown', name: 'قائمة منسدلة', icon: '⌄', category: 'questions', description: 'قائمة اختيار منسدلة', hasOptions: true },
  { id: 'multi_select', name: 'اختيار متعدد', icon: '✓✓', category: 'questions', description: 'اختيار متعدد من قائمة', hasOptions: true },
  { id: 'number', name: 'رقم', icon: '#', category: 'questions', description: 'إدخال رقمي' },
  { id: 'email', name: 'بريد إلكتروني', icon: '@', category: 'questions', description: 'إدخال بريد إلكتروني' },
  { id: 'phone', name: 'رقم هاتف', icon: '✆', category: 'questions', description: 'إدخال رقم هاتف' },
  { id: 'link', name: 'رابط', icon: '🔗', category: 'questions', description: 'إدخال رابط URL' },
  { id: 'file_upload', name: 'رفع ملف', icon: '⬆', category: 'questions', description: 'رفع ملفات' },
  { id: 'date', name: 'تاريخ', icon: '📅', category: 'questions', description: 'اختيار التاريخ' },
  { id: 'time', name: 'وقت', icon: '⏱', category: 'questions', description: 'اختيار الوقت' },
  { id: 'linear_scale', name: 'مقياس خطي', icon: '•••', category: 'questions', description: 'تقييم بالمقياس' },
  { id: 'matrix', name: 'مصفوفة', icon: '⊞', category: 'questions', description: 'إدخال شبكي' },
  { id: 'rating', name: 'تقييم', icon: '☆', category: 'questions', description: 'تقييم بالنجوم' },
  { id: 'signature', name: 'توقيع', icon: '✎', category: 'questions', description: 'توقيع رقمي' },
  { id: 'ranking', name: 'ترتيب', icon: '⇅', category: 'questions', description: 'ترتيب العناصر', hasOptions: true },
];

const LAYOUT_BLOCKS: QuestionTypeItem[] = [
  { id: 'statement', name: 'بيان', icon: '¶', category: 'layout', description: 'عرض نصي' },
];

export const ComponentPicker: React.FC<ComponentPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  onGenerate
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<QuestionTypeItem | null>(null);
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  
  // Inline edit states
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>(['الخيار 1', 'الخيار 2', 'الخيار 3']);
  const [editMode, setEditMode] = useState<'manual' | 'ai'>('manual');
  const [aiInstructions, setAiInstructions] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const generateInputRef = useRef<HTMLTextAreaElement>(null);

  const filteredQuestions = QUESTION_TYPES.filter(q => 
    q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredLayouts = LAYOUT_BLOCKS.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredItems = [...filteredQuestions, ...filteredLayouts];

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedItem(null);
      setShowGenerateInput(false);
      setGeneratePrompt('');
      setEditText('');
      setEditDescription('');
      setEditOptions(['الخيار 1', 'الخيار 2', 'الخيار 3']);
      setEditMode('manual');
      setAiInstructions('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update edit fields when selection changes
  useEffect(() => {
    if (selectedItem) {
      setEditText(`Your ${selectedItem.name.toLowerCase()} question`);
      setEditDescription('');
      setEditOptions(['الخيار 1', 'الخيار 2', 'الخيار 3']);
      setAiInstructions('');
      setEditMode('manual');
    }
  }, [selectedItem]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showGenerateInput) {
          setShowGenerateInput(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, showGenerateInput, onClose]);

  const handleItemSelect = (item: QuestionTypeItem) => {
    setSelectedItem(item);
  };

  const handleAddComponent = () => {
    if (!selectedItem) return;
    
    if (editMode === 'ai' && aiInstructions.trim()) {
      onSelect(selectedItem.id, { aiPrompt: aiInstructions.trim() });
    } else {
      onSelect(selectedItem.id, {
        text: editText.trim() || undefined,
        description: editDescription.trim() || undefined,
        options: selectedItem.hasOptions ? editOptions.filter(o => o.trim()) : undefined
      });
    }
    onClose();
  };

  const handleQuickAdd = (item: QuestionTypeItem) => {
    // Double-click or quick add without customization
    onSelect(item.id);
    onClose();
  };

  const handleGenerate = () => {
    if (generatePrompt.trim() && onGenerate) {
      onGenerate(generatePrompt.trim());
      onClose();
    }
  };

  const addOption = () => {
    setEditOptions([...editOptions, `الخيار ${editOptions.length + 1}`]);
  };

  const removeOption = (index: number) => {
    if (editOptions.length > 1) {
      setEditOptions(editOptions.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...editOptions];
    newOptions[index] = value;
    setEditOptions(newOptions);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '6vh'
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 0
        }}
      />
      
      {/* Modal */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '800px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Search Input */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchComponents}
            style={{
              flex: 1,
              fontSize: '15px',
              color: '#1f2937',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit'
            }}
          />
          {selectedItem && (
            <button
              onClick={handleAddComponent}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#ffffff',
                background: '#0E7C86',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Add {selectedItem.name}
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', height: '65vh', maxHeight: '500px' }}>
          {/* Left: Component List */}
          <div style={{
            width: '220px',
            borderInlineStart: '1px solid #f3f4f6',
            overflowY: 'auto',
            padding: '8px 0',
            flexShrink: 0
          }}>
            {/* Generate with AI */}
            {onGenerate && !showGenerateInput && (
              <>
                <div style={{
                  padding: '6px 12px 4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  AI Generate
                </div>
                <button
                  onClick={() => {
                    setShowGenerateInput(true);
                    setSelectedItem(null);
                    setTimeout(() => generateInputRef.current?.focus(), 100);
                  }}
                  style={{
                    width: 'calc(100% - 12px)',
                    margin: '0 6px 8px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    color: showGenerateInput ? '#0E7C86' : '#374151',
                    background: showGenerateInput ? '#E7F5F4' : 'transparent',
                    border: showGenerateInput ? '1px solid #0E7C86' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                    fontFamily: 'inherit'
                  }}
                >
                  <span>✨</span>
                  Generate with AI
                </button>
              </>
            )}
            
            {/* Questions Section */}
            {filteredQuestions.length > 0 && !showGenerateInput && (
              <>
                <div style={{
                  padding: '10px 12px 4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Questions
                </div>
                {filteredQuestions.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      onDoubleClick={() => handleQuickAdd(item)}
                      style={{
                        width: 'calc(100% - 12px)',
                        margin: '0 6px 2px',
                        padding: '7px 10px',
                        fontSize: '13px',
                        color: isSelected ? '#0E7C86' : '#374151',
                        background: isSelected ? '#E7F5F4' : 'transparent',
                        border: isSelected ? '1px solid #0E7C86' : '1px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'all 0.1s'
                      }}
                    >
                      <span style={{
                        width: '18px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: isSelected ? '#0E7C86' : '#6b7280'
                      }}>
                        {item.icon}
                      </span>
                      {item.name}
                    </button>
                  );
                })}
              </>
            )}

            {/* Layout Blocks */}
            {filteredLayouts.length > 0 && !showGenerateInput && (
              <>
                <div style={{
                  padding: '10px 12px 4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Layout
                </div>
                {filteredLayouts.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      onDoubleClick={() => handleQuickAdd(item)}
                      style={{
                        width: 'calc(100% - 12px)',
                        margin: '0 6px 2px',
                        padding: '7px 10px',
                        fontSize: '13px',
                        color: isSelected ? '#0E7C86' : '#374151',
                        background: isSelected ? '#E7F5F4' : 'transparent',
                        border: isSelected ? '1px solid #0E7C86' : '1px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                        fontFamily: 'inherit'
                      }}
                    >
                      <span style={{
                        width: '18px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: isSelected ? '#0E7C86' : '#6b7280'
                      }}>
                        {item.icon}
                      </span>
                      {item.name}
                    </button>
                  );
                })}
              </>
            )}

            {filteredItems.length === 0 && !showGenerateInput && (
              <div style={{ padding: '16px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
                No results
              </div>
            )}
            
            {showGenerateInput && (
              <div style={{ padding: '12px' }}>
                <button
                  onClick={() => setShowGenerateInput(false)}
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '8px'
                  }}
                >
                  ← العودة للقائمة
                </button>
              </div>
            )}
          </div>

          {/* Right: Edit Panel */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            background: '#fafafa'
          }}>
            {showGenerateInput ? (
              /* AI Generate Mode */
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                    ✨ Generate with AI
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Describe exactly what you want
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <textarea
                    ref={generateInputRef}
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    placeholder="مثال: اسأل عن المناسبات (وليمة، نكاح، بارات) التي سيحضرها الضيف بخانات اختيار، وإذا كان سيحضر مع مرافق..."
                    style={{
                      width: '100%',
                      minHeight: '140px',
                      padding: '12px',
                      paddingRight: '48px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      background: '#ffffff',
                      lineHeight: '1.5'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0E7C86'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && generatePrompt.trim()) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!generatePrompt.trim()}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      insetInlineEnd: '10px',
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      background: generatePrompt.trim() ? '#0E7C86' : '#d1d5db',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: generatePrompt.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : selectedItem ? (
              /* Edit Selected Component */
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>
                    {selectedItem.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {selectedItem.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {selectedItem.description}
                    </div>
                  </div>
                </div>

                {/* Mode Toggle */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '8px',
                  padding: '8px',
                  borderRadius: '12px',
                  border: '1px solid #D9E4E1',
                  background: '#F7FAF8'
                }}>
                  <button
                    onClick={() => setEditMode('manual')}
                    style={{
                      minHeight: '46px',
                      padding: '10px 14px',
                      fontSize: '14px',
                      fontWeight: '800',
                      color: editMode === 'manual' ? '#0E7C86' : '#6b7280',
                      background: editMode === 'manual' ? '#ffffff' : 'transparent',
                      border: `1px solid ${editMode === 'manual' ? '#0E7C86' : '#e5e7eb'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      boxShadow: editMode === 'manual' ? '0 10px 22px rgba(14, 124, 134, 0.1)' : 'none'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setEditMode('ai')}
                    style={{
                      minHeight: '46px',
                      padding: '10px 14px',
                      fontSize: '14px',
                      fontWeight: '800',
                      color: editMode === 'ai' ? '#0E7C86' : '#6b7280',
                      background: editMode === 'ai' ? '#ffffff' : 'transparent',
                      border: `1px solid ${editMode === 'ai' ? '#0E7C86' : '#e5e7eb'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: editMode === 'ai' ? '0 10px 22px rgba(14, 124, 134, 0.1)' : 'none'
                    }}
                  >
                    ✨ AI
                  </button>
                </div>

                {editMode === 'manual' ? (
                  <>
                    {/* Question Text */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                        Question
                      </label>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="أدخل سؤالك..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: '13px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          outline: 'none',
                          background: '#ffffff'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0E7C86'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                        Description <span style={{ color: '#9ca3af', fontWeight: '400' }}>(اختياري)</span>
                      </label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="أضف نصًا مساعداً..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: '13px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          outline: 'none',
                          background: '#ffffff'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0E7C86'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Options */}
                    {selectedItem.hasOptions && (
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                          Options
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {editOptions.map((option, index) => (
                            <div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ color: '#9ca3af', fontSize: '12px', width: '16px' }}>
                                {selectedItem.id === 'multiple_choice' ? '◉' : '☐'}
                              </span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '6px 8px',
                                  fontSize: '13px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '5px',
                                  outline: 'none',
                                  background: '#ffffff'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0E7C86'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                              />
                              {editOptions.length > 1 && (
                                <button
                                  onClick={() => removeOption(index)}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9ca3af',
                                    fontSize: '14px'
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={addOption}
                            style={{
                              alignSelf: 'flex-start',
                              padding: '4px 8px',
                              fontSize: '12px',
                              color: '#0E7C86',
                              background: 'transparent',
                              border: '1px dashed #fcd34d',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginTop: '2px'
                            }}
                          >
                            + Add option
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* AI Mode */
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                      Describe how to customize
                    </label>
                    <textarea
                      value={aiInstructions}
                      onChange={(e) => setAiInstructions(e.target.value)}
                      placeholder={`مثال: "اسأل عن القيود الغذائية مع خيارات: نباتي، نباتي صارم، حلال، كوشير، بدون. اجعله مطلوباً."`}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '13px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        background: '#ffffff'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0E7C86'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                )}

                {/* Preview */}
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Preview
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>
                    {editText || t.yourQuestion} <span style={{ color: '#0E7C86' }}>*</span>
                  </div>
                  {editDescription && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      {editDescription}
                    </div>
                  )}
                  {selectedItem.hasOptions ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      {editOptions.filter(o => o.trim()).slice(0, 3).map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
                          <input 
                            type={selectedItem.id === 'multiple_choice' ? 'radio' : 'checkbox'} 
                            disabled 
                            style={{ accentColor: '#0E7C86' }}
                          />
                          {opt}
                        </label>
                      ))}
                      {editOptions.filter(o => o.trim()).length > 3 && (
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          +{editOptions.filter(o => o.trim()).length - 3} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="أجب هنا..."
                      disabled
                      style={{
                        width: '100%',
                        padding: '6px 0',
                        fontSize: '13px',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        background: 'transparent',
                        marginTop: '4px'
                      }}
                    />
                  )}
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddComponent}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: '#0E7C86',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  Add to Form
                </button>
                <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                  Double-click a component to add without editing
                </div>
              </div>
            ) : (
              /* No Selection */
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '20px', color: '#d1d5db' }}>+</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  اختر مكونًا
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.5', maxWidth: '220px' }}>
                  انقر للتخصيص قبل الإضافة، أو انقر نقراً مزدوجاً للإضافة بسرعة.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
};
