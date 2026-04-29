import { getCorsHeaders, optionsResponse } from './_shared/http.ts';
import { createAuthenticatedInsforgeClient } from './_shared/insforge.ts';
import { createChatCompletion } from './_shared/openrouter.ts';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { insforge, user } = await createAuthenticatedInsforgeClient(req);

    const { formId, message, history = [] } = await req.json();

    if (!formId || !message) {
      throw new Error('Missing formId or message');
    }

    const { data: form, error: formError } = await insforge.database
      .from('forms')
      .select('id, title, description, form_questions(id, type, label, description, required, order, settings)')
      .eq('id', formId)
      .eq('user_id', user.id);

    if (formError || !form?.length) {
      throw new Error('Form not found or access denied');
    }

    const formData = form[0];
    const questions = (formData.form_questions || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    const questionIds = questions.map((q: any) => q.id);

    let conditionalRules: any[] = [];
    if (questionIds.length > 0) {
      const { data: rules, error: rulesError } = await insforge.database
        .from('conditional_rules')
        .select('id, question_id, target_question_id, condition, action')
        .in('question_id', questionIds);

      if (rulesError) {
        throw new Error(rulesError.message || 'Failed to load conditional rules');
      }

      conditionalRules = rules || [];
    }

    const formContext = `
Form: ${formData.title}
Description: ${formData.description || 'No description'}
Questions:
${questions.map((q: any) => `- ${(q.order ?? 0) + 1}. ${q.label} (${q.type})${q.required ? ' [Required]' : ''}${q.description ? ` - ${q.description}` : ''}`).join('\n') || 'No questions'}
Conditional Rules:
${conditionalRules.map((r: any) => {
  const sourceQ = questions.find((q: any) => q.id === r.question_id);
  const targetQ = questions.find((q: any) => q.id === r.target_question_id);
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
      .insert([{ form_id: formId, user_id: user.id, role: 'user', content: message }]);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const aiResponse = await createChatCompletion(messages, 2000);

    const assistantMessage = aiResponse.choices?.[0]?.message?.content;
    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    await insforge.database
      .from('chat_messages')
      .insert([{ form_id: formId, user_id: user.id, role: 'assistant', content: assistantMessage }]);

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
          const maxOrder = Math.max(...(questions.map((q: any) => q.order) || [-1]));
          await insforge.database
            .from('form_questions')
            .insert([{
              form_id: formId,
              type: action.data.type,
              label: action.data.label,
              description: action.data.description || null,
              required: action.data.required || false,
              order: maxOrder + 1,
              settings: action.data.settings || {},
            }]);
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
            .insert([{
              question_id: action.data.source_question_id,
              target_question_id: action.data.target_question_id,
              condition: action.data.condition,
              action: action.data.action,
            }]);
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
    console.error('form-chat failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' || message === 'Missing authorization header'
      ? 401
      : message === 'Missing formId or message'
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
