import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { I18nextProvider } from 'react-i18next';
import {
  useFonts,
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
  SchibstedGrotesk_700Bold,
} from '@expo-google-fonts/schibsted-grotesk';
import { YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import { SplineSansMono_500Medium } from '@expo-google-fonts/spline-sans-mono';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastHost } from '@/components/ui/ToastHost';
import { PremiumSync } from '@/components/PremiumSync';
import { AppShortcuts } from '@/components/AppShortcuts';
import { NightWarmth } from '@/components/ui/NightWarmth';
import i18n from '@/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
    YoungSerif_400Regular,
    SplineSansMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

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
          <Stack.Screen
            name="intent/[id]"
            options={{
              headerShown: false,
              // Home's intent block and this hero share the same image and
              // colour; a hard horizontal push made that continuity invisible.
              // A fade lets the shared imagery read as one surface settling
              // in rather than a new screen sliding over the old one.
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen
            name="paywall"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
        <NightWarmth />
        <PremiumSync />
        <AppShortcuts />
        <ToastHost />
        {/* Follows the app's own theme, not the system's: "auto" drew dark
            status icons over the dark-default UI on light-mode phones. */}
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </I18nextProvider>
  );
}
