export function getSupabaseConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) {
    throw new Error('Supabase設定が不足しています。.env.localにEXPO_PUBLIC_SUPABASE_URLとEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEYを設定してください。');
  }
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error('Supabase URLの形式が不正です。'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('Supabase URLにはHTTPSのプロジェクトURLを指定してください。');
  }
  if (!publishableKey.startsWith('sb_publishable_')) {
    throw new Error('Supabaseにはpublishable keyを指定してください。secret/service_roleキーは使用できません。');
  }
  return { url: parsed.origin, publishableKey };
}
