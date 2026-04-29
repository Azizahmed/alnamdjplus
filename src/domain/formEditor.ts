import { buildAnswerPayload } from './questions.ts';

export interface EditableQuestion {
  id: string | number;
  question_text?: string;
  label?: string;
  description?: string;
  required?: boolean;
  order?: number;
  question_order?: number;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreateQuestionDraftInput {
  formId: string;
  questionType: string;
  currentQuestions?: EditableQuestion[];
  atIndex?: number | null;
  customization?: {
    text?: string;
    description?: string;
    options?: string[];
  };
}

const SELECTABLE_TYPES = new Set(['multiple_choice', 'checkboxes', 'dropdown', 'multi_select']);

export const getQuestionOrder = (question: EditableQuestion) =>
  Number(question.question_order ?? question.order ?? 0);

export const sortQuestionsByOrder = <T extends EditableQuestion>(questions: T[]) =>
  [...questions].sort((left, right) => getQuestionOrder(left) - getQuestionOrder(right));

export const patchQuestionInForm = <T extends EditableQuestion>(
  questions: T[],
  questionId: string | number,
  field: string,
  value: unknown
) =>
  questions.map((question) => {
    if (String(question.id) !== String(questionId)) {
      return question;
    }

    if (field.startsWith('settings.')) {
      const settingKey = field.split('.')[1];
      return {
        ...question,
        settings: {
          ...(question.settings || {}),
          [settingKey]: value,
        },
      };
    }

    return {
      ...question,
      [field]: value,
    };
  });

export const mergeQuestionInForm = <T extends EditableQuestion>(
  questions: T[],
  questionId: string | number,
  updates: Partial<T>
) =>
  questions.map((question) =>
    String(question.id) === String(questionId)
      ? { ...question, ...updates }
      : question
  );

export const buildQuestionUpdatePayload = (question: Partial<EditableQuestion>) => ({
  question_text: question.question_text ?? question.label,
  description: question.description,
  required: Boolean(question.required),
  settings: question.settings || {},
});

export const reorderFormQuestions = <T extends EditableQuestion>(
  questions: T[],
  activeId: string | number,
  overId: string | number
) => {
  const sortedQuestions = sortQuestionsByOrder(questions);
  const oldIndex = sortedQuestions.findIndex((question) => String(question.id) === String(activeId));
  const newIndex = sortedQuestions.findIndex((question) => String(question.id) === String(overId));

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return questions;
  }

  const nextSorted = [...sortedQuestions];
  const [movedQuestion] = nextSorted.splice(oldIndex, 1);
  nextSorted.splice(newIndex, 0, movedQuestion);

  return nextSorted.map((question, index) => ({
    ...question,
    order: index,
    question_order: index,
  }));
};

export const buildReorderPayload = (questions: EditableQuestion[]) =>
  questions.map((question) => ({
    id: String(question.id),
    order: getQuestionOrder(question),
  }));

const getNextOrder = (questions: EditableQuestion[] = [], atIndex?: number | null) => {
  if (atIndex !== undefined && atIndex !== null && questions.length > 0) {
    return sortQuestionsByOrder(questions)[atIndex]?.question_order ?? atIndex;
  }

  if (questions.length === 0) {
    return 0;
  }

  return Math.max(...questions.map(getQuestionOrder)) + 1;
};

export const buildDefaultQuestionSettings = (
  questionType: string,
  options: string[] = []
) => {
  const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);

  if (SELECTABLE_TYPES.has(questionType)) {
    return { choices: cleanedOptions.length ? cleanedOptions : ['Option 1', 'Option 2', 'Option 3'] };
  }

  if (questionType === 'ranking') {
    return { ranking_items: cleanedOptions.length ? cleanedOptions : ['Item 1', 'Item 2', 'Item 3'] };
  }

  if (questionType === 'matrix') {
    return { rows: ['Row 1', 'Row 2'], columns: ['Column 1', 'Column 2', 'Column 3'] };
  }

  if (questionType === 'linear_scale') {
    return { min_value: 1, max_value: 5, scale_min_label: 'Low', scale_max_label: 'High' };
  }

  if (questionType === 'rating') {
    return { max_value: 5 };
  }

  return {};
};

export const createQuestionDraft = ({
  formId,
  questionType,
  currentQuestions = [],
  atIndex,
  customization,
}: CreateQuestionDraftInput) => ({
  form_id: formId,
  type: questionType,
  label: customization?.text || 'New Question',
  description: customization?.description || '',
  required: false,
  order: getNextOrder(currentQuestions, atIndex),
  settings: buildDefaultQuestionSettings(questionType, customization?.options),
});

export const getBuilderVisibleQuestionIds = (questions: EditableQuestion[] = []) =>
  new Set(questions.map((question) => String(question.id)));

export const buildQuestionAnswerPayload = buildAnswerPayload;
