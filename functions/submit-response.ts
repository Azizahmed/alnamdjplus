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

const jsonResponse = (req: Request, body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });

const submissionWindow = new Map<string, number[]>();

const checkRateLimit = (key: string) => {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = Number(Deno.env.get('PUBLIC_SUBMIT_RATE_LIMIT_PER_MINUTE') || 12);
  const recent = (submissionWindow.get(key) || []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= maxRequests) {
    return false;
  }

  recent.push(now);
  submissionWindow.set(key, recent);
  return true;
};

const isPlainObject = (value: unknown) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const hasAnswerValue = (value: any) => {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) {
    if (typeof value.text === 'string') return value.text.trim().length > 0;
    if (value.number !== undefined) return value.number !== null && value.number !== '';
    if (Array.isArray(value.choices)) return value.choices.length > 0;
    if (value.rating !== undefined) return value.rating !== null && value.rating !== '';
    if (Array.isArray(value.files)) return value.files.length > 0;
    return Object.keys(value).length > 0;
  }
  return true;
};

const validateFileAnswer = (question: any, value: any) => {
  const files = Array.isArray(value?.files) ? value.files : [];
  const settings = question.settings || {};
  const maxSize = Number(settings.max_file_size || 10_485_760);
  const allowedTypes = Array.isArray(settings.file_types) ? settings.file_types : [];

  for (const file of files) {
    if (!file || typeof file !== 'object') {
      throw new Error(`Invalid file answer for "${question.label}"`);
    }

    const size = Number(file.size_bytes || file.size || 0);
    if (!Number.isFinite(size) || size <= 0 || size > maxSize) {
      throw new Error(`Uploaded file for "${question.label}" exceeds the allowed size`);
    }

    const contentType = String(file.content_type || file.mime_type || '');
    if (allowedTypes.length > 0 && contentType && !allowedTypes.includes(contentType)) {
      throw new Error(`Uploaded file type for "${question.label}" is not allowed`);
    }
  }
};

const normalizeStatus = (metadata: any) => metadata?.status === 'draft' ? 'draft' : 'completed';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    const maxBodyBytes = Number(Deno.env.get('PUBLIC_SUBMIT_MAX_BODY_BYTES') || 1_000_000);
    if (contentLength > maxBodyBytes) {
      throw new Error('Request body is too large');
    }

    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') ?? '',
      anonKey: Deno.env.get('ANON_KEY') ?? '',
    });

    const { token, answers, metadata = {} } = await req.json();

    if (!token || !Array.isArray(answers)) {
      throw new Error('Missing token or answers');
    }

    if (answers.length > 100) {
      throw new Error('Too many answers in one submission');
    }

    if (metadata?.website) {
      throw new Error('Invalid submission');
    }

    const ipAddress = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown')
      .split(',')[0]
      .trim();
    const rateLimitKey = `${token}:${metadata?.session_id || ipAddress}`;
    if (!checkRateLimit(rateLimitKey)) {
      return jsonResponse(req, { error: 'Too many submissions. Please try again later.' }, 429);
    }

    const { data: publicForm, error: publicFormError } = await insforge.database
      .from('public_forms')
      .select('form_id')
      .eq('token', token)
      .single();

    if (publicFormError || !publicForm) {
      throw new Error('Invalid form token');
    }

    const formId = publicForm.form_id;

    const { data: form, error: formError } = await insforge.database
      .from('forms')
      .select('id, form_questions(id, type, label, required, settings)')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      throw new Error('Form not found');
    }

    const questions = form.form_questions || [];
    const questionById = new Map(questions.map((question: any) => [question.id, question]));
    const answerByQuestionId = new Map<string, any>();

    for (const answer of answers) {
      if (!answer?.question_id || !questionById.has(answer.question_id)) {
        throw new Error('Submission contains an unknown question');
      }

      if (JSON.stringify(answer.value || {}).length > 20_000) {
        throw new Error('Answer is too large');
      }

      const question = questionById.get(answer.question_id);
      if (question.type === 'file_upload') {
        validateFileAnswer(question, answer.value);
      }

      answerByQuestionId.set(answer.question_id, answer.value);
    }

    const status = normalizeStatus(metadata);
    if (status === 'completed') {
      for (const question of questions) {
        if (question.required && !hasAnswerValue(answerByQuestionId.get(question.id))) {
          throw new Error(`Question "${question.label}" is required`);
        }
      }
    }

    const responseMetadata = {
      session_id: typeof metadata.session_id === 'string' ? metadata.session_id.slice(0, 128) : undefined,
      form_version: metadata.form_version,
    };

    const { data: response, error: responseError } = await insforge.database
      .from('form_responses')
      .insert([{
        form_id: formId,
        status,
        ip_hash: ipAddress,
        geo: {},
        utm: metadata.utm || {},
        metadata: responseMetadata,
      }])
      .select();

    if (responseError) {
      throw new Error(responseError.message);
    }

    const responseId = response?.[0]?.id;
    if (!responseId) {
      throw new Error('Failed to create response');
    }

    if (answers.length > 0) {
      const answerRecords = answers.map((answer: any) => ({
        response_id: responseId,
        question_id: answer.question_id,
        value: answer.value,
      }));

      const { error: answersError } = await insforge.database
        .from('response_answers')
        .insert(answerRecords);

      if (answersError) {
        throw new Error(answersError.message);
      }
    }

    if (status === 'completed') {
      const { data: webhooks } = await insforge.database
        .from('webhook_configs')
        .select()
        .eq('form_id', formId)
        .eq('active', true);

      if (webhooks?.length) {
        for (const webhook of webhooks) {
          try {
            const webhookPayload = {
              form_id: formId,
              response_id: responseId,
              answers: answers,
              submitted_at: new Date().toISOString(),
            };

            const signature = await crypto.subtle.digest(
              'SHA-256',
              new TextEncoder().encode(JSON.stringify(webhookPayload) + (webhook.secret || ''))
            );

            const signatureHex = Array.from(new Uint8Array(signature))
              .map((byte) => byte.toString(16).padStart(2, '0'))
              .join('');

            await fetch(webhook.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signatureHex,
              },
              body: JSON.stringify(webhookPayload),
            });
          } catch (webhookError) {
            console.error(`Webhook ${webhook.url} failed:`, webhookError);
          }
        }
      }

      await insforge.database
        .from('form_analytics_events')
        .insert([{ form_id: formId, event_type: 'complete', metadata: { response_id: responseId } }]);
    }

    return jsonResponse(req, {
      success: true,
      response_id: responseId,
      status,
    });
  } catch (error) {
    return jsonResponse(req, { error: error instanceof Error ? error.message : 'Submission failed' }, 400);
  }
}
