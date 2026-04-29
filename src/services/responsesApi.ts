import { exportResponses } from '../domain/responseExport.ts';
import { insforge } from './apiClient';

export const responsesApi = {
  list: async (formId: string) => {
    return insforge.database.from('form_responses').select('*, response_answers(*)').eq('form_id', formId).order('submitted_at', { ascending: false });
  },

  get: async (responseId: string) => {
    return insforge.database.from('form_responses').select('*, response_answers(*)').eq('id', responseId).single();
  },

  submit: async (token: string, answers: { question_id: string; value: any }[], metadata?: Record<string, any>) => {
    return insforge.functions.invoke('submit-response', {
      body: { token, answers, metadata },
    });
  },

  export: async (formId: string, format: 'csv' | 'json') => {
    const { data: responses } = await insforge.database.from('form_responses').select('*, response_answers(*)').eq('form_id', formId);
    if (!responses) return null;

    const { data: questions } = await insforge.database.from('form_questions').select().eq('form_id', formId).order('order', { ascending: true });
    if (!questions) return null;

    return exportResponses({ responses, questions, format });
  },
};
