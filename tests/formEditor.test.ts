import {
  buildQuestionUpdatePayload,
  createQuestionDraft,
  mergeQuestionInForm,
  patchQuestionInForm,
  reorderFormQuestions,
} from '../src/domain/formEditor.ts';

const assertDeepEqual = (actual: unknown, expected: unknown, message: string) => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
};

const questions = [
  { id: 'q1', question_text: 'First', question_order: 0, order: 0, settings: {} },
  { id: 'q2', question_text: 'Second', question_order: 1, order: 1, settings: {} },
  { id: 'q3', question_text: 'Third', question_order: 2, order: 2, settings: {} },
];

assertDeepEqual(
  mergeQuestionInForm(questions, 'q1', { question_text: 'Renamed' }),
  [
    { id: 'q1', question_text: 'Renamed', question_order: 0, order: 0, settings: {} },
    { id: 'q2', question_text: 'Second', question_order: 1, order: 1, settings: {} },
    { id: 'q3', question_text: 'Third', question_order: 2, order: 2, settings: {} },
  ],
  'merges modal question updates without adding synthetic fields'
);

assertDeepEqual(
  patchQuestionInForm(questions, 'q2', 'settings.placeholder', 'Write here'),
  [
    { id: 'q1', question_text: 'First', question_order: 0, order: 0, settings: {} },
    { id: 'q2', question_text: 'Second', question_order: 1, order: 1, settings: { placeholder: 'Write here' } },
    { id: 'q3', question_text: 'Third', question_order: 2, order: 2, settings: {} },
  ],
  'patches nested question settings without changing other questions'
);

assertDeepEqual(
  buildQuestionUpdatePayload({
    question_text: 'Updated',
    description: 'Details',
    required: true,
    settings: { choices: ['A'] },
  }),
  {
    question_text: 'Updated',
    description: 'Details',
    required: true,
    settings: { choices: ['A'] },
  },
  'builds the small save payload for inline question edits'
);

assertDeepEqual(
  reorderFormQuestions(questions, 'q3', 'q1').map((question) => ({
    id: question.id,
    question_order: question.question_order,
    order: question.order,
  })),
  [
    { id: 'q3', question_order: 0, order: 0 },
    { id: 'q1', question_order: 1, order: 1 },
    { id: 'q2', question_order: 2, order: 2 },
  ],
  'reorders questions and rewrites contiguous order values'
);

assertDeepEqual(
  createQuestionDraft({
    formId: 'form-1',
    questionType: 'dropdown',
    currentQuestions: questions,
    customization: {
      text: 'Pick a plan',
      description: 'Choose one',
      options: ['Free', 'Pro', ''],
    },
  }),
  {
    form_id: 'form-1',
    type: 'dropdown',
    label: 'Pick a plan',
    description: 'Choose one',
    required: false,
    order: 3,
    settings: { choices: ['Free', 'Pro'] },
  },
  'creates a normalized question draft for selectable question types'
);
