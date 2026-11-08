import { type ComponentRef, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';
import { loginStyles as styles } from '@/styles/login';

export function LoginScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);
  const disabled = auth.pending || auth.checking;

  const submit = async () => {
    if (disabled) return;
    const submittedPassword = password;
    setPassword('');
    await auth.signIn(email, submittedPassword);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={64}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">LittleDiary</Text>
            <Text style={styles.subtitle}>メールアドレスとパスワードでログイン</Text>
            {auth.checking ? (
              <View accessibilityLiveRegion="polite">
                <ActivityIndicator color="#302B27" accessibilityLabel="セッション確認中" />
                <Text style={styles.message}>ログイン状態を確認しています…</Text>
              </View>
            ) : auth.session ? (
              <>
                <Text style={styles.message} accessibilityLiveRegion="polite">ログイン済みです。</Text>
                <Pressable accessibilityRole="button" accessibilityState={{ disabled: auth.pending }} disabled={auth.pending} onPress={() => void auth.signOut()} style={({ pressed }) => [styles.button, auth.pending && styles.disabled, pressed && styles.pressed]}>
                  <Text style={styles.buttonText}>{auth.pending ? 'ログアウト中…' : 'ログアウト'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View>
                  <Text style={styles.label}>メールアドレス</Text>
                  <TextInput accessibilityLabel="メールアドレス" style={styles.input} value={email} onChangeText={setEmail} editable={!disabled} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} placeholder="name@example.com" placeholderTextColor="#75685D" />
                </View>
                <View>
                  <Text style={styles.label}>パスワード</Text>
                  <TextInput ref={passwordInput} accessibilityLabel="パスワード" style={styles.input} value={password} onChangeText={setPassword} editable={!disabled} autoCapitalize="none" autoCorrect={false} secureTextEntry autoComplete="current-password" returnKeyType="go" onSubmitEditing={() => void submit()} placeholder="パスワード" placeholderTextColor="#75685D" />
                </View>
                <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy: auth.pending }} disabled={disabled} onPress={() => void submit()} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
                  <Text style={styles.buttonText}>{auth.pending ? 'ログイン中…' : 'ログイン'}</Text>
                </Pressable>
              </>
            )}
            {auth.error ? (
              <>
                <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">{auth.error}</Text>
                {!auth.pending && (
                  <Pressable accessibilityRole="button" onPress={auth.retrySession} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
                    <Text style={styles.buttonText}>ログイン状態を再確認</Text>
                  </Pressable>
                )}
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
