export const normalizeQuestionSettings = (settings: any = {}) => {
  const normalized = { ...(settings || {}) };

  if (!Array.isArray(normalized.choices) && Array.isArray(normalized.options)) {
    normalized.choices = normalized.options;
  }

  return normalized;
};

export const normalizeQuestion = (question: any) => ({
  ...question,
  type: question.type ?? question.question_type,
  question_type: question.question_type ?? question.type,
  label: question.label ?? question.question_text,
  question_text: question.question_text ?? question.label,
  order: question.order ?? question.question_order ?? 0,
  question_order: question.question_order ?? question.order ?? 0,
  settings: normalizeQuestionSettings(question.settings),
});

export const toQuestionRecord = (data: Record<string, any>) => {
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
