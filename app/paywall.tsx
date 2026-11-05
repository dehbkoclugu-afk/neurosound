/**
 * Premium paywall: yearly (with the free trial, if Play offers one to this
 * user), monthly, and a one-time lifetime unlock. Prices come from the store
 * so they are always localised; the entitlement itself is set by PremiumSync.
 *
 * Layout: a scene hero (what this app feels like), a strip of the actual
 * locked sounds (what the money opens), plans, then a CTA pinned to the
 * bottom edge so it never scrolls away from the plan it buys.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, requestPurchase, ErrorCode } from 'expo-iap';
import Animated, { FadeIn, ZoomOut } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { useArtwork } from '@/hooks/use-artwork';
import { Spacing, Typography, FontFamily, Radius, AccessibilitySize, withAlpha } from '@/constants/theme';
import { contentColumn } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { ArtBackground } from '@/components/ui/ArtBackground';
import { EqualizerBars } from '@/components/ui/EqualizerBars';
import { syncPremium } from '@/components/PremiumSync';
import { PREMIUM_SKUS, SUBSCRIPTION_SKUS, isLockedPreset } from '@/lib/premium';
import { allPresets, getPresetById, FrequencyPreset } from '@/lib/frequencies';
import { presetArt } from '@/lib/artAssets';
import { upper, formatPercent } from '@/lib/upper';
import { useIsPremium } from '@/stores/premiumStore';
import { useToastStore } from '@/stores/toastStore';
import * as haptics from '@/lib/haptics';
import * as playerController from '@/lib/audio/playerController';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';

type PlanKey = keyof typeof PREMIUM_SKUS;

interface Plan {
  key: PlanKey;
  sku: string;
  price: string;
  offerToken?: string;
  hasTrial: boolean;
  /** Numeric recurring price in the store's currency, when the store gives one. */
  amount?: number;
}

const PLAN_ORDER: PlanKey[] = ['yearly', 'monthly', 'lifetime'];
const BENEFITS = ['benefitLibrary', 'benefitMix', 'benefitOffline'] as const;
const HERO_PRESET = 'solfeggio-963';
// Hand-picked rather than the first six in catalogue order, which opened on two
// Gammas in a row. These are the most different-looking sounds Premium opens.
const PREVIEW_IDS = ['solfeggio-963', 'solfeggio-741', 'binaural-gamma', 'solfeggio-639', 'solfeggio-396', 'solfeggio-174'];

const PREVIEW_MS = 15000;
const UNLOCK_STEP_MS = 170;
const UNLOCK_HOLD_MS = 900;

type StoreProduct = {
  id: string;
  displayPrice: string;
  subscriptionOfferDetailsAndroid?: unknown;
  introductoryPricePaymentModeIOS?: string;
  price?: number;
};

// Apple's standard EULA — App Review (3.1.2) wants a Terms of Use link next to
// any auto-renewing subscription, and this is the default one App Store
// Connect applies when no custom EULA is uploaded.
const APPLE_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
type Offer = {
  offerToken: string;
  pricingPhases: { pricingPhaseList: { formattedPrice: string; priceAmountMicros: string }[] };
};

function toPlan(product: StoreProduct): Plan | null {
  const key = PLAN_ORDER.find((k) => PREMIUM_SKUS[k] === product.id);
  if (!key) return null;
  if (Platform.OS === 'ios') {
    // ponytail: StoreKit reports the configured intro offer, not this user's
    // eligibility; Apple's own sheet shows the real price. Check
    // isEligibleForIntroOfferIOS if returning users see a trial they lack.
    return {
      key,
      sku: product.id,
      price: product.displayPrice,
      hasTrial: product.introductoryPricePaymentModeIOS === 'free-trial',
      amount: product.price,
    };
  }
  const offers = (product.subscriptionOfferDetailsAndroid ?? []) as Offer[];
  // Play only lists offers this user is eligible for, so a zero-price phase
  // here means the trial is genuinely available to them.
  const trial = offers.find((o) =>
    o.pricingPhases.pricingPhaseList.some((p) => p.priceAmountMicros === '0')
  );
  const offer = trial ?? offers[0];
  const phases = offer?.pricingPhases.pricingPhaseList ?? [];
  return {
    key,
    sku: product.id,
    // The last phase is the recurring price, after any trial.
    price: phases[phases.length - 1]?.formattedPrice ?? product.displayPrice,
    offerToken: offer?.offerToken,
    hasTrial: !!trial,
    amount: phases.length
      ? Number(phases[phases.length - 1].priceAmountMicros) / 1_000_000
      : product.price,
  };
}

