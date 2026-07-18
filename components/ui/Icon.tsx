/**
 * Icon Component - Unified icon rendering
 * Supports Ionicons and MaterialCommunityIcons
 */

import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';
import { BinauralIcons, NoiseIcons, CategoryIcons, SolfeggioIcon } from '@/constants/theme';

export type IconLibrary = 'ionicon' | 'material';

export interface IconConfig {
  name: string;
  library: IconLibrary;
}

interface IconProps {
  icon: IconConfig;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ icon, size = 24, color = '#FFFFFF', style }: IconProps) {
  if (icon.library === 'material') {
    return (
      <MaterialCommunityIcons
        name={icon.name as any}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  return (
    <Ionicons
      name={icon.name as any}
      size={size}
      color={color}
      style={style}
    />
  );
}

// Helper function to get icon for preset type — maps live in constants/theme.ts
export function getPresetIcon(
  type: 'binaural' | 'solfeggio' | 'noise',
  subType?: string
): IconConfig {
  if (type === 'binaural' && subType) {
    return (BinauralIcons[subType] as IconConfig) || { name: 'pulse', library: 'ionicon' };
  }

  if (type === 'noise' && subType) {
    return (NoiseIcons[subType] as IconConfig) || { name: 'volume-high', library: 'ionicon' };
  }

  if (type === 'solfeggio') {
    return SolfeggioIcon as IconConfig;
  }

  return { name: 'headset', library: 'ionicon' };
}

// Category icons
export function getCategoryIcon(category: string): IconConfig {
  return (CategoryIcons[category] as IconConfig) || { name: 'apps', library: 'ionicon' };
}
