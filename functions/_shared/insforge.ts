import { createClient } from 'https://esm.sh/@insforge/sdk@latest';
import type { EnvReader } from './http.ts';

const defaultEnv: EnvReader = {
  get: (key) => {
    const deno = (globalThis as unknown as { Deno?: { env?: { get?: (key: string) => string | undefined } } }).Deno;
    return deno?.env?.get?.(key);
  },
};

const getEnv = (env: EnvReader, key: string) => env.get(key) ?? '';

export const createPublicInsforgeClient = (env: EnvReader = defaultEnv) =>
  createClient({
    baseUrl: getEnv(env, 'INSFORGE_BASE_URL'),
    anonKey: getEnv(env, 'ANON_KEY'),
  });

export const createAuthenticatedInsforgeClient = async (
  req: Request,
  env: EnvReader = defaultEnv
) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const userToken = authHeader.replace('Bearer ', '');
  const insforge = createClient({
    baseUrl: getEnv(env, 'INSFORGE_BASE_URL'),
    edgeFunctionToken: userToken,
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
