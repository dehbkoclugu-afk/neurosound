/**
 * A barely-there amber wash over the app from 22:00 to 06:00, so the screen
 * feels gentler at the hour it is mostly used. Purely a look, not a blue-light
 * filter: four percent does not filter anything, and it isn't claimed to.
 */

import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

const isNight = () => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
};

export function NightWarmth() {
  const [night, setNight] = useState(isNight);

  // Checked on return to the app; a tick for a change this slight is not worth it.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') setNight(isNight());
    });
    return () => subscription.remove();
  }, []);

  if (!night) return null;
  return <View pointerEvents="none" style={styles.wash} />;
}

const styles = StyleSheet.create({
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 140, 40, 0.04)',
  },
});
