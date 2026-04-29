import {
  getRequiredOpenRouterEnv,
  hasClientVisibleOpenRouterKey,
  parseEnvFile,
} from '../scripts/sync-openrouter-env.mjs';

const assertDeepEqual = (actual, expected, message) => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
};

const env = parseEnvFile(`
# comments are ignored
VITE_INSFORGE_URL=https://example.insforge.app
OPENROUTER_API_KEY="sk-or-test"
OPENROUTER_MODEL='anthropic/claude-3.5-haiku'
`);

assertDeepEqual(
  getRequiredOpenRouterEnv(env),
  {
    OPENROUTER_API_KEY: 'sk-or-test',
    OPENROUTER_MODEL: 'anthropic/claude-3.5-haiku',
  },
  'reads required OpenRouter server env values'
);

if (!hasClientVisibleOpenRouterKey({ VITE_OPENROUTER_API_KEY: 'unsafe' })) {
  throw new Error('detects Vite-exposed OpenRouter keys');
}

try {
  getRequiredOpenRouterEnv({ OPENROUTER_MODEL: 'openai/gpt-4o-mini' });
  throw new Error('missing key should fail');
} catch (error) {
  if (!String(error.message).includes('OPENROUTER_API_KEY')) {
    throw error;
  }
}
