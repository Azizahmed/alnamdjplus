export interface ExportQuestion {
  id: string | number;
  label?: string;
  question_text?: string;
}

export interface ExportAnswer {
  question_id: string | number;
  value: unknown;
}

export interface ExportResponse {
  submitted_at?: string;
  response_answers?: ExportAnswer[];
  [key: string]: unknown;
}

const getQuestionLabel = (question: ExportQuestion) =>
  String(question.label ?? question.question_text ?? question.id);

const escapeCsvCell = (value: unknown) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

const findAnswerValue = (response: ExportResponse, question: ExportQuestion) =>
  response.response_answers?.find((answer) => String(answer.question_id) === String(question.id))?.value ?? '';

export const exportResponses = ({
  responses,
  questions,
  format,
}: {
  responses: ExportResponse[];
  questions: ExportQuestion[];
  format: 'csv' | 'json';
}) => {
  if (format === 'json') {
    return JSON.stringify(responses, null, 2);
  }

  const headers = ['submitted_at', ...questions.map(getQuestionLabel)];
  const rows = responses.map((response) => [
    escapeCsvCell(response.submitted_at || ''),
    ...questions.map((question) => escapeCsvCell(findAnswerValue(response, question))),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
};
