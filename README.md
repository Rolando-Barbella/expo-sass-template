# Expo SaaS Template 💵

A React Native template built with [Expo](https://expo.dev), [Supabase](https://supabase.com/) authentication, [Stripe](https://stripe.com/) payments, [RevenueCat](https://www.revenuecat.com/) subscriptions, and native Google/Apple Sign-In.

## Features

- ✅ Google Sign-In (iOS & Android)
- ✅ Apple Sign-In (iOS)
- ✅ Supabase authentication & backend
- ✅ Bottom sheet login UI
### Todo
- ⏳ RevenueCat subscriptions (coming next)
- ⏳ Apple payment
- ⏳ Stripe payments 
- ⏳ Push Notifications with firebase and expo
- ⏳ Emails with [resend](https://resend.com/emails)

## Prerequisites

Before you start, make sure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Xcode** (for iOS development) - [Download](https://developer.apple.com/xcode/)
- **Android Studio** (for Android development) - [Download](https://developer.android.com/studio)
- **Apple developer account** For making your app live [Create](https://developer.apple.com/account) ($99 a year)

## Nice to have
- **[Expo Orbit](https://expo.dev/orbit)** (highly recommended for running emulators)
- **EAS CLI** - Install with `npm install -g eas-cli`

## Quick Start

### 1. Clone the Template

```bash
git clone https://github.com/yourusername/expo-sass-template.git my-app
cd my-app
```

### 2. Configure Your Project

You need to customize several files to make this template your own.

#### A. Update `package.json`

Open `package.json` and change:

```json
{
  "name": "expo-sass",  // Change to your project name
  "version": "1.0.0"
}
```

#### B. Update `app.json`

Open `app.json` and update the following fields:

```json
{
  "expo": {
    "name": "expo-sass",              // Your app display name
    "slug": "Expo SaaS",              // URL-friendly identifier
    "scheme": "exposass",             // Deep linking scheme (lowercase, no spaces)
    "ios": {
      "bundleIdentifier": "com.rolandobarbella.exposass"  // Your unique iOS bundle ID
    },
    "android": {
      "package": "com.rolandobarbella.exposass"  // Your unique Android package name
    },
    "extra": {
      "eas": {
        "projectId": ""  // Leave empty for now, will be filled when you run 'eas build'
      }
    }
  }
}
```

**Important naming conventions:**
- Bundle Identifier (iOS): Reverse domain notation (e.g., `com.yourcompany.appname`)
- Package Name (Android): Same format as bundle identifier
- Scheme: Lowercase, no spaces (e.g., `myapp`, `mycompanyapp`)


### 3. Set Up External Services

Rename the .env.example file for .env.local or .env

#### A. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a free account
2. Click "Start New project"
3. Choose your organization and set a database password
4. On the left bar go to **Project Settings** > **Data API** > ***Project URL** and copy:
   - URL (e.g., `https://jskokp.supabase.co`)
5. On the left bar go to **Project Settings** > **API keys** > ***Legacy anon, service_role API keys tab** and copy:
   - Anon/Public Key (starts with `eyJ...`)
6. Paste this two values on your `.env.local`, EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY


### 4. Create a Google Cloud Project (for Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project or select an existing one
google-claude-project

3. Add credentials
   - Go to **APIs & Services** >  **Credentials** > **Create credentials**
   - Configure the consent screen if you haven't already, select the **External** checkbox, then add the rest of the app information 
   - Then  **Create Credentials** > **OAuth client ID**

    **iOS Client:**
   - Application type: **iOS**
   - Name: "My App iOS" or leave the default one
   - Bundle ID: `com.yourcompany.yourapp` (must match `app.json`)
   - Copy the **Client ID**, pasted the id in the .env.local file, EXPO_PUBLIC_IOS_CLIENT_ID

     **Android Client:**
   - Application type: **Android**
   - Name: "My App Android"
   - Package name: `com.yourcompany.yourapp` (must match `app.json`)
   - SHA-1 certificate fingerprint: Get this by running:
     ```bash
     # For development
     keytool -keystore ~/.android/debug.keystore -list -v
     # Password is usually 'android'
     ```
   - Copy the **Client ID**, Pasted the id in the .env.local file, EXPO_PUBLIC_ANDROID_CLIENT_ID

   **Web Client (required for Supabase):**
   - Application type: **Web application**
   - Name: "My App Web" or the defualt one
   - On the Authorised JavaScript origins, add: `http://localhost:8081`
   - Leave the Authorised redirect URIs empry for now (we will come back to in a next step)
   <!-- - Authorized redirect URIs: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` -->
   - Copy the **Client ID** and **Client Secret**
   


4. Supabase Auth setup

1. Go to your project
2. On the left bar, go to **Authentication** > **Sign In/Providers"** 
3. Enable Apple and Google
4.1 On Apple, add the client id: `com.yourcompany.appname`
4.2 On Google, add the client id: with the following values: 
`EXPO_PUBLIC_ANDROID_CLIENT_ID, + EXPO_PUBLIC_IOS_CLIENT_ID, + EXPO_PUBLIC_WEB_CLIENT_ID` (don't forget the commas)
5.Copy the Callback URL (for OAuth) from Google or Apple
6.Go back to your Web Client credential in Google claude and paste the adress in the Authorised redirect URIs field
   

5. Update `app.json` with your iOS Web Client ID:
   Find this section and replace with your iOS Web Client ID (reversed format):
   ```json
   {
     "plugins": [
       [
         "@react-native-google-signin/google-signin",
         {
           "iosUrlScheme": "com.googleusercontent.apps.EXPO_PUBLIC_IOS_CLIENT_ID"
         }
       ]
     ]
   }
   ```
   The iOS Web Client ID looks like: `1234567890-abc123def456.apps.googleusercontent.com`
   You need to reverse it to: `com.googleusercontent.apps.1234567890-abc123def456`

#### C. Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google**:
   - Enable the provider
   - Add your **Web Client ID** and **Client Secret** from Google Cloud
   - Save

3. Enable **Apple** (optional, for iOS only):
   - See the [Apple Sign-In Setup](#apple-sign-in-setup-optional) section below

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:
   ```bash
   # Google OAuth Client IDs (from Google Cloud Console)
   EXPO_PUBLIC_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
   EXPO_PUBLIC_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
   EXPO_PUBLIC_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

   # Supabase (from Supabase Dashboard > Settings > API)
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxx...
   ```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the App

```bash
npx expo start
```

In the output, you'll find options to open the app in:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

**Note:** Google and Apple Sign-In require a [development build](https://docs.expo.dev/develop/development-builds/create-a-build/), they won't work in Expo Go.

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


## Troubleshooting
1. Clear caches — npx expo start --clear
2. Clean prebuild — npx expo prebuild --clean
3. Review console warnings — Legacy modules log compatibility warnings

## Expo community

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
