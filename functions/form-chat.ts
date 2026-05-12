import { createClient } from 'https://esm.sh/@insforge/sdk@latest';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || Deno.env.get('APP_URL') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QUESTION_TYPES = new Set([
  'short_answer',
  'long_answer',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'multi_select',
  'number',
  'email',
  'phone',
  'link',
  'file_upload',
  'date',
  'time',
  'linear_scale',
  'matrix',
  'rating',
  'signature',
  'ranking',
]);
const SELECTABLE_TYPES = new Set(['multiple_choice', 'checkboxes', 'dropdown', 'multi_select']);
const ACTION_ALIASES: Record<string, string> = {
  add_field: 'add_question',
  create_question: 'add_question',
  create_field: 'add_question',
  update_question: 'edit_question',
  modify_question: 'edit_question',
  edit_field: 'edit_question',
  update_field: 'edit_question',
  delete_field: 'delete_question',
  remove_question: 'delete_question',
  remove_field: 'delete_question',
  update_form_metadata: 'update_form',
  add_condition: 'add_rule',
  create_rule: 'add_rule',
  delete_condition: 'delete_rule',
  remove_rule: 'delete_rule',
};

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowOrigin = allowedOrigins.includes(origin) || isLocalhost
    ? origin
    : (allowedOrigins[0] || 'null');

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
};

const optionsResponse = (req: Request) =>
  new Response(null, { status: 204, headers: getCorsHeaders(req) });

const createPublicInsforgeClient = () =>
  createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL') ?? '',
    anonKey: Deno.env.get('ANON_KEY') ?? '',
  });

const createAuthenticatedInsforgeClient = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const insforge = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL') ?? '',
    edgeFunctionToken: authHeader.replace('Bearer ', ''),
  });

  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  return {
    insforge,
    user: userData.user,
  };
};

