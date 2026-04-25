import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuestionEditor } from '../QuestionEditor';
import { LoadingAnimation } from '../LoadingAnimation';
import { ConditionModal } from '../ConditionModal';
import { QuestionColorPicker } from '../ColorPicker';
import { SideAddButton } from '../SideAddButton';
import { InlineEditableText, EditableOptions } from '../InlineEditableText';
import { ComponentPicker } from '../ComponentPicker';
import { useSidebar } from '../../contexts/SidebarContext';
import { useI18n } from '../../i18n';
import { config, getAuthHeaders } from '../../config';
import { FormChatPanel } from '../FormChatPanel';
import { brandTokens, buildPagePresets, normalizeThemeColor, withAlpha } from '../../theme/brand';

interface FormBuilderProps {
  formData: any;
  onBack?: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ formData: initialFormData, onBack }) => {
  const { t } = useI18n();
  const { setSidebarOpen } = useSidebar();
  const initialBackground = normalizeThemeColor(initialFormData.settings?.background_color, 'background', brandTokens.surface);
  const initialText = normalizeThemeColor(initialFormData.settings?.text_color, 'text', brandTokens.text);
  const initialAccent = normalizeThemeColor(initialFormData.settings?.accent_color, 'accent', brandTokens.accent);
  const initialBold = normalizeThemeColor(initialFormData.settings?.bold_text_color || initialFormData.settings?.accent_color, 'bold', brandTokens.primary);
  const [formData, setFormData] = useState(initialFormData);
  const [showPublishPopup, setShowPublishPopup] = useState(false);
  const [publishLink, setPublishLink] = useState('');
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(initialFormData.isGenerating || false);
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [conditionForQuestion, setConditionForQuestion] = useState<any>(null);
  const [showQuestionColorPicker, setShowQuestionColorPicker] = useState(false);
  const [colorPickerForQuestion, setColorPickerForQuestion] = useState<number | null>(null);
  const [questionColors, setQuestionColors] = useState<Record<number, any>>({});
  const [globalColors, setGlobalColors] = useState({
    background: initialBackground,
    text: initialText,
    accent: initialAccent,
    boldText: initialBold
  });
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showChat, setShowChat] = useState(true); // Chat visible by default in builder

  const resolvedBackground = normalizeThemeColor(globalColors.background, 'background', brandTokens.surface);
  const resolvedText = normalizeThemeColor(globalColors.text, 'text', brandTokens.text);
  const resolvedAccent = normalizeThemeColor(globalColors.accent, 'accent', brandTokens.accent);
  const resolvedBoldText = normalizeThemeColor(globalColors.boldText || globalColors.accent, 'bold', brandTokens.primary);

  // Refs for debounced saves
  const pendingQuestionSaves = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const pendingFormSave = useRef<NodeJS.Timeout | null>(null);

  // Save question to backend (debounced)
  const saveQuestionToBackend = useCallback(async (questionId: number, updates: any) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/forms/${formData.id}/questions/${questionId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify(updates)
        }
      );
      if (!response.ok) {
        console.error('Failed to save question:', await response.text());
      }
    } catch (err) {
      console.error('Failed to save question:', err);
    }
  }, [formData.id]);

  // Save form metadata to backend (debounced)
  const saveFormMetadataToBackend = useCallback(async (title: string, description: string) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ title, description })
      });
      if (!response.ok) {
        console.error('Failed to save form metadata:', await response.text());
      }
    } catch (err) {
      console.error('Failed to save form metadata:', err);
    }
  }, [formData.id]);

  // Cleanup pending saves on unmount
  useEffect(() => {
    return () => {
      // Clear all pending question saves
      pendingQuestionSaves.current.forEach((timeout) => clearTimeout(timeout));
      pendingQuestionSaves.current.clear();
      // Clear pending form save
      if (pendingFormSave.current) {
        clearTimeout(pendingFormSave.current);
      }
    };
  }, []);

  // Handler to open chat and close sidebar
  const handleOpenChat = () => {
    setSidebarOpen(false);
    setShowChat(true);
  };

  // Save global colors to form settings when they change
  useEffect(() => {
    if (formData.id) {
      const currentBg = normalizeThemeColor(formData.settings?.background_color, 'background', brandTokens.surface);
      const currentText = normalizeThemeColor(formData.settings?.text_color, 'text', brandTokens.text);
      const currentAccent = normalizeThemeColor(formData.settings?.accent_color, 'accent', brandTokens.accent);
      const currentBoldText = normalizeThemeColor(formData.settings?.bold_text_color || formData.settings?.accent_color, 'bold', brandTokens.primary);
      
      // Only update if colors actually changed
      if (
        currentBg !== globalColors.background ||
        currentText !== globalColors.text ||
        currentAccent !== globalColors.accent ||
        currentBoldText !== globalColors.boldText
      ) {
        const updatedSettings = {
          ...formData.settings,
          background_color: resolvedBackground,
          text_color: resolvedText,
          accent_color: resolvedAccent,
          bold_text_color: resolvedBoldText
        };
        
        // Update local state
        setFormData({ ...formData, settings: updatedSettings });
        
        // Save to backend
        saveFormSettings(updatedSettings);
      }
    }
  }, [resolvedBackground, resolvedText, resolvedAccent, resolvedBoldText]);

  // Save form settings to backend
  const saveFormSettings = async (settings: any) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ settings })
      });
      
      if (!response.ok) {
        console.error('Failed to save form settings');
      }
    } catch (err) {
      console.error('Error saving form settings:', err);
    }
  };

  // Handler when form is updated via chat
  const handleFormUpdatedFromChat = async () => {
    try {
      const formResponse = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (formResponse.ok) {
        const updatedForm = await formResponse.json();
        setFormData(updatedForm);
      }
    } catch (err) {
      console.error('Failed to refresh form:', err);
    }
  };

  // Handle form generation on mount if needed
  useEffect(() => {
    if (initialFormData.isGenerating && initialFormData.user_query) {
      generateForm(initialFormData.user_query);
    }
  }, []);

  const generateForm = async (userQuery: string) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/generate`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          user_query: userQuery
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        let errorMessage = 'Failed to generate form';
        if (isJson) {
          try {
        const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use status text
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        } else {
          // If not JSON, it's probably an HTML error page
          errorMessage = `Server error (${response.status}). Please check if the backend is running correctly.`;
        }
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error('Server returned non-JSON response. Please check backend configuration.');
      }

      const data = await response.json();
      setFormData(data.form);
    } catch (err: any) {
      console.error('Form generation error:', err);
      // Form generation failed - user can see the error in the console
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuestion = async (updates: any) => {
    if (!selectedQuestion) return;

    try {
      // Save to backend
      const response = await fetch(
        `${config.backendUrl}/api/forms/${formData.id}/questions/${selectedQuestion.id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save question');
      }

      // Update local state
    const updatedQuestions = formData.questions.map((q: any) =>
      q.id === selectedQuestion.id ? { ...q, ...updates } : q
    );

    setFormData({ ...formData, questions: updatedQuestions });
    setSelectedQuestion({ ...selectedQuestion, ...updates });
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Failed to save question. Please try again.');
    }
  };

  const handleRegenerateQuestion = async (question: any, prompt: string) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/forms/${formData.id}/questions/${question.id}/regenerate`,
        {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ 
            context: prompt || 'Regenerate this question',
            prompt: prompt
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to regenerate question');
      }

      const data = await response.json();
      
      // Update the question in the form
      if (data.question) {
        const updatedQuestions = formData.questions.map((q: any) =>
          q.id === question.id ? { ...q, ...data.question } : q
        );
        setFormData({ ...formData, questions: updatedQuestions });
      }
    } catch (err: any) {
      console.error('Question regeneration error:', err);
      alert(err.message || 'Failed to regenerate question. Please try again.');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        // Delete from backend first
        const response = await fetch(
          `${config.backendUrl}/api/forms/${formData.id}/questions/${questionId}`,
          {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete question');
        }

        // Update local state only after successful backend delete
      const updatedQuestions = formData.questions.filter((q: any) => q.id !== questionId);
      setFormData({ ...formData, questions: updatedQuestions });
      } catch (err) {
        console.error('Failed to delete question:', err);
        alert('Failed to delete question. Please try again.');
      }
    }
  };

  // Handle inline editing of question text, description, or options
  const handleInlineQuestionUpdate = (questionId: number, field: string, value: any) => {
    // Find the current question to build the complete update
    const question = formData.questions.find((q: any) => q.id === questionId);
    if (!question) return;

    // Build the updated question
    let updatedQuestion: any;
    if (field.startsWith('settings.')) {
      const settingKey = field.split('.')[1];
      updatedQuestion = { ...question, settings: { ...question.settings, [settingKey]: value } };
    } else {
      updatedQuestion = { ...question, [field]: value };
    }

    // Update local state immediately
    const updatedQuestions = formData.questions.map((q: any) =>
      q.id === questionId ? updatedQuestion : q
    );
    setFormData({ ...formData, questions: updatedQuestions });

    // Debounce the backend save (500ms)
    const existingTimeout = pendingQuestionSaves.current.get(questionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      // Build the update payload for the backend
      const updatePayload: any = {
        question_text: updatedQuestion.question_text,
        description: updatedQuestion.description,
        required: updatedQuestion.required,
        settings: updatedQuestion.settings
      };
      saveQuestionToBackend(questionId, updatePayload);
      pendingQuestionSaves.current.delete(questionId);
    }, 500);
    
    pendingQuestionSaves.current.set(questionId, timeoutId);
  };

  // Handle form title update with debounced save
  const handleTitleUpdate = (value: string) => {
    setFormData((prev: any) => ({ ...prev, title: value }));
    
    // Debounce backend save
    if (pendingFormSave.current) {
      clearTimeout(pendingFormSave.current);
    }
    pendingFormSave.current = setTimeout(() => {
      saveFormMetadataToBackend(value, formData.description || '');
      pendingFormSave.current = null;
    }, 500);
  };

  // Handle form description update with debounced save
  const handleDescriptionUpdate = (value: string) => {
    setFormData((prev: any) => ({ ...prev, description: value }));
    
    // Debounce backend save
    if (pendingFormSave.current) {
      clearTimeout(pendingFormSave.current);
    }
    pendingFormSave.current = setTimeout(() => {
      saveFormMetadataToBackend(formData.title || 'Untitled Form', value);
      pendingFormSave.current = null;
    }, 500);
  };

  const handleSaveCondition = (condition: any) => {
    // Add or update conditional rule
    const existingRules = formData.conditional_rules || [];
    const updatedRules = [...existingRules, condition];
    setFormData({ ...formData, conditional_rules: updatedRules });
  };

  const handleQuestionColorChange = (questionId: number, colors: any) => {
    setQuestionColors((prev) => ({
      ...prev,
      [questionId]: colors
    }));
  };

  const handleAddQuestion = async (
    questionType: string, 
    atIndex?: number | null,
    customization?: { text?: string; description?: string; options?: string[]; aiPrompt?: string }
  ) => {
    if (!formData.id) {
      alert('Form must be saved before adding questions');
      return;
    }

    // If AI customization is requested, use the chat API
    if (customization?.aiPrompt) {
      setShowComponentPicker(false);
      setIsGenerating(true);
      const aiMessage = `Add a ${questionType.replace(/_/g, ' ')} question: ${customization.aiPrompt}`;
      
      try {
        const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/chat`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ message: aiMessage })
        });
        
        if (!response.ok) throw new Error('Failed to generate component');
        
        // Refresh form data
        const formResponse = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        
        if (formResponse.ok) {
          const updatedForm = await formResponse.json();
          setFormData(updatedForm);
        }
      } catch (err) {
        console.error('AI generate error:', err);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    try {
      // Determine the question order based on insertion index
      let questionOrder: number;
      if (atIndex !== undefined && atIndex !== null && formData.questions?.length > 0) {
        // Insert at specific position - use the order of the question at that index
        const sortedQuestions = [...formData.questions].sort((a: any, b: any) => a.question_order - b.question_order);
        questionOrder = sortedQuestions[atIndex]?.question_order ?? atIndex;
        
        // Shift all questions at or after this position
        // This will be handled by refetching the form
      } else {
        // Add at the end
      const maxOrder = formData.questions?.length > 0
        ? Math.max(...formData.questions.map((q: any) => q.question_order))
        : -1;
        questionOrder = maxOrder + 1;
      }

      // Use customization data if provided
      const questionText = customization?.text || 'New Question';
      const description = customization?.description || '';
      const customOptions = customization?.options?.filter(o => o.trim());

      // Build settings based on question type
      let settings: any = {};
      if (questionType === 'multiple_choice' || questionType === 'checkboxes' || questionType === 'dropdown' || questionType === 'multi_select') {
        settings = { choices: customOptions?.length ? customOptions : ['Option 1', 'Option 2', 'Option 3'] };
      } else if (questionType === 'ranking') {
        settings = { ranking_items: customOptions?.length ? customOptions : ['Item 1', 'Item 2', 'Item 3'] };
      } else if (questionType === 'matrix') {
        settings = { rows: ['Row 1', 'Row 2'], columns: ['Column 1', 'Column 2', 'Column 3'] };
      } else if (questionType === 'linear_scale') {
        settings = { min_value: 1, max_value: 5, scale_min_label: 'Low', scale_max_label: 'High' };
      } else if (questionType === 'rating') {
        settings = { max_value: 5 };
      }

      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/questions`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          form_id: formData.id,
          question_order: questionOrder,
          question_type: questionType,
          question_text: questionText,
          description: description,
          required: false,
          settings: settings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add question');
      }

      await response.json();
      
      // Refresh form data
      const formResponse = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (formResponse.ok) {
        const updatedForm = await formResponse.json();
        setFormData(updatedForm);
      }
      
      // Reset insert index
      setInsertAtIndex(null);
    } catch (err) {
      console.error('Failed to add question:', err);
      alert('Failed to add question. Please try again.');
    }
  };

  const handlePublish = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/publish`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          form_id: formData.id,
          allow_multiple_submissions: true,
          collect_email: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Use the same /forms/{token} URL for both preview and sharing
        const link = `${window.location.origin}/forms/${data.share_token}`;
        setPublishLink(link);
        setShowPublishPopup(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Publish failed:', errorData);
        alert('Failed to create publish link. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create publish link:', error);
      alert('Failed to create publish link. Please try again.');
    }
  };

  const handlePreview = async () => {
    try {
      // First create/get publish link
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/publish`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          form_id: formData.id,
          allow_multiple_submissions: true,
          collect_email: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add review=true to show form in grayscale mode
        const previewUrl = `${window.location.origin}/forms/${data.share_token}?review=true`;
        window.open(previewUrl, '_blank');
      } else {
        alert('Failed to generate preview. Please try again.');
      }
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to generate preview. Please try again.');
        }
  };

  const handleDeleteForm = async () => {
    if (!formData.id) return;
    
    if (!confirm(`Are you sure you want to delete "${formData.title || 'this form'}"?\n\nThis will permanently delete the form and all its responses. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        alert('Form deleted successfully.');
        // Navigate back or to dashboard
        if (onBack) {
          onBack();
      } else {
          window.location.href = '/build';
        }
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.detail || 'Failed to delete form. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete form:', error);
      alert('Failed to delete form. Please try again.');
    }
  };

  const copyPublishLink = () => {
    navigator.clipboard.writeText(publishLink);
    alert('Link copied to clipboard!');
  };

  // Evaluate conditional logic to determine which questions to show
  // In builder view, show all questions (conditional logic applies only in public form)
  const visibleQuestionIds = new Set(formData.questions?.map((q: any) => q.id) || []);

  const toolbarButtonBase: React.CSSProperties = {
    minHeight: '42px',
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.18s ease',
    lineHeight: 1,
    whiteSpace: 'nowrap'
  };

  const toolbarSecondaryButton: React.CSSProperties = {
    ...toolbarButtonBase,
    color: brandTokens.text,
    background: 'linear-gradient(180deg, #ffffff 0%, #fbf8f4 100%)',
    border: `1px solid ${brandTokens.border}`,
    boxShadow: '0 4px 12px rgba(74, 69, 64, 0.06)'
  };

  const toolbarIconButton: React.CSSProperties = {
    ...toolbarButtonBase,
    width: '42px',
    minWidth: '42px',
    padding: 0,
    color: brandTokens.textSoft,
    background: 'linear-gradient(180deg, #ffffff 0%, #fbf8f4 100%)',
    border: `1px solid ${brandTokens.border}`,
    boxShadow: '0 4px 12px rgba(74, 69, 64, 0.06)'
  };

  const toolbarPrimaryButton: React.CSSProperties = {
    ...toolbarButtonBase,
    color: '#ffffff',
    background: `linear-gradient(135deg, ${resolvedAccent} 0%, ${brandTokens.primary} 100%)`,
    border: 'none',
    boxShadow: '0 10px 24px rgba(74, 69, 64, 0.18)'
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: resolvedBackground,
      overflow: 'hidden',
      minHeight: 0
    }}>
      {/* Top Bar */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(251,248,244,0.95) 100%)',
        borderBottom: `1px solid ${brandTokens.border}`,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 10px 30px rgba(74, 69, 64, 0.06)',
        flexShrink: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                ...toolbarSecondaryButton,
                color: brandTokens.textSoft
              }}
            >
              ← {t.back}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Add Component Button */}
          <button
            onClick={() => {
              setInsertAtIndex(null);
              setShowComponentPicker(true);
            }}
            style={toolbarSecondaryButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = brandTokens.borderStrong;
              e.currentTarget.style.color = brandTokens.primary;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = brandTokens.border;
              e.currentTarget.style.color = brandTokens.text;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t.add}
          </button>

          {/* Preview Button */}
          <button
            onClick={handlePreview}
            style={toolbarSecondaryButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = brandTokens.borderStrong;
              e.currentTarget.style.color = brandTokens.primary;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = brandTokens.border;
              e.currentTarget.style.color = brandTokens.text;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {t.preview}
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDeleteForm}
            style={toolbarIconButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#edc2ba';
              e.currentTarget.style.color = brandTokens.danger;
              e.currentTarget.style.background = brandTokens.dangerSoft;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = brandTokens.border;
              e.currentTarget.style.color = brandTokens.textSoft;
              e.currentTarget.style.background = 'linear-gradient(180deg, #ffffff 0%, #fbf8f4 100%)';
            }}
            title={t.deleteForm}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>

          {/* Background Color */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowBgColorPicker(!showBgColorPicker)}
              style={{
                ...toolbarIconButton,
                width: '42px',
                minWidth: '42px',
                background: resolvedBackground,
                border: `2px solid ${brandTokens.border}`,
                cursor: 'pointer',
                position: 'relative'
              }}
              title={t.backgroundColor}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brandTokens.textSoft} strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </button>
            {showBgColorPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 18px 40px rgba(74, 69, 64, 0.14)',
                  border: `1px solid ${brandTokens.border}`,
                  padding: '16px',
                  zIndex: 100,
                  width: '280px'
                }}
                onMouseLeave={() => setShowBgColorPicker(false)}
              >
                  <div style={{ fontSize: '13px', fontWeight: '700', color: brandTokens.text, marginBottom: '12px' }}>
                    {t.backgroundColor}
                  </div>
                
                {/* Custom Color Picker */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="color"
                     value={resolvedBackground}
                     onChange={(e) => setGlobalColors({ ...globalColors, background: normalizeThemeColor(e.target.value, 'background', brandTokens.surface) })}
                     style={{
                       width: '48px',
                       height: '36px',
                       borderRadius: '6px',
                       border: `2px solid ${brandTokens.border}`,
                       cursor: 'pointer'
                     }}
                   />
          <input
            type="text"
                    value={resolvedBackground}
                    onChange={(e) => setGlobalColors({ ...globalColors, background: normalizeThemeColor(e.target.value, 'background', brandTokens.surface) })}
                    placeholder="#FFFFFF"
            style={{
              flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: `1px solid ${brandTokens.border}`,
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase'
            }}
          />
        </div>

                {/* Preset Colors */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {buildPagePresets.background.map((color) => (
                    <button
                      key={color}
                      onClick={() => setGlobalColors({ ...globalColors, background: color })}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        background: color,
                        border: resolvedBackground === color ? `2px solid ${brandTokens.accent}` : `1px solid ${brandTokens.border}`,
                        cursor: 'pointer',
                        transition: 'transform 0.1s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
              </div>
            )}
        </div>

          {/* Text Color */}
          <div style={{ position: 'relative' }}>
          <button
              onClick={() => setShowTextColorPicker(!showTextColorPicker)}
              style={{
                ...toolbarIconButton,
                width: '42px',
                minWidth: '42px',
                background: '#ffffff',
                border: `2px solid ${brandTokens.border}`,
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '700',
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: resolvedText
              }}
              title="Text Colors"
            >
              T
            </button>
            {showTextColorPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 18px 40px rgba(74, 69, 64, 0.14)',
                  border: `1px solid ${brandTokens.border}`,
                  padding: '16px',
                  zIndex: 100,
                  width: '280px'
                }}
                onMouseLeave={() => setShowTextColorPicker(false)}
              >
                {/* Normal Text Color */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: brandTokens.text, marginBottom: '12px' }}>
                    {t.normalText}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="color"
                      value={resolvedText}
                      onChange={(e) => setGlobalColors({ ...globalColors, text: normalizeThemeColor(e.target.value, 'text', brandTokens.text) })}
                      style={{
                        width: '48px',
                        height: '36px',
                        borderRadius: '6px',
                        border: `2px solid ${brandTokens.border}`,
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={resolvedText}
                      onChange={(e) => setGlobalColors({ ...globalColors, text: normalizeThemeColor(e.target.value, 'text', brandTokens.text) })}
                      placeholder="#000000"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        border: `1px solid ${brandTokens.border}`,
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {buildPagePresets.text.map((color) => (
                      <button
                        key={color}
                        onClick={() => setGlobalColors({ ...globalColors, text: color })}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          background: color,
                          border: resolvedText === color ? `2px solid ${brandTokens.accent}` : `1px solid ${brandTokens.border}`,
                          cursor: 'pointer',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>

                {/* Bold/Button Color */}
                <div style={{ borderTop: `1px solid ${brandTokens.border}`, paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: brandTokens.text, marginBottom: '12px' }}>
                    {t.boldButtonColor}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="color"
                      value={resolvedBoldText}
                      onChange={(e) => setGlobalColors({ ...globalColors, boldText: normalizeThemeColor(e.target.value, 'bold', brandTokens.primary) })}
                      style={{
                        width: '48px',
                        height: '36px',
                        borderRadius: '6px',
                        border: `2px solid ${brandTokens.border}`,
                        cursor: 'pointer'
                      }}
          />
                    <input
                      type="text"
                       value={resolvedBoldText}
                       onChange={(e) => setGlobalColors({ ...globalColors, boldText: normalizeThemeColor(e.target.value, 'bold', brandTokens.primary) })}
                       placeholder="#4a4540"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        border: `1px solid ${brandTokens.border}`,
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {buildPagePresets.accent.map((color) => (
                      <button
                        key={color}
                        onClick={() => setGlobalColors({ ...globalColors, boldText: color })}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          background: color,
                          border: resolvedBoldText === color ? `2px solid ${brandTokens.text}` : `1px solid ${brandTokens.border}`,
                          cursor: 'pointer',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
        </div>

          <button
            onClick={handlePublish}
            style={toolbarPrimaryButton}
          >
            {t.publish}
          </button>
        </div>
      </div>

      {/* Main Content: Chat + Form side by side */}
      <div style={{
        flex: '1 1 0',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Collapsed Chat Toggle */}
        {!showChat && (
          <button
            onClick={handleOpenChat}
            style={{
              width: '44px',
              background: 'linear-gradient(180deg, #F5F3F0 0%, #FAF8F6 100%)',
              border: 'none',
          borderRight: `1px solid ${brandTokens.borderStrong}`,
              cursor: 'pointer',
          display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            flexDirection: 'column',
              gap: '8px',
              padding: '16px 0',
              transition: 'all 0.15s'
            }}
            title="Open chat panel"
            onMouseEnter={(e) => e.currentTarget.style.background = '#F5F3F0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(180deg, #F5F3F0 0%, #FAF8F6 100%)'}
              >
                <div style={{
              width: '32px',
              height: '32px',
                borderRadius: '8px',
              background: brandTokens.primary,
                display: 'flex',
                alignItems: 'center',
              justifyContent: 'center'
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              </div>
            <span style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: '11px',
              fontWeight: '600',
               color: brandTokens.primary,
              letterSpacing: '0.05em'
            }}>
              {t.formAssistant}
            </span>
          </button>
        )}

        {/* Inline Chat Panel for Builder - Using shared component */}
        {showChat && (
          <FormChatPanel
            formId={formData.id}
            isOpen={true}
            onClose={() => setShowChat(false)}
            onFormUpdated={handleFormUpdatedFromChat}
            position="right"
            width={400}
            mode="builder"
            accentColor={resolvedAccent}
            inline={true}
          />
        )}

        {/* Form Edit Area */}
          <div style={{
          flex: 1,
          minHeight: 0, // Critical for flex children to enable scroll
          overflow: 'auto',
          padding: '0',
          background: resolvedBackground,
            display: 'flex',
            flexDirection: 'column',
          position: 'relative'
          }}>
          {/* Form Title & Description - Sticky at top */}
            <div style={{
            position: 'sticky',
            top: 0,
            background: resolvedBackground,
            zIndex: 5,
            padding: '40px 24px 24px 64px',
            borderBottom: `1px solid ${brandTokens.border}`,
            marginBottom: '24px'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              width: '100%'
            }}>
              <InlineEditableText
                value={formData.title || t.untitledForm}
                onChange={handleTitleUpdate}
                placeholder="Form title"
                isTitle={true}
                 boldTextColor={resolvedBoldText}
               style={{
                   fontSize: '32px',
                   fontWeight: '700',
                   color: resolvedText,
                  lineHeight: '1.2',
                  marginBottom: '8px',
                  display: 'block'
                }}
              />
              {formData.description && (
                <InlineEditableText
                  value={formData.description}
                  onChange={handleDescriptionUpdate}
                  placeholder={t.addDescription}
                  multiline={true}
                   boldTextColor={resolvedBoldText}
                   style={{
                     fontSize: '16px',
                     color: resolvedText,
                     opacity: 0.7,
                    lineHeight: '1.5'
                  }}
                />
              )}
              {!formData.description && (
                <div
              onClick={() => {
                    // Add description on click
                    const newDesc = prompt('Add form description:') || '';
                    if (newDesc) {
                      handleDescriptionUpdate(newDesc);
                    }
                  }}
              style={{
                    fontSize: '16px',
                    color: resolvedText,
                    opacity: 0.4,
                    lineHeight: '1.5',
                    cursor: 'pointer',
                    fontStyle: 'italic'
                  }}
                >
                  {t.addDescription}
                </div>
              )}
          </div>
        </div>

          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '0 24px 100px 64px',
            position: 'relative'
          }}>
          {isGenerating && (!formData.questions || formData.questions.length === 0) ? (
            <LoadingAnimation />
          ) : formData.questions && formData.questions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {formData.questions
                .filter((q: any) => visibleQuestionIds.has(q.id))
                .sort((a: any, b: any) => a.question_order - b.question_order)
                .map((question: any, index: number) => (
                  <React.Fragment key={question.id}>
                    <div
                      style={{
                        padding: '48px 0',
                        borderBottom: index < formData.questions.length - 1 ? `1px solid ${questionColors[question.id]?.border || '#e5e7eb'}` : 'none',
                        position: 'relative',
                        background: questionColors[question.id]?.background || 'transparent',
                        borderRadius: questionColors[question.id]?.background ? '8px' : '0',
                        paddingLeft: questionColors[question.id]?.background ? '24px' : '0',
                        paddingRight: questionColors[question.id]?.background ? '24px' : '0',
                        paddingTop: questionColors[question.id]?.background ? '32px' : '48px',
                        paddingBottom: questionColors[question.id]?.background ? '32px' : '48px'
                      }}
                      onMouseEnter={() => setHoveredQuestion(question.id)}
                      onMouseLeave={() => setHoveredQuestion(null)}
                    >
                      {/* Side Add Button */}
                      <SideAddButton
                        onAdd={() => {
                          setInsertAtIndex(index);
                          setShowComponentPicker(true);
                        }}
                        disabled={isGenerating}
                        position="right"
                      />
                    {/* Question Content - Inline Editable */}
                    <div style={{ marginBottom: '16px' }}>
                      <InlineEditableText
                        value={question.question_text}
                        onChange={(value) => handleInlineQuestionUpdate(question.id, 'question_text', value)}
                        placeholder={t.enterQuestionText}
                        isTitle={true}
                        boldTextColor={resolvedBoldText}
                        style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: questionColors[question.id]?.color || resolvedText,
                          marginBottom: '8px',
                          lineHeight: '1.4'
                        }}
                      />
                      
                      <InlineEditableText
                        value={question.description || ''}
                        onChange={(value) => handleInlineQuestionUpdate(question.id, 'description', value)}
                        placeholder={t.enterDescription}
                        isDescription={true}
                        multiline={true}
                        boldTextColor={resolvedBoldText}
                          style={{
                            fontSize: '14px',
                          color: questionColors[question.id]?.color ? `${questionColors[question.id].color}CC` : '#6b7280',
                            lineHeight: '1.5'
                          }}
                      />
                    </div>

                    {/* Editable Options for choice-based questions */}
                    {['multiple_choice', 'checkboxes', 'dropdown', 'multi_select'].includes(question.question_type) && question.settings?.choices && (
                      <div style={{ marginBottom: '16px' }}>
                        <EditableOptions
                          options={question.settings.choices}
                          onChange={(choices) => handleInlineQuestionUpdate(question.id, 'settings.choices', choices)}
                          placeholder="Option"
                        />
                      </div>
                    )}
                    
                    {/* Editable Options for ranking items */}
                    {question.question_type === 'ranking' && question.settings?.ranking_items && (
                      <div style={{ marginBottom: '16px' }}>
                        <EditableOptions
                          options={question.settings.ranking_items}
                          onChange={(items) => handleInlineQuestionUpdate(question.id, 'settings.ranking_items', items)}
                          placeholder="Item"
                        />
                      </div>
                    )}
                    
                    {/* Editable Matrix as a visual table */}
                    {question.question_type === 'matrix' && (
                      <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'separate',
                          borderSpacing: '0',
                          fontSize: '14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <thead>
                            <tr>
                              <th style={{
                                padding: '12px',
                                background: '#f9fafb',
                                borderBottom: '2px solid #e5e7eb',
                                borderRight: '2px solid #e5e7eb',
                                minWidth: '120px'
                              }}></th>
                              {(question.settings?.columns || ['Column 1', 'Column 2', 'Column 3']).map((col: string, idx: number) => (
                                <th key={idx} style={{
                                  padding: '8px',
                                  background: '#f9fafb',
                                  borderBottom: '2px solid #e5e7eb',
                                  borderRight: idx < (question.settings?.columns || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                                  minWidth: '150px'
                                }}>
                                  <input
                                    type="text"
                                    value={col}
                                    onChange={(e) => {
                                      const newColumns = [...(question.settings?.columns || [])];
                                      newColumns[idx] = e.target.value;
                                      handleInlineQuestionUpdate(question.id, 'settings.columns', newColumns);
                                    }}
                                    placeholder="Column name"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      color: '#374151',
                                      border: '1px solid transparent',
                                      borderRadius: '4px',
                                      outline: 'none',
                                      background: 'transparent',
                                      textAlign: 'center'
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = resolvedBoldText;
                                      e.currentTarget.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = 'transparent';
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const newColumns = (question.settings?.columns || []).filter((_: string, i: number) => i !== idx);
                                      if (newColumns.length > 0) {
                                        handleInlineQuestionUpdate(question.id, 'settings.columns', newColumns);
                                      }
                                    }}
                                    style={{
                                      marginTop: '4px',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      color: '#ef4444',
                                      background: 'transparent',
                                      border: '1px solid #fee2e2',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    {t.remove}
                                  </button>
                                </th>
                              ))}
                              <th style={{
                                padding: '8px',
                                background: '#f9fafb',
                                borderBottom: '2px solid #e5e7eb',
                                width: '60px',
                                textAlign: 'center'
                              }}>
                                <button
                                  onClick={() => {
                                    const newColumns = [...(question.settings?.columns || []), `Column ${(question.settings?.columns || []).length + 1}`];
                                    handleInlineQuestionUpdate(question.id, 'settings.columns', newColumns);
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: resolvedBoldText,
                                    background: 'transparent',
                                    border: `1px dashed ${resolvedBoldText}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = withAlpha(resolvedBoldText, 0.12)}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  + Col
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(question.settings?.rows || ['Row 1', 'Row 2']).map((row: string, rowIdx: number) => (
                              <tr key={rowIdx}>
                                <td style={{
                                  padding: '8px 12px',
                                  background: '#f9fafb',
                                  borderRight: '2px solid #e5e7eb',
                                  borderBottom: rowIdx < (question.settings?.rows || []).length - 1 ? '1px solid #e5e7eb' : 'none'
                                }}>
                                  <input
                                    type="text"
                                    value={row}
                                    onChange={(e) => {
                                      const newRows = [...(question.settings?.rows || [])];
                                      newRows[rowIdx] = e.target.value;
                                      handleInlineQuestionUpdate(question.id, 'settings.rows', newRows);
                                    }}
                                    placeholder="Row name"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      color: '#374151',
                                      border: '1px solid transparent',
                                      borderRadius: '4px',
                                      outline: 'none',
                                      background: 'transparent'
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = resolvedBoldText;
                                      e.currentTarget.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = 'transparent';
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const newRows = (question.settings?.rows || []).filter((_: string, i: number) => i !== rowIdx);
                                      if (newRows.length > 0) {
                                        handleInlineQuestionUpdate(question.id, 'settings.rows', newRows);
                                      }
                                    }}
                                    style={{
                                      marginTop: '4px',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      color: '#ef4444',
                                      background: 'transparent',
                                      border: '1px solid #fee2e2',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    {t.remove}
                                  </button>
                                </td>
                                {(question.settings?.columns || []).map((_: string, colIdx: number) => (
                                  <td key={colIdx} style={{
                                    padding: '12px',
                                    borderRight: colIdx < (question.settings?.columns || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                                    borderBottom: rowIdx < (question.settings?.rows || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                                    textAlign: 'center',
                                    background: '#ffffff'
                                  }}>
                                    <input
                                      type="radio"
                                      disabled
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        accentColor: resolvedBoldText,
                                        cursor: 'not-allowed'
                                      }}
                                    />
                                  </td>
                                ))}
                                <td style={{
                                  padding: '8px',
                                  borderBottom: rowIdx < (question.settings?.rows || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                                  textAlign: 'center',
                                  background: '#ffffff'
                                }}></td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={(question.settings?.columns || []).length + 2} style={{
                                padding: '8px',
                                textAlign: 'center',
                                background: '#f9fafb'
                              }}>
                                <button
                                  onClick={() => {
                                    const newRows = [...(question.settings?.rows || []), `Row ${(question.settings?.rows || []).length + 1}`];
                                    handleInlineQuestionUpdate(question.id, 'settings.rows', newRows);
                                  }}
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: resolvedBoldText,
                                    background: 'transparent',
                                    border: `1px dashed ${resolvedBoldText}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = withAlpha(resolvedBoldText, 0.12)}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  {t.addRow}
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Editable Settings for linear scale */}
                    {question.question_type === 'linear_scale' && (
                      <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                              {t.minValue}
                            </div>
                            <input
                              type="number"
                              value={question.settings?.min_value ?? ''}
                              onChange={(e) => {
                                // Allow temporary empty value while editing
                                const val = e.target.value;
                                if (val === '') {
                                  // Store empty temporarily to allow user to clear field
                                  const updatedQuestions = formData.questions.map((q: any) => {
                                    if (q.id === question.id) {
                                      return { ...q, settings: { ...q.settings, min_value: '' } };
                                    }
                                    return q;
                                  });
                                  setFormData({ ...formData, questions: updatedQuestions });
                                } else {
                                  const numVal = parseInt(val);
                                  if (!isNaN(numVal)) {
                                    handleInlineQuestionUpdate(question.id, 'settings.min_value', numVal);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Restore to default if empty on blur
                                if (e.target.value === '' || e.target.value === null) {
                                  handleInlineQuestionUpdate(question.id, 'settings.min_value', 1);
                                }
                                e.currentTarget.style.borderColor = '#e5e7eb';
                              }}
                          style={{
                                width: '100%',
                                padding: '8px 12px',
                            fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = resolvedBoldText}
                              placeholder="1"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                              {t.maxValue}
                            </div>
                            <input
                              type="number"
                              value={question.settings?.max_value ?? ''}
                              onChange={(e) => {
                                // Allow temporary empty value while editing
                                const val = e.target.value;
                                if (val === '') {
                                  // Store empty temporarily to allow user to clear field
                                  const updatedQuestions = formData.questions.map((q: any) => {
                                    if (q.id === question.id) {
                                      return { ...q, settings: { ...q.settings, max_value: '' } };
                                    }
                                    return q;
                                  });
                                  setFormData({ ...formData, questions: updatedQuestions });
                                } else {
                                  const numVal = parseInt(val);
                                  if (!isNaN(numVal)) {
                                    handleInlineQuestionUpdate(question.id, 'settings.max_value', numVal);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Restore to default if empty on blur
                                if (e.target.value === '' || e.target.value === null) {
                                  handleInlineQuestionUpdate(question.id, 'settings.max_value', 5);
                                }
                                e.currentTarget.style.borderColor = '#e5e7eb';
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = resolvedBoldText}
                              placeholder="5"
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                              {t.minLabel}
                            </div>
                            <input
                              type="text"
                              value={question.settings?.scale_min_label || ''}
                              onChange={(e) => handleInlineQuestionUpdate(question.id, 'settings.scale_min_label', e.target.value)}
                              placeholder="e.g., Low"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = resolvedBoldText}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                              {t.maxLabel}
                            </div>
                            <input
                              type="text"
                              value={question.settings?.scale_max_label || ''}
                              onChange={(e) => handleInlineQuestionUpdate(question.id, 'settings.scale_max_label', e.target.value)}
                              placeholder="e.g., High"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = resolvedBoldText}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple input preview for non-choice questions */}
                    {!['multiple_choice', 'checkboxes', 'dropdown', 'multi_select', 'ranking', 'matrix'].includes(question.question_type) && (
                      <div style={{ marginTop: '8px' }}>
                        {question.question_type === 'short_answer' && (
                          <input
                            type="text"
                            placeholder="حقل بيانات قصير"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'long_answer' && (
                          <textarea
                            placeholder="حقل بيانات طويل"
                            disabled
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '12px',
                              fontSize: '15px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af',
                              resize: 'none'
                            }}
                          />
                        )}
                        {question.question_type === 'number' && (
                          <input
                            type="number"
                            placeholder="0"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'email' && (
                          <input
                            type="email"
                            placeholder="email@example.com"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'phone' && (
                          <input
                            type="tel"
                            placeholder="(123) 456-7890"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'link' && (
                          <input
                            type="url"
                            placeholder="https://example.com"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'date' && (
                          <input
                            type="date"
                            disabled
                            style={{
                              width: '200px',
                              padding: '12px 16px',
                              fontSize: '15px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'time' && (
                          <input
                            type="time"
                            disabled
                            style={{
                              width: '150px',
                              padding: '12px 16px',
                              fontSize: '15px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'file_upload' && (
                          <button
                            disabled
                            style={{
                              padding: '12px 24px',
                              fontSize: '15px',
                              fontWeight: '500',
                              color: '#9ca3af',
                              background: 'transparent',
                              border: '1px dashed #d1d5db',
                              borderRadius: '8px',
                              cursor: 'not-allowed'
                            }}
                          >
                            Choose File
                          </button>
                      )}
                        {question.question_type === 'rating' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} style={{ fontSize: '24px', color: '#d1d5db' }}>★</span>
                            ))}
                    </div>
                        )}
                        {question.question_type === 'linear_scale' && (() => {
                          const minVal = question.settings?.min_value || 1;
                          const maxVal = question.settings?.max_value || 5;
                          const range = maxVal - minVal + 1;
                          const useSlider = range > 10;
                          
                          return useSlider ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                              <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '30px' }}>{minVal}</span>
                              <input
                                type="range"
                                min={minVal}
                                max={maxVal}
                                disabled
                                style={{
                                  flex: 1,
                                  height: '6px',
                                  borderRadius: '3px',
                                  background: '#e5e7eb',
                                  cursor: 'not-allowed',
                                  accentColor: resolvedBoldText
                                }}
                              />
                              <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '30px', textAlign: 'right' }}>{maxVal}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {[...Array(range)].map((_, i) => (
                                <span
                                  key={i}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#9ca3af'
                                  }}
                                >
                                  {minVal + i}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                        {question.question_type === 'signature' && (
                          <div
                            style={{
                              width: '100%',
                              height: '120px',
                              border: '1px dashed #d1d5db',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                              fontSize: '14px'
                            }}
                          >
                            {t.signatureArea}
                          </div>
                        )}
                        {question.question_type === 'payment' && (
                          <div
                            style={{
                              padding: '16px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#9ca3af',
                              fontSize: '14px'
                            }}
                          >
                            {t.payment}: ${question.settings?.payment_amount || '0.00'}
                          </div>
                        )}
                        {question.question_type === 'matrix' && (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '14px'
                            }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }}></th>
                                  {(question.settings?.columns || ['Column 1', 'Column 2', 'Column 3']).map((col: string, idx: number) => (
                                    <th key={idx} style={{ padding: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontWeight: '500' }}>
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(question.settings?.rows || ['Row 1', 'Row 2']).map((row: string, rowIdx: number) => (
                                  <tr key={rowIdx}>
                                    <td style={{ padding: '8px', border: '1px solid #e5e7eb', color: '#6b7280', fontWeight: '500' }}>
                                      {row}
                                    </td>
                                    {(question.settings?.columns || ['Column 1', 'Column 2', 'Column 3']).map((_: string, colIdx: number) => (
                                      <td key={colIdx} style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                        <input
                                          type="radio"
                                          disabled
                                          style={{
                                            width: '16px',
                                            height: '16px',
                                            accentColor: resolvedBoldText,
                                            cursor: 'not-allowed'
                                          }}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {question.question_type === 'ranking' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(question.settings?.ranking_items || ['Item 1', 'Item 2', 'Item 3']).map((item: string, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: '#ffffff'
                                }}
                              >
                                <span style={{
                                  minWidth: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: resolvedBoldText,
                                  background: withAlpha(resolvedBoldText, 0.12),
                                  borderRadius: '4px'
                                }}>
                                  {idx + 1}
                                </span>
                                <span style={{
                                  flex: 1,
                                  fontSize: '15px',
                                  color: '#6b7280'
                                }}>
                                  {item}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    disabled
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '16px',
                                      color: '#d1d5db',
                                      background: 'transparent',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '4px',
                                      cursor: 'not-allowed'
                                    }}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    disabled
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '16px',
                                      color: '#d1d5db',
                                      background: 'transparent',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '4px',
                                      cursor: 'not-allowed'
                                    }}
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Per-Component Controls (visible on hover) */}
                    {hoveredQuestion === question.id && (
                      <div style={{
                        position: 'absolute',
                        top: '48px',
                        right: '0',
                        display: 'flex',
                        gap: '8px',
                        background: '#ffffff',
                        padding: '8px',
                        borderRadius: '12px',
                        boxShadow: '0 12px 28px rgba(74, 69, 64, 0.12)',
                        border: `1px solid ${brandTokens.border}`
                      }}>
                        {/* AI Edit Button */}
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowQuestionEditor(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: resolvedBoldText,
                            background: brandTokens.warningSoft,
                            border: `1px solid ${withAlpha(brandTokens.warning, 0.35)}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '500'
                          }}
                          title="Edit with AI"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="14 2 18 6 7 17 3 17 3 13 14 2" />
                          </svg>
                          Edit
                        </button>

                        {/* Condition Button */}
                        <button
                          onClick={() => {
                            setConditionForQuestion(question);
                            setShowConditionModal(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#6b7280',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title={t.add}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="2" x2="12" y2="6" />
                            <line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" />
                            <line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                        </button>

                        {/* Color Picker Button */}
                        <button
                          onClick={() => {
                            setColorPickerForQuestion(question.id);
                            setShowQuestionColorPicker(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#6b7280',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Customize color"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#dc2626',
                            background: '#ffffff',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Delete question"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                ))}

                {/* Side Add Button After Last Question */}
                {formData.questions && formData.questions.length > 0 && (
                <div style={{
                    position: 'relative',
                    padding: '48px 0',
                    marginTop: '24px'
                }}>
                    <SideAddButton
                      onAdd={() => {
                        setInsertAtIndex(null);
                        setShowComponentPicker(true);
                      }}
                    disabled={isGenerating}
                      position="right"
                  />
                </div>
                )}

              {/* Submit Button Preview */}
              <div style={{ marginTop: '48px', marginBottom: '40px' }}>
                <button
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: globalColors.boldText || globalColors.accent,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {formData.settings?.submit_button_text || 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#6b7280'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <span style={{ fontSize: '32px', color: '#d1d5db' }}>+</span>
              </div>
              <p style={{ marginBottom: '20px', fontSize: '15px' }}>لا توجد أسئلة حتى الآن. ابدأ بإنشاء نموذجك.</p>
              <button
                onClick={() => {
                  setInsertAtIndex(null);
                  setShowComponentPicker(true);
                }}
                disabled={isGenerating}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#ffffff',
                  background: `linear-gradient(135deg, ${resolvedAccent} 0%, ${brandTokens.primary} 100%)`,
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1,
                  boxShadow: '0 12px 24px rgba(74, 69, 64, 0.14)'
                }}
              >
                {t.addComponent}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Publish Popup */}
      {showPublishPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(47, 41, 36, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fbf8f4 100%)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            border: `1px solid ${brandTokens.border}`,
            boxShadow: '0 28px 64px rgba(47, 41, 36, 0.22)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: brandTokens.text,
              marginBottom: '8px'
            }}>
              {t.publishSuccess}
            </h3>
            <p style={{
              fontSize: '14px',
              color: brandTokens.textSoft,
              marginBottom: '20px'
            }}>
              {t.publishDescription}
            </p>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                value={publishLink}
                readOnly
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  border: `1px solid ${brandTokens.border}`,
                  borderRadius: '12px',
                  background: brandTokens.surfaceAlt,
                  color: brandTokens.text
                }}
              />
              <button
                onClick={copyPublishLink}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff',
                  background: `linear-gradient(135deg, ${resolvedAccent} 0%, ${brandTokens.primary} 100%)`,
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 12px 24px rgba(74, 69, 64, 0.14)'
                }}
              >
                {t.copyLink}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => window.open(`${publishLink}?review=true`, '_blank')}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: brandTokens.text,
                  background: brandTokens.surfaceAlt,
                  border: `1px solid ${brandTokens.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                {t.preview}
              </button>
              <button
                onClick={() => setShowPublishPopup(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: brandTokens.textSoft,
                  background: brandTokens.surfaceAlt,
                  border: `1px solid ${brandTokens.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Condition Modal */}
      {showConditionModal && conditionForQuestion && (
        <ConditionModal
          isOpen={showConditionModal}
          onClose={() => {
            setShowConditionModal(false);
            setConditionForQuestion(null);
          }}
          question={conditionForQuestion}
          formQuestions={formData.questions || []}
          onSave={handleSaveCondition}
        />
      )}

      {/* Question Color Picker */}
      {colorPickerForQuestion !== null && (
        <QuestionColorPicker
          questionId={colorPickerForQuestion}
          colors={questionColors[colorPickerForQuestion] || {}}
          onChange={handleQuestionColorChange}
          isOpen={showQuestionColorPicker}
          onClose={() => {
            setShowQuestionColorPicker(false);
            setColorPickerForQuestion(null);
          }}
        />
      )}

      {/* Question Editor Modal */}
      {selectedQuestion && (
        <QuestionEditor
          question={selectedQuestion}
          isOpen={showQuestionEditor}
          onClose={() => {
            setShowQuestionEditor(false);
            setSelectedQuestion(null);
          }}
          onSave={handleSaveQuestion}
          onRegenerate={handleRegenerateQuestion}
        />
      )}

      {/* Component Picker Modal */}
      <ComponentPicker
        isOpen={showComponentPicker}
        onClose={() => {
          setShowComponentPicker(false);
          setInsertAtIndex(null);
        }}
        onSelect={(questionType, customization) => {
          handleAddQuestion(questionType, insertAtIndex, customization);
        }}
        onGenerate={async (prompt) => {
          // Use the chat API to generate the component
          setShowComponentPicker(false);
          setIsGenerating(true);
          
          try {
            const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/chat`, {
              method: 'POST',
              headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
              credentials: 'include',
              body: JSON.stringify({ message: prompt })
            });
            
            if (!response.ok) throw new Error('Failed to generate component');
            
            // Refresh form data
            const formResponse = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
              headers: getAuthHeaders(),
              credentials: 'include'
            });
            
            if (formResponse.ok) {
              const updatedForm = await formResponse.json();
              setFormData(updatedForm);
            }
          } catch (err) {
            console.error('Generate error:', err);
          } finally {
            setIsGenerating(false);
          }
        }}
      />

      {/* Streaming cursor animation */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
