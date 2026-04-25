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
    const insforge = createClient({
      baseUrl: Deno.env.get('INSGORGE_URL') ?? '',
      anonKey: Deno.env.get('INSGORGE_ANON_KEY') ?? '',
    });

    const { token, answers, metadata = {} } = await req.json();

    if (!token || !answers) {
      throw new Error('Missing token or answers');
    }

    const { data: publicForm, error: publicFormError } = await insforge.database.query('public_forms', {
      filter: { token },
      select: 'form_id',
    });

    if (publicFormError || !publicForm?.length) {
      throw new Error('Invalid form token');
    }

    const formId = publicForm[0].form_id;

    const { data: form, error: formError } = await insforge.database.query('forms', {
      filter: { id: formId },
      select: 'id, form_questions(id, type, label, required, settings)',
    });

    if (formError || !form?.length) {
      throw new Error('Form not found');
    }

    const formData = form[0];
    const questions = formData.form_questions || [];

    for (const question of questions) {
      if (question.required) {
        const answer = answers.find((a: any) => a.question_id === question.id);
        if (!answer || answer.value === null || answer.value === undefined || answer.value === '') {
          throw new Error(`Question "${question.label}" is required`);
        }
      }
    }

    const ipHash = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const { data: response, error: responseError } = await insforge.database.insert('form_responses', [{
      form_id: formId,
      status: 'completed',
      ip_hash: ipHash,
      geo: metadata.geo || {},
      utm: metadata.utm || {},
      metadata: metadata,
    }]);

    if (responseError) {
      throw new Error(responseError.message);
    }

    const responseId = response[0].id;

    if (answers.length > 0) {
      const answerRecords = answers.map((a: any) => ({
        response_id: responseId,
        question_id: a.question_id,
        value: a.value,
      }));

      const { error: answersError } = await insforge.database.insert('response_answers', answerRecords);

      if (answersError) {
        throw new Error(answersError.message);
      }
    }

    const { data: webhooks } = await insforge.database.query('webhook_configs', {
      filter: { form_id: formId, active: true },
    });

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
            .map(b => b.toString(16).padStart(2, '0'))
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

    await insforge.database.insert('form_analytics_events', [{
      form_id: formId,
      event_type: 'complete',
      metadata: { response_id: responseId },
    }]);

    return new Response(
      JSON.stringify({
        success: true,
        response_id: responseId,
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