const createOpenRouterCompletion = async (messages: any[], maxTokens: number) => {
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

const createAssistantCompletion = async (messages: any[], maxTokens: number) => {
  const aiClient = createPublicInsforgeClient();
  const insforgeModel = Deno.env.get('INSFORGE_AI_MODEL') || 'moonshotai/kimi-k2.5';

  try {
    return await aiClient.ai.chat.completions.create({
      model: insforgeModel,
      messages,
      temperature: 0.7,
      maxTokens,
    });
  } catch (insforgeAiError) {
    console.error('InsForge AI request failed, trying OpenRouter fallback:', insforgeAiError);
  }

  return createOpenRouterCompletion(messages, maxTokens);
};

const isRecord = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const firstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const normalizeQuestionType = (value: unknown) => {
  const questionType = typeof value === 'string' ? value.trim() : '';
  return QUESTION_TYPES.has(questionType) ? questionType : 'short_answer';
};

const normalizeOptionList = (value: unknown) =>
  Array.isArray(value)
    ? value.map((option) => String(option).trim()).filter(Boolean)
    : [];

const normalizeQuestionSettings = (
  questionType: string,
  settingsValue: unknown,
  sourceValue: Record<string, any> = {}
) => {
  const settings = isRecord(settingsValue) ? { ...settingsValue } : {};
  const options = [
    ...normalizeOptionList(sourceValue.options),
    ...normalizeOptionList(sourceValue.choices),
    ...normalizeOptionList(settings.options),
    ...normalizeOptionList(settings.choices),
  ];
  const uniqueOptions = [...new Set(options)];

  if (uniqueOptions.length > 0) {
    settings.choices = uniqueOptions;
    settings.options = uniqueOptions;
  } else if (SELECTABLE_TYPES.has(questionType)) {
    settings.choices = ['Option 1', 'Option 2', 'Option 3'];
    settings.options = settings.choices;
  }

  if (questionType === 'ranking' && !Array.isArray(settings.ranking_items)) {
    settings.ranking_items = uniqueOptions.length > 0 ? uniqueOptions : ['Item 1', 'Item 2', 'Item 3'];
  }

  if (questionType === 'matrix') {
    if (!Array.isArray(settings.rows)) settings.rows = ['Row 1', 'Row 2'];
    if (!Array.isArray(settings.columns)) settings.columns = ['Column 1', 'Column 2', 'Column 3'];
  }

  if (questionType === 'linear_scale') {
    if (settings.min_value === undefined) settings.min_value = 1;
    if (settings.max_value === undefined) settings.max_value = 5;
  }

  if (questionType === 'rating' && settings.max_value === undefined) {
    settings.max_value = 5;
  }

  return settings;
};

const getQuestionLabel = (question: any) => String(question?.label || '').trim();

const resolveQuestion = (
  questions: any[],
  data: Record<string, any>,
  idKeys = ['question_id', 'id', 'target_question_id'],
  labelKeys = ['question_label', 'target_label', 'current_label']
) => {
  const questionId = firstString(...idKeys.map((key) => data[key]));
  if (questionId) {
    const match = questions.find((question) => String(question.id) === questionId);
    if (match) return match;
  }

  const label = firstString(...labelKeys.map((key) => data[key]));
  if (!label) return null;

  const normalizedLabel = label.toLocaleLowerCase();
  return questions.find((question) => getQuestionLabel(question).toLocaleLowerCase() === normalizedLabel)
    || questions.find((question) => getQuestionLabel(question).toLocaleLowerCase().includes(normalizedLabel));
};

const normalizeQuestionUpdatePayload = (data: Record<string, any>, currentType: string) => {
  const source = isRecord(data.updates) ? data.updates : data;
  const updates: Record<string, any> = {};
  const nextType = source.type || source.question_type;
  const questionType = nextType ? normalizeQuestionType(nextType) : currentType;
  const label = firstString(source.label, source.question_text, source.text, source.title);

  if (label) updates.label = label;
  if ('description' in source) updates.description = source.description || null;
  if ('required' in source) updates.required = Boolean(source.required);
  if (nextType) updates.type = questionType;
  if (Number.isFinite(Number(source.order))) updates.order = Number(source.order);

  const hasSettingsPatch = isRecord(source.settings)
    || 'options' in source
    || 'choices' in source
    || 'rows' in source
    || 'columns' in source
    || 'ranking_items' in source
    || 'min_value' in source
    || 'max_value' in source;

  if (hasSettingsPatch) {
    updates.settings = normalizeQuestionSettings(questionType, source.settings, source);
  }

  return updates;
};

const assertDbSuccess = (result: any, fallbackMessage: string) => {
  if (result?.error) {
    throw new Error(result.error.message || fallbackMessage);
  }
};

const extractJsonSnippets = (text: string) => {
  const snippets: string[] = [];

  for (let start = 0; start < text.length; start += 1) {
    const opener = text[start];
    if (opener !== '{' && opener !== '[') continue;

    const stack = [opener];
    let inString = false;
    let escaped = false;

    for (let index = start + 1; index < text.length; index += 1) {
      const char = text[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ']') {
        const expected = char === '}' ? '{' : '[';
        if (stack[stack.length - 1] !== expected) break;

        stack.pop();
        if (stack.length === 0) {
          snippets.push(text.slice(start, index + 1));
          start = index;
          break;
        }
      }
    }
  }

  return snippets;
};

const actionsFromParsedJson = (parsed: any) => {
  if (Array.isArray(parsed)) return parsed;
  if (isRecord(parsed) && Array.isArray(parsed.actions)) return parsed.actions;
  if (isRecord(parsed) && parsed.action) return [parsed];
  return [];
};

const normalizeAction = (rawAction: any) => {
  if (!isRecord(rawAction)) return null;

  const rawName = String(rawAction.action || rawAction.type || rawAction.name || '').trim().toLocaleLowerCase();
  const action = ACTION_ALIASES[rawName] || rawName;
  const data = isRecord(rawAction.data) ? rawAction.data : rawAction;

  if (!action) return null;
  return { action, data };
};

const parseAssistantActions = (assistantMessage: string) => {
  const candidates: string[] = [];
  const taggedMatches = assistantMessage.matchAll(/<form_actions>([\s\S]*?)<\/form_actions>/gi);
  for (const match of taggedMatches) candidates.push(match[1]);

  const fencedMatches = assistantMessage.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);
  for (const match of fencedMatches) candidates.push(match[1]);

  candidates.push(...extractJsonSnippets(assistantMessage));

  for (const candidate of candidates) {
    try {
      const actions = actionsFromParsedJson(JSON.parse(candidate.trim()))
        .map(normalizeAction)
        .filter(Boolean);

      if (actions.length > 0) return actions;
    } catch (_error) {
    }
  }

  return [];
};

const removeActionMarkup = (assistantMessage: string, hasActions: boolean) => {
  let cleaned = assistantMessage
    .replace(/<form_actions>[\s\S]*?<\/form_actions>/gi, '')
    .replace(/```(?:json)?\s*([\s\S]*?)```/gi, (match, inner) => {
      try {
        return actionsFromParsedJson(JSON.parse(inner.trim())).length > 0 ? '' : match;
      } catch (_error) {
        return match;
      }
    })
    .trim();

  if (hasActions) {
    for (const snippet of extractJsonSnippets(cleaned)) {
      try {
        if (actionsFromParsedJson(JSON.parse(snippet.trim())).length > 0) {
          cleaned = cleaned.replace(snippet, '').trim();
        }
      } catch (_error) {
      }
    }

    try {
      if (actionsFromParsedJson(JSON.parse(cleaned || 'null')).length > 0) {
        cleaned = '';
      }
    } catch (_error) {
    }
  }

  return cleaned;
};

