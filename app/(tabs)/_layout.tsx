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
import {
  useMiniPlayerVisible,
  TAB_BAR_HEIGHT,
} from '@/hooks/use-mini-player';

/** Android-style active indicator: a filled pill behind the selected icon.
 *  Colour alone (the old cue) is a weak signal for a drowsy user. */
function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.pill, focused && { backgroundColor: colors.tabPill }]}>
      <Ionicons name={name} size={22} color={focused ? colors.tabPillIcon : color} />
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const miniPlayerVisible = useMiniPlayerVisible();
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.cardBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: Spacing.xs,
          },
          // Weight comes from fontFamily: React Native does not synthesize
          // weights for custom fonts.
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: FontFamily.semibold,
            marginTop: 2,
          },
          // Room for the 56pt active pill; the default icon slot is ~24pt
          // wide and would clip it.
          tabBarIconStyle: {
            width: 56,
            height: 30,
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
              <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t('tabs.explore'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'compass' : 'compass-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="mixer"
          options={{
            title: t('tabs.mixer'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'layers' : 'layers-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>

      {/* MiniPlayer overlay above tab bar */}
      <MiniPlayerHost
        visible={miniPlayerVisible}
        bottom={TAB_BAR_HEIGHT + insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
