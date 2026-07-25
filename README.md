# Expo SaaS Template 💵

Opinionated React Native template built with [Expo](https://expo.dev), [Supabase](https://supabase.com/), [Stripe](https://stripe.com/), [RevenueCat](https://www.revenuecat.com/), and native Google/Apple Sign-In.

Most features have been tested on iOS first.

## Menu
- [Quick start](#quick-start)
- [Authentication setup](#authentication-setup)
- [RevenueCat setup](#revenuecat-setup)
- [Troubleshooting](#troubleshooting)
- [Extra resources](#extra-resources)

## What You Get

### Included ✅

- Google Sign-In for iOS and Android
- Apple Sign-In for iOS
- Supabase authentication and backend integration
- Bottom sheet login UI
- RevenueCat subscriptions

### Planned ⏳

- Apple payments
- Stripe payments
- Push notifications with Firebase and Expo
- Emails with [Resend](https://resend.com/emails)

## Prerequisites

Before starting, make sure you have:

- [Node.js](https://nodejs.org/) `18+`
- `npm` or `yarn`
- [Xcode](https://developer.apple.com/xcode/) for iOS development
- An [Apple Developer account](https://developer.apple.com/account) for App Store release
- An [Expo account](https://expo.dev/)
- `eas-cli` installed: `npm install -g eas-cli`

If you plan to release on Android, also install:

- [Android Studio](https://developer.android.com/studio)
- A [Google Play developer account](https://play.google.com/console/signup)

Nice to have:

- [Expo Orbit](https://expo.dev/orbit) for running emulators

## Quick Start

### 1. Clone the template

```bash
git clone https://github.com/Rolando-Barbella/expo-sass-template my-app
cd my-app
```

### 2. Customize project identity

Update `package.json`:

```json
{
  "name": "expo-sass",
  "version": "1.0.0"
}
```

Update `app.json`:

```json
{
  "expo": {
    "name": "Expo Sass",
    "slug": "expo-sass",
    "scheme": "exposass",
    "ios": {
      "bundleIdentifier": "com.rolandobarbella.exposass"
    },
    "android": {
      "package": "com.rolandobarbella.exposass"
    },
    "extra": {
      "eas": {
        "projectId": ""
      }
    }
  }
}
```

Naming rules:

- iOS bundle identifier: reverse-domain format, for example `com.yourcompany.appname`
- Android package name: usually the same format as the iOS bundle identifier
- App scheme: lowercase, no spaces, for example `myapp`

### 3. Create your environment file

Rename `.env.example` to `.env.local` or `.env`.

### 4. Install dependencies and run the native app

```bash
npm install
```

Create native projects:

```bash
npx expo prebuild
```

Run a platform build:

```bash
npx expo run:ios
```

```bash
npx expo run:android
```

This creates the `ios/` and `android/` folders.

### 5. Create a Supabase project

1. Create a project in [Supabase](https://supabase.com/).
2. Open your project dashboard.
3. Go to `Project Settings`.
4. Under `Configuration`, open `Data API` and copy the API URL.
5. Under `API keys`, copy the public anon key.
6. Add both values to your env file:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

![Left Bar Supabase](assets/images/left-bar-supbase.png)
![Supabase API Key](assets/images/supbase-api-key.png)

## Authentication Setup

This template supports Google Sign-In and Apple Sign-In. For iOS App Store release, Apple Sign-In is required if you provide third-party sign-in.

### Google Sign-In 🔐

#### 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Go to `APIs & Services` > `Credentials`.
4. If prompted, configure the consent screen first.
5. In the audience section, choose `External` and complete the basic app information.

![Google Cloud Project](assets/images/google-claude-project.png)
![Consent screen](assets/images/consent-screen.png)

#### 2. Create OAuth clients

Create these three OAuth client types:

`iOS`

- Application type: `iOS`
- Bundle ID: must match `app.json`
- Save the generated client ID as `EXPO_PUBLIC_IOS_CLIENT_ID`

`Android`

- Application type: `Android`
- Package name: must match `app.json`
- Add the SHA-1 fingerprint from:

```bash
keytool -keystore ~/.android/debug.keystore -list -v
```

The default debug keystore password is usually `android`.

- Save the generated client ID as `EXPO_PUBLIC_ANDROID_CLIENT_ID`

`Web`

- Application type: `Web application`
- Add `http://localhost:8081` to `Authorized JavaScript origins`
- Leave redirect URIs empty for now
- Save the generated client ID as `EXPO_PUBLIC_WEB_CLIENT_ID`

Helpful video: [Google setup walkthrough](http://youtube.com/watch?v=BDeKTPQzvR4)

### Supabase Auth Provider Setup

1. In Supabase, open `Authentication` > `Sign In / Providers`.
2. Enable Apple and Google.
3. For Apple, add your app client ID such as `com.yourcompany.appname`.
4. For Google, add:
   `EXPO_PUBLIC_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_IOS_CLIENT_ID`, `EXPO_PUBLIC_WEB_CLIENT_ID`
5. Copy the callback URL shown by Supabase.
6. Return to your Google web client and add that URL to `Authorized redirect URIs`.

### Update `app.json` for Google Sign-In

Replace `EXPO_PUBLIC_IOS_CLIENT_ID` in the plugin config with the real iOS client ID value:

```json
{
  "plugins": [
    [
      "@react-native-google-signin/google-signin",
      {
        "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
      }
    ]
  ]
}
```

### Apple Sign-In and EAS 

1. Run an iOS build:

```bash
eas build -p ios
```

2. Check that identifiers were created in your [Apple Developer account](https://developer.apple.com/account/resources/identifier/list).
3. In your Expo project, open `Credentials` and confirm the app credentials were saved.

Helpful video: [Apple Sign-In setup walkthrough](https://www.youtube.com/watch?v=tqxTijhYhp8)

Test the app again after finishing auth setup:

```bash
npx expo run:ios
```

```bash
npx expo run:android
```

## RevenueCat Setup 😺

1. Create an account at [RevenueCat](https://www.revenuecat.com/).
2. Create a new project from the [projects page](https://app.revenuecat.com/projects/).
3. Continue through the initial setup screens.

![Revenue cat new project](assets/images/revenue-cat-new-product.png)

### Entitlement

1. Open `Product catalog` > `Entitlements`.
2. Create a new entitlement.
3. Use a clear identifier and display name, for example `pro_account`.

### Android Subscription Setup 🤖

This flow moves between Google Play Console, Google Cloud Console, and RevenueCat.

#### 1. Create the app in Google Play Console

1. Create an app in [Google Play Console](https://play.google.com/console/u/0/developers/).
2. Use the package name from `app.json`.
3. Build your app if you have not already:

```bash
eas build
```

4. Download the generated `.aab` file.

#### 2. Create an internal release

1. In Google Play Console, open `Test and release` > `Internal testing`.
2. Click `Create new release`.
3. Upload the `.aab`.
4. Publish the release.

![Google Play Console](assets/images/internal-release.png)

#### 3. Create the subscription

1. Open `Monetize with Play` > `Products` > `Subscriptions`.
2. Create a subscription.
3. Add a product ID such as `new_app_subscription`.
4. Add a display name and save.

#### 4. Add subscription benefits

1. Click `Add subscription benefits`.
2. Add the benefits your app provides.
3. Leave tax/compliance fields for later if needed.
4. Save.

#### 5. Add a base plan

1. Open the subscription again.
2. Add a base plan, for example `default`.
3. Enable auto-renewing.
4. Set billing period, grace period, countries, and pricing.
5. Save and activate.

#### 6. Create Google Cloud credentials

1. Open your [Google Cloud Console](https://console.cloud.google.com/).
2. Enable:
   - [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)
   - [Google Play Developer Reporting API](https://console.cloud.google.com/apis/library/playdeveloperreporting.googleapis.com)
3. Create credentials if prompted.

If the button is missing, you may already have credentials in that project.

Helpful video: [RevenueCat Android credentials walkthrough](https://www.youtube.com/watch?v=fOr2fu-0Vs8&t=2s)

#### 7. Create a service account

1. In the API credentials flow, choose `Application data`.
2. Create a service account.
3. Add these permissions:
   - `Pub/Sub Editor`
   - `Monitoring Viewer`
4. Finish the setup.
5. Copy the service account email from the `Credentials` tab.
6. Open `Manage service accounts`.
7. Create a new JSON key and download it.

#### 8. Enable Pub/Sub

Enable the [Cloud Pub/Sub API](https://console.cloud.google.com/apis/library/pubsub.googleapis.com?).

#### 9. Invite the service account in Google Play Console

1. Open `Users and permissions`.
2. Invite the service account email.
3. Grant app access to your app.
4. Enable these account permissions:
   - View app information and download bulk reports
   - View financial data, orders, and cancellation survey responses
   - Manage orders and subscriptions

At this point, the Android-side Google setup should be complete.

#### 10. Connect Google Play to RevenueCat

1. In RevenueCat, open `Apps`.
2. Click `+ Add app`.
3. Select `Google Play Store`.
4. Create a Play Store configuration with your Android package name.
5. Upload the JSON service account credentials.

It can take up to 36 hours for Google Play credentials to fully propagate.

![revenuecat credentials page](assets/images/revenuecat-credentials.png)

#### 11. Import the Google Play subscription into RevenueCat

1. In RevenueCat, open `Product catalog` > `Products`.
2. Click `New product`, then `Import`.
3. Select the subscription you created in Google Play.
4. Attach the entitlement.

![Attach product](assets/images/attched-product.png)

### iOS Subscription Setup 

Official guide: [RevenueCat iOS entitlements guide](https://www.revenuecat.com/docs/getting-started/entitlements/ios-products)

1. Build the app:

```bash
eas build
```

2. Submit it to App Store Connect:

```bash
eas submit -p ios
```

### App Store Connect Subscriptions

1. Open your app in [App Store Connect](https://appstoreconnect.apple.com/apps).
2. Under `Monetization`, open `Subscriptions`.
3. Create a subscription group.
4. Add localization details.
5. Create a subscription and configure:
   - Reference name
   - Product ID, for example `new_app_subscription_monthly`
   - Duration
   - Availability
   - Price
   - Localization
6. Back on the subscriptions overview page, configure a billing grace period.

![Attach product](assets/images/monetization.png)

### In-App Purchase Key

1. Open [Users and Access](https://appstoreconnect.apple.com/access/users).
2. Select the `Integrations` tab.
3. Open `In-App Purchase`.
4. Generate a new key.
5. Download the key file.
6. Copy the Issuer ID.

### Connect App Store to RevenueCat

1. In RevenueCat, open `Apps`.
2. Create a new `App Store` app.
3. Add your iOS bundle ID.
4. Upload the key file.
5. Add the Issuer ID.
6. Save.

### Add the App Store product in RevenueCat

1. In RevenueCat, open `Product catalog` > `Products`.
2. Click `New Product`.
3. Choose your App Store product.
4. In App Store Connect, open the subscription and copy the product ID.
5. Paste that into RevenueCat as the identifier.
6. Add a display name.
7. Attach the entitlement.
8. Refresh and verify it saved correctly.

![Attached Entitlements](assets/images/attached-entitlements.png)

### Offerings

1. Open `Product catalog` > `Offerings`.
2. Click `+ New Offering`.
3. Add an identifier and display name.
4. Add packages such as monthly or annual.
5. Assign the matching products.

### API Keys

Copy these values into your env file:

```bash
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=...
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=...
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=...
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=...
```

You can find them in RevenueCat under:

- `App & providers` > `API keys`
- `Product catalog` > `Entitlements`
- `Product catalog` > `Offerings`

## Troubleshooting

- Clear Metro cache: `npx expo start --clear`
- Clean native prebuild: `npx expo prebuild --clean`
- Review console warnings, especially native compatibility warnings

## Extra Resources

### Skills

- https://github.com/expo/skills
- https://skills.sh/trending

### Expo

- [Expo documentation](https://docs.expo.dev/)
- [Expo GitHub](https://github.com/expo/expo)
- [Expo Discord community](https://chat.expo.dev)
