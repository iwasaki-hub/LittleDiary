import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { homeStyles as styles } from '@/styles/home';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>LITTLE DIARY</Text>
          <Text accessibilityRole="header" style={styles.heading}>今日も、いい一日に。</Text>
          <Text style={styles.description}>小さな出来事を残してみよう。</Text>
        </View>
        <View style={styles.diaryCard}>
          <Text style={styles.label}>{"TODAY'S DIARY"}</Text>
          <View style={styles.diaryBody}>
            <View style={styles.diaryCopy}>
              <Text accessibilityRole="header" style={styles.cardHeading}>今日はどんな日だった？</Text>
              <Text style={styles.body}>一言だけでも大丈夫。</Text>
            </View>
            <View style={styles.character} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.face}>
                <View style={styles.eyes}><View style={styles.eye} /><View style={styles.eye} /></View>
                <View style={styles.cheeks}><View style={styles.cheek} /><View style={styles.cheek} /></View>
                <View style={styles.smile} />
              </View>
              <View style={styles.characterShadow} />
            </View>
          </View>
          {/* Display mock only: no touch handler or navigation in Step 2-1. */}
          <View style={styles.writeMock}>
            <Text style={styles.writeLabel}>日記を書く</Text>
            <Text style={styles.mockBadge}>準備中</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={[styles.featureCard, styles.learningCard]}>
            <Text style={styles.featureSymbol} accessible={false}>Aa</Text>
            <Text accessibilityRole="header" style={styles.featureHeading}>英語を学ぶ</Text>
            <Text style={styles.body}>日々の言葉を、英語に。</Text>
            <Text style={styles.comingSoon}>準備中</Text>
          </View>
          <View style={[styles.featureCard, styles.historyCard]}>
            <Text style={styles.featureSymbol} accessible={false}>＋</Text>
            <Text accessibilityRole="header" style={styles.featureHeading}>日記の記録</Text>
            <Text style={styles.body}>小さな思い出を、少しずつ。</Text>
            <Text style={styles.comingSoon}>準備中</Text>
          </View>
        </View>
        <View style={styles.englishCard}>
          <Text style={styles.label}>{"TODAY'S ENGLISH"}</Text>
          <Text style={styles.exampleBadge}>フレーズ例</Text>
          <Text style={styles.englishPhrase}>It was a lovely day!</Text>
          <Text style={styles.body}>今日は素敵な一日だった！</Text>
        </View>
        <Text style={styles.footer}>あなたのペースで、ひとことずつ。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
