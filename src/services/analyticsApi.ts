import { insforge } from './apiClient';

export const analyticsApi = {
  getSummary: async (formId: string) => {
    const { data: responses } = await insforge.database.from('form_responses').select('id, status, submitted_at').eq('form_id', formId);
    const total = responses?.length || 0;
    const completed = responses?.filter((response: any) => response.status === 'completed').length || 0;
    return { total_responses: total, completed_responses: completed };
  },

  getTimeseries: async (formId: string, startDate?: string, endDate?: string) => {
    let query = insforge.database.from('form_responses').select('submitted_at, status').eq('form_id', formId);
    if (startDate) query = query.gte('submitted_at', startDate);
    if (endDate) query = query.lte('submitted_at', endDate);
    return query.order('submitted_at', { ascending: true });
  },
};
