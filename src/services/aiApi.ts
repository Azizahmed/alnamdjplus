import { insforge, requireCurrentUser, unauthenticatedError } from './apiClient';

export const aiApi = {
  generateForm: async (prompt: string, language?: string) => {
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    if (userError || !userData?.user) {
      return {
        data: null,
        error: unauthenticatedError('انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى ثم حاول إنشاء النموذج.'),
      };
    }

    return insforge.functions.invoke('generate-form', {
      body: { prompt, language },
    });
  },

  analyzeResponses: async (formId: string, question?: string, history?: { role: string; content: string }[]) => {
    const auth = await requireCurrentUser();
    if (auth.error) return auth;

    return insforge.functions.invoke('analyze-responses', {
      body: { formId, question, history },
    });
  },
};
