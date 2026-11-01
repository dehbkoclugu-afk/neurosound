/**
 * Mounted once at the root: owns the store connection and the purchase
 * listener, and re-checks Google Play for the entitlement on every connect.
 * Screens call expo-iap's plain functions; a second useIAP would register a
 * second listener and finish each purchase twice.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useIAP, getAvailablePurchases, finishTransaction, type Purchase } from 'expo-iap';

import { ALL_SKUS } from '@/lib/premium';
import { usePremiumStore } from '@/stores/premiumStore';

function isPremiumPurchase(p: Purchase): boolean {
  return ALL_SKUS.includes(p.productId) && p.purchaseState === 'purchased';
}

/** Re-reads owned purchases from the store. Returns whether premium is owned. */
export async function syncPremium(): Promise<boolean> {
  const purchases = (await getAvailablePurchases()).filter(isPremiumPurchase);
  // A purchase Play never saw acknowledged (app killed mid-flow) is refunded
  // after three days, so finish any stragglers here.
  await Promise.all(
    purchases
      .filter((p) => 'isAcknowledgedAndroid' in p && p.isAcknowledgedAndroid === false)
      .map((purchase) => finishTransaction({ purchase, isConsumable: false }).catch(() => {}))
  );
  const owned = purchases.length > 0;
  usePremiumStore.getState().setOwned(owned);
  return owned;
}

function PremiumSyncNative() {
  const { connected } = useIAP({
    onPurchaseSuccess: (purchase) => {
      if (!isPremiumPurchase(purchase)) return;
      usePremiumStore.getState().setOwned(true);
      finishTransaction({ purchase, isConsumable: false }).catch(() => {});
    },
  });

  useEffect(() => {
    // Offline or Play unavailable: keep the cached entitlement as it is.
    if (connected) syncPremium().catch(() => {});
  }, [connected]);

  return null;
}

export function PremiumSync() {
  return Platform.OS === 'web' ? null : <PremiumSyncNative />;
}
