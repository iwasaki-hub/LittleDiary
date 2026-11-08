import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from './client';

class AuthFailure extends Error {}

export function validateLogin(email: string, password: string): string | null {
  if (!email.trim()) return 'メールアドレスを入力してください。';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'メールアドレスの形式を確認してください。';
  if (!password.length) return 'パスワードを入力してください。';
  return null;
}

/** Never display server messages, credentials, tokens, or storage exceptions verbatim. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthFailure) return error.message;
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 'invalid_credentials') return 'メールアドレスまたはパスワードを確認してください。';
  if (code === 'email_not_confirmed') return 'メールアドレスの確認を完了してからログインしてください。';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') {
    return '試行が多いため、少し待ってからお試しください。';
  }
  const name = typeof error === 'object' && error !== null && 'name' in error ? error.name : undefined;
  if (name === 'AuthRetryableFetchError' || error instanceof TypeError) {
    return '接続できませんでした。通信環境を確認して、もう一度お試しください。';
  }
  return '認証処理を完了できませんでした。時間をおいてもう一度お試しください。';
}

/** Injection is for offline tests; production always uses the existing lazy singleton. */
export function createAuthActions(getClient: () => SupabaseClient = getSupabaseClient) {
  const getAuth = () => {
    try { return getClient().auth; } catch {
      throw new AuthFailure('接続設定またはセッション保存領域を確認してください。設定変更後はアプリを再起動してください。');
    }
  };

  return {
    async signIn(email: string, password: string): Promise<void> {
      const validation = validateLogin(email, password);
      if (validation) throw new AuthFailure(validation);
      const { data, error } = await getAuth().signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (!data.session) throw new AuthFailure('ログインを完了できませんでした。もう一度お試しください。');
    },
    async signOut(): Promise<void> {
      // Limit logout to this device/session instead of logging out other devices.
      const { error } = await getAuth().signOut({ scope: 'local' });
      if (error) throw error;
    },
    watchSession(onSession: (session: Session | null) => void, onError: (error: unknown) => void) {
      let active = true;
      let revision = 0;
      let unsubscribe: (() => void) | undefined;
      // Defer initialization until mounted; no client/storage access during SSR rendering.
      void Promise.resolve().then(async () => {
        if (!active) return;
        const auth = getAuth();
        const snapshotRevision = revision;
        const { data } = auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          revision++;
          onSession(session);
        });
        unsubscribe = () => data.subscription.unsubscribe();
        const result = await auth.getSession();
        // A later auth event takes precedence over an older restoration result.
        if (!active || revision !== snapshotRevision) return;
        if (result.error) onError(result.error);
        else onSession(result.data.session);
      }).catch(error => {
        if (active && revision === 0) onError(error);
      });
      return () => { active = false; unsubscribe?.(); };
    },
  };
}

export const authActions = createAuthActions();
