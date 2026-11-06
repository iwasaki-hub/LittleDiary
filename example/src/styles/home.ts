import { Platform, StyleSheet } from 'react-native';

import { BottomTabInset } from '@/constants/theme';

const colors = {
  background: '#FFF8EE', text: '#302B27', secondary: '#817367',
  orange: '#FF935C', peach: '#FFDEBF', blue: '#CDE8FA', yellow: '#FFE8A6',
};

export const homeStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 24,
    // The existing web tab list overlays the top of the screen.
    paddingTop: Platform.OS === 'web' ? 100 : 28,
    paddingBottom: BottomTabInset + 32, gap: 24,
  },
  header: { gap: 12, paddingBottom: 8 },
  brand: { color: colors.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 2.5 },
  heading: { color: colors.text, fontSize: 30, fontWeight: '700' },
  description: { color: colors.secondary, fontSize: 15, lineHeight: 25 },
  diaryCard: { backgroundColor: colors.peach, borderRadius: 32, padding: 24, gap: 20 },
  label: { color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  diaryBody: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
  diaryCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 180, gap: 12 },
  cardHeading: { color: colors.text, fontSize: 25, fontWeight: '700' },
  body: { color: colors.text, fontSize: 14, lineHeight: 24 },
  character: { width: 116, alignItems: 'center', gap: 10, alignSelf: 'center' },
  face: { width: 110, height: 104, backgroundColor: colors.orange, borderRadius: 52, transform: [{ rotate: '-8deg' }] },
  eyes: { position: 'absolute', top: 37, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between' },
  eye: { width: 6, height: 9, borderRadius: 4, backgroundColor: colors.text },
  cheeks: { position: 'absolute', top: 52, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between' },
  cheek: { width: 16, height: 9, borderRadius: 8, backgroundColor: colors.peach },
  smile: { position: 'absolute', top: 53, left: 43, width: 24, height: 15, borderBottomWidth: 3, borderColor: colors.text, borderRadius: 14 },
  characterShadow: { width: 62, height: 8, borderRadius: 30, backgroundColor: colors.orange, opacity: 0.2 },
  writeMock: { backgroundColor: colors.orange, borderRadius: 22, padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10 },
  writeLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  mockBadge: { color: colors.text, backgroundColor: colors.peach, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featureCard: { flexBasis: 136, flexGrow: 1, flexShrink: 1, borderRadius: 28, padding: 20, gap: 12 },
  learningCard: { backgroundColor: colors.blue },
  historyCard: { backgroundColor: colors.yellow },
  featureSymbol: { color: colors.text, fontSize: 30, fontWeight: '500' },
  featureHeading: { color: colors.text, fontSize: 18, fontWeight: '700' },
  comingSoon: { color: colors.text, fontSize: 12, marginTop: 'auto', paddingTop: 4 },
  englishCard: { backgroundColor: colors.yellow, borderRadius: 28, padding: 24, gap: 12 },
  exampleBadge: { color: colors.text, fontSize: 12 },
  englishPhrase: { color: colors.text, fontSize: 25, fontWeight: '600' },
  footer: { color: colors.secondary, fontSize: 12, textAlign: 'center', paddingVertical: 8 },
});
