import {
  buildAnswerPayload,
  getQuestionId,
  getQuestionLabel,
  hasAnswerValue,
  type AnswerMap,
  type FormQuestion,
} from './questions.ts';

export { buildAnswerPayload };

export type ConditionalAction = 'show' | 'hide';

export interface ConditionalRule {
  question_id?: string | number;
  trigger_question_id?: string | number;
  target_question_id?: string | number;
  condition?: {
    operator?: string;
    type?: string;
    value?: unknown;
  };
  condition_type?: string;
  condition_value?: unknown;
  action?: ConditionalAction | string;
}

export interface NormalizedConditionalRule {
  questionId: string;
  targetQuestionId: string;
  operator: string;
  value: unknown;
  action: ConditionalAction;
}

const toId = (value: unknown) => value === undefined || value === null ? '' : String(value);

const getConditionValue = (rule: ConditionalRule) => {
  if (rule.condition && 'value' in rule.condition) {
    return rule.condition.value;
  }

  return rule.condition_value;
};

export const normalizeConditionalRule = (rule: ConditionalRule): NormalizedConditionalRule => ({
  questionId: toId(rule.question_id ?? rule.trigger_question_id),
  targetQuestionId: toId(rule.target_question_id),
  operator: String(rule.condition?.operator ?? rule.condition?.type ?? rule.condition_type ?? 'equals'),
  value: getConditionValue(rule),
  action: rule.action === 'hide' ? 'hide' : 'show',
});

const getAnswerScalar = (answer: unknown): unknown => {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
    return answer;
  }

  const record = answer as Record<string, unknown>;
  if ('text' in record) return record.text;
  if ('number' in record) return record.number;
  if ('rating' in record) return record.rating;
  if ('choices' in record) return record.choices;
  if ('date' in record) return record.date;
  if ('time' in record) return record.time;
  return record;
};

const includesExpected = (answer: unknown, expected: unknown) => {
  if (Array.isArray(answer)) {
    return answer.map(String).includes(String(expected));
  }

  return String(answer ?? '').includes(String(expected ?? ''));
};

export const conditionMatches = (
  answer: unknown,
  operator: string,
  expectedValue: unknown
) => {
  const value = getAnswerScalar(answer);

  switch (operator) {
    case 'equals':
      if (Array.isArray(value)) return value.map(String).includes(String(expectedValue));
      return String(value ?? '') === String(expectedValue ?? '');
    case 'not_equals':
      if (Array.isArray(value)) return !value.map(String).includes(String(expectedValue));
      return String(value ?? '') !== String(expectedValue ?? '');
    case 'contains':
      return includesExpected(value, expectedValue);
    case 'not_contains':
      return !includesExpected(value, expectedValue);
    case 'is_empty':
      return !hasAnswerValue(answer);
    case 'is_not_empty':
      return hasAnswerValue(answer);
    case 'greater_than':
      return Number(value) > Number(expectedValue);
    case 'less_than':
      return Number(value) < Number(expectedValue);
    default:
      return false;
  }
};

export const getVisibleQuestionIds = ({
  questions,
  rules = [],
  answers,
}: {
  questions: Pick<FormQuestion, 'id'>[];
  rules?: ConditionalRule[];
  answers: AnswerMap;
}) => {
  const visibleQuestionIds = new Set<string>();

  for (const question of questions) {
    visibleQuestionIds.add(getQuestionId(question));
  }

  for (const rawRule of rules) {
    const rule = normalizeConditionalRule(rawRule);
    if (!rule.questionId || !rule.targetQuestionId) continue;

    const isMatch = conditionMatches(answers[rule.questionId], rule.operator, rule.value);

    if (rule.action === 'show') {
      if (isMatch) {
        visibleQuestionIds.add(rule.targetQuestionId);
      } else {
        visibleQuestionIds.delete(rule.targetQuestionId);
      }
      continue;
    }

    if (isMatch) {
      visibleQuestionIds.delete(rule.targetQuestionId);
    } else {
      visibleQuestionIds.add(rule.targetQuestionId);
    }
  }

  return visibleQuestionIds;
};

export const buildMissingRequiredMessage = (missingQuestions: Partial<FormQuestion>[]) => {
  const missingNames = missingQuestions.map(getQuestionLabel).slice(0, 3);
  const moreCount = missingQuestions.length - 3;
  let errorMessage = `Please complete: ${missingNames.join(', ')}`;

  if (moreCount > 0) {
    errorMessage += ` and ${moreCount} more required field${moreCount > 1 ? 's' : ''}`;
  }

  return errorMessage;
};
