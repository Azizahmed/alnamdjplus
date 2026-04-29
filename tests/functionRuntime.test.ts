import { createChatCompletion } from '../functions/_shared/openrouter.ts';
import { getCorsHeaders, jsonResponse } from '../functions/_shared/http.ts';

const req = new Request('https://example.test/function', {
  method: 'POST',
  headers: {
    Origin: 'http://localhost:5174',
  },
});

const corsHeaders = getCorsHeaders(req, {
  get: (key) => key === 'APP_URL' ? 'https://alnamdjplus.app' : undefined,
});

if (corsHeaders['Access-Control-Allow-Origin'] !== 'http://localhost:5174') {
  throw new Error('local development origin should be allowed');
}

const response = jsonResponse(req, { success: true }, 201, {
  get: () => 'https://alnamdjplus.app',
});

if (response.status !== 201 || response.headers.get('Content-Type') !== 'application/json') {
  throw new Error('jsonResponse should set status and JSON headers');
}

const calls: unknown[] = [];
const completion = await createChatCompletion(
  [{ role: 'user', content: 'hello' }],
  {
    maxTokens: 100,
    temperature: 0.2,
    env: {
      get: (key) => ({
        OPENROUTER_API_KEY: 'sk-test',
        OPENROUTER_MODEL: 'openai/gpt-4o-mini',
        APP_URL: 'https://alnamdjplus.app',
      })[key],
    },
    fetcher: async (_url, init) => {
      calls.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'ok' } }],
      }), { status: 200 });
    },
  }
);

if (completion.choices[0].message.content !== 'ok') {
  throw new Error('returns parsed OpenRouter response');
}

if ((calls[0] as any).model !== 'openai/gpt-4o-mini' || (calls[0] as any).max_tokens !== 100) {
  throw new Error('sends model and token limit through the OpenRouter adapter');
}

try {
  await createChatCompletion([{ role: 'user', content: 'hello' }], {
    maxTokens: 100,
    env: { get: () => undefined },
    fetcher: fetch,
  });
  throw new Error('missing OpenRouter env should fail');
} catch (error) {
  if (!String((error as Error).message).includes('OPENROUTER_API_KEY')) {
    throw error;
  }
}
