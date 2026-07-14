# RevenueCat setup (Mindful Moves)

SDK is integrated in the Expo app. Complete these dashboard steps so paywalls and entitlements work end-to-end.

## 1. Install (already done)

```bash
npx expo install react-native-purchases react-native-purchases-ui
```

RevenueCat needs a **development build** (not Expo Go) for real StoreKit purchases:

```bash
npx expo run:ios
# or
eas build --profile development --platform ios
```

## 2. API keys

App config: `config/revenuecat.ts`

| Key | Usage |
|-----|--------|
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | Shared / Test Store key (default in repo for sandbox) |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | Production Apple public API key (`appl_…`) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | Production Google public API key (`goog_…`) |

Add production keys to EAS **production** env the same way as Supabase keys.

Current sandbox key (Test Store): `test_rPGiLOnEHINZlOzchuyygNWUGbb`

## 3. Dashboard: products

In [App Store Connect](https://appstoreconnect.apple.com) (and Play Console if needed), create IAPs matching these product IDs:

| Product ID | Type |
|------------|------|
| `monthly` | Auto-renewable subscription |
| `yearly` | Auto-renewable subscription |
| `lifetime` | Non-consumable (or non-renewing, if you prefer) |

Import / sync those products into RevenueCat → **Products**.

## 4. Dashboard: entitlement

Create entitlement exactly:

**`Mindful Moves App Pro`**

Attach `monthly`, `yearly`, and `lifetime` to this entitlement.

App checks:

```ts
customerInfo.entitlements.active['Mindful Moves App Pro']
```

## 5. Dashboard: offering + packages

1. Create an Offering (e.g. `default`) and set it as **Current**.
2. Add packages that point at your products (identifiers can stay `monthly` / `yearly` / `lifetime`, or use `$rc_monthly` / `$rc_annual` / `$rc_lifetime` mapped to those store products).
3. Attach a **Paywall** to that offering (Templates → edit in dashboard).

## 6. Dashboard: Customer Center

Enable **Customer Center** in RevenueCat so Settings → **Manage subscription** works (`RevenueCatUI.presentCustomerCenter()`).

## 7. App integration map

| Piece | Path |
|-------|------|
| Config | `config/revenuecat.ts` |
| Provider | `context/SubscriptionContext.tsx` |
| Mounted under Auth | `app/_layout.tsx` |
| Upgrade / restore / manage | `app/(tabs)/settings.tsx` |

### Usage examples

```ts
import { useSubscription } from '@/context/SubscriptionContext';

const { isPro, presentPaywall, presentPaywallIfNeeded, presentCustomerCenter } = useSubscription();

// Soft upgrade CTA
await presentPaywall();

// Gate a feature (shows paywall only if entitlement missing)
const unlocked = await presentPaywallIfNeeded();
if (!unlocked) return;

// Manage / cancel / restore UI
await presentCustomerCenter();
```

Identity uses Supabase `user.id` via `Purchases.logIn` / `logOut` automatically.

## 8. Test checklist

1. Rebuild native app after installing packages.
2. Confirm RevenueCat Project + iOS app bundle id `com.mindfulmoves.app`.
3. Sandbox Apple ID on device.
4. Settings → Upgrade to Pro → paywall shows Monthly / Yearly / Lifetime.
5. Purchase → `isPro` becomes true.
6. Manage subscription → Customer Center opens.
7. Restore purchases after reinstall / new login.

## Notes

- Configure a Paywall in the dashboard before calling `presentPaywall` or you will get an error / empty state.
- Hot reload alone is not enough after adding native modules — rebuild with `expo run:ios` or EAS.
- Do not commit store production API keys into git; prefer EAS env vars.
