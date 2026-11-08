import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { getSupabaseConfig } from './config';
import { getSessionStorage } from './session-storage';

let client: SupabaseClient | undefined;

/** Lazy initialization keeps the placeholder and server export independent of config. */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const { url, publishableKey } = getSupabaseConfig();
  const storage = getSessionStorage();
  client = createClient(url, publishableKey, {
    auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  if (Platform.OS !== 'web') {
    const instance = client;
    const updateRefresh = (state: string | null | undefined) => {
      if (state === 'active') instance.auth.startAutoRefresh();
      else instance.auth.stopAutoRefresh();
    };
    updateRefresh(AppState.currentState);
    // One app-lifetime listener, registered only when the singleton is created.
    AppState.addEventListener('change', updateRefresh);
  }
  return client;
}
