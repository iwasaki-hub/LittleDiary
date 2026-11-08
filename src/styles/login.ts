import { StyleSheet } from 'react-native';

export const loginStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8EE' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 16 },
  title: { color: '#302B27', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#63564B', fontSize: 16, lineHeight: 24 },
  label: { color: '#302B27', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#817367', borderRadius: 12, backgroundColor: '#FFFFFF', color: '#302B27', fontSize: 17 },
  button: { minHeight: 52, padding: 14, borderRadius: 12, backgroundColor: '#FF935C', alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: '#FFDEBF' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
  buttonText: { color: '#302B27', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  message: { color: '#302B27', fontSize: 16, lineHeight: 24 },
  error: { color: '#9B251C', fontSize: 16, lineHeight: 24 },
});
