/**
 * Icon Component - Unified icon rendering
 * Supports Ionicons and MaterialCommunityIcons
 */

import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

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

// Helper function to get icon for preset type
export function getPresetIcon(
  type: 'binaural' | 'solfeggio' | 'noise',
  subType?: string
): IconConfig {
  if (type === 'binaural' && subType) {
    const icons: Record<string, IconConfig> = {
      delta: { name: 'moon', library: 'ionicon' },
      theta: { name: 'fitness', library: 'ionicon' }, // meditation pose alternative
      alpha: { name: 'leaf', library: 'ionicon' },
      beta: { name: 'flash', library: 'ionicon' },
      gamma: { name: 'trending-up', library: 'ionicon' },
    };
    return icons[subType] || { name: 'pulse', library: 'ionicon' };
  }

  if (type === 'noise' && subType) {
    const icons: Record<string, IconConfig> = {
      // Classic noise
      white: { name: 'radio', library: 'ionicon' },
      pink: { name: 'flower', library: 'ionicon' },
      brown: { name: 'cloudy', library: 'ionicon' },
      // Nature sounds
      rain: { name: 'rainy', library: 'ionicon' },
      thunder: { name: 'thunderstorm', library: 'ionicon' },
      ocean: { name: 'water', library: 'ionicon' },
      wind: { name: 'leaf', library: 'ionicon' },
      fire: { name: 'flame', library: 'ionicon' },
      forest: { name: 'leaf', library: 'ionicon' },
      stream: { name: 'water', library: 'ionicon' },
      // Machine sounds
      fan: { name: 'sync', library: 'ionicon' },
      airplane: { name: 'airplane', library: 'ionicon' },
      train: { name: 'train', library: 'ionicon' },
    };
    return icons[subType] || { name: 'volume-high', library: 'ionicon' };
  }

  if (type === 'solfeggio') {
    return { name: 'musical-note', library: 'ionicon' };
  }

  // Default
  return { name: 'headset', library: 'ionicon' };
}

// Category icons
export function getCategoryIcon(category: string): IconConfig {
  const icons: Record<string, IconConfig> = {
    binaural: { name: 'pulse', library: 'ionicon' },
    solfeggio: { name: 'musical-notes', library: 'ionicon' },
    noise: { name: 'water', library: 'ionicon' },
  };
  return icons[category] || { name: 'apps', library: 'ionicon' };
}
