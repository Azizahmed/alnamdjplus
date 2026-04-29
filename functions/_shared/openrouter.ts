import type { EnvReader } from './http.ts';

export interface ChatMessage {
  role: string;
  content: string;
}

export interface CreateChatCompletionOptions {
  maxTokens: number;
  temperature?: number;
  env?: EnvReader;
  fetcher?: typeof fetch;
}

const defaultEnv: EnvReader = {
  get: (key) => {
    const deno = (globalThis as unknown as { Deno?: { env?: { get?: (key: string) => string | undefined } } }).Deno;
    return deno?.env?.get?.(key);
  },
};

const requiredEnv = (env: EnvReader, key: string) => {
  const value = env.get(key);
  if (!value) {
    throw new Error(`Missing ${key} secret`);
  }

  return value;
};

export const createChatCompletion = async (
  messages: ChatMessage[],
  options: CreateChatCompletionOptions | number
) => {
  const normalizedOptions = typeof options === 'number'
    ? { maxTokens: options }
    : options;
  const env = normalizedOptions.env || defaultEnv;
  const fetcher = normalizedOptions.fetcher || fetch;
  const apiKey = requiredEnv(env, 'OPENROUTER_API_KEY');
  const model = requiredEnv(env, 'OPENROUTER_MODEL');

  const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.get('APP_URL') ?? 'https://alnamdjplus.app',
      'X-Title': 'AlnamdjPlus',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: normalizedOptions.temperature ?? 0.7,
      max_tokens: normalizedOptions.maxTokens,
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.message || `OpenRouter request failed (${response.status})`);
  }

  return body;
};
