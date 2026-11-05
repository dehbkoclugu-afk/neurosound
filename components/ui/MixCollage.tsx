/**
 * A saved mix's cover: its own sounds' artwork, up to four, in two columns.
 * RN's Image on purpose: the share card captures this view with view-shot, and
 * expo-image's hardware bitmaps can't be drawn into that software canvas.
 */

import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export function MixCollage({
  images,
  style,
}: {
  images: ImageSourcePropType[];
  style?: StyleProp<ViewStyle>;
}) {
  const shown = images.slice(0, 4);
  const half = Math.ceil(shown.length / 2);
  const columns = [shown.slice(0, half), shown.slice(half)].filter((column) => column.length > 0);
  return (
    <View style={[styles.collage, style]}>
      {columns.map((column, c) => (
        <View key={c} style={styles.column}>
          {column.map((image, i) => (
            <Image key={i} source={image} style={styles.image} resizeMode="cover" />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  collage: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#1B1821',
  },
  column: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
  },
});
