import {
  buildAnswerPayload,
  buildMissingRequiredMessage,
  getVisibleQuestionIds,
} from '../src/domain/publicFormRuntime.ts';

const assertDeepEqual = (actual: unknown, expected: unknown, message: string) => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
};

const questions = [
  { id: 'q1', label: 'Plan', required: true },
  { id: 'q2', label: 'Company size', required: true },
  { id: 'q3', label: 'Extra notes', required: false },
];

const visibleWhenEnterprise = getVisibleQuestionIds({
  questions,
  rules: [
    {
      question_id: 'q1',
      target_question_id: 'q2',
      condition: { operator: 'equals', value: 'enterprise' },
      action: 'show',
    },
    {
      trigger_question_id: 'q1',
      target_question_id: 'q3',
      condition_type: 'contains',
      condition_value: 'hide-notes',
      action: 'hide',
    },
  ],
  answers: {
    q1: { text: 'enterprise' },
  },
});

assertDeepEqual(
  Array.from(visibleWhenEnterprise),
  ['q1', 'q2', 'q3'],
  'supports current and legacy conditional rule shapes'
);

const visibleWhenStarter = getVisibleQuestionIds({
  questions,
  rules: [
    {
      question_id: 'q1',
      target_question_id: 'q2',
      condition: { operator: 'equals', value: 'enterprise' },
      action: 'show',
    },
  ],
  answers: {
    q1: { text: 'starter' },
  },
});

assertDeepEqual(
  Array.from(visibleWhenStarter),
  ['q1', 'q3'],
  'hides show-target questions until their condition matches'
);

assertDeepEqual(
  buildAnswerPayload({ q2: { number: 12 }, q1: { text: 'enterprise' } }),
  [
    { question_id: 'q2', value: { number: 12 } },
    { question_id: 'q1', value: { text: 'enterprise' } },
  ],
  'builds submit payloads from answer state without exposing UI details'
);

const message = buildMissingRequiredMessage([
  { id: 'q1', label: 'Name' },
  { id: 'q2', question_text: 'Email' },
  { id: 'q3', label: 'Phone' },
  { id: 'q4', label: 'Company' },
]);

if (message !== 'Please complete: Name, Email, Phone and 1 more required field') {
  throw new Error(`unexpected missing required message: ${message}`);
}
