import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FormChatPanel } from '../components/FormChatPanel';
import { useSidebar } from '../contexts/SidebarContext';

interface Response {
  id: number;
  submitted_at: string;
  status: string;
  ip_address?: string;
  country?: string;
  answers: Array<{
    question_id: number;
    question_text: string;
    answer_value: any;
  }>;
}

interface FormData {
  id: number;
  title: string;
  questions: Array<{
    id: number;
    question_text: string;
    question_type: string;
  }>;
}

export const FormResponsesNew: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { setSidebarOpen } = useSidebar();
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'complete' | 'partial'>('all');
  const [showChat, setShowChat] = useState(false);
  
  const ITEMS_PER_PAGE = 50;

  // Handler to open chat and close sidebar
  const handleOpenChat = () => {
    setSidebarOpen(false);
    setShowChat(true);
  };

  useEffect(() => {
    loadForm();
  }, [formId]);

  useEffect(() => {
    if (formData) {
      loadResponses();
    }
  }, [formId, currentPage, formData]);

  const loadForm = async () => {
    try {
      const { data, error } = await api.forms.get(formId!);
      if (error) throw new Error('Failed to load form');
      if (data) {
        setFormData(data);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.responses.list(formId!);
      if (error) throw new Error('Failed to load responses');
      
      const sortedResponses = (data || []).sort((a: Response, b: Response) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
      
      setResponses(sortedResponses);
      setTotalCount(sortedResponses.length);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const result = await api.responses.export(formId!, format);
      if (!result) throw new Error('Export failed');
      
      const blob = new Blob([result], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${formId}_responses.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export: ' + err.message);
    }
  };

  // Helper to truncate text at 100 characters
  const truncateText = (text: string, maxLength: number = 100): React.ReactNode => {
    if (text.length <= maxLength) return text;
    return (
      <span title={text}>
        {text.substring(0, maxLength)}...
      </span>
    );
  };

  const formatAnswer = (value: any): React.ReactNode => {
    if (!value) return '-';
    
    if (value.files && Array.isArray(value.files)) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {value.files.map((file: any, idx: number) => {
            const label = file?.filename || file?.original_filename || file?.s3_key || `File ${idx + 1}`;
            if (file?.download_url || file?.s3_url || file?.url) {
              const downloadUrl = file?.download_url || file?.s3_url || file?.url;
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(downloadUrl, '_blank');
                  }}
                  title={`Download ${label}`}
                  style={{
                    padding: '6px 12px',
                    background: '#0E7C86',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                    boxShadow: '0 1px 3px rgba(14,124,134,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#123A3F';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(14,124,134,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0E7C86';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(14,124,134,0.3)';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  {label.length > 15 ? label.substring(0, 15) + '...' : label}
                </button>
              );
            }
            return (
              <span key={idx} style={{ fontSize: '13px', color: '#6b7280' }}>
                {label}
              </span>
            );
          })}
        </div>
      );
    }

    if (value.text) return truncateText(String(value.text));
    if (value.file_url || value.s3_url || value.url) {
      const downloadUrl = value.file_url || value.s3_url || value.url;
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(downloadUrl, '_blank');
          }}
          title="Download file"
          style={{
            padding: '6px 12px',
            background: '#0E7C86',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s',
            boxShadow: '0 1px 3px rgba(14,124,134,0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#123A3F';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(14,124,134,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0E7C86';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(14,124,134,0.3)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Download File
        </button>
      );
    }
    if (value.number !== undefined && value.number !== null) return value.number.toString();
    if (value.choices) {
      const choicesText = Array.isArray(value.choices) ? value.choices.join(', ') : String(value.choices);
      return truncateText(choicesText);
    }
    if (value.date) return value.date;
    if (value.rating) return `${'⭐'.repeat(Math.min(value.rating, 5))}`;
    if (value.matrix_answers) {
      const matrixText = Object.entries(value.matrix_answers)
        .map(([row, col]) => `${row}: ${col}`)
        .join('; ');
      return truncateText(matrixText);
    }
    if (value.ranked_items && Array.isArray(value.ranked_items)) {
      const rankedText = value.ranked_items.join(' → ');
      return truncateText(rankedText);
    }
    if (value.wallet_address) return truncateText(String(value.wallet_address));
    
    // Handle null/undefined values
    if (value === null || value === undefined) return '-';
    
    // Fallback for other types
    const fallbackText = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return truncateText(fallbackText);
  };

  // Filter responses by status
  const filteredResponses = responses.filter(response => {
    if (activeTab === 'all') return true;
    if (activeTab === 'complete') return response.status === 'complete';
    if (activeTab === 'partial') return response.status === 'partial' || response.status === 'in_progress';
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResponses = filteredResponses.slice(startIndex, endIndex);

  const emptyStateCopy = {
    all: {
      title: 'لا توجد ردود بعد',
      description: 'انشر النموذج لبدء جمع الردود'
    },
    complete: {
      title: 'لا توجد ردود مكتملة',
      description: 'لا توجد ردود مكتملة لهذا النموذج'
    },
    partial: {
      title: 'لا توجد ردود جزئية',
      description: 'لا توجد ردود جزئية لهذا النموذج'
    }
  }[activeTab];

  if (loading && !formData) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #0E7C86',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            background: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: '500', marginBottom: '24px' }}>
            {error}
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 28px',
              background: '#0E7C86',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'transform 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      overflow: 'hidden',
      background: '#fafafa',
      minHeight: 0,
      direction: 'ltr'
    }}>
      {/* Collapsed Chat Toggle */}
      {!showChat && (
        <button
          onClick={handleOpenChat}
          style={{
            width: '44px',
            background: 'linear-gradient(180deg, #E7F5F4 0%, #ffffff 100%)',
            border: 'none',
            borderInlineEnd: '1px solid #e5e7eb',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px 0',
            transition: 'all 0.15s',
            flexShrink: 0
          }}
          title="فتح مساعد النموذج"
          onMouseEnter={(e) => e.currentTarget.style.background = '#E7F5F4'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(180deg, #E7F5F4 0%, #ffffff 100%)'}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#0E7C86',
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
            color: '#0E7C86',
            letterSpacing: '0.05em'
          }}>
            المساعد
          </span>
        </button>
      )}

      {/* Inline Chat Panel */}
      {showChat && (
        <FormChatPanel
          formId={parseInt(formId || '0')}
          isOpen={true}
          onClose={() => setShowChat(false)}
          mode="responses"
          position="left"
          accentColor="#0E7C86"
          inline={true}
          width={400}
        />
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        minHeight: 0, // Critical for flex children to enable scroll
        overflowY: 'auto',
        padding: '24px',
        direction: 'rtl'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            direction: 'ltr'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', direction: 'ltr' }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div style={{ direction: 'rtl', textAlign: 'right' }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.02em'
                }}>
                  الردود
                </h1>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {formData?.title}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                padding: '10px 16px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {totalCount} ردود
              </div>
              
              <button
              onClick={() => handleExport('csv')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                background: '#0E7C86',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#123A3F';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0E7C86';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ↓ تصدير ملف إكسل
            </button>
            <button
              onClick={() => handleExport('json')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                background: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ↓ تصدير ملف جيسون
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '8px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'inline-flex',
          gap: '4px'
        }}>
          {[
            { key: 'all' as const, label: 'الكل', count: responses.length },
            { key: 'complete' as const, label: 'مكتملة', count: responses.filter(r => r.status === 'complete').length },
            { key: 'partial' as const, label: 'جزئية', count: responses.filter(r => r.status === 'partial' || r.status === 'in_progress').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === tab.key ? '#0E7C86' : '#6b7280',
                background: activeTab === tab.key ? '#E7F5F4' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tab.label}
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                background: activeTab === tab.key ? '#0E7C86' : '#e5e7eb',
                color: activeTab === tab.key ? 'white' : '#6b7280'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {filteredResponses.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '80px 40px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              opacity: 0.5
            }}>
              📝
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {emptyStateCopy.title}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {emptyStateCopy.description}
            </p>
          </div>
        ) : (
          <>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #e5e7eb'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{
                    background: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      background: '#f9fafb',
                      zIndex: 10,
                      borderInlineStart: '1px solid #e5e7eb'
                    }}>
                      تاريخ الإرسال
                    </th>
                    {formData?.questions.map((question) => (
                      <th
                        key={question.id}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '12px',
                          minWidth: '200px',
                          maxWidth: '300px',
                          whiteSpace: 'normal',
                          lineHeight: '1.4'
                        }}
                      >
                        {question.question_text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedResponses.map((response, idx) => (
                    <tr
                      key={response.id}
                      style={{
                        background: idx % 2 === 0 ? 'white' : '#fafafa',
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafafa'}
                    >
                      <td style={{
                        padding: '12px 16px',
                        fontWeight: '500',
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        left: 0,
                        background: 'inherit',
                        zIndex: 5,
                        borderInlineStart: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {activeTab === 'all' && response.status !== 'complete' && (
                            <span
                              title="رد جزئي"
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#f59e0b',
                                display: 'inline-block'
                              }}
                            />
                          )}
                          <span>
                            {new Date(response.submitted_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {' '}
                            {new Date(response.submitted_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      {formData?.questions.map((question) => {
                        const answer = response.answers.find((a) => a.question_id === question.id);
                        return (
                          <td
                            key={question.id}
                            style={{
                              padding: '12px 16px',
                              color: '#374151',
                              verticalAlign: 'top',
                              maxWidth: '300px',
                              overflow: 'hidden'
                            }}
                          >
                            {answer ? formatAnswer(answer.answer_value) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                padding: '20px 24px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  عرض {startIndex + 1}-{Math.min(endIndex, filteredResponses.length)} من {filteredResponses.length}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentPage === 1 ? '#d1d5db' : '#374151',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.borderColor = '#0E7C86';
                        e.currentTarget.style.color = '#0E7C86';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                  >
                    السابق
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            width: '40px',
                            height: '40px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: currentPage === pageNum ? 'white' : '#374151',
                            background: currentPage === pageNum ? '#0E7C86' : 'white',
                            border: '1px solid',
                            borderColor: currentPage === pageNum ? '#0E7C86' : '#e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            if (currentPage !== pageNum) {
                              e.currentTarget.style.borderColor = '#0E7C86';
                              e.currentTarget.style.color = '#0E7C86';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentPage !== pageNum) {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.color = '#374151';
                            }
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentPage === totalPages ? '#d1d5db' : '#374151',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.borderColor = '#0E7C86';
                        e.currentTarget.style.color = '#0E7C86';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSelectedResponse(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.01em'
                }}>
                  الرد #{selectedResponse.id}
                </h2>
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {new Date(selectedResponse.submitted_at).toLocaleString()}
                  {selectedResponse.country && ` • ${selectedResponse.country}`}
                </div>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                style={{
                  width: '40px',
                  height: '40px',
                  fontSize: '24px',
                  color: '#6b7280',
                  background: '#f9fafb',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {selectedResponse.answers.map((answer, index) => (
                <div key={index} style={{
                  padding: '20px',
                  background: '#fafafa',
                  borderRadius: '12px',
                  border: '1px solid #f3f4f6'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#0E7C86',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    السؤال {index + 1}
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px',
                    lineHeight: '1.5'
                  }}>
                    {answer.question_text}
                  </div>
                  <div style={{
                    padding: '14px 16px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '500',
                    border: '1px solid #e5e7eb'
                  }}>
                    {formatAnswer(answer.answer_value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
