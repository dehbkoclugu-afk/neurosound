/**
 * Premium paywall: yearly (with the free trial, if Play offers one to this
 * user), monthly, and a one-time lifetime unlock. Prices come from the store
 * so they are always localised; the entitlement itself is set by PremiumSync.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, requestPurchase, ErrorCode } from 'expo-iap';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily, Radius, AccessibilitySize, withAlpha } from '@/constants/theme';
import { contentColumn } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { syncPremium } from '@/components/PremiumSync';
import { PREMIUM_SKUS, SUBSCRIPTION_SKUS } from '@/lib/premium';
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
  const colors = useThemeColors();
  const isPremium = useIsPremium();
  const showToast = useToastStore((s) => s.show);

  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<PlanKey>('yearly');
  const [busy, setBusy] = useState(false);

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={close}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, contentColumn]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {t('paywall.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('paywall.subtitle')}</Text>

        <View style={styles.benefits}>
          {BENEFITS.map((key) => (
            <View key={key} style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
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
                      backgroundColor: active ? withAlpha(colors.accent, 0.08) : colors.card,
                    },
                  ]}
                >
                  <View style={styles.planText}>
                    <Text style={[styles.planName, { color: colors.text }]}>{t(`paywall.plan.${p.key}`)}</Text>
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

        <Button
          title={ctaTitle}
          onPress={handleBuy}
          disabled={!plan || busy}
          size="large"
          style={styles.cta}
        />

        <TouchableOpacity
          onPress={handleRestore}
          disabled={busy}
          style={styles.restore}
          accessibilityRole="button"
        >
          <Text style={[styles.restoreText, { color: colors.accent }]}>{t('paywall.restore')}</Text>
        </TouchableOpacity>

        <Text style={[styles.legal, { color: colors.textSecondary }]}>{t('paywall.legal')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  closeButton: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  title: {
    ...Typography.title,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.lg,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: AccessibilitySize.minTouchTarget + Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.card,
    borderWidth: 2,
    gap: Spacing.md,
  },
  planText: {
    flex: 1,
    gap: 2,
  },
  planName: {
    ...Typography.headline,
    fontFamily: FontFamily.semibold,
  },
  planBadge: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
  },
  planPrice: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  cta: {
    marginBottom: Spacing.sm,
  },
  restore: {
    minHeight: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  restoreText: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  legal: {
    ...Typography.footnote,
    textAlign: 'center',
  },
});
