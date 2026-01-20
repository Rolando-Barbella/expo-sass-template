import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type GoogleSignInSheetProps = {
  onSuccess?: () => void;
};

export function GoogleSignInSheet({ onSuccess }: GoogleSignInSheetProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    profileImageSize: 120,
  });

  const backgroundColor = useThemeColor({}, 'background');
  const dangerColor = useThemeColor({}, 'danger');

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

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor }]}>
        <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Sign In
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign in to sync your account across devices.
        </ThemedText>

        <GoogleSignInButton onPress={handleGoogleSignIn} isLoading={isLoading} />

        {errorMessage ? (
          <ThemedText style={[styles.error, { color: dangerColor }]}>{errorMessage}</ThemedText>
        ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '86%',
    maxWidth: 360,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 20,
    opacity: 0.7,
    textAlign: 'center',
  },
  error: {
    marginTop: 16,
    textAlign: 'center',
  },
});
