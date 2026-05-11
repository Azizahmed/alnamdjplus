import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  order: number;
};

type NormalizedAnswer = {
  question_id: string;
  value: any;
};

type NormalizedResponse = {
  id: string;
  submitted_at: string;
  status: string;
  answers: NormalizedAnswer[];
};

type CoverageItem = Question & {
  answered: number;
  missing: number;
  rate: number;
};

type DistributionRow = {
  label: string;
  count: number;
};

type DistributionGroup = {
  question: Question;
  rows: DistributionRow[];
};

type NumericStat = {
  question: Question;
  count: number;
  average: number;
  min: number;
  max: number;
};

type ActivityItem = {
  date: string;
  count: number;
};

type AnalysisSummary = {
  totalResponses: number;
  completedResponses: number;
  partialResponses: number;
  completionRate: number;
  requiredQuestions: number;
  coverage: CoverageItem[];
  distributions: DistributionGroup[];
  numericStats: NumericStat[];
  activity: ActivityItem[];
  topWords: Array<[string, number]>;
  missingRequired: number;
  averageAnsweredFields: number;
};

const numberFormat = new Intl.NumberFormat('ar');

const normalizeQuestion = (question: any): Question => ({
  id: String(question.id),
  text: question.question_text || question.label || 'سؤال بدون عنوان',
  type: question.question_type || question.type || 'unknown',
  required: Boolean(question.required),
  order: Number(question.question_order ?? question.order ?? 0),
});

const normalizeResponse = (response: any): NormalizedResponse => ({
  id: String(response.id),
  submitted_at: response.submitted_at,
  status: response.status || 'unknown',
  answers: (response.response_answers || response.answers || []).map((answer: any) => ({
    question_id: String(answer.question_id),
    value: answer.value ?? answer.answer_value,
  })),
});

const hasValue = (value: any) => {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text.trim().length > 0;
    if (value.number !== undefined) return value.number !== null && value.number !== '';
    if (value.rating !== undefined) return value.rating !== null && value.rating !== '';
    if (Array.isArray(value.choices)) return value.choices.length > 0;
    if (Array.isArray(value.files)) return value.files.length > 0;
    return Object.keys(value).length > 0;
  }
  return true;
};

const extractValues = (value: any): string[] => {
  if (!hasValue(value)) return [];
  if (Array.isArray(value?.choices)) return value.choices.map(String);
  if (value?.text) return [String(value.text)];
  if (value?.rating !== undefined) return [String(value.rating)];
  if (value?.number !== undefined) return [String(value.number)];
  if (value?.date) return [String(value.date)];
  if (value?.time) return [String(value.time)];
  if (Array.isArray(value?.files)) return value.files.map((file: any) => file.filename || file.original_filename || 'file');
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  return [JSON.stringify(value)];
};

