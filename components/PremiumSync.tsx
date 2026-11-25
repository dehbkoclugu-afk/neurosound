/**
 * Mounted once at the root: owns the store connection and the purchase
 * listener, and re-checks Google Play / StoreKit for the entitlement on connect.
 * Screens call expo-iap's plain functions; a second useIAP would register a
 * second listener and finish each purchase twice.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  useIAP,
  getAvailablePurchases,
  finishTransaction,
  syncIOS,
  ErrorCode,
  type Purchase,
} from 'expo-iap';

import i18n from '@/i18n';
import { ALL_SKUS } from '@/lib/premium';
import { recordPurchase, startRevenueCat } from '@/lib/revenuecat';
import { usePremiumStore } from '@/stores/premiumStore';
import { useToastStore } from '@/stores/toastStore';

function isPremiumPurchase(p: Purchase): boolean {
  return ALL_SKUS.includes(p.productId) && p.purchaseState === 'purchased';
}

/** Re-reads owned purchases from the store. Returns whether premium is owned. */
export async function syncPremium(): Promise<boolean> {
  const purchases = (await getAvailablePurchases()).filter(isPremiumPurchase);
  // Finish any straggler transactions: unacknowledged Android purchases are
  // refunded after 3 days, and unfinished iOS StoreKit 2 transactions remain
  // in the queue until finished (finishTransaction is idempotent on iOS).
  await Promise.all(
    purchases
      .filter(
        (p) =>
          Platform.OS === 'ios' ||
          ('isAcknowledgedAndroid' in p && p.isAcknowledgedAndroid === false)
      )
      .map((purchase) => finishTransaction({ purchase, isConsumable: false }).catch(() => {}))
  );
  const owned = purchases.length > 0;
  usePremiumStore.getState().setOwned(owned);
  return owned;
}

/** Explicit user-initiated restore: triggers AppStore.sync() on iOS first so
 *  reinstalls / new devices refresh StoreKit 2 entitlements before querying. */
export async function restorePremium(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'ios') {
    await syncIOS().catch(() => {});
  }
  return syncPremium();
}

function PremiumSyncNative() {
  useEffect(startRevenueCat, []);

  const { connected } = useIAP({
    onPurchaseSuccess: (purchase) => {
      if (!ALL_SKUS.includes(purchase.productId)) return;
      if (purchase.purchaseState === 'pending') {
        useToastStore.getState().show(i18n.t('paywall.pending'), 'info');
        return;
      }
      if (!isPremiumPurchase(purchase)) return;
      usePremiumStore.getState().setOwned(true);
      // RevenueCat has to see an iOS transaction before it is finished.
      recordPurchase(purchase.productId)
        .then(() => finishTransaction({ purchase, isConsumable: false }))
        .catch(() => {});
    },
    onPurchaseError: (error) => {
      if (error?.code === ErrorCode.UserCancelled) return;
      useToastStore.getState().show(i18n.t('paywall.error'), 'error');
    },
  });

  useEffect(() => {
    usePremiumStore.getState().setConnected(connected);
    // Offline or Play unavailable: keep the cached entitlement as it is.
    if (connected) syncPremium().catch(() => {});
  }, [connected]);

  return null;
}

export function PremiumSync() {
  return Platform.OS === 'web' ? null : <PremiumSyncNative />;
}
