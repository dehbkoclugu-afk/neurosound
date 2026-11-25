/**
 * RevenueCat in observer mode: expo-iap still sells and finishes every
 * purchase; RevenueCat only records them, so its dashboard shows installs
 * that open the app, trials, subscriptions and revenue. Nothing here gates
 * premium — the entitlement still comes from the store via PremiumSync.
 *
 * The keys are RevenueCat's public SDK keys, meant to ship in the app.
 */

import { Platform } from 'react-native';
import Purchases, { PURCHASES_ARE_COMPLETED_BY_TYPE, STOREKIT_VERSION } from 'react-native-purchases';

const API_KEYS = {
  ios: 'appl_gTZkqEKUxsOHIOndKKZSrUfTADU',
  android: 'goog_jIUwstwneRFJlPoIJHMFxjvlddV',
} as const;

let started = false;

export function startRevenueCat(): void {
  if (started || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;
  try {
    Purchases.configure({
      apiKey: API_KEYS[Platform.OS],
      // expo-iap 3 buys through StoreKit 2 on iOS.
      purchasesAreCompletedBy: {
        type: PURCHASES_ARE_COMPLETED_BY_TYPE.MY_APP,
        storeKitVersion: STOREKIT_VERSION.STOREKIT_2,
      },
    });
    started = true;
  } catch {
    // Analytics only: a failed start must never block playback or purchases.
  }
}

/**
 * Hands a fresh purchase to RevenueCat. On iOS this must run before the
 * transaction is finished; on Android it reads the purchase back from Play.
 */
export async function recordPurchase(productId: string): Promise<void> {
  if (!started) return;
  try {
    if (Platform.OS === 'ios') await Purchases.recordPurchase(productId);
    else await Purchases.syncPurchases();
  } catch {
    // Same as above: never let reporting break the purchase itself.
  }
}
