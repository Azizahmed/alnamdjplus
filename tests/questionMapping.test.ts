import {
  getMissingRequiredQuestions,
  hasAnswerValue,
  normalizeQuestion,
  toQuestionRecord,
} from '../src/services/questionMapping.ts';

const assertDeepEqual = (actual: unknown, expected: unknown, message: string) => {
  const stringify = (value: unknown): string => {
    if (Array.isArray(value)) {
      return `[${value.map(stringify).join(',')}]`;
    }

    if (value && typeof value === 'object') {
      return `{${Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stringify(nestedValue)}`)
        .join(',')}}`;
    }

    return JSON.stringify(value);
  };

  const actualJson = stringify(actual);
  const expectedJson = stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
};

const generatedDropdown = {
  id: 'question-1',
  form_id: 'form-1',
  type: 'dropdown',
  label: 'Choose one',
  required: false,
  order: 0,
  settings: {
    options: ['Alpha', 'Beta'],
  },
};

const normalizedDropdown = normalizeQuestion(generatedDropdown);

assertDeepEqual(
  normalizedDropdown.settings,
  { options: ['Alpha', 'Beta'], choices: ['Alpha', 'Beta'] },
  'normalizes generated dropdown options into renderer choices'
);

const updateRecord = toQuestionRecord({
  question_text: 'Updated question',
  question_type: 'dropdown',
  question_order: 2,
  settings: {
    options: ['One', 'Two'],
  },
});

assertDeepEqual(
  updateRecord,
  {
    label: 'Updated question',
    type: 'dropdown',
    order: 2,
    settings: {
      options: ['One', 'Two'],
      choices: ['One', 'Two'],
    },
  },
  'maps UI aliases and generated option settings to database fields'
);

const normalizedChoiceQuestion = normalizeQuestion({
  id: 'question-2',
  question_type: 'multiple_choice',
  question_text: 'Pick one',
  question_order: 1,
  settings: {
    choices: ['One', 'Two'],
  },
});

assertDeepEqual(
  normalizedChoiceQuestion.settings,
  { choices: ['One', 'Two'], options: ['One', 'Two'] },
  'keeps choices and options aliases in sync both ways'
);

if (hasAnswerValue({ text: '   ' })) {
  throw new Error('blank text answers should not count as present');
}

if (!hasAnswerValue({ choices: ['Alpha'] })) {
  throw new Error('choice answers should count as present');
}

const missingRequired = getMissingRequiredQuestions(
  [
    { id: 'question-1', label: 'Name', required: true },
    { id: 'question-2', label: 'Preference', required: true },
    { id: 'question-3', label: 'Optional note', required: false },
  ],
  {
    'question-1': { text: 'Aziz' },
    'question-2': { text: '' },
  }
);

assertDeepEqual(
  missingRequired.map((question) => question.id),
  ['question-2'],
  'finds only visible required questions without answer values'
);
