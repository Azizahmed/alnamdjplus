import { normalizeQuestion, toQuestionRecord } from '../src/services/questionMapping';

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
