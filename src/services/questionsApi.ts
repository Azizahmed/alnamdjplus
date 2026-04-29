import { insforge } from './apiClient';
import { toQuestionRecord } from './questionMapping';

export const questionsApi = {
  list: async (formId: string) => {
    return insforge.database.from('form_questions').select().eq('form_id', formId).order('order', { ascending: true });
  },

  create: async (data: { form_id: string; type: string; label: string; description?: string; required?: boolean; order: number; settings?: Record<string, any> }) => {
    return insforge.database.from('form_questions').insert([toQuestionRecord(data)]).select();
  },

  update: async (questionId: string, data: Record<string, any>) => {
    return insforge.database.from('form_questions').update(toQuestionRecord(data)).eq('id', questionId).select();
  },

  delete: async (questionId: string) => {
    return insforge.database.from('form_questions').delete().eq('id', questionId);
  },

  reorder: async (questions: { id: string; order: number }[]) => {
    const promises = questions.map((question) =>
      insforge.database.from('form_questions').update({ order: question.order }).eq('id', question.id)
    );
    return Promise.all(promises);
  },
};
