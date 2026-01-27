import { AppleSignInButton } from '@/components/AppleSignInButton';
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

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      setErrorMessage(null);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });


      if (!credential.identityToken || typeof credential.identityToken !== 'string') {
        throw new Error('Missing Apple identity token');
      }

      const appleProvider: Provider = 'apple';

      const appleAuthResult = await supabase.auth.signInWithIdToken({
        provider: appleProvider,
        token: credential.identityToken,
      });

      if (appleAuthResult.error) {
        console.error('Supabase apple auth error:', appleAuthResult.error);
        throw appleAuthResult.error;
      }

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

      if (fullName.length > 0 && typeof authData.user.user_metadata?.full_name !== 'string') {
        const { error: updateAuthError } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        if (updateAuthError) {
          console.error('Supabase user metadata update error:', updateAuthError);
          throw updateAuthError;
        }
      }

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
          <GoogleSignInButton onPress={handleGoogleSignIn} isLoading={isGoogleLoading} />
          <AppleSignInButton onPress={handleAppleSignIn} isLoading={isAppleLoading} />
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
