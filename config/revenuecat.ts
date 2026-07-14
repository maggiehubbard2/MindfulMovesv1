/**
 * RevenueCat configuration for Mindful Moves.
 *
 * Dashboard should define:
 * - Entitlement: Mindful Moves App Pro
 * - Products: lifetime, yearly, monthly
 * - Offering (current) with those packages + a Paywall
 * - Customer Center (optional) for manage / restore flows
 */

export const ENTITLEMENT_ID = 'Mindful Moves App Pro';

/** Store / RevenueCat product identifiers */
export const PRODUCT_IDS = {
  lifetime: 'lifetime',
  yearly: 'yearly',
  monthly: 'monthly',
} as const;

/**
 * Prefer env vars so EAS production can use platform keys.
 * Falls back to the Test Store key for local / sandbox development.
 */
export const REVENUECAT_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ??
  'test_rPGiLOnEHINZlOzchuyygNWUGbb';

export const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? REVENUECAT_API_KEY;

export const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? REVENUECAT_API_KEY;