const extractNumericValue = (value: any): number | null => {
  const raw = value?.number ?? value?.rating ?? (typeof value === 'number' ? value : null);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const pct = (value: number) => `${Math.round(value)}%`;

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const barStyle = (percent: number, color = '#0E7C86'): React.CSSProperties => ({
  width: `${Math.max(3, Math.min(100, percent))}%`,
  height: '8px',
  borderRadius: '999px',
  background: color,
});

export const FormDataAnalysis: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>(null);
  const [responses, setResponses] = useState<NormalizedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [formResult, responseResult] = await Promise.all([
          api.forms.get(formId!),
          api.responses.list(formId!),
        ]);

        if (formResult.error) throw new Error('Failed to load form');
        if (responseResult.error) throw new Error('Failed to load responses');

        setFormData(formResult.data);
        setResponses((responseResult.data || []).map(normalizeResponse));
      } catch (err: any) {
        setError(err.message || 'Failed to load data analysis');
      } finally {
        setLoading(false);
      }
    };

    if (formId) void load();
  }, [formId]);

  const questions = useMemo<Question[]>(() => {
    const rawQuestions: any[] = formData?.questions || formData?.form_questions || [];
    return rawQuestions
      .map(normalizeQuestion)
      .sort((a: Question, b: Question) => a.order - b.order);
  }, [formData]);

  const analysis = useMemo<AnalysisSummary>(() => {
    const totalResponses = responses.length;
    const completedResponses = responses.filter((response) => response.status === 'completed' || response.status === 'complete').length;
    const partialResponses = totalResponses - completedResponses;
    const requiredQuestions = questions.filter((question) => question.required);

    const answersByQuestion = new Map<string, any[]>();
    questions.forEach((question) => answersByQuestion.set(question.id, []));
    responses.forEach((response) => {
      response.answers.forEach((answer) => {
        if (answersByQuestion.has(answer.question_id) && hasValue(answer.value)) {
          answersByQuestion.get(answer.question_id)!.push(answer.value);
        }
      });
    });

    const coverage: CoverageItem[] = questions.map((question) => {
      const answered = answersByQuestion.get(question.id)?.length || 0;
      return {
        ...question,
        answered,
        missing: Math.max(0, totalResponses - answered),
        rate: totalResponses > 0 ? (answered / totalResponses) * 100 : 0,
      };
    });

    const distributions: DistributionGroup[] = questions
      .map((question) => {
        const counts = new Map<string, number>();
        (answersByQuestion.get(question.id) || []).forEach((value) => {
          extractValues(value).forEach((label) => counts.set(label, (counts.get(label) || 0) + 1));
        });
        return {
          question,
          rows: Array.from(counts.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6),
        };
      })
      .filter((item) => item.rows.length > 0);

    const numericStats: NumericStat[] = questions
      .map((question) => {
        const values = (answersByQuestion.get(question.id) || [])
          .map(extractNumericValue)
          .filter((value): value is number => value !== null);
        if (values.length === 0) return null;
        const sum = values.reduce((acc, value) => acc + value, 0);
        return {
          question,
          count: values.length,
          average: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      })
      .filter(Boolean) as NumericStat[];

    const dateCounts = new Map<string, number>();
    responses.forEach((response) => {
      const date = response.submitted_at?.split('T')[0] || 'بدون تاريخ';
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
    });
    const activity: ActivityItem[] = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    const textQuestionTypes = new Set(['short_answer', 'long_answer', 'email', 'phone', 'link']);
    const textValues: string[] = questions
      .filter((question) => textQuestionTypes.has(question.type))
      .flatMap((question) => (answersByQuestion.get(question.id) || []).flatMap(extractValues));
    const words = new Map<string, number>();
    const stopWords = new Set(['من', 'في', 'على', 'عن', 'الى', 'إلى', 'ما', 'هل', 'the', 'and', 'for', 'with']);
    textValues.forEach((text) => {
      text
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && !stopWords.has(word))
        .forEach((word) => words.set(word, (words.get(word) || 0) + 1));
    });

    const missingRequired = responses.reduce((count, response) => {
      return count + requiredQuestions.filter((question) => {
        const answer = response.answers.find((item) => item.question_id === question.id);
        return !answer || !hasValue(answer.value);
      }).length;
    }, 0);

    return {
      totalResponses,
      completedResponses,
      partialResponses,
      completionRate: totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
      requiredQuestions: requiredQuestions.length,
      coverage,
      distributions,
      numericStats,
      activity,
      topWords: Array.from(words.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12),
      missingRequired,
      averageAnsweredFields: totalResponses > 0
        ? coverage.reduce((sum, item) => sum + item.answered, 0) / totalResponses
        : 0,
    };
  }, [questions, responses]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#fafafa' }}>
        <div className="loading-spinner" style={{ width: 42, height: 42 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#fafafa', direction: 'rtl' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ color: '#BA4A45', fontWeight: 700 }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{ border: 0, background: '#0E7C86', color: '#fff', borderRadius: 8, padding: '10px 18px', cursor: 'pointer' }}>
            رجوع
          </button>
        </div>
      </div>
    );
  }

  const maxActivity = Math.max(1, ...analysis.activity.map((item) => item.count));

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: '#fafafa',
      padding: '24px',
      paddingBottom: '72px',
      direction: 'rtl',
    }}>
      <div style={{ maxWidth: 1480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: '#111827' }}>تحليل البيانات</h1>
            <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>
              تحليل تلقائي مبني على أسئلة النموذج والردود: {formData?.title}
            </p>
          </div>
          <button
            onClick={() => navigate(`/forms/${formId}/responses`)}
            style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#374151', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 }}
          >
            العودة للردود
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
          {[
            ['إجمالي الردود', numberFormat.format(analysis.totalResponses)],
            ['الردود المكتملة', numberFormat.format(analysis.completedResponses)],
            ['الردود الجزئية', numberFormat.format(analysis.partialResponses)],
            ['معدل الإكمال', pct(analysis.completionRate)],
            ['متوسط الحقول المجابة', numberFormat.format(Number(analysis.averageAnsweredFields.toFixed(1)))],
          ].map(([label, value]) => (
            <div key={label} style={cardStyle}>
              <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>{label}</div>
              <div style={{ color: '#111827', fontSize: 26, fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
          <section style={cardStyle}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>1. تحليل اكتمال الردود</h2>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 13 }}>يقيس نسبة الردود المكتملة مقابل المسودات أو الردود الجزئية.</p>
            <div style={{ background: '#eef3f2', height: 12, borderRadius: 999, overflow: 'hidden' }}>
              <div style={barStyle(analysis.completionRate)} />
            </div>
            <div style={{ marginTop: 10, color: '#374151', fontWeight: 700 }}>{pct(analysis.completionRate)} مكتملة</div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>2. تحليل تغطية الأسئلة</h2>
            <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>يوضح لكل سؤال كم مرة تمت الإجابة عليه.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {analysis.coverage.slice(0, 8).map((item) => (
                <div key={item.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, color: '#374151' }}>{item.text}</span>
                    <span style={{ color: '#6b7280' }}>{pct(item.rate)}</span>
                  </div>
                  <div style={{ background: '#eef3f2', height: 8, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={barStyle(item.rate, item.required ? '#0E7C86' : '#B7791F')} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>3. تحليل التوزيعات والاختيارات</h2>
            <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>يلخص أكثر الإجابات تكراراً في أسئلة الاختيار والتقييم.</p>
            <div style={{ display: 'grid', gap: 14 }}>
              {analysis.distributions.length === 0 ? (
                <div style={{ color: '#6b7280' }}>لا توجد إجابات كافية لعرض توزيع بعد.</div>
              ) : analysis.distributions.slice(0, 4).map((group) => (
                <div key={group.question.id}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{group.question.text}</div>
                  {group.rows.map((row) => {
                    const max = Math.max(...group.rows.map((item) => item.count), 1);
                    return (
                      <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 48px', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ background: '#eef3f2', height: 8, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={barStyle((row.count / max) * 100)} />
                        </div>
                        <div style={{ color: '#374151', fontSize: 12 }}>{row.label} ({numberFormat.format(row.count)})</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>4. التحليل الرقمي والتقييمات</h2>
            <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>يعرض المتوسط والحدود للأسئلة الرقمية أو أسئلة التقييم.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {analysis.numericStats.length === 0 ? (
                <div style={{ color: '#6b7280' }}>لا توجد أسئلة رقمية أو تقييمات مجابة بعد.</div>
              ) : analysis.numericStats.map((item) => (
                <div key={item.question.id} style={{ border: '1px solid #eef3f2', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{item.question.text}</div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', color: '#374151', fontSize: 13 }}>
                    <span>المتوسط: {numberFormat.format(Number(item.average.toFixed(2)))}</span>
                    <span>الأدنى: {numberFormat.format(item.min)}</span>
                    <span>الأعلى: {numberFormat.format(item.max)}</span>
                    <span>العينة: {numberFormat.format(item.count)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>5. تحليل النصوص المفتوحة</h2>
            <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>يستخرج أكثر الكلمات تكراراً من الإجابات النصية للمساعدة في قراءة الأنماط.</p>
            {analysis.topWords.length === 0 ? (
              <div style={{ color: '#6b7280' }}>لا توجد إجابات نصية كافية بعد.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {analysis.topWords.map(([word, count]) => (
                  <span key={word} style={{ background: '#E7F5F4', color: '#0E7C86', borderRadius: 999, padding: '6px 10px', fontWeight: 700, fontSize: 13 }}>
                    {word} · {numberFormat.format(count)}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>6. تحليل جودة البيانات</h2>
            <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>يفحص الحقول المطلوبة والفجوات التي قد تؤثر على موثوقية التحليل.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eef3f2', paddingBottom: 8 }}>
                <span>عدد الأسئلة المطلوبة</span>
                <strong>{numberFormat.format(analysis.requiredQuestions)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eef3f2', paddingBottom: 8 }}>
                <span>إجمالي القيم المطلوبة المفقودة</span>
                <strong>{numberFormat.format(analysis.missingRequired)}</strong>
              </div>
              <div style={{ color: analysis.missingRequired === 0 ? '#25745A' : '#B7791F', fontWeight: 700 }}>
                {analysis.missingRequired === 0 ? 'جودة البيانات جيدة للحقول المطلوبة.' : 'توجد فجوات في الحقول المطلوبة تحتاج للمراجعة.'}
              </div>
            </div>
          </section>

          <section style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>7. تحليل النشاط الزمني</h2>
            <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>يعرض توزيع الردود حسب آخر تواريخ الإرسال.</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {analysis.activity.length === 0 ? (
                <div style={{ color: '#6b7280' }}>لا توجد ردود زمنية بعد.</div>
              ) : analysis.activity.map((item) => (
                <div key={item.date} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 48px', gap: 12, alignItems: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{item.date}</div>
                  <div style={{ background: '#eef3f2', height: 10, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={barStyle((item.count / maxActivity) * 100, '#B7791F')} />
                  </div>
                  <strong>{numberFormat.format(item.count)}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
