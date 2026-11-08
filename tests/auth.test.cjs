const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function loadAuth() {
  const code = ts.transpileModule(fs.readFileSync('src/lib/supabase/auth.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const output = {};
  new Function('require', 'exports', code)(id => {
    if (id === './client') return { getSupabaseClient: () => { throw new Error('No live client in tests'); } };
    throw new Error('Unexpected runtime dependency: ' + id);
  }, output);
  return output;
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('invalid input is rejected before client access', async () => {
  const { validateLogin, createAuthActions, authErrorMessage } = loadAuth();
  let accesses = 0;
  const actions = createAuthActions(() => { accesses++; throw new Error('should not initialize'); });
  for (const [email, password] of [['', 'x'], ['invalid', 'x'], ['a@example.com', '']]) {
    assert(validateLogin(email, password));
    await assert.rejects(actions.signIn(email, password), error => {
      assert.match(authErrorMessage(error), /入力|形式/);
      return true;
    });
  }
  assert.equal(accesses, 0);
  assert.equal(validateLogin(' a@example.com ', ' x '), null);
});

test('sign-in uses injected singleton auth, trims email and preserves password', async () => {
  const { createAuthActions } = loadAuth();
  let received;
  const client = { auth: { signInWithPassword: async credentials => {
    received = credentials;
    return { data: { session: { user: {} } }, error: null };
  } } };
  await createAuthActions(() => client).signIn(' a@example.com ', ' x ');
  assert.deepEqual(received, { email: 'a@example.com', password: ' x ' });
});

test('auth failures are actionable without echoing server messages or secrets', async () => {
  const { createAuthActions, authErrorMessage } = loadAuth();
  for (const [failure, expected] of [
    [{ code: 'invalid_credentials', message: 'PRIVATE_SERVER_DETAIL' }, /確認/],
    [{ code: 'email_not_confirmed' }, /メールアドレスの確認/],
    [{ code: 'over_request_rate_limit' }, /少し待って/],
    [{ name: 'AuthRetryableFetchError' }, /通信環境/],
    [new TypeError('PRIVATE_SERVER_DETAIL'), /通信環境/],
    [new Error('PRIVATE_SERVER_DETAIL'), /認証処理/],
  ]) {
    const message = authErrorMessage(failure);
    assert.match(message, expected);
    assert(!message.includes('PRIVATE_SERVER_DETAIL'));
    const actions = createAuthActions(() => ({ auth: { signInWithPassword: async () => ({ data: {}, error: failure }) } }));
    await assert.rejects(actions.signIn('a@example.com', 'x'));
  }
  const missingSession = createAuthActions(() => ({ auth: { signInWithPassword: async () => ({ data: { session: null }, error: null }) } }));
  await assert.rejects(missingSession.signIn('a@example.com', 'x'), error => /ログインを完了/.test(authErrorMessage(error)));
});

test('logout limits scope to local session and surfaces failure', async () => {
  const { createAuthActions } = loadAuth();
  let options;
  const actions = createAuthActions(() => ({ auth: { signOut: async value => {
    options = value;
    return { error: null };
  } } }));
  await actions.signOut();
  assert.deepEqual(options, { scope: 'local' });
  const failed = createAuthActions(() => ({ auth: { signOut: async () => ({ error: new Error('offline') }) } }));
  await assert.rejects(failed.signOut());
});

test('newer auth events beat stale session restoration, cleanup removes listener', async () => {
  const { createAuthActions } = loadAuth();
  let listener, restore;
  let unsubscribed = 0;
  const sessions = [];
  const errors = [];
  const actions = createAuthActions(() => ({ auth: {
    onAuthStateChange: callback => { listener = callback; return { data: { subscription: { unsubscribe: () => unsubscribed++ } } }; },
    getSession: () => new Promise(resolve => { restore = resolve; }),
  } }));
  const stop = actions.watchSession(session => sessions.push(session), error => errors.push(error));
  await tick();
  const signedIn = { user: { id: 'test-only' } };
  listener('SIGNED_IN', signedIn);
  restore({ data: { session: null }, error: null });
  await tick();
  assert.deepEqual(sessions, [signedIn]);
  listener('SIGNED_OUT', null);
  assert.deepEqual(sessions, [signedIn, null]);
  stop();
  listener('SIGNED_IN', signedIn);
  assert.equal(sessions.length, 2);
  assert.equal(unsubscribed, 1);
  assert.equal(errors.length, 0);
});

test('stored session is restored when no newer auth event exists', async () => {
  const { createAuthActions } = loadAuth();
  const stored = { user: { id: 'stored-test-session' } };
  const actions = createAuthActions(() => ({ auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getSession: async () => ({ data: { session: stored }, error: null }),
  } }));
  const sessions = [];
  const stop = actions.watchSession(session => sessions.push(session), () => assert.fail('unexpected failure'));
  await tick();
  assert.deepEqual(sessions, [stored]);
  stop();
});

test('restoration, config and storage failures are handled, late restoration is ignored', async () => {
  const { createAuthActions, authErrorMessage } = loadAuth();
  const errors = [];
  const missing = createAuthActions(() => { throw new Error('PRIVATE_KEY_VALUE'); });
  missing.watchSession(() => assert.fail('unexpected session'), error => errors.push(authErrorMessage(error)));
  await tick();
  assert.match(errors[0], /接続設定またはセッション保存領域/);
  assert(!errors[0].includes('PRIVATE_KEY_VALUE'));

  let restore;
  const actions = createAuthActions(() => ({ auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getSession: () => new Promise(resolve => { restore = resolve; }),
  } }));
  const sessions = [];
  const stop = actions.watchSession(session => sessions.push(session), error => errors.push(error));
  await tick();
  stop();
  restore({ data: { session: {} }, error: null });
  await tick();
  assert.deepEqual(sessions, []);

  const failure = new Error('storage read failed');
  const rejected = createAuthActions(() => ({ auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getSession: async () => ({ data: { session: null }, error: failure }),
  } }));
  const stopRejected = rejected.watchSession(() => assert.fail('unexpected session'), error => errors.push(error));
  await tick();
  assert.equal(errors.at(-1), failure);
  stopRejected();
});
