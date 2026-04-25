import { createClient } from 'https://esm.sh/@insforge/sdk@latest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

Generate appropriate question types based on the user's request. Include validation rules, options for choice questions, and conditional logic where appropriate.

Language: ${language}`;

    const aiResponse = await insforge.ai.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      model: 'openai/gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 4000,
    });

    if (aiResponse.error) {
      throw new Error(aiResponse.error.message);
    }

    const content = aiResponse.data?.choices?.[0]?.message?.content;
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
      .insert({
        user_id: userData.user.id,
        title: formData.title,
        description: formData.description,
        settings: {},
      })
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
      .insert({ form_id: formId, token, settings: {} });

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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}
