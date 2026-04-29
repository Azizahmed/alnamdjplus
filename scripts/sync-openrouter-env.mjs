#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_KEYS = ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL'];

export const parseEnvFile = (contents) => {
  const env = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalizedLine = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const equalsIndex = normalizedLine.indexOf('=');
    if (equalsIndex < 1) continue;

    const key = normalizedLine.slice(0, equalsIndex).trim();
    let value = normalizedLine.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
};

export const hasClientVisibleOpenRouterKey = (env) =>
  Object.keys(env).some((key) => /^VITE_OPENROUTER/i.test(key));

export const getRequiredOpenRouterEnv = (env) => {
  const values = {};
  const missing = [];

  for (const key of REQUIRED_KEYS) {
    const value = env[key]?.trim();
    if (!value) {
      missing.push(key);
    } else {
      values[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required .env.local value(s): ${missing.join(', ')}`);
  }

  return values;
};

const redact = (text, values) => {
  let redacted = text;
  for (const value of Object.values(values)) {
    redacted = redacted.split(value).join('[redacted]');
  }
  return redacted;
};

const runInsforge = (args, values) => {
  const bin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(bin, ['@insforge/cli', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    ...result,
    stdout: redact(result.stdout || '', values),
    stderr: redact(result.stderr || '', values),
  };
};

const syncSecret = (key, value, values, dryRun) => {
  if (dryRun) {
    console.log(`Would sync ${key}`);
    return;
  }

  const update = runInsforge(['secrets', 'update', key, '--value', value], values);
  if (update.status === 0) {
    console.log(`Updated ${key}`);
    return;
  }

  const add = runInsforge(['secrets', 'add', key, value], values);
  if (add.status === 0) {
    console.log(`Added ${key}`);
    return;
  }

  const details = [update.stderr, add.stderr].filter(Boolean).join('\n');
  throw new Error(`Failed to sync ${key}${details ? `\n${details}` : ''}`);
};

const main = () => {
  const args = process.argv.slice(2);
  const envFlagIndex = args.indexOf('--env');
  const envPath = envFlagIndex >= 0 ? args[envFlagIndex + 1] : '.env.local';
  const dryRun = args.includes('--dry-run');

  if (envFlagIndex >= 0 && !envPath) {
    throw new Error('Missing path after --env');
  }

  const envFile = resolve(process.cwd(), envPath);
  const env = parseEnvFile(readFileSync(envFile, 'utf8'));

  if (hasClientVisibleOpenRouterKey(env)) {
    throw new Error('Do not use VITE_OPENROUTER_* keys. They expose the OpenRouter key in the browser bundle.');
  }

  const values = getRequiredOpenRouterEnv(env);

  for (const [key, value] of Object.entries(values)) {
    syncSecret(key, value, values, dryRun);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
