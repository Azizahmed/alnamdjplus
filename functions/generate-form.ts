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

    const { prompt, language = 'ar' } = await req.json();

    if (!prompt) {
      throw new Error('Missing prompt');
    }

    const systemPrompt = `You are an AI form builder assistant. Generate a complete form structure based on the user's description.

Return a JSON object with the following structure:
{
  "title": "Form title",
  "description": "Form description",
  "questions": [
    {
      "type": "short_answer|long_answer|multiple_choice|checkboxes|dropdown|multi_select|number|email|phone|link|file_upload|date|time|linear_scale|matrix|rating|payment|signature|ranking|wallet_connect",
      "label": "Question label",
      "description": "Optional description",
      "required": true/false,
      "settings": {
        "placeholder": "Optional placeholder",
        "options": ["option1", "option2"],
        "min": 0,
        "max": 10,
        "min_label": "Low",
        "max_label": "High"
      }
    }
  ],
  "conditional_rules": [
    {
      "source_question_index": 0,
      "target_question_index": 1,
      "condition": { "operator": "equals", "value": "option1" },
      "action": "show|hide"
    }
  ]
}

Generate 5 to 8 high-quality questions unless the user explicitly asks for more. Include validation rules, options for choice questions, and conditional logic only when it clearly improves the form.

Language: ${language}`;

    const aiResponse = await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      2500
    );

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let formData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        formData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response');
      }
    } catch (e) {
      throw new Error('Failed to parse AI response');
    }

    const { data: form, error: formError } = await insforge.database
      .from('forms')
      .insert([{
        user_id: userData.user.id,
        title: formData.title,
        description: formData.description,
        settings: {},
      }])
      .select();

    if (formError) {
      throw new Error(formError.message);
    }

    const formId = form[0].id;

    if (formData.questions && formData.questions.length > 0) {
      const questions = formData.questions.map((q: any, index: number) => ({
        form_id: formId,
        type: q.type,
        label: q.label,
        description: q.description || null,
        required: q.required || false,
        order: index,
        settings: q.settings || {},
      }));

      const { data: insertedQuestions, error: questionsError } = await insforge.database
        .from('form_questions')
        .insert(questions)
        .select();

      if (questionsError) {
        throw new Error(questionsError.message);
      }

      if (formData.conditional_rules && formData.conditional_rules.length > 0 && insertedQuestions) {
        const rules = formData.conditional_rules.map((rule: any) => ({
          question_id: insertedQuestions[rule.source_question_index].id,
          target_question_id: insertedQuestions[rule.target_question_index].id,
          condition: rule.condition,
          action: rule.action,
        }));

        const { error: rulesError } = await insforge.database
          .from('conditional_rules')
          .insert(rules);

        if (rulesError) {
          console.error('Failed to insert conditional rules:', rulesError);
        }
      }
    }

    const token = crypto.randomUUID().replace(/-/g, '');
    const { error: publicError } = await insforge.database
      .from('public_forms')
      .insert([{ form_id: formId, token, settings: {} }]);

    if (publicError) {
      console.error('Failed to create public form:', publicError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        form_id: formId,
        token: token,
        title: formData.title,
        description: formData.description,
        questions_count: formData.questions?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('generate-form failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' || message === 'Missing authorization header'
      ? 401
      : message === 'Missing prompt'
        ? 400
        : 500;

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    );
  }
}
