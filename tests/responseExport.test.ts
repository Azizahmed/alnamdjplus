import { exportResponses } from '../src/domain/responseExport.ts';

const questions = [
  { id: 'q1', label: 'Name' },
  { id: 'q2', label: 'Plan' },
];

const responses = [
  {
    submitted_at: '2026-04-29T10:00:00Z',
    response_answers: [
      { question_id: 'q1', value: { text: 'Aziz' } },
      { question_id: 'q2', value: { choices: ['Pro'] } },
    ],
  },
];

const json = exportResponses({ responses, questions, format: 'json' });
if (!json.includes('"submitted_at": "2026-04-29T10:00:00Z"')) {
  throw new Error('json export should include the response payload');
}

const csv = exportResponses({ responses, questions, format: 'csv' });
const expected = [
  'submitted_at,Name,Plan',
  '"2026-04-29T10:00:00Z","{""text"":""Aziz""}","{""choices"":[""Pro""]}"',
].join('\n');

if (csv !== expected) {
  throw new Error(`csv export mismatch\nExpected: ${expected}\nActual: ${csv}`);
}