export default function PaywallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const artwork = useArtwork();
  const isPremium = useIsPremium();
  const showToast = useToastStore((s) => s.show);

  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<PlanKey>('yearly');
  const [busy, setBusy] = useState(false);

  // The real locked sounds, with their own art — "the full library" is an
  // abstraction; six named scenes with a lock on them are not.
  const lockedPreview = useMemo(
    () => PREVIEW_IDS.map((id) => getPresetById(id)).filter((p): p is FrequencyPreset => !!p && isLockedPreset(p.id)),
    []
  );
  const lockedCount = useMemo(() => allPresets.filter((p) => isLockedPreset(p.id)).length, []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  useEffect(() => {
    if (Platform.OS === 'web') {
      setPlans([]);
      return;
    }
    Promise.all([
      fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' }),
      fetchProducts({ skus: [PREMIUM_SKUS.lifetime], type: 'in-app' }),
    ])
      .then((lists) => {
        const found = lists
          .flatMap((list) => (list ?? []) as StoreProduct[])
          .map(toPlan)
          .filter((p): p is Plan => p !== null)
          .sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key));
        setPlans(found);
        if (found.length && !found.some((p) => p.key === 'yearly')) setSelected(found[0].key);
      })
      .catch(() => setPlans([]));
  }, []);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreAfterPreview = useRef<(() => void) | null>(null);

  const stopPreview = () => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = null;
    setPreviewId(null);
    restoreAfterPreview.current?.();
    restoreAfterPreview.current = null;
  };

  // A preview borrows the one audio slot, so whatever was there comes back
  // afterwards: tasting a sound must not end the sleep sound already running.
  const togglePreview = (preset: FrequencyPreset) => {
    haptics.select();
    if (previewId === preset.id) {
      stopPreview();
      return;
    }
    if (!restoreAfterPreview.current) {
      const { isMixerPlaying, isPlaying, currentPreset } = useAudioStore.getState();
      restoreAfterPreview.current = () => {
        if (isMixerPlaying) {
          playerController.mixerStart();
        } else if (currentPreset) {
          playerController.loadPreset(currentPreset);
          if (isPlaying) playerController.play();
        } else {
          playerController.unload();
        }
      };
    }
    playerController.loadPreset(preset);
    playerController.play();
    setPreviewId(preset.id);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(stopPreview, PREVIEW_MS);
  };

  // Leaving the paywall ends the preview, however it was left.
  useEffect(
    () => () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      restoreAfterPreview.current?.();
    },
    [],
  );

  // PremiumSync flips the entitlement when Play confirms the purchase. The moment
  // is the one payoff the money buys today, so the locks come off one by one
  // before the screen goes. Someone already premium just passes through.
  const wasPremium = useRef(isPremium);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const [unlocked, setUnlocked] = useState<number | null>(null);

  useEffect(() => {
    if (!isPremium) return;
    const finish = () => {
      haptics.save();
      showToast(t('paywall.welcome'), 'success');
      close();
    };
    if (wasPremium.current || reduceMotion) {
      finish();
      return;
    }
    if (previewTimer.current) stopPreview();
    setUnlocked(0);
    let opened = 0;
    let done: ReturnType<typeof setTimeout> | undefined;
    const step = setInterval(() => {
      opened += 1;
      setUnlocked(opened);
      haptics.select();
      if (opened >= lockedPreview.length) {
        clearInterval(step);
        done = setTimeout(finish, UNLOCK_HOLD_MS);
      }
    }, UNLOCK_STEP_MS);
    return () => {
      clearInterval(step);
      if (done) clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const plan = plans?.find((p) => p.key === selected);

  // "Best value" with no reason is a claim; the number is the reason.
  const yearly = plans?.find((p) => p.key === 'yearly')?.amount;
  const monthly = plans?.find((p) => p.key === 'monthly')?.amount;
  const yearlySaving = yearly && monthly ? 1 - yearly / (monthly * 12) : 0;

  const handleBuy = async () => {
    if (!plan || busy) return;
    haptics.commit();
    setBusy(true);
    try {
      if (plan.key === 'lifetime') {
        await requestPurchase({
          type: 'in-app',
          request: { google: { skus: [plan.sku] }, apple: { sku: plan.sku } },
        });
      } else {
        await requestPurchase({
          type: 'subs',
          request: {
            google: {
              skus: [plan.sku],
              subscriptionOffers: plan.offerToken
                ? [{ sku: plan.sku, offerToken: plan.offerToken }]
                : undefined,
            },
            apple: { sku: plan.sku },
          },
        });
      }
    } catch (e) {
      if ((e as { code?: string })?.code !== ErrorCode.UserCancelled) {
        showToast(t('paywall.error'), 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const owned = await syncPremium();
      if (!owned) showToast(t('paywall.restoreNone'), 'info');
    } catch {
      showToast(t('paywall.error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const ctaTitle = !plan
    ? t('paywall.cta')
    : plan.hasTrial
      ? t('paywall.ctaTrial')
      : plan.key === 'lifetime'
        ? t('paywall.ctaLifetime')
        : t('paywall.cta');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <ArtBackground
          source={artwork.source(presetArt(HERO_PRESET))}
          variant="tile"
          style={[styles.hero, { paddingTop: insets.top + Spacing.sm }]}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity
              onPress={close}
              style={[styles.closeButton, { backgroundColor: artwork.foreground.badge }]}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={24} color={artwork.foreground.primary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.heroText, contentColumn]}>
            <Text style={[styles.kicker, { color: artwork.foreground.secondary }]}>
              {/* The brand keeps its own casing; only the word is set in caps. */}
              {`852Hz ${upper('Premium')}`}
            </Text>
            <Text
              style={[styles.title, { color: artwork.foreground.primary }]}
              accessibilityRole="header"
            >
              {t('paywall.title')}
            </Text>
            <Text style={[styles.subtitle, { color: artwork.foreground.secondary }]}>
              {t('paywall.subtitle')}
            </Text>
          </View>
        </ArtBackground>

        {/* What it costs first: the plans used to start below the fold, after
            a sky and a gallery. */}
        <View style={[styles.body, styles.plansBody, contentColumn]}>
          {plans === null ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : plans.length === 0 ? (
            <Text style={[styles.unavailable, { color: colors.textSecondary }]}>{t('paywall.unavailable')}</Text>
          ) : (
            <>
            <View style={styles.plans} accessibilityRole="radiogroup">
              {plans.map((p) => {
                const active = p.key === selected;
                const featured = p.key === 'yearly';
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => {
                      haptics.select();
                      setSelected(p.key);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.plan,
                      {
                        borderColor: active ? colors.accent : colors.cardBorder,
                        backgroundColor: active ? withAlpha(colors.accent, 0.1) : colors.card,
                      },
                    ]}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={active ? colors.accent : colors.textSecondary}
                    />
                    <View style={styles.planText}>
                      <View style={styles.planNameRow}>
                        <Text style={[styles.planName, { color: colors.text }]}>{t(`paywall.plan.${p.key}`)}</Text>
                        {featured && (
                          <View style={[styles.bestValue, { backgroundColor: colors.accent }]}>
                            <Text style={[styles.bestValueText, { color: colors.onPrimary }]}>
                              {upper(
                                yearlySaving > 0.05
                                  ? t('paywall.savePercent', { percent: formatPercent(yearlySaving) })
                                  : t('paywall.bestValue'),
                              )}
                            </Text>
                          </View>
                        )}
                      </View>
                      {p.hasTrial && (
                        <Text style={[styles.planBadge, { color: colors.accent }]}>{t('paywall.trialBadge')}</Text>
                      )}
                    </View>
                    <Text style={[styles.planPrice, { color: colors.text }]}>
                      {t(`paywall.price.${p.key}`, { price: p.price })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* When the charge happens, drawn rather than left to the small print:
                nobody should be surprised when the trial ends. */}
            {plan?.hasTrial && (
              <View style={styles.timeline}>
                <View style={styles.timelineStop}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.timelineText, { color: colors.text }]}>
                    {t('paywall.timelineToday')}
                  </Text>
                </View>
                <View style={[styles.timelineLine, { backgroundColor: colors.cardBorder }]} />
                <View style={styles.timelineStop}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.textSecondary }]} />
                  <Text style={[styles.timelineText, { color: colors.text }]}>
                    {t('paywall.timelineLater', {
                      price: t(`paywall.price.${plan.key}`, { price: plan.price }),
                    })}
                  </Text>
                </View>
              </View>
            )}
            </>
          )}
        </View>

        <Text style={[styles.previewHint, contentColumn, { color: colors.textSecondary }]}>
          {t('paywall.previewHint')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewStrip}
          accessibilityLabel={t('paywall.benefitLibrary')}
        >
          {lockedPreview.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              onPress={() => togglePreview(preset)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: previewId === preset.id }}
              accessibilityLabel={`${t(preset.nameKey)}. ${t('paywall.previewHint')}`}
            >
              <ArtBackground
                source={artwork.source(presetArt(preset.id))}
                variant="tile"
                style={styles.previewTile}
              >
                <View style={[styles.previewLock, { backgroundColor: artwork.foreground.badge }]}>
                  {previewId === preset.id ? (
                    <EqualizerBars color={artwork.foreground.primary} size={12} />
                  ) : (
                    <Ionicons name="play" size={12} color={artwork.foreground.primary} />
                  )}
                </View>
                <Text
                  style={[styles.previewName, { color: artwork.foreground.primary }]}
                  numberOfLines={2}
                >
                  {t(preset.nameKey)}
                </Text>
              </ArtBackground>
            </TouchableOpacity>
          ))}
          <View
            style={[
              styles.previewTile,
              styles.previewMore,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.previewMoreNumber, { color: colors.text }]}>
              +{Math.max(0, lockedCount - lockedPreview.length)}
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.body, contentColumn]}>
          <View style={styles.benefits}>
            {BENEFITS.map((key) => (
              <View key={key} style={styles.benefit}>
                <Ionicons name="checkmark" size={18} color={colors.accent} />
                <Text style={[styles.benefitText, { color: colors.text }]}>{t(`paywall.${key}`)}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleRestore}
            disabled={busy}
            style={styles.restore}
            accessibilityRole="button"
          >
            <Text style={[styles.restoreText, { color: colors.accent }]}>{t('paywall.restore')}</Text>
          </TouchableOpacity>

          <Text style={[styles.legal, { color: colors.textSecondary }]}>
            {t('paywall.legal', { context: Platform.OS })}
          </Text>
          {Platform.OS === 'ios' && (
            <View style={styles.links}>
              <TouchableOpacity
                onPress={() => Linking.openURL(APPLE_EULA)}
                style={styles.link}
                accessibilityRole="link"
              >
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  {t('paywall.termsOfUse')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/privacy')}
                style={styles.link}
                accessibilityRole="link"
              >
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  {t('settings.privacyPolicy')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: colors.background,
            borderTopColor: colors.cardBorder,
          },
        ]}
      >
        {/* What happens after the trial, stated next to the button that
            starts it (Play requires the post-trial price to be this clear). */}
        {plan && (
          <Text style={[styles.terms, { color: colors.text }]}>
            {plan.hasTrial
              ? t('paywall.trialTerms', { price: t(`paywall.price.${plan.key}`, { price: plan.price }) })
              : t(`paywall.price.${plan.key}`, { price: plan.price })}
          </Text>
        )}
        {/* The one bright fill in the app: a deliberate decision, not a
            control someone brushes past at 1am. */}
        <Button
          title={ctaTitle}
          onPress={handleBuy}
          disabled={!plan || busy}
          size="large"
          style={{ ...contentColumn, backgroundColor: colors.accent }}
          textStyle={{ color: colors.background }}
        />
      </View>

      {unlocked !== null && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.unlock, { backgroundColor: colors.background }]}
        >
          <View style={styles.unlockGrid}>
            {lockedPreview.map((preset, index) => (
              <ArtBackground
                key={preset.id}
                source={artwork.source(presetArt(preset.id))}
                variant="tile"
                style={[styles.previewTile, { opacity: index < unlocked ? 1 : 0.45 }]}
              >
                {index >= unlocked && (
                  <Animated.View
                    exiting={ZoomOut.duration(160)}
                    style={[styles.previewLock, { backgroundColor: artwork.foreground.badge }]}
                  >
                    <Ionicons name="lock-closed" size={12} color={artwork.foreground.primary} />
                  </Animated.View>
                )}
              </ArtBackground>
            ))}
          </View>
          <Text style={[styles.unlockTitle, { color: colors.text }]} accessibilityLiveRegion="polite">
            {t('paywall.welcome')}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    minHeight: 220,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  closeButton: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    borderRadius: AccessibilitySize.minTouchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  kicker: {
    ...Typography.label,
  },
  title: {
    ...Typography.largeTitle,
  },
  subtitle: {
    ...Typography.body,
  },
  previewHint: {
    ...Typography.footnote,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timelineStop: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    flex: 1,
    minWidth: 16,
    height: 1,
  },
  timelineText: {
    ...Typography.footnote,
    flexShrink: 1,
  },
  unlock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  unlockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    maxWidth: 340,
  },
  unlockTitle: {
    ...Typography.title,
    textAlign: 'center',
  },
  previewStrip: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  previewTile: {
    width: 104,
    height: 132,
    borderRadius: Radius.card,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  previewLock: {
    alignSelf: 'flex-end',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
  },
  previewMore: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMoreNumber: {
    ...Typography.title,
    ...Typography.numeral,
  },
  body: {
    paddingHorizontal: Spacing.lg,
  },
  plansBody: {
    paddingTop: Spacing.md,
  },
  benefits: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    ...Typography.body,
    flex: 1,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  unavailable: {
    ...Typography.body,
    textAlign: 'center',
    marginVertical: Spacing.lg,
  },
  plans: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: AccessibilitySize.minTouchTarget + Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.card,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  planText: {
    flex: 1,
    gap: 2,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  planName: {
    ...Typography.headline,
    fontFamily: FontFamily.semibold,
  },
  bestValue: {
    borderRadius: Radius.tag,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bestValueText: {
    ...Typography.label,
  },
  planBadge: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
  },
  planPrice: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  restore: {
    minHeight: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  restoreText: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  legal: {
    ...Typography.caption,
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  link: {
    minHeight: AccessibilitySize.minTouchTarget,
    justifyContent: 'center',
  },
  linkText: {
    ...Typography.caption,
    textDecorationLine: 'underline',
  },
  terms: {
    ...Typography.footnote,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  footer: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
