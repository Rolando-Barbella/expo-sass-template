# RevenueCat subscriptions setup guide

This app now includes a real RevenueCat integration instead of mock buttons:

- `providers/RevenueCatProvider.tsx`
- `lib/revenuecat.ts`
- `components/SubscriptionBottomSheet.tsx`
- `app/_layout.tsx`
- `app/(tabs)/profile.tsx`

## 1. Install the current Expo-compatible packages

```bash
npx expo install react-native-purchases react-native-purchases-ui
```

If your repo already contains native folders, regenerate them after install:

```bash
npx expo prebuild
```

Use a native development build for purchase testing:

```bash
npx expo run:ios
```

or:

```bash
npx expo run:android
```

## 2. Configure RevenueCat dashboard objects

Create these objects in RevenueCat so the app can resolve the expected offering and products:

1. Entitlement: `Sass Template Pro`
2. Products:
   - `lifetime`
   - `yearly`
   - `monthly`
3. Offering: `default`
4. Packages attached to `default`:
   - `lifetime` or `$rc_lifetime`
   - `yearly` or `$rc_annual`
   - `monthly` or `$rc_monthly`

The product identifiers above are inferred from the code in `lib/revenuecat.ts` and the subscription sheet UI.

## 3. Environment variables

`.env.local` should contain:

```env
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=test_sQdXRpUekqXHcIKYEUdJhFKzuaI
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=Sass Template Pro
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
```

Use RevenueCat public SDK keys only. Do not ship private REST API keys in the client app.

## 4. What the app now does

`RevenueCatProvider` configures the SDK once at startup, binds RevenueCat identity to the Supabase user when logged in, and exposes:

- `Purchases.getOfferings()`
- `Purchases.getCustomerInfo()`
- `Purchases.purchasePackage()`
- `Purchases.restorePurchases()`
- `RevenueCatUI.presentPaywallIfNeeded()`
- `RevenueCatUI.presentCustomerCenter()`

It also subscribes to `addCustomerInfoUpdateListener` so entitlement state updates immediately after purchases and restores.

## 5. Entitlement checking

The premium gate is based on:

```ts
customerInfo.entitlements.active['Sass Template Pro']
```

That entitlement powers:

- the active/free state in `components/SubscriptionBottomSheet.tsx`
- the subscription summary in `app/(tabs)/profile.tsx`

## 6. Manual purchase flow

The manual flow in `SubscriptionBottomSheet.tsx` now:

1. fetches the current offering
2. matches `lifetime`, `yearly`, and `monthly` packages
3. purchases the selected package with `purchasePackage`
4. restores transactions with `restorePurchases`
5. handles user cancellation separately from store or configuration errors
6. refreshes customer info and offering state

## 7. RevenueCat paywalls and Customer Center

This repo now uses the modern React Native UI methods:

- `RevenueCatUI.presentPaywallIfNeeded(...)`
- `RevenueCatUI.presentCustomerCenter(...)`

Use the paywall button in the subscription sheet for RevenueCat-hosted purchase UI. Use Customer Center from the sheet or profile screen for restores, subscription management, refund flows, and support actions configured in RevenueCat.

## 8. Best practices for this app

- Configure RevenueCat once at app startup.
- Use the Supabase user id as the RevenueCat `appUserID`.
- Gate premium UI from the entitlement, not from local booleans alone.
- Keep restore available in the purchase UI.
- Test only in a native build, not Expo Go or the web build.
- Add your Android public SDK key before expecting Android purchases to work.

## 9. Recommended server-side follow-up

If you need backend enforcement or analytics sync, add RevenueCat webhooks to Supabase and persist subscription state server-side. The client implementation here is enough for app UI gating and purchases, but webhooks are the right next step for API authorization.
