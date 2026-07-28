/**
 * Tab Layout with Modern Tab Bar and MiniPlayer
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { MiniPlayerHost } from '@/components/ui/MiniPlayerHost';
import { FontFamily, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  useMiniPlayerVisible,
  MINI_PLAYER_HEIGHT,
  TAB_BAR_HEIGHT,
  TAB_BAR_HEIGHT_NIGHT,
} from '@/hooks/use-mini-player';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const miniPlayerVisible = useMiniPlayerVisible();
  const { theme } = useSettingsStore();
  // Night mode exists to emit as little as possible before sleep — the tab
  // bar is the one piece of chrome always on screen, so it drops its labels
  // and sits at lower contrast instead of competing with the player.
  const isNight = theme === 'night';

  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarShowLabel: !isNight,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.cardBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: (isNight ? TAB_BAR_HEIGHT_NIGHT : TAB_BAR_HEIGHT) + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: Spacing.xs,
          },
          // fontWeight alone is a silent bug with the loaded Nunito Sans
          // faces: React Native does not synthesize weights for custom
          // fonts, so '600' quietly fell back to the system font and these
          // four always-visible labels were the only text in the app not in
          // the brand face.
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: FontFamily.semibold,
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: isNight ? 0 : -2,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t('tabs.explore'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="mixer"
          options={{
            title: t('tabs.mixer'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'layers' : 'layers-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* MiniPlayer overlay above tab bar */}
      <MiniPlayerHost
        visible={miniPlayerVisible}
        bottom={MINI_PLAYER_HEIGHT + insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
