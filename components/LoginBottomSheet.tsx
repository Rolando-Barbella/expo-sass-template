import { AppleSignInButton } from '@/components/AppleSignInButton';
import { AuthSkeleton } from '@/components/AuthSkeleton';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ThemedText } from '@/components/themed-text';
import { Colors, UI } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { Provider } from '@supabase/auth-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

type GoogleSignInSheetProps = {
  onSuccess?: () => void;
};


type UserRow = {
  id: string;
  email: string;
  name: string;
  image: string;
  surname: string;
  is_pay: boolean;
  expo_push_token: string | null;
  created_at: string;
};

export function GoogleSignInSheet({ onSuccess }: GoogleSignInSheetProps) {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isProfileSyncing, setIsProfileSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { height: windowHeight } = useWindowDimensions();

  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    profileImageSize: 120,
  });

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);

      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('Missing Google ID token');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      onSuccess?.();
      router.back();
    } catch (error: unknown) {
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;

      if (errorCode === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      console.error('Google sign-in error:', error);

      setErrorMessage(error instanceof Error ? error.message : 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * Handles Apple Sign-In authentication flow.
   *
   * Flow:
   * 1. Triggers native Apple Sign-In dialog via expo-apple-authentication
   * 2. Requests user's full name and email (only provided on FIRST sign-in)
   * 3. Receives identity token (JWT) from Apple
   * 4. Authenticates with Supabase using the Apple identity token
   * 5. Syncs user profile to the 'users' table in Supabase
   *
   * Important Notes:
   * - Apple only provides name/email on the FIRST sign-in. On subsequent sign-ins,
   *   these fields will be null, so we fallback to Supabase auth data.
   * - The identity token is a JWT that Supabase validates with Apple's public keys.
   * - User profile is upserted (insert or update) to handle both new and returning users.
   * - If user cancels the dialog, we silently return without showing an error.
   */
  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      setErrorMessage(null);

      // Step 1: Trigger native Apple Sign-In dialog
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });


      // Step 2: Validate the identity token from Apple
      if (!credential.identityToken || typeof credential.identityToken !== 'string') {
        throw new Error('Missing Apple identity token');
      }

      // Step 3: Authenticate with Supabase using Apple's identity token
      // Supabase validates the JWT with Apple's public keys server-side
      const appleProvider: Provider = 'apple';

      const appleAuthResult = await supabase.auth.signInWithIdToken({
        provider: appleProvider,
        token: credential.identityToken,
      });

      if (appleAuthResult.error) {
        console.error('Supabase apple auth error:', appleAuthResult.error);
        throw appleAuthResult.error;
      }

      // Step 4: Fetch the authenticated user from Supabase
      setIsProfileSyncing(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Supabase could not get user after Apple sign-in', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Missing user after Apple sign-in');
      }

      if (!authData.user.id || typeof authData.user.id !== 'string') {
        throw new Error('Missing user id after Apple sign-in');
      }

      // Step 5: Extract user profile data
      // Note: Apple only provides name/email on FIRST sign-in, so we use fallbacks
      const name = typeof credential.fullName?.givenName === 'string' ? credential.fullName.givenName : '';
      const surname = typeof credential.fullName?.familyName === 'string' ? credential.fullName.familyName : '';
      const fullName = [name, surname].filter((value) => value.length > 0).join(' ');
      const email =
        typeof credential.email === 'string'
          ? credential.email
          : typeof authData.user.email === 'string'
            ? authData.user.email
            : '';
      const image =
        typeof authData.user.user_metadata?.avatar_url === 'string' ? authData.user.user_metadata.avatar_url : '';

      // Step 6: Update Supabase auth metadata with full name (if available and not already set)
      if (fullName.length > 0 && typeof authData.user.user_metadata?.full_name !== 'string') {
        const { error: updateAuthError } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        if (updateAuthError) {
          console.error('Supabase user metadata update error:', updateAuthError);
          throw updateAuthError;
        }
      }

      // Step 7: Upsert user profile to 'users' table (creates new or updates existing)
      const userRow = {
        id: authData.user.id,
        email,
        name,
        image,
        surname,
        is_pay: false,
        expo_push_token: null,
        created_at: new Date().toISOString(),
      } satisfies UserRow;

      const { error: profileError } = await supabase
      .from('users')
      .upsert(userRow, { onConflict: 'id' });

      if (profileError) {
        console.error('Supabase user upsert error:', profileError);
        throw profileError;
      }

      onSuccess?.();
      router.back();
    } catch (error: unknown) {
      // Silently handle user cancellation (don't show error)
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return;
      }
      console.error('Apple sign-in error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Apple sign-in failed');
    } finally {
      setIsAppleLoading(false);
      setIsProfileSyncing(false);
    }
  };

  return (
    <View style={[styles.container, { height: windowHeight * UI.loginSheet.heightRatio}]}>
      <View style={styles.card}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Sign In
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Sign in to sync your account across devices.
          </ThemedText>
          {isProfileSyncing ? (
            <AuthSkeleton />
          ) : (
            <>
              <GoogleSignInButton onPress={handleGoogleSignIn} isLoading={isGoogleLoading} />
              <AppleSignInButton onPress={handleAppleSignIn} isLoading={isAppleLoading} />
            </>
          )}
          {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 10,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    bottom: 10,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
    opacity: 0.7,
    textAlign: 'center',
  },
  error: {
    marginTop: 16,
    color: Colors.light.danger,
  },
});
