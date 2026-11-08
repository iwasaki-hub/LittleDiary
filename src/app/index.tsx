import { Stack } from 'expo-router';

import { LoginScreen } from '@/components/login-screen';

export default function Index() {
  return (
    <>
      <Stack.Screen options={{ title: 'LittleDiary' }} />
      <LoginScreen />
    </>
  );
}
