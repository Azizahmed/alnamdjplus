export type QuestionId = string;
export type AnswerValue = unknown;
export type AnswerMap = Record<string, AnswerValue>;

export interface FormQuestion {
  id: QuestionId;
  form_id?: string;
  type?: string;
  question_type?: string;
  label?: string;
  question_text?: string;
  description?: string | null;
  required?: boolean;
  order?: number;
  question_order?: number;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeArrayAlias = (
  normalized: Record<string, unknown>,
  primaryKey: string,
  aliasKey: string
) => {
  if (!Array.isArray(normalized[primaryKey]) && Array.isArray(normalized[aliasKey])) {
    normalized[primaryKey] = normalized[aliasKey];
  }
};

export const normalizeQuestionSettings = (settings: unknown = {}) => {
  const normalized = isPlainObject(settings) ? { ...settings } : {};

  normalizeArrayAlias(normalized, 'choices', 'options');
  normalizeArrayAlias(normalized, 'options', 'choices');

  return normalized;
};

export const normalizeQuestion = <T extends Record<string, unknown>>(question: T) => {
  const type = question.type ?? question.question_type;
  const label = question.label ?? question.question_text;
  const order = question.order ?? question.question_order ?? 0;

  return {
    ...question,
    id: question.id === undefined || question.id === null ? question.id : String(question.id),
    type,
    question_type: type,
    label,
    question_text: label,
    order,
    question_order: order,
    settings: normalizeQuestionSettings(question.settings),
  };
};

export const toQuestionRecord = (data: Record<string, unknown>) => {
  const record = { ...data };

  if ('question_text' in record) {
    record.label = record.question_text;
    delete record.question_text;
  }

  if ('question_type' in record) {
    record.type = record.question_type;
    delete record.question_type;
  }

  if ('question_order' in record) {
    record.order = record.question_order;
    delete record.question_order;
  }

  if ('settings' in record) {
    record.settings = normalizeQuestionSettings(record.settings);
  }

  return record;
};

export const getQuestionId = (question: Pick<FormQuestion, 'id'>) => String(question.id);

export const getQuestionLabel = (question: Partial<FormQuestion>) =>
  String(question.label ?? question.question_text ?? 'Untitled question');

export const hasAnswerValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;

  if (isPlainObject(value)) {
    if (typeof value.text === 'string') return value.text.trim().length > 0;
    if (value.number !== undefined) return value.number !== null && value.number !== '';
    if (Array.isArray(value.choices)) return value.choices.length > 0;
    if (value.rating !== undefined) return value.rating !== null && value.rating !== '';
    if (Array.isArray(value.files)) return value.files.length > 0;
    if (typeof value.signature === 'string') return value.signature.trim().length > 0;
    return Object.keys(value).length > 0;
  }

  return true;
};

export const getMissingRequiredQuestions = <T extends Pick<FormQuestion, 'id'> & Partial<FormQuestion>>(
  questions: T[],
  answers: AnswerMap,
  visibleQuestionIds?: Set<QuestionId>
) =>
  questions.filter((question) => {
    const questionId = getQuestionId(question);

    if (visibleQuestionIds && !visibleQuestionIds.has(questionId)) {
      return false;
    }

    return Boolean(question.required) && !hasAnswerValue(answers[questionId]);
  });

export const buildAnswerPayload = (answers: AnswerMap) =>
  Object.entries(answers).map(([questionId, value]) => ({
    question_id: questionId,
    value,
  }));
