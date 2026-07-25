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
import { MiniPlayer } from '@/components/ui/MiniPlayer';
import { Spacing, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useMiniPlayerVisible, MINI_PLAYER_HEIGHT } from '@/hooks/use-mini-player';

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
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.cardBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: MINI_PLAYER_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: Spacing.xs,
            ...Shadows.small,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: -2,
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
      {miniPlayerVisible && (
        <View
          style={[
            styles.miniPlayerContainer,
            { bottom: MINI_PLAYER_HEIGHT + insets.bottom },
          ]}
        >
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  miniPlayerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
