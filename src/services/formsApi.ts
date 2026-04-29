import { insforge, unauthenticatedError } from './apiClient';
import { normalizeQuestion } from './questionMapping';

const loadConditionalRules = async (questionIds: string[]) => {
  if (questionIds.length === 0) {
    return { data: [], error: null };
  }

  return insforge.database
    .from('conditional_rules')
    .select('*')
    .in('question_id', questionIds);
};

export const hydrateFormQuestions = async (form: any) => {
  const questions = (form.form_questions || [])
    .map(normalizeQuestion)
    .sort((a: any, b: any) => a.question_order - b.question_order);
  const questionIds = questions.map((question: any) => question.id);
  const { data: conditionalRules, error } = await loadConditionalRules(questionIds);

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      ...form,
      form_questions: questions,
      questions,
      conditional_rules: conditionalRules || [],
    },
    error: null,
  };
};

export const formsApi = {
  list: async (userId: string) => {
    return insforge.database.from('forms').select('*, form_questions(*)').eq('user_id', userId).order('updated_at', { ascending: false });
  },

  get: async (formId: string) => {
    const { data: form, error } = await insforge.database
      .from('forms')
      .select('*, form_questions(*)')
      .eq('id', formId)
      .single();

    if (error || !form) {
      return { data: form, error };
    }

    return hydrateFormQuestions(form);
  },

  create: async (data: { user_id: string; title: string; description?: string; settings?: Record<string, any> }) => {
    return insforge.database.from('forms').insert([data]).select();
  },

  update: async (formId: string, data: Record<string, any>) => {
    return insforge.database.from('forms').update(data).eq('id', formId).select();
  },

  delete: async (formId: string) => {
    return insforge.database.from('forms').delete().eq('id', formId);
  },

  publish: async (formId: string, token: string) => {
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    if (userError || !userData?.user) {
      return {
        data: null,
        error: unauthenticatedError('You must be signed in before publishing a form.'),
      };
    }

    const existing = await insforge.database
      .from('public_forms')
      .select('*')
      .eq('form_id', formId)
      .maybeSingle();

    if (existing.error) {
      return existing;
    }

    if (existing.data) {
      return { data: existing.data, error: null };
    }

    const inserted = await insforge.database
      .from('public_forms')
      .insert([{ form_id: formId, token, settings: {} }])
      .select();

    return {
      data: Array.isArray(inserted.data) ? inserted.data[0] : inserted.data,
      error: inserted.error,
    };
  },

  unpublish: async (formId: string) => {
    return insforge.database.from('public_forms').delete().eq('form_id', formId);
  },
};
