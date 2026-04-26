import { createClient } from 'https://esm.sh/@insforge/sdk@latest';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || Deno.env.get('APP_URL') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowOrigin = allowedOrigins.includes(origin) || isLocalhost ? origin : (allowedOrigins[0] || 'null');

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
};

const createChatCompletion = async (messages: any[], maxTokens: number) => {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  const model = Deno.env.get('OPENROUTER_MODEL');

  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY secret');
  }
  if (!model) {
    throw new Error('Missing OPENROUTER_MODEL secret');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': Deno.env.get('APP_URL') ?? 'https://alnamdjplus.app',
      'X-Title': 'AlnamdjPlus',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.message || `OpenRouter request failed (${response.status})`);
  }

  return body;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const userToken = authHeader.replace('Bearer ', '');

    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') ?? '',
      edgeFunctionToken: userToken,
    });

    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
    if (userError || !userData?.user) {
      throw new Error('Unauthorized');
    }

    const { formId, question, history = [] } = await req.json();

    if (!formId) {
      throw new Error('Missing formId');
    }

    const { data: form, error: formError } = await insforge.database
      .from('forms')
      .select('id, title, description, form_questions(id, type, label, order, settings)')
      .eq('id', formId)
      .eq('user_id', userData.user.id);

    if (formError || !form?.length) {
      throw new Error('Form not found or access denied');
    }

    const formData = form[0];

    const { data: responses, error: responsesError } = await insforge.database
      .from('form_responses')
      .select('id, submitted_at, status, response_answers(question_id, value)')
      .eq('form_id', formId);

    if (responsesError) {
      throw new Error(responsesError.message);
    }

    const totalResponses = responses?.length || 0;
    const completedResponses = responses?.filter((r: any) => r.status === 'completed').length || 0;

    const questionStats: any = {};
    for (const question of formData.form_questions || []) {
      questionStats[question.id] = {
        label: question.label,
        type: question.type,
        total_answers: 0,
        values: [],
      };
    }

    for (const response of responses || []) {
      for (const answer of response.response_answers || []) {
        if (questionStats[answer.question_id]) {
          questionStats[answer.question_id].total_answers++;
          questionStats[answer.question_id].values.push(answer.value);
        }
      }
    }

    const statsSummary = Object.entries(questionStats).map(([id, stats]: [string, any]) => ({
      question_id: id,
      label: stats.label,
      type: stats.type,
      total_answers: stats.total_answers,
      sample_values: stats.values.slice(0, 5),
      unique_values: [...new Set(stats.values.map((v: any) => JSON.stringify(v)))].length,
    }));

    const systemPrompt = `You are an AI data analyst helping to analyze form responses. Here's the form data:

Form: ${formData.title}
Description: ${formData.description || 'No description'}
Total Responses: ${totalResponses}
Completed Responses: ${completedResponses}

Question Statistics:
${statsSummary.map((s: any) => `- ${s.label} (${s.type}): ${s.total_answers} answers, ${s.unique_values} unique values`).join('\n')}

Detailed Data:
${statsSummary.map((s: any) => `
${s.label}:
- Sample values: ${JSON.stringify(s.sample_values)}
`).join('\n')}

You can help with:
1. Summarizing response data
2. Identifying patterns and trends
3. Generating insights
4. Suggesting improvements based on response data
5. Creating visualizations descriptions

Always respond in the same language as the user's message. If the user writes in Arabic, respond in Arabic.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
    ];

    if (question) {
      messages.push({ role: 'user', content: question });
    } else {
      messages.push({ role: 'user', content: 'Please analyze the form responses and provide a summary of the key insights.' });
    }

    const aiResponse = await createChatCompletion(messages, 3000);

    const analysis = aiResponse.choices?.[0]?.message?.content;
    if (!analysis) {
      throw new Error('No response from AI');
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        stats: {
          total_responses: totalResponses,
          completed_responses: completedResponses,
          questions: statsSummary,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}
