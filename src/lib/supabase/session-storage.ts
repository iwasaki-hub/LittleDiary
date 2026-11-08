export function getSessionStorage() {
  if (typeof window === 'undefined') {
    throw new Error('Supabaseクライアントはブラウザまたはネイティブで初期化してください。SSR共有クライアントは使用できません。');
  }
  return window.localStorage;
}
