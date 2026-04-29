import { insforge } from './apiClient';

export const conditionalRulesApi = {
  list: async (formId: string) => {
    return insforge.database.from('conditional_rules').select('*, form_questions!inner(form_id)').eq('form_questions.form_id', formId);
  },

  create: async (data: { question_id: string; target_question_id: string; condition: Record<string, any>; action: string }) => {
    return insforge.database.from('conditional_rules').insert([data]).select();
  },

  delete: async (ruleId: string) => {
    return insforge.database.from('conditional_rules').delete().eq('id', ruleId);
  },
};
