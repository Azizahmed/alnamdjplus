import { insforge } from '../config';

export const api = {
  auth: {
    getCurrentUser: () => insforge.auth.getCurrentUser(),
    signIn: (email: string, password: string) => insforge.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string, name?: string) => insforge.auth.signUp({ email, password, name }),
    signInWithOAuth: (provider: string) => insforge.auth.signInWithOAuth({ provider }),
    signOut: () => insforge.auth.signOut(),
    updateProfile: (data: Record<string, any>) => insforge.auth.setProfile(data),
  },

  forms: {
    list: async (userId: string) => {
      return insforge.database.from('forms').select('*, form_questions(*)').eq('user_id', userId).order('updated_at', { ascending: false });
    },

    get: async (formId: string) => {
      return insforge.database.from('forms').select('*, form_questions(*), conditional_rules(*)').eq('id', formId).single();
    },

    create: async (data: { user_id: string; title: string; description?: string; settings?: Record<string, any> }) => {
      return insforge.database.from('forms').insert(data).select();
    },

    update: async (formId: string, data: Record<string, any>) => {
      return insforge.database.from('forms').update(data).eq('id', formId).select();
    },

    delete: async (formId: string) => {
      return insforge.database.from('forms').delete().eq('id', formId);
    },

    publish: async (formId: string, token: string) => {
      return insforge.database.from('public_forms').insert({ form_id: formId, token, settings: {} }).select();
    },

    unpublish: async (formId: string) => {
      return insforge.database.from('public_forms').delete().eq('form_id', formId);
    },
  },

  questions: {
    list: async (formId: string) => {
      return insforge.database.from('form_questions').select().eq('form_id', formId).order('order', { ascending: true });
    },

    create: async (data: { form_id: string; type: string; label: string; description?: string; required?: boolean; order: number; settings?: Record<string, any> }) => {
      return insforge.database.from('form_questions').insert(data).select();
    },

    update: async (questionId: string, data: Record<string, any>) => {
      return insforge.database.from('form_questions').update(data).eq('id', questionId).select();
    },

    delete: async (questionId: string) => {
      return insforge.database.from('form_questions').delete().eq('id', questionId);
    },

    reorder: async (questions: { id: string; order: number }[]) => {
      const promises = questions.map(q => 
        insforge.database.from('form_questions').update({ order: q.order }).eq('id', q.id)
      );
      return Promise.all(promises);
    },
  },

  conditionalRules: {
    list: async (formId: string) => {
      return insforge.database.from('conditional_rules').select('*, form_questions!inner(form_id)').eq('form_questions.form_id', formId);
    },

    create: async (data: { question_id: string; target_question_id: string; condition: Record<string, any>; action: string }) => {
      return insforge.database.from('conditional_rules').insert(data).select();
    },

    delete: async (ruleId: string) => {
      return insforge.database.from('conditional_rules').delete().eq('id', ruleId);
    },
  },

  responses: {
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

      if (format === 'json') {
        return JSON.stringify(responses, null, 2);
      }

      const { data: questions } = await insforge.database.from('form_questions').select().eq('form_id', formId).order('order', { ascending: true });
      if (!questions) return null;

      const headers = ['submitted_at', ...questions.map((q: any) => q.label)];
      const rows = responses.map((r: any) => {
        const row: any = { submitted_at: r.submitted_at };
        questions.forEach((q: any) => {
          const answer = r.response_answers?.find((a: any) => a.question_id === q.id);
          row[q.label] = answer ? JSON.stringify(answer.value) : '';
        });
        return row;
      });

      const csv = [headers.join(','), ...rows.map((r: any) => headers.map(h => `"${r[h] || ''}"`).join(','))].join('\n');
      return csv;
    },
  },

  publicForms: {
    get: async (token: string) => {
      return insforge.database.from('public_forms').select('form_id, forms(id, title, description, form_questions(*))').eq('token', token).single();
    },

    trackEvent: async (formId: string, eventType: string, metadata?: Record<string, any>) => {
      return insforge.database.from('form_analytics_events').insert({ form_id: formId, event_type: eventType, metadata: metadata || {} });
    },
  },

  analytics: {
    getSummary: async (formId: string) => {
      const { data: responses } = await insforge.database.from('form_responses').select('id, status, submitted_at').eq('form_id', formId);
      const total = responses?.length || 0;
      const completed = responses?.filter((r: any) => r.status === 'completed').length || 0;
      return { total_responses: total, completed_responses: completed };
    },

    getTimeseries: async (formId: string, startDate?: string, endDate?: string) => {
      let query = insforge.database.from('form_responses').select('submitted_at, status').eq('form_id', formId);
      if (startDate) query = query.gte('submitted_at', startDate);
      if (endDate) query = query.lte('submitted_at', endDate);
      return query.order('submitted_at', { ascending: true });
    },
  },

  chat: {
    getMessages: async (formId: string) => {
      return insforge.database.from('chat_messages').select().eq('form_id', formId).order('created_at', { ascending: true });
    },

    send: async (formId: string, message: string, history?: { role: string; content: string }[]) => {
      return insforge.functions.invoke('form-chat', {
        body: { formId, message, history },
      });
    },
  },

  ai: {
    generateForm: async (prompt: string, language?: string) => {
      return insforge.functions.invoke('generate-form', {
        body: { prompt, language },
      });
    },

    analyzeResponses: async (formId: string, question?: string, history?: { role: string; content: string }[]) => {
      return insforge.functions.invoke('analyze-responses', {
        body: { formId, question, history },
      });
    },
  },

  storage: {
    upload: async (bucket: string, file: File, path?: string) => {
      const key = path || `${Date.now()}-${file.name}`;
      const { data, error } = await insforge.storage.from(bucket).upload(key, file);
      if (error) throw error;
      return { key: data?.key || key, url: data?.url || '' };
    },

    getPublicUrl: (bucket: string, key: string) => {
      return `https://u74dqt4w.eu-central.insforge.app/api/storage/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
    },

    download: async (bucket: string, key: string) => {
      return insforge.storage.from(bucket).download(key);
    },

    remove: async (bucket: string, key: string) => {
      return insforge.storage.from(bucket).remove(key);
    },
  },
};