const buildActionConfirmation = (actions: any[], userMessage: string) => {
  const isArabic = /[\u0600-\u06FF]/.test(userMessage);
  if (!isArabic) return actions.length > 1 ? 'Done. I updated the form.' : 'Done. I updated the form.';

  if (actions.length !== 1) return 'تم تحديث النموذج.';

  switch (actions[0].action) {
    case 'add_question':
      return 'تمت إضافة السؤال إلى النموذج.';
    case 'edit_question':
      return 'تم تعديل السؤال في النموذج.';
    case 'delete_question':
      return 'تم حذف السؤال من النموذج.';
    case 'update_form':
      return 'تم تحديث بيانات النموذج.';
    case 'add_rule':
      return 'تمت إضافة الشرط إلى النموذج.';
    case 'delete_rule':
      return 'تم حذف الشرط من النموذج.';
    default:
      return 'تم تحديث النموذج.';
  }
};

const applyFormAction = async (
  insforge: any,
  formId: string,
  userId: string,
  questions: any[],
  conditionalRules: any[],
  normalizedAction: { action: string; data: Record<string, any> }
) => {
  const { action, data } = normalizedAction;

  switch (action) {
    case 'add_question': {
      const questionType = normalizeQuestionType(data.type || data.question_type);
      const label = firstString(data.label, data.question_text, data.text, data.title) || 'New Question';
      const order = Number.isFinite(Number(data.order))
        ? Number(data.order)
        : Math.max(-1, ...questions.map((question) => Number(question.order ?? 0))) + 1;
      const payload = {
        form_id: formId,
        type: questionType,
        label,
        description: data.description || null,
        required: Boolean(data.required),
        order,
        settings: normalizeQuestionSettings(questionType, data.settings, data),
      };
      const result = await insforge.database.from('form_questions').insert([payload]).select();
      assertDbSuccess(result, 'Failed to add question');

      const createdQuestion = Array.isArray(result.data) ? result.data[0] : result.data;
      if (createdQuestion) questions.push(createdQuestion);
      return { action, question_id: createdQuestion?.id, label };
    }

    case 'edit_question': {
      const targetQuestion = resolveQuestion(questions, data);
      if (!targetQuestion) throw new Error('Question not found for edit action');

      const updates = normalizeQuestionUpdatePayload(data, targetQuestion.type || 'short_answer');
      if (Object.keys(updates).length === 0) {
        throw new Error('No supported question updates were provided');
      }

      const result = await insforge.database
        .from('form_questions')
        .update(updates)
        .eq('id', targetQuestion.id)
        .eq('form_id', formId)
        .select();
      assertDbSuccess(result, 'Failed to edit question');
      Object.assign(targetQuestion, updates);

      return { action, question_id: targetQuestion.id, updates };
    }

    case 'delete_question': {
      const targetQuestion = resolveQuestion(
        questions,
        data,
        ['question_id', 'id', 'target_question_id'],
        ['question_label', 'target_label', 'label', 'question_text', 'text']
      );
      if (!targetQuestion) throw new Error('Question not found for delete action');

      const result = await insforge.database
        .from('form_questions')
        .delete()
        .eq('id', targetQuestion.id)
        .eq('form_id', formId);
      assertDbSuccess(result, 'Failed to delete question');

      const questionIndex = questions.findIndex((question) => String(question.id) === String(targetQuestion.id));
      if (questionIndex >= 0) questions.splice(questionIndex, 1);

      return { action, question_id: targetQuestion.id, label: targetQuestion.label };
    }

    case 'update_form': {
      const updates: Record<string, any> = {};
      const title = firstString(data.title, data.name);
      const description = firstString(data.description);

      if (title) updates.title = title;
      if ('description' in data) updates.description = description || null;
      if (isRecord(data.settings)) updates.settings = data.settings;
      if (Object.keys(updates).length === 0) throw new Error('No supported form updates were provided');

      const result = await insforge.database
        .from('forms')
        .update(updates)
        .eq('id', formId)
        .eq('user_id', userId)
        .select();
      assertDbSuccess(result, 'Failed to update form');

      return { action, updates };
    }

    case 'add_rule': {
      const sourceQuestion = resolveQuestion(
        questions,
        data,
        ['source_question_id', 'question_id'],
        ['source_question_label', 'source_label', 'question_label']
      );
      const targetQuestion = resolveQuestion(
        questions,
        data,
        ['target_question_id'],
        ['target_question_label', 'target_label']
      );

      if (!sourceQuestion || !targetQuestion) throw new Error('Question not found for conditional rule');
      if (!isRecord(data.condition)) throw new Error('Conditional rule is missing a valid condition');

      const result = await insforge.database
        .from('conditional_rules')
        .insert([{
          question_id: sourceQuestion.id,
          target_question_id: targetQuestion.id,
          condition: data.condition,
          action: data.rule_action || data.visibility_action || data.action || 'show',
        }])
        .select();
      assertDbSuccess(result, 'Failed to add conditional rule');

      const createdRule = Array.isArray(result.data) ? result.data[0] : result.data;
      if (createdRule) conditionalRules.push(createdRule);

      return { action, rule_id: createdRule?.id };
    }

    case 'delete_rule': {
      const ruleId = firstString(data.rule_id, data.id);
      const sourceQuestion = resolveQuestion(
        questions,
        data,
        ['source_question_id', 'question_id'],
        ['source_question_label', 'source_label', 'question_label']
      );
      const targetQuestion = resolveQuestion(
        questions,
        data,
        ['target_question_id'],
        ['target_question_label', 'target_label']
      );
      const targetRule = ruleId
        ? conditionalRules.find((rule) => String(rule.id) === ruleId)
        : conditionalRules.find((rule) =>
          (!sourceQuestion || rule.question_id === sourceQuestion.id)
          && (!targetQuestion || rule.target_question_id === targetQuestion.id)
        );

      if (!targetRule) throw new Error('Conditional rule not found for delete action');

      const result = await insforge.database
        .from('conditional_rules')
        .delete()
        .eq('id', targetRule.id);
      assertDbSuccess(result, 'Failed to delete conditional rule');

      const ruleIndex = conditionalRules.findIndex((rule) => String(rule.id) === String(targetRule.id));
      if (ruleIndex >= 0) conditionalRules.splice(ruleIndex, 1);

      return { action, rule_id: targetRule.id };
    }

    default:
      throw new Error(`Unsupported form action: ${action}`);
  }
};

