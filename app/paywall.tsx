/**
 * Premium paywall: yearly (with the free trial, if Play offers one to this
 * user), monthly, and a one-time lifetime unlock. Prices come from the store
 * so they are always localised; the entitlement itself is set by PremiumSync.
 *
 * Layout: a scene hero (what this app feels like), a strip of the actual
 * locked sounds (what the money opens), plans, then a CTA pinned to the
 * bottom edge so it never scrolls away from the plan it buys.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, requestPurchase, ErrorCode } from 'expo-iap';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { useArtwork } from '@/hooks/use-artwork';
import { Spacing, Typography, FontFamily, Radius, AccessibilitySize, withAlpha } from '@/constants/theme';
import { contentColumn } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { ArtBackground } from '@/components/ui/ArtBackground';
import { syncPremium } from '@/components/PremiumSync';
import { PREMIUM_SKUS, SUBSCRIPTION_SKUS, isLockedPreset } from '@/lib/premium';
import { allPresets } from '@/lib/frequencies';
import { presetArt } from '@/lib/artAssets';
import { upper } from '@/lib/upper';
import { useIsPremium } from '@/stores/premiumStore';
import { useToastStore } from '@/stores/toastStore';
import * as haptics from '@/lib/haptics';

type PlanKey = keyof typeof PREMIUM_SKUS;

interface Plan {
  key: PlanKey;
  sku: string;
  price: string;
  offerToken?: string;
  hasTrial: boolean;
}

const PLAN_ORDER: PlanKey[] = ['yearly', 'monthly', 'lifetime'];
const BENEFITS = ['benefitLibrary', 'benefitMix', 'benefitOffline'] as const;
const HERO_PRESET = 'solfeggio-963';
const PREVIEW_COUNT = 6;

type StoreProduct = { id: string; displayPrice: string; subscriptionOfferDetailsAndroid?: unknown };
type Offer = {
  offerToken: string;
  pricingPhases: { pricingPhaseList: { formattedPrice: string; priceAmountMicros: string }[] };
};

function toPlan(product: StoreProduct): Plan | null {
  const key = PLAN_ORDER.find((k) => PREMIUM_SKUS[k] === product.id);
  if (!key) return null;
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
    () => allPresets.filter((p) => isLockedPreset(p.id) && presetArt(p.id)).slice(0, PREVIEW_COUNT),
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

  // PremiumSync flips the entitlement when Play confirms the purchase.
  useEffect(() => {
    if (!isPremium) return;
    haptics.save();
    showToast(t('paywall.welcome'), 'success');
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const plan = plans?.find((p) => p.key === selected);

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
          variant="hero"
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewStrip}
          accessibilityLabel={t('paywall.benefitLibrary')}
        >
          {lockedPreview.map((preset) => (
            <ArtBackground
              key={preset.id}
              source={artwork.source(presetArt(preset.id))}
              variant="hero"
              style={styles.previewTile}
            >
              <View style={[styles.previewLock, { backgroundColor: artwork.foreground.badge }]}>
                <Ionicons name="lock-closed" size={12} color={artwork.foreground.primary} />
              </View>
              <Text
                style={[styles.previewName, { color: artwork.foreground.primary }]}
                numberOfLines={2}
              >
                {t(preset.nameKey)}
              </Text>
            </ArtBackground>
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

          {plans === null ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : plans.length === 0 ? (
            <Text style={[styles.unavailable, { color: colors.textSecondary }]}>{t('paywall.unavailable')}</Text>
          ) : (
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
                              {upper(t('paywall.bestValue'))}
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
          )}

          <TouchableOpacity
            onPress={handleRestore}
            disabled={busy}
            style={styles.restore}
            accessibilityRole="button"
          >
            <Text style={[styles.restoreText, { color: colors.accent }]}>{t('paywall.restore')}</Text>
          </TouchableOpacity>

          <Text style={[styles.legal, { color: colors.textSecondary }]}>{t('paywall.legal')}</Text>
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
        <Button
          title={ctaTitle}
          onPress={handleBuy}
          disabled={!plan || busy}
          size="large"
          style={contentColumn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    minHeight: 340,
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
  footer: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
