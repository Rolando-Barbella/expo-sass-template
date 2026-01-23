import { AppleSignInButton } from '@/components/AppleSignInButton';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ThemedText } from '@/components/themed-text';
import { Colors, UI } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

type GoogleSignInSheetProps = {
  onSuccess?: () => void;
  showAppleButton?: boolean;
};

export function GoogleSignInSheet({ onSuccess }: GoogleSignInSheetProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [onSuccess, router]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Missing Apple identity token');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
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
      setIsLoading(false);
    }
  }, [onSuccess, router]);

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
          <GoogleSignInButton onPress={handleGoogleSignIn} isLoading={isLoading} />
          <AppleSignInButton onPress={handleAppleSignIn} isLoading={isLoading} />
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