export default async function handler(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();

  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { insforge, user } = await createAuthenticatedInsforgeClient(req);

    const { formId: rawFormId, message, history = [], mode = 'builder' } = await req.json();
    const formId = String(rawFormId ?? '').trim();
    console.log('form-chat request', {
      requestId,
      formId,
      rawFormIdType: typeof rawFormId,
      formIdValid: UUID_PATTERN.test(formId),
      mode,
      messageType: typeof message,
      messageLength: typeof message === 'string' ? message.length : null,
      historyCount: Array.isArray(history) ? history.length : null,
    });

    if (!formId || !message) {
      throw new Error('Missing formId or message');
    }

    if (!UUID_PATTERN.test(formId)) {
      console.error('Invalid form-chat formId', {
        requestId,
        type: typeof rawFormId,
        value: String(rawFormId ?? '').slice(0, 80),
        mode,
      });
      throw new Error('Invalid formId');
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
    const isResponseMode = mode === 'responses' || mode === 'analytics';

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
${questions.map((q: any) => `- order: ${q.order ?? 0}, question_id: ${q.id}, label: "${q.label}", type: ${q.type}, required: ${Boolean(q.required)}, description: ${q.description ? `"${q.description}"` : 'none'}, settings: ${JSON.stringify(q.settings || {})}`).join('\n') || 'No questions'}
Conditional Rules:
${conditionalRules.map((r: any) => {
  const sourceQ = questions.find((q: any) => q.id === r.question_id);
  const targetQ = questions.find((q: any) => q.id === r.target_question_id);
  return `- rule_id: ${r.id}, source_question_id: ${r.question_id}, source_label: "${sourceQ?.label || 'Unknown'}", target_question_id: ${r.target_question_id}, target_label: "${targetQ?.label || 'Unknown'}", visibility_action: ${r.action}, condition: ${JSON.stringify(r.condition)}`;
}).join('\n') || 'No conditional rules'}
`;

    let responseContext = '';
    if (isResponseMode) {
      const { data: responses, error: responsesError } = await insforge.database
        .from('form_responses')
        .select('id, submitted_at, status, response_answers(question_id, value)')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false })
        .limit(200);

      if (responsesError) {
        throw new Error(responsesError.message || 'Failed to load responses');
      }

      const completedResponses = (responses || []).filter((response: any) => response.status === 'completed');
      const questionStats = questions.map((question: any) => {
        const values = (responses || [])
          .flatMap((response: any) => response.response_answers || [])
          .filter((answer: any) => answer.question_id === question.id)
          .map((answer: any) => answer.value);

        return {
          label: question.label,
          type: question.type,
          total_answers: values.length,
          sample_values: values.slice(0, 8),
          unique_values: new Set(values.map((value: any) => JSON.stringify(value))).size,
        };
      });

      responseContext = `
Response Data:
- Total responses loaded: ${(responses || []).length}
- Completed responses: ${completedResponses.length}
- Draft/partial responses: ${(responses || []).length - completedResponses.length}
- Latest response timestamps: ${(responses || []).slice(0, 5).map((response: any) => `${response.submitted_at} (${response.status})`).join(', ') || 'None'}

Question answer summaries:
${questionStats.map((stats: any) => `- ${stats.label} (${stats.type}): ${stats.total_answers} answers, ${stats.unique_values} unique values. Samples: ${JSON.stringify(stats.sample_values)}`).join('\n') || 'No answers yet'}
`;
    }

    const systemPrompt = isResponseMode
      ? `You are an AI data analyst helping analyze form responses. You have access to this form and response data:

${formContext}
${responseContext}

Answer questions about the response results, patterns, summaries, completion state, and notable insights. Do not suggest editing the form unless the user explicitly asks for improvement ideas. Always respond in the same language as the user's message. If the user writes in Arabic, respond in Arabic.`
      : `You are an AI assistant helping to build and manage forms. You have access to the following form data:

${formContext}

You can help with:
1. Adding new questions to the form
2. Modifying existing questions
3. Deleting existing questions
4. Updating the form title/description
5. Adding or deleting conditional logic
6. Analyzing form structure and suggesting improvements

When the user asks to change the form, include a valid JSON action block at the end of your reply using exactly this wrapper:
<form_actions>
{"actions":[{"action":"add_question|edit_question|delete_question|update_form|add_rule|delete_rule","data":{}}]}
</form_actions>

Rules for form actions:
- Use only valid JSON: no comments, no Markdown inside the action block.
- For existing questions, always use the exact question_id from the context. Do not invent IDs.
- Supported question types: short_answer, long_answer, multiple_choice, checkboxes, dropdown, multi_select, number, email, phone, link, file_upload, date, time, linear_scale, matrix, rating, signature, ranking.
- add_question data: type, label, description, required, settings, options or choices.
- edit_question data: question_id, updates. Supported updates: label, description, required, type, order, settings, options or choices.
- delete_question data: question_id.
- update_form data: title, description, settings.
- add_rule data: source_question_id, target_question_id, condition, visibility_action ("show" or "hide").
- delete_rule data: rule_id.
- If the user is only asking a question or for advice, do not include form_actions.

Always respond in the same language as the user's message. If the user writes in Arabic, respond in Arabic.`;

    await insforge.database
      .from('chat_messages')
      .insert([{ form_id: formId, user_id: user.id, role: 'user', content: message }]);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-12).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const aiResponse = await createAssistantCompletion(messages, isResponseMode ? 3000 : 2000);

    const assistantMessage = aiResponse.choices?.[0]?.message?.content;
    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    const requestedActions = isResponseMode ? [] : parseAssistantActions(assistantMessage);
    const appliedActions: any[] = [];

    for (const requestedAction of requestedActions) {
      appliedActions.push(await applyFormAction(
        insforge,
        formId,
        user.id,
        questions,
        conditionalRules,
        requestedAction
      ));
    }

    const cleanedAssistantMessage = requestedActions.length > 0
      ? removeActionMarkup(assistantMessage, true) || buildActionConfirmation(appliedActions, message)
      : assistantMessage;

    await insforge.database
      .from('chat_messages')
      .insert([{ form_id: formId, user_id: user.id, role: 'assistant', content: cleanedAssistantMessage }]);

    return new Response(
      JSON.stringify({
        success: true,
        message: cleanedAssistantMessage,
        action: appliedActions[0] || null,
        actions: appliedActions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('form-chat failed:', { requestId, error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' || message === 'Missing authorization header'
      ? 401
      : message === 'Missing formId or message' || message === 'Invalid formId' || message === 'Form not found or access denied'
        ? 400
        : 500;
    const code = status === 401
      ? 'UNAUTHORIZED'
      : status === 400
        ? 'BAD_REQUEST'
        : 'FUNCTION_ERROR';

    return new Response(
      JSON.stringify({ error: code, message, statusCode: status, requestId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    );
  }
}
