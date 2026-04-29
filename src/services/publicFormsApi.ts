import { insforge } from './apiClient';
import { hydrateFormQuestions } from './formsApi';

export const publicFormsApi = {
  get: async (token: string) => {
    const { data, error } = await insforge.database
      .from('public_forms')
      .select('form_id, forms(id, title, description, settings, form_questions(*))')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { data, error };
    }

    const form = Array.isArray((data as any).forms) ? (data as any).forms[0] : (data as any).forms;
    if (!form) {
      return { data, error: null };
    }

    const hydrated = await hydrateFormQuestions(form);
    if (hydrated.error) {
      return hydrated;
    }

    return {
      data: {
        ...(data as any),
        forms: hydrated.data,
      },
      error: null,
    };
  },

  trackEvent: async (formId: string, eventType: string, metadata?: Record<string, any>) => {
    return insforge.database.from('form_analytics_events').insert([{ form_id: formId, event_type: eventType, metadata: metadata || {} }]);
  },
};
