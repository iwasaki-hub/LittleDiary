import 'expo-sqlite/localStorage/install';

export function getSessionStorage() {
  return globalThis.localStorage;
}
