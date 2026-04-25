import { insforge } from '../config';

export const api = {
  auth: {
    getCurrentUser: () => insforge.auth.getCurrentUser(),
    signIn: (email: string, password: string) => insforge.auth.signIn(email, password),
    signUp: (email: string, password: string, metadata?: Record<string, any>) => insforge.auth.signUp(email, password, metadata),
    signInWithOAuth: (provider: string) => insforge.auth.signInWithOAuth(provider as any),
    signOut: () => insforge.auth.signOut(),
    updateProfile: (data: Record<string, any>) => insforge.auth.updateUser({ data }),
  },

  forms: {
    list: async (userId: string) => {
      return insforge.database.query('forms', {
        filter: { user_id: userId },
        select: 'id, title, description, is_published, created_at, updated_at',
        sort: { column: 'updated_at', ascending: false },
      });
    },

    get: async (formId: string) => {
      return insforge.database.query('forms', {
        filter: { id: formId },
        select: '*, form_questions(*), conditional_rules(*)',
      });
    },

    create: async (data: { user_id: string; title: string; description?: string; settings?: Record<string, any> }) => {
      return insforge.database.insert('forms', [data]);
    },

    update: async (formId: string, data: Record<string, any>) => {
      return insforge.database.update('forms', data, { filter: { id: formId } });
    },

    delete: async (formId: string) => {
      return insforge.database.delete('forms', { filter: { id: formId } });
    },

    publish: async (formId: string, token: string) => {
      return insforge.database.insert('public_forms', [{
        form_id: formId,
        token,
        settings: {},
      }]);
    },

    unpublish: async (formId: string) => {
      return insforge.database.delete('public_forms', { filter: { form_id: formId } });
    },
  },

  questions: {
    list: async (formId: string) => {
      return insforge.database.query('form_questions', {
        filter: { form_id: formId },
        sort: { column: 'order', ascending: true },
      });
    },

    create: async (data: { form_id: string; type: string; label: string; description?: string; required?: boolean; order: number; settings?: Record<string, any> }) => {
      return insforge.database.insert('form_questions', [data]);
    },

    update: async (questionId: string, data: Record<string, any>) => {
      return insforge.database.update('form_questions', data, { filter: { id: questionId } });
    },

    delete: async (questionId: string) => {
      return insforge.database.delete('form_questions', { filter: { id: questionId } });
    },

    reorder: async (questions: { id: string; order: number }[]) => {
      const promises = questions.map(q => 
        insforge.database.update('form_questions', { order: q.order }, { filter: { id: q.id } })
      );
      return Promise.all(promises);
    },
  },

  conditionalRules: {
    list: async (formId: string) => {
      return insforge.database.query('conditional_rules', {
        filter: { question_id: { operator: 'in', value: `form_questions.form_id=eq.${formId}` } },
      });
    },

    create: async (data: { question_id: string; target_question_id: string; condition: Record<string, any>; action: string }) => {
      return insforge.database.insert('conditional_rules', [data]);
    },

    delete: async (ruleId: string) => {
      return insforge.database.delete('conditional_rules', { filter: { id: ruleId } });
    },
  },

  responses: {
    list: async (formId: string) => {
      return insforge.database.query('form_responses', {
        filter: { form_id: formId },
        select: '*, response_answers(*)',
        sort: { column: 'submitted_at', ascending: false },
      });
    },

    get: async (responseId: string) => {
      return insforge.database.query('form_responses', {
        filter: { id: responseId },
        select: '*, response_answers(*)',
      });
    },

    submit: async (token: string, answers: { question_id: string; value: any }[], metadata?: Record<string, any>) => {
      return insforge.functions.invoke('submit-response', {
        body: { token, answers, metadata },
      });
    },

    export: async (formId: string, format: 'csv' | 'json') => {
      const { data: responses } = await insforge.database.query('form_responses', {
        filter: { form_id: formId },
        select: '*, response_answers(*)',
      });

      if (!responses) return null;

      if (format === 'json') {
        return JSON.stringify(responses, null, 2);
      }

      const { data: questions } = await insforge.database.query('form_questions', {
        filter: { form_id: formId },
        sort: { column: 'order', ascending: true },
      });

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
      return insforge.database.query('public_forms', {
        filter: { token },
        select: 'form_id, forms(id, title, description, form_questions(*))',
      });
    },

    trackEvent: async (formId: string, eventType: string, metadata?: Record<string, any>) => {
      return insforge.database.insert('form_analytics_events', [{
        form_id: formId,
        event_type: eventType,
        metadata: metadata || {},
      }]);
    },
  },

  analytics: {
    getSummary: async (formId: string) => {
      const { data: responses } = await insforge.database.query('form_responses', {
        filter: { form_id: formId },
        select: 'id, status, submitted_at',
      });

      const total = responses?.length || 0;
      const completed = responses?.filter((r: any) => r.status === 'completed').length || 0;

      return { total, completed };
    },

    getTimeseries: async (formId: string, startDate?: string, endDate?: string) => {
      const filter: any = { form_id: formId };
      if (startDate) filter.submitted_at = { operator: 'gte', value: startDate };
      if (endDate) filter.submitted_at = { ...filter.submitted_at, operator: 'lte', value: endDate };

      return insforge.database.query('form_responses', {
        filter,
        select: 'submitted_at, status',
        sort: { column: 'submitted_at', ascending: true },
      });
    },
  },

  chat: {
    getMessages: async (formId: string) => {
      return insforge.database.query('chat_messages', {
        filter: { form_id: formId },
        sort: { column: 'created_at', ascending: true },
      });
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
      const { data, error } = await insforge.storage.upload(bucket, key, file);
      if (error) throw error;
      return { key, url: insforge.storage.getPublicUrl(bucket, key) };
    },

    getPublicUrl: (bucket: string, key: string) => {
      return insforge.storage.getPublicUrl(bucket, key);
    },

    download: async (bucket: string, key: string) => {
      return insforge.storage.download(bucket, key);
    },
  },
};
