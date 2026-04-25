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

    const { formId, message, history = [] } = await req.json();

    if (!formId || !message) {
      throw new Error('Missing formId or message');
    }

    const { data: form, error: formError } = await insforge.database
      .from('forms')
      .select('id, title, description, form_questions(id, type, label, description, required, order, settings), conditional_rules(id, question_id, target_question_id, condition, action)')
      .eq('id', formId)
      .eq('user_id', userData.user.id);

    if (formError || !form?.length) {
      throw new Error('Form not found or access denied');
    }

    const formData = form[0];
    const formContext = `
Form: ${formData.title}
Description: ${formData.description || 'No description'}
Questions:
${formData.form_questions?.map((q: any) => `- ${q.order + 1}. ${q.label} (${q.type})${q.required ? ' [Required]' : ''}${q.description ? ` - ${q.description}` : ''}`).join('\n') || 'No questions'}
Conditional Rules:
${formData.conditional_rules?.map((r: any) => {
  const sourceQ = formData.form_questions?.find((q: any) => q.id === r.question_id);
  const targetQ = formData.form_questions?.find((q: any) => q.id === r.target_question_id);
  return `- ${sourceQ?.label || 'Unknown'} ${r.action === 'show' ? 'shows' : 'hides'} ${targetQ?.label || 'Unknown'} when ${JSON.stringify(r.condition)}`;
}).join('\n') || 'No conditional rules'}
`;

    const systemPrompt = `You are an AI assistant helping to build and manage forms. You have access to the following form data:

${formContext}

You can help with:
1. Adding new questions to the form
2. Modifying existing questions
3. Adding conditional logic
4. Analyzing form structure
5. Suggesting improvements

When the user asks to add or modify questions, respond with a JSON action block:
{
  "action": "add_question|edit_question|add_rule",
  "data": {
    // For add_question:
    "type": "question_type",
    "label": "Question label",
    "description": "Optional description",
    "required": true/false,
    "settings": {}
    
    // For edit_question:
    "question_id": "uuid",
    "updates": { "label": "new label", ... }
    
    // For add_rule:
    "source_question_id": "uuid",
    "target_question_id": "uuid",
    "condition": { ... },
    "action": "show|hide"
  }
}

Always respond in the same language as the user's message. If the user writes in Arabic, respond in Arabic.`;

    await insforge.database
      .from('chat_messages')
      .insert({ form_id: formId, user_id: userData.user.id, role: 'user', content: message });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const aiResponse = await insforge.ai.chat({
      messages,
      model: 'openai/gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2000,
    });

    if (aiResponse.error) {
      throw new Error(aiResponse.error.message);
    }

    const assistantMessage = aiResponse.data?.choices?.[0]?.message?.content;
    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    await insforge.database
      .from('chat_messages')
      .insert({ form_id: formId, user_id: userData.user.id, role: 'assistant', content: assistantMessage });

    let action = null;
    try {
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action && parsed.data) {
          action = parsed;
        }
      }
    } catch (e) {
    }

    if (action) {
      switch (action.action) {
        case 'add_question': {
          const maxOrder = Math.max(...(formData.form_questions?.map((q: any) => q.order) || [-1]));
          await insforge.database
            .from('form_questions')
            .insert({
              form_id: formId,
              type: action.data.type,
              label: action.data.label,
              description: action.data.description || null,
              required: action.data.required || false,
              order: maxOrder + 1,
              settings: action.data.settings || {},
            });
          break;
        }
        case 'edit_question': {
          await insforge.database
            .from('form_questions')
            .update(action.data.updates)
            .eq('id', action.data.question_id);
          break;
        }
        case 'add_rule': {
          await insforge.database
            .from('conditional_rules')
            .insert({
              question_id: action.data.source_question_id,
              target_question_id: action.data.target_question_id,
              condition: action.data.condition,
              action: action.data.action,
            });
          break;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
        action: action,
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
