import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BarChart } from '../components/analytics/BarChart';
import { FunnelChart } from '../components/analytics/FunnelChart';
import { FilterPanel, AnalyticsFilters } from '../components/analytics/FilterPanel';

interface TimeSeriesData {
  time_series: Array<{ date: string; views: number; submissions: number }>;
  total_views: number;
  total_submissions: number;
}

interface FunnelData {
  total_views: number;
  total_starts: number;
  total_completes: number;
  completion_rate: number;
  question_funnel: Array<{
    question_id: number;
    question_text: string;
    question_order: number;
    viewed: number;
    answered: number;
    skipped: number;
    drop_off_rate: number;
    avg_time_spent: number;
  }>;
  traffic_sources: Record<string, { count: number; completion_rate: number }>;
  geographic_distribution: Record<string, { views: number; completes: number }>;
}

interface SummaryData {
  total_responses: number;
  completed_responses: number;
  partial_responses?: number;
  avg_completion_time_seconds?: number;
  recent_activity?: {
    last_7_days: number;
    last_24_hours: number;
  };
}

interface FormData {
  id: number;
  title: string;
  questions: Array<{ id: number; question_text: string; question_order: number }>;
}

export const FormAnalyticsNew: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30d'
  });

  useEffect(() => {
    loadForm();
  }, [formId]);

  useEffect(() => {
    if (formData) {
      loadAnalytics();
    }
  }, [formId, filters, formData]);

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

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [summaryResult, tsResult] = await Promise.all([
        api.analytics.getSummary(formId!),
        api.analytics.getTimeseries(formId!),
      ]);

      setSummary(summaryResult as SummaryData);
      setFunnel({
        total_views: (summaryResult as SummaryData).total_responses,
        total_starts: (summaryResult as SummaryData).total_responses,
        total_completes: (summaryResult as SummaryData).completed_responses,
        completion_rate: (summaryResult as SummaryData).total_responses > 0 
          ? ((summaryResult as SummaryData).completed_responses / (summaryResult as SummaryData).total_responses) * 100 : 0,
        question_funnel: [],
        traffic_sources: {},
        geographic_distribution: {}
      });
      if (tsResult.data) {
        setTimeSeries({
          time_series: tsResult.data.map((r: any) => ({
            date: r.submitted_at?.split('T')[0] || '',
            views: 0,
            submissions: r.status === 'completed' ? 1 : 0
          })),
          total_views: 0,
          total_submissions: tsResult.data.filter((r: any) => r.status === 'completed').length
        });
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && !summary) {
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
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const availableCountries = funnel ? Object.keys(funnel.geographic_distribution) : [];

  // Calculate conversion rate
  const conversionRate = funnel && funnel.total_views > 0 
    ? (funnel.total_completes / funnel.total_views) * 100 
    : 0;

  // Extract available UTM sources from funnel data
  const extractUtmSources = (funnelData: FunnelData): string[] => {
    if (!funnelData.traffic_sources) return [];
    return Object.keys(funnelData.traffic_sources).filter(source => source.toLowerCase() !== 'organic');
  };

  return (
    <div style={{
      padding: '24px',
      paddingBottom: '80px',
      background: '#fafafa',
      minHeight: '100vh',
      maxHeight: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '4px',
          letterSpacing: '-0.02em'
        }}>
          تحليل البيانات
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: '400'
        }}>
          تتبع عمليات إرسال النماذج وسلوك المستخدم
        </p>
      </div>

      {/* Filters */}
      {formData && (
        <div style={{ marginBottom: '16px' }}>
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            questions={formData.questions || []}
            availableCountries={availableCountries}
            availableUtmSources={funnel ? extractUtmSources(funnel) : []}
          />
        </div>
      )}

      {/* Chart + Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: '16px',
        marginBottom: '16px'
      }}>
        {/* Bar Chart */}
        {timeSeries && (
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              fontSize: '15px', 
              fontWeight: '700', 
              color: '#111827', 
              marginBottom: '2px',
              letterSpacing: '-0.01em'
            }}>
              الردود والمشاهدات
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '12px'
            }}>
              تتبع تفاعل المستخدمين مع مرور الوقت
            </p>
            <div style={{ height: '280px' }}>
              <BarChart data={timeSeries.time_series} height={280} />
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #E7F5F4 0%, #ffffff 100%)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #D9E4E1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>
              إجمالي الردود
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#0E7C86' }}>
              {(summary?.total_responses || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #E7F5F4 0%, #ffffff 100%)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #D9E4E1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>
              إجمالي المشاهدات
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#0E7C86' }}>
              {(funnel?.total_views || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #E7F5F4 0%, #ffffff 100%)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #D9E4E1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>
              معدل التحويل
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#0E7C86' }}>
              {conversionRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Chart */}
      {funnel && (
        <div style={{
          background: 'white',
          padding: '16px',
          paddingBottom: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '40px'
        }}>
          <h3 style={{ 
            fontSize: '15px', 
            fontWeight: '700', 
            color: '#111827', 
            marginBottom: '2px',
            letterSpacing: '-0.01em'
          }}>
            مسار البيانات
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px'
          }}>
            تتبع تقدم المستخدم من خلال إكمال النموذج
          </p>
          <FunnelChart
            height={280}
            stages={[
              {
                label: 'مشاهدات الصفحة',
                value: funnel.total_views,
                percentage: 100,
                dropOff: funnel.total_views > 0 ? ((funnel.total_views - funnel.total_starts) / funnel.total_views) * 100 : 0
              },
              {
                label: 'فتح النموذج',
                value: funnel.total_starts,
                percentage: funnel.total_views > 0 ? (funnel.total_starts / funnel.total_views) * 100 : 0,
                dropOff: funnel.total_starts > 0 && funnel.question_funnel.length > 0 ? 
                  ((funnel.total_starts - funnel.question_funnel[0].answered) / funnel.total_starts) * 100 : 0
              },
              ...funnel.question_funnel.map((q, idx) => ({
                label: `أكتمال السؤال ${idx + 1}  `,
                value: q.answered,
                percentage: funnel.total_views > 0 ? (q.answered / funnel.total_views) * 100 : 0,
                dropOff: idx < funnel.question_funnel.length - 1 && q.answered > 0 ?
                  ((q.answered - funnel.question_funnel[idx + 1].answered) / q.answered) * 100 : 
                  q.answered > 0 ? ((q.answered - funnel.total_completes) / q.answered) * 100 : 0
              })),
              {
                label: 'تكملة النموذج',
                value: funnel.total_completes,
                percentage: funnel.total_views > 0 ? (funnel.total_completes / funnel.total_views) * 100 : 0
              }
            ]}
            totalViews={funnel.total_views}
          />
        </div>
      )}
    </div>
  );
};
