export interface EnvReader {
  get: (key: string) => string | undefined | null;
}

const defaultEnv: EnvReader = {
  get: (key) => {
    const deno = (globalThis as unknown as { Deno?: { env?: { get?: (key: string) => string | undefined } } }).Deno;
    return deno?.env?.get?.(key);
  },
};

const readEnv = (env: EnvReader, key: string) => env.get(key) ?? undefined;

const getAllowedOrigins = (env: EnvReader) =>
  (readEnv(env, 'ALLOWED_ORIGINS') || readEnv(env, 'APP_URL') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const getCorsHeaders = (req: Request, env: EnvReader = defaultEnv) => {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigins = getAllowedOrigins(env);
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

export const jsonResponse = (
  req: Request,
  body: Record<string, unknown>,
  status = 200,
  env: EnvReader = defaultEnv
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req, env), 'Content-Type': 'application/json' },
  });

export const optionsResponse = (req: Request, env: EnvReader = defaultEnv) =>
  new Response(null, { status: 204, headers: getCorsHeaders(req, env) });
