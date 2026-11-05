/**
 * Shares a saved mix as an image card. It is a picture of the recipe, not a
 * link: the app has no accounts or server to resolve one against.
 */

import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { Spacing, Typography, FontFamily, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { MixCollage } from '@/components/ui/MixCollage';
import { Sheet } from '@/components/ui/Sheet';
import { PRESET_LOCK_ART } from '@/lib/artAssets';
import { getPresetById } from '@/lib/frequencies';
import { useToastStore } from '@/stores/toastStore';
import * as haptics from '@/lib/haptics';

export interface ShareableMix {
  name: string;
  channels: { presetId: string }[];
}

export function MixShareSheet({ mix, onClose }: { mix: ShareableMix | null; onClose: () => void }) {
  const { t } = useTranslation();
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const presets = (mix?.channels ?? [])
    .map((c) => getPresetById(c.presetId))
    .filter((p) => p !== undefined);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    haptics.commit();
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1, width: 1080, height: 1350 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: mix?.name });
      onClose();
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={mix !== null} onClose={onClose} title={t('mixer.share')}>
      <View ref={card} collapsable={false} style={styles.card}>
        <MixCollage
          images={presets.map((p) => PRESET_LOCK_ART[p.id]).filter(Boolean)}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(10, 9, 13, 0.1)', 'rgba(10, 9, 13, 0.92)']}
          locations={[0.3, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.brand}>852Hz</Text>
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={2}>
            {mix?.name}
          </Text>
          <Text style={styles.sounds} numberOfLines={3}>
            {presets.map((p) => t(p.nameKey).split(' (')[0]).join(' + ')}
          </Text>
        </View>
      </View>
      <Button title={t('mixer.share')} onPress={share} disabled={busy} />
    </Sheet>
  );
}

// Fixed colours: the card is an image that leaves the app, so it doesn't follow
// whichever theme it happened to be made under.
const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: 264,
    height: 330,
    borderRadius: Radius.card,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  brand: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
  text: {
    gap: Spacing.xs,
  },
  name: {
    ...Typography.title,
    color: '#FFFFFF',
  },
  sounds: {
    ...Typography.footnote,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
