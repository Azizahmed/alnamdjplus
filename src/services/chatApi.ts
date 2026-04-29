import { insforge, requireCurrentUser } from './apiClient';

export const chatApi = {
  getMessages: async (formId: string) => {
    return insforge.database.from('chat_messages').select().eq('form_id', formId).order('created_at', { ascending: true });
  },

  send: async (formId: string, message: string, history?: { role: string; content: string }[]) => {
    const auth = await requireCurrentUser();
    if (auth.error) return auth;

    return insforge.functions.invoke('form-chat', {
      body: { formId, message, history },
    });
  },
};
