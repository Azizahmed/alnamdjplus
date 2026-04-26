import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import { brandTokens, normalizeThemeColor } from '../theme/brand';

interface Form {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  settings?: {
    background_color?: string;
    text_color?: string;
    accent_color?: string;
    bold_text_color?: string;
  };
}

export const Sidebar: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, setSidebarOpen } = useSidebar();
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredForm, setHoveredForm] = useState<string | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadForms();
    }
  }, [user]);

  const loadForms = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const { data } = await api.forms.list(user!.id);
      if (data) {
        setForms(data);
      }
    } catch (err) {
      console.error('Failed to load forms:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (!refreshing) {
      loadForms(true);
    }
  };

  const isFormActive = (formId: string) => {
    return location.pathname.includes(`/forms/${formId}`);
  };

  const getFormAccent = (form: Form) => normalizeThemeColor(
    form.settings?.bold_text_color || form.settings?.accent_color,
    'bold',
    brandTokens.accent
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return t.minutesAgo.replace('{count}', String(diffMins));
    if (diffHours < 24) return t.hoursAgo.replace('{count}', String(diffHours));
    if (diffDays < 7) return t.daysAgo.replace('{count}', String(diffDays));
    return date.toLocaleDateString('ar', { month: 'short', day: 'numeric' });
  };

  const handleDeleteForm = async (formId: string, formTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(t.confirmDelete.replace('{title}', formTitle))) {
      return;
    }

    setDeletingFormId(formId);
    try {
      const { error } = await api.forms.delete(formId);
      if (!error) {
        setForms(forms.filter(f => f.id !== formId));
      }
    } catch (error) {
      console.error('Failed to delete form:', error);
    } finally {
      setDeletingFormId(null);
    }
  };

  const handleFormClick = (formId: string) => {
    navigate(`/forms/${formId}/responses`);
  };

  const handleEditForm = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSidebarOpen(false);
    navigate('/build', { state: { formId } });
  };

  const handleCreateForm = () => {
    setSidebarOpen(false);
    navigate('/build', { state: { createNew: Date.now() } });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">{t.myForms}</h3>
        <button
          onClick={handleRefresh}
          className={`sidebar-refresh-btn ${refreshing ? 'spinning' : ''}`}
          disabled={refreshing}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      <div className="sidebar-content">
        {loading ? (
          <div className="sidebar-loading">
            <div className="loading-spinner" style={{ width: 24, height: 24 }} />
          </div>
        ) : forms.length === 0 ? (
          <div className="sidebar-empty">
            <p>{t.noForms}</p>
            <button onClick={handleCreateForm} className="sidebar-create-btn">
              {t.createFirstForm}
            </button>
          </div>
        ) : (
          <div className="sidebar-forms-list">
            {forms.map(form => (
              <div
                key={form.id}
                className={`sidebar-form-item ${isFormActive(form.id) ? 'active' : ''}`}
                onClick={() => handleFormClick(form.id)}
                onMouseEnter={() => setHoveredForm(form.id)}
                onMouseLeave={() => setHoveredForm(null)}
              >
                <div className="sidebar-form-color" style={{ backgroundColor: getFormAccent(form) }} />
                <div className="sidebar-form-info">
                  <div className="sidebar-form-title">{form.title}</div>
                  <div className="sidebar-form-date">{formatDate(form.updated_at)}</div>
                </div>
                {hoveredForm === form.id && (
                  <div className="sidebar-form-actions">
                    <button
                      onClick={(e) => handleEditForm(form.id, e)}
                      className="sidebar-action-btn sidebar-edit-btn"
                      title="تعديل النموذج"
                      aria-label="تعديل النموذج"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteForm(form.id, form.title, e)}
                      className="sidebar-action-btn sidebar-delete-btn"
                      disabled={deletingFormId === form.id}
                      title="حذف النموذج"
                      aria-label="حذف النموذج"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button onClick={handleCreateForm} className="sidebar-new-form-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t.newForm}
        </button>
      </div>
    </div>
  );
};
