import React, { useState } from 'react';
import { QuestionRenderer } from '../QuestionRenderer';
import { BarChart } from '../analytics/BarChart';
import { FunnelChart } from '../analytics/FunnelChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Tab = 'ai-analysis' | 'form' | 'analytics' | 'submissions';

export const InteractiveDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('ai-analysis');
  const [formData, setFormData] = useState<Record<number, any>>({});

  // Sample form questions
  const demoQuestions = [
    {
      id: 1,
      question_type: 'email',
      question_text: 'ما هو **عنوان بريدك الإلكتروني**؟',
      description: '',
      required: true,
      settings: { placeholder: 'you@example.com' }
    },
    {
      id: 2,
      question_type: 'rating',
      question_text: 'ما مدى **رضاك** عن خدمتنا؟',
      description: '',
      required: true,
      settings: { max_rating: 5, icon: 'star' }
    },
    {
      id: 3,
      question_type: 'long_answer',
      question_text: 'هل لديك **تعليقات إضافية**؟',
      description: 'شاركنا أفكارك',
      required: false,
      settings: { placeholder: 'اكتب تعليقاتك هنا...', max_length: 500 }
    }
  ];

  // Sample analytics data
  const timeSeriesData = [
    { date: 'Jan 8', views: 45, submissions: 12 },
    { date: 'Jan 9', views: 52, submissions: 18 },
    { date: 'Jan 10', views: 68, submissions: 24 },
    { date: 'Jan 11', views: 84, submissions: 31 },
    { date: 'Jan 12', views: 92, submissions: 38 },
    { date: 'Jan 13', views: 105, submissions: 45 }
  ];

  const funnelData = [
    { label: 'تم عرض النموذج', value: 105, percentage: 100 },
    { label: 'بدأ التعبئة', value: 92, percentage: 88 },
    { label: 'س1: البريد', value: 78, percentage: 74 },
    { label: 'س2: التقييم', value: 58, percentage: 55 },
    { label: 'تم الإرسال', value: 45, percentage: 43 }
  ];

  // Sample submissions
  const sampleSubmissions = [
    {
      id: 1,
      submitted_at: '2026-01-13 14:32',
      responses: {
        1: 'john@example.com',
        2: 5,
        3: 'Love the AI features!'
      }
    },
    {
      id: 2,
      submitted_at: '2026-01-13 13:18',
      responses: {
        1: 'sarah@example.com',
        2: 4,
        3: 'Great product overall'
      }
    },
    {
      id: 3,
      submitted_at: '2026-01-13 11:45',
      responses: {
        1: 'mike@example.com',
        2: 5,
        3: 'This saves me so much time!'
      }
    }
  ];

  const handleAnswerChange = (questionId: number, value: any) => {
    setFormData({ ...formData, [questionId]: value });
  };

  const tabs = [
    { id: 'ai-analysis' as Tab, label: 'تحليل الذكاء الاصطناعي' },
    { id: 'form' as Tab, label: 'معاينة النموذج' },
    { id: 'analytics' as Tab, label: 'التحليلات' },
    { id: 'submissions' as Tab, label: 'الردود' }
  ];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(74, 69, 64, 0.12)',
      border: '1px solid #e8e4e0'
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #f3f4f6',
        backgroundColor: '#fafafa'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === tab.id ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #4A4540' : '3px solid transparent',
              color: activeTab === tab.id ? '#4A4540' : '#6b7280',
              fontSize: '15px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '32px', height: '550px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'form' && (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                استبيان رضا العملاء
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                جرب ملء هذا النموذج التفاعلي - جميع المكونات تعمل بشكل كامل!
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {demoQuestions.map((question) => (
                <div key={question.id}>
                  {/* Question Label with Markdown support */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                        strong: ({ children }) => <strong style={{ color: '#4A4540' }}>{children}</strong>
                      }}
                    >
                      {question.question_text}
                    </ReactMarkdown>
                    {question.required && <span style={{ color: '#4A4540', marginInlineStart: '4px' }}>*</span>}
                  </div>

                  {/* Description with Markdown support */}
                  {question.description && (
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                          strong: ({ children }) => <strong style={{ color: '#4A4540' }}>{children}</strong>
                        }}
                      >
                        {question.description}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Question Input - using QuestionRenderer without labels */}
                  <QuestionRenderer
                    question={question}
                    value={formData[question.id]}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                    hideLabel={true}
                    accentColor="#4A4540"
                    boldTextColor="#4A4540"
                  />
                </div>
              ))}
            </div>
            <button
              style={{
                marginTop: '32px',
                padding: '14px 28px',
                background: '#4A4540',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3D3834';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4A4540';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              إرسال (تجريبي)
            </button>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                لوحة التحليلات
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                تتبع المشاهدات والردود ومعدلات التحويل في الوقت الفعلي
              </p>
            </div>

            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                padding: '16px',
                background: '#faf8f6',
                borderRadius: '12px',
                border: '1px solid #e8e4e0'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>إجمالي المشاهدات</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#4A4540' }}>105</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#faf8f6',
                borderRadius: '12px',
                border: '1px solid #e8e4e0'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>الردود</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#4A4540' }}>45</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#faf8f6',
                borderRadius: '12px',
                border: '1px solid #e8e4e0'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Completion Rate</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#4A4540' }}>43%</div>
              </div>
            </div>

            {/* Charts */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>
                Views & Submissions Over Time
              </h4>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <BarChart data={timeSeriesData} height={300} />
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>
                قمع التحويل
              </h4>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <FunnelChart stages={funnelData} height={240} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                ردود النموذج
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                عرض وإدارة جميع ردود النموذج
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      تاريخ الإرسال
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      البريد الإلكتروني
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      التقييم
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      التعليق
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sampleSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#faf8f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }}>
                        {submission.submitted_at}
                      </td>
                      <td style={{ padding: '12px', color: '#1f2937', fontWeight: '500' }}>
                        {submission.responses[1]}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          background: '#faf8f6',
                          borderRadius: '6px',
                          color: '#4A4540',
                          fontWeight: '600'
                        }}>
                          {'⭐'.repeat(submission.responses[2] as number)}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px',
                        color: '#6b7280',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {submission.responses[3] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: '#faf8f6',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              📊 عرض 3 من 45 رد
            </div>
          </div>
        )}

        {activeTab === 'ai-analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Chat Messages Container */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
              {/* User Message - White card matching assistant UI */}
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#4A4540', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  أنت
                </div>
                <div style={{ fontSize: '15px', color: '#1f2937' }}>
                  حلل ردودي
                </div>
              </div>

              {/* Assistant Message */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                background: '#ffffff'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  المساعد
                </div>

                <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
                  <p style={{ margin: '0 0 16px 0' }}>
                    إليك ملخص للردود التي قدمتها، بناءً على البيانات المجمعة:
                  </p>

                  <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '10px' }}>
                      <span style={{ color: '#4A4540', fontWeight: '500' }}>إجمالي الاستجابات</span>: بلغ عدد الاستجابات الكاملة للاستبيان 45 استجابة، مما يدل على تفاعل قوي من المشاركين.
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      <span style={{ color: '#4A4540', fontWeight: '500' }}>نسبة الإكمال</span>: أكمل 43% من المشاهدين الاستبيان، مما يعكس استجابة جيدة من إجمالي 105 مشاهدات.
                    </li>
                    <li>
                      <span style={{ color: '#4A4540', fontWeight: '500' }}>متوسط ​​التقييم</span>: 4.6 out of 5 stars, with 89% giving 4 or 5 stars.
                    </li>
                  </ul>

                  <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>
                    النتائج الرئيسية:
                  </p>

                  <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '10px' }}>
                      <span style={{ color: '#4A4540', fontWeight: '500' }}>المواضيع الشائعة في التعليقات</span>:
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '6px' }}>
                          <span style={{ color: '#4A4540', fontWeight: '500' }}>إيجابية</span>: معظم المستجيبين أشادوا بسهولة الاستخدام وميزات الذكاء الاصطناعي.
                        </li>
                        <li style={{ marginBottom: '6px' }}>
                          <span style={{ color: '#4A4540', fontWeight: '500' }}>طلبات الميزات</span>: عدة مستخدمين ذكوا رغبتهم في دعم تطبيق الجوال والمزيد من التكاملات.
                        </li>
                        <li>
                          <span style={{ color: '#4A4540', fontWeight: '500' }}>المشاكل المبلغ عنها</span>: مستخدم واحد واجه مشاكل انتهاء المهلة على الجوال وفقد التقدم.
                        </li>
                      </ul>
                    </li>
                  </ul>

                  <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>
                    ردود ملحوظة:
                  </p>

                  <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '10px' }}>
                      <span style={{ color: '#4A4540', fontWeight: '500' }}>تنبيه تقييم منخفض</span>:
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '6px' }}>
                          رد من alex.chen@company.com بتقييم <span style={{ color: '#ef4444', fontWeight: '500' }}>نجمة واحدة</span> مع التعليق: "النموذج يستمر في انتهاء المهلة على الجوال. فقدت تقدمي مرتين."
                        </li>
                        <li>
                          <span style={{ color: '#6b7280', fontStyle: 'italic' }}>توصية: فكر في تنفيذ ميزة الحفظ التلقائي لمنع فقدان البيانات.</span>
                        </li>
                      </ul>
                    </li>
                  </ul>

                  {/* Rating Distribution Chart - Same style as ResponseDataTable */}
                  <div style={{
                    marginTop: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#ffffff'
                  }}>
                    {/* Chart Header */}
                    <div style={{
                      padding: '8px 14px',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#faf8f6',
                      display: 'flex',
                      gap: '4px'
                    }}>
                      <button
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="3" y1="15" x2="21" y2="15" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                        جدول
                      </button>
                      <button
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          background: '#4A4540',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        Chart
                      </button>
                    </div>

                    {/* Chart Body */}
                    <div style={{ padding: '16px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Count by Rating
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { label: '5 نجوم', value: 22, color: '#4A4540' },
                          { label: '4 نجوم', value: 18, color: '#5A5550' },
                          { label: '3 نجوم', value: 3, color: '#9B8B7A' },
                          { label: 'نجمتان', value: 1, color: '#C5C0BC' },
                          { label: 'نجمة واحدة', value: 1, color: '#D4C5B0' }
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '70px',
                              fontSize: '13px',
                              color: '#374151',
                              fontWeight: '500',
                              textAlign: 'right'
                            }}>
                              {item.label}
                            </div>
                            <div style={{
                              flex: 1,
                              height: '28px',
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              <div style={{
                                width: `${(item.value / 22) * 100}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${item.color} 0%, #5A5550 100%)`,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: '8px',
                                minWidth: item.value > 0 ? '40px' : '0'
                              }}>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: 'white',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}>
                                  {item.value}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary stats */}
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: '#faf8f6',
                        borderRadius: '8px',
                        display: 'flex',
                        gap: '24px',
                        fontSize: '13px'
                      }}>
                        <div>
                          <span style={{ color: '#6b7280' }}>الإجمالي: </span>
                          <strong style={{ color: '#4A4540' }}>45</strong>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>المتوسط: </span>
                          <strong style={{ color: '#4A4540' }}>4.6</strong>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>الأقصى: </span>
                          <strong style={{ color: '#4A4540' }}>22</strong>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: '8px 14px',
                      borderTop: '1px solid #e5e7eb',
                      background: '#f9fafb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <span>
                        <strong style={{ color: '#4A4540' }}>5</strong> صفوف
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: '16px 0 0 0', color: '#6b7280' }}>
                    هل ترغب في تحليل جوانب محددة بمزيد من التفصيل، مثل اتجاهات توزيع التقييمات أو تصنيف التعليقات؟
                  </p>
                </div>
              </div>
            </div>

            {/* Input Box - Fixed at bottom */}
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginTop: 'auto'
            }}>
              <input
                type="text"
                placeholder="اسأل الذكاء الاصطناعي أي شيء بخصوص ردودك..."
                disabled
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white',
                  color: '#9ca3af'
                }}
              />
              <button
                disabled
                style={{
                  padding: '12px 24px',
                  background: '#D4C5B0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'not-allowed'
                }}
              >
                إرسال
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
