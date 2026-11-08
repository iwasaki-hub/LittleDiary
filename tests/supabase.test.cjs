const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const output = {};
  new Function('require', 'exports', code)((id) => dependencies[id] ?? require(id), output);
  return output;
}

test('configuration rejects missing values and privileged keys without exposing values', () => {
  const previous = { ...process.env };
  try {
    const { getSupabaseConfig } = load('src/lib/supabase/config.ts');
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    assert.throws(getSupabaseConfig, /設定が不足/);
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_secret_test';
    assert.throws(getSupabaseConfig, /publishable key/);
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    for (const value of ['bad-url', 'http://example.supabase.co', 'https://user:pass@example.com', 'https://example.com/path']) {
      process.env.EXPO_PUBLIC_SUPABASE_URL = value;
      assert.throws(getSupabaseConfig);
    }
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co/';
    assert.equal(getSupabaseConfig().url, 'https://example.supabase.co');
  } finally {
    process.env = previous;
  }
});

test('client is lazy, singleton and forwards persistence plus native lifecycle', () => {
  let creates = 0;
  let starts = 0;
  let stops = 0;
  let listener;
  const storage = {};
  const instance = { auth: { startAutoRefresh: () => starts++, stopAutoRefresh: () => stops++ } };
  const { getSupabaseClient } = load('src/lib/supabase/client.ts', {
    '@supabase/supabase-js': { createClient: (_url, _key, options) => {
      creates++;
      assert.equal(options.auth.storage, storage);
      assert.equal(options.auth.persistSession, true);
      assert.equal(options.auth.detectSessionInUrl, false);
      return instance;
    } },
    'react-native': { Platform: { OS: 'ios' }, AppState: { currentState: null, addEventListener: (_event, fn) => { listener = fn; } } },
    './config': { getSupabaseConfig: () => ({ url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' }) },
    './session-storage': { getSessionStorage: () => storage },
  });
  assert.equal(creates, 0);
  assert.equal(getSupabaseClient(), instance);
  assert.equal(getSupabaseClient(), instance);
  assert.equal(creates, 1);
  listener('active');
  listener('background');
  assert.equal(starts, 1);
  assert.equal(stops, 2);
});

test('web storage rejects SSR instead of sharing a server session', () => {
  const { getSessionStorage } = load('src/lib/supabase/session-storage.ts');
  assert.throws(getSessionStorage, /SSR共有/);
});
