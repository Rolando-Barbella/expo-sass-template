# RevenueCat subscriptions setup guide

This branch includes a starter subscription UI:
- `components/SubscriptionBottomSheet.tsx`
- `app/subscription-sheet.tsx`
- route wiring in `app/_layout.tsx`
- entry point from `app/index.tsx`

The current UI is intentionally a template placeholder. The `Subscribe` and `Restore purchases` actions are mock handlers where RevenueCat calls should be connected.

## 1. Install dependencies

Run:

```bash
npx expo install @revenuecat/purchases
```

If native folders already exist, run a new prebuild after install:

```bash
npx expo prebuild
```

## 2. RevenueCat dashboard setup

1. Create a RevenueCat project.
2. Add apps for iOS and Android with matching bundle/package ids from `app.json`.
3. Create an entitlement (example: `pro`).
4. Create products in App Store Connect and Google Play Console.
5. Import/link those store products in RevenueCat.
6. Create an Offering (example: `default`) and attach packages (`$rc_monthly`, `$rc_annual`, etc.).
7. Copy each platform public SDK key from RevenueCat.

## 3. Environment variables

Add these keys to `.env.local` (or `.env`):

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
```

Use non-secret public SDK keys only. Do not place private RevenueCat API keys in the app.

## 4. Initialize RevenueCat once on app startup

Create `lib/revenuecat.ts` and configure the SDK once:

```ts
import Purchases from '@revenuecat/purchases';
import { Platform } from 'react-native';

export async function configureRevenueCat(userId?: string) {
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

  if (!apiKey) throw new Error('Missing RevenueCat API key');
  await Purchases.configure({ apiKey, appUserID: userId });
}
```

Call it from root app startup (`app/_layout.tsx`) after session load. Use your Supabase user id as `appUserID` so purchases map to the same account.

## 5. Wire the sheet to real purchases

Replace template placeholders in `components/SubscriptionBottomSheet.tsx`:

- Fetch offerings: `Purchases.getOfferings()`
- Choose package from current offering
- Purchase package: `Purchases.purchasePackage(selectedPackage)`
- Restore: `Purchases.restorePurchases()`
- Validate entitlement: `customerInfo.entitlements.active[ENTITLEMENT_ID]`

Suggested behavior:
- Disable buttons during purchase/restore.
- Show user-friendly cancellation vs error messages.
- After successful purchase, close sheet and unlock premium UI.

## 6. Gate premium features

Add a central subscription state (context/store/query cache) and check active entitlement before rendering premium screens/actions.

Recommended:
- On auth login: configure RevenueCat with Supabase user id.
- On app foreground: refresh `customerInfo`.
- On logout: call `Purchases.logOut()` and clear local subscription state.

## 7. Backend sync (recommended)

Use RevenueCat webhooks to keep Supabase in sync:

1. Create webhook endpoint (Supabase Edge Function or API route).
2. Verify RevenueCat webhook authorization.
3. Store subscription status in a `subscriptions` table (user id, entitlement id, expires_at, is_active).
4. Use server-side status for API authorization where needed.

## 8. Testing checklist

- iOS: run with Sandbox tester in TestFlight/dev build.
- Android: run with license test account in internal testing track.
- Test purchase success, restore, cancellation, billing issue, and expiry.
- Confirm account switching works (logout/login with different users).
- Confirm entitlements remain correct after reinstall.

## Important notes

- Expo Go is not sufficient for this flow; use a dev build (`expo run:*` or EAS build).
- Product identifiers must match exactly across store + RevenueCat.
- Keep paywall copy transparent (trial length, billing cadence, renewal terms).
- Apple requires "Restore Purchases" access in subscription flows.
