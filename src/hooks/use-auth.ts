import type { Session } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';

import { authActions, authErrorMessage } from '@/lib/supabase/auth';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const stop = authActions.watchSession(next => {
      setSession(next);
      setChecking(false);
      setError(null);
    }, failure => {
      setChecking(false);
      setError(authErrorMessage(failure));
    });
    return () => { mounted.current = false; stop(); };
  }, [attempt]);

  const run = async (operation: () => Promise<void>) => {
    if (busy.current || checking) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try { await operation(); } catch (failure) {
      if (mounted.current) setError(authErrorMessage(failure));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  };

  return {
    session, checking, pending, error,
    signIn: (email: string, password: string) => run(() => authActions.signIn(email, password)),
    signOut: () => run(() => authActions.signOut()),
    retrySession: () => {
      if (busy.current) return;
      setChecking(true);
      setError(null);
      setAttempt(value => value + 1);
    },
  };
}
