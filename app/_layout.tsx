import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { I18nextProvider } from 'react-i18next';

import { useColorScheme } from '@/hooks/use-color-scheme';
import i18n from '@/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="player/[id]"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </I18nextProvider>
  );
}
