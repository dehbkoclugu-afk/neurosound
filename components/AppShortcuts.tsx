/**
 * Long-press on the app icon: the four intents, in the user's language.
 * Set from JS rather than a static plist so the titles follow the in-app
 * language, and because Android has no static form of these at all.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting, type RouterAction } from 'expo-quick-actions/router';

import { intents } from '@/lib/intents';

const SF_SYMBOLS: Record<string, string> = {
  sleep: 'symbol:moon.fill',
  focus: 'symbol:scope',
  relax: 'symbol:leaf.fill',
  meditate: 'symbol:circle.circle',
};

export function AppShortcuts() {
  const { t, i18n } = useTranslation();
  useQuickActionRouting();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    QuickActions.setItems<RouterAction>(
      intents.map((intent) => ({
        id: intent.id,
        title: t(intent.nameKey),
        icon: Platform.OS === 'ios' ? SF_SYMBOLS[intent.id] : undefined,
        params: { href: `/intent/${intent.id}` },
      })),
    ).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  return null;
}
