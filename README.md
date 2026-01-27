# Expo Sass Template 💵

This template is based on [Expo](https://expo.dev), backend with [Supabase](https://supabase.com/), one-off payments with [Stripe](https://stripe.com/), subscribtions with [RevenueCat](https://www.revenuecat.com/) and [Google cloud](https://console.cloud.google.com/) social media sign-in.

## Get started
Assuming you have [Xcode](https://developer.apple.com/xcode/), [Android Studio](https://developer.android.com/studio) install, follow the next steps

* I highly recommend [Orbit](https://expo.dev/orbit) for when running emulators

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## More about expo

To learn more about developing your project with Expo, look at the following resources:
- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).

## Skills

https://skills.sh/trending

## Authentication (Google + Apple Sign In)

This template uses Supabase Auth with native OAuth providers. Users authenticate with Google or Apple, and Supabase handles session management.

### Prerequisites

1. Create a [Supabase](https://supabase.com/) project
2. Create a [Google Cloud](https://console.cloud.google.com/) project
3. Have an [Apple Developer](https://developer.apple.com/) account (for Apple Sign In)

### Environment Variables

Create a `.env` file in the root directory with:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_IOS_CLIENT_ID=your_google_ios_client_id
```

### Google Sign In

1. **Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials (OAuth client ID)
   - Create both **Web** and **iOS** client types
   - For iOS, add your bundle identifier: `com.rolandobarbella.exposass`
   - Copy the Web Client ID to `EXPO_PUBLIC_WEB_CLIENT_ID`
   - Copy the iOS Client ID to `EXPO_PUBLIC_IOS_CLIENT_ID`

2. **Supabase Dashboard**
   - Go to Authentication > Providers > Google
   - Enable Google provider
   - Add your Google Client ID and Client Secret (from Web credentials)

3. **app.json** (already configured)
   - The `@react-native-google-signin/google-signin` plugin is configured with the iOS URL scheme

### Apple Sign In

1. **Apple Developer Portal**
   - Enable "Sign In with Apple" capability for your App ID
   - Create a Services ID for web authentication (used by Supabase)
   - Configure the return URL: `https://<your-project>.supabase.co/auth/v1/callback`

2. **Supabase Dashboard**
   - Go to Authentication > Providers > Apple
   - Enable Apple provider
   - Add your Services ID and generate a secret key

3. **app.json** (already configured)
   - `"usesAppleSignIn": true` is set in the iOS config
   - `"expo-apple-authentication"` plugin is included

### Building for Testing

Apple Sign In requires a **development build** (not Expo Go):

```bash
# Build for iOS
eas build -p ios --profile development

# Build for Android (Google only)
eas build -p android --profile development
```

### How It Works

1. User taps Google/Apple sign-in button
2. Native OAuth dialog appears
3. User authenticates with provider
4. App receives identity token (JWT)
5. Token is sent to Supabase for validation
6. Supabase creates/retrieves user session
7. User profile is synced to `users` table

## Todo (full SaaS template)

- [x] Authentication (Google + Apple sign in)
- [ ] Protected routes and auth guards
- [ ] User profiles and account management
- [ ] Subscription billing (Stripe)
- [ ] Feature flags and plan gating
- [ ] Supabase database schema + policies
- [ ] File storage and uploads
- [ ] In-app notifications and email
- [ ] Analytics and error tracking
- [ ] Admin dashboard
- [ ] CI/CD and environment setup
- [ ] Security review and audit checklist

## Expo community

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
