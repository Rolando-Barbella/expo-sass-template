import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';

type GoogleSignInSheetProps = {
  onSuccess?: () => void;
};

const googleLogo = require('../assets/images/google-sign-in.png');
type SignInWithIdToken = (params: { provider: 'google'; token: string }) => Promise<{ error: Error | null }>;

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
  const borderColor = useThemeColor({}, 'border');
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

      const signInWithIdToken = (supabase.auth as unknown as { signInWithIdToken: SignInWithIdToken })
        .signInWithIdToken;
        
      const { error } = await signInWithIdToken({
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
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Continue with Google
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign in to sync your account across devices.
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { borderColor },
            pressed && styles.buttonPressed,
          ]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Image source={googleLogo} style={styles.logo} resizeMode="contain" />
          <ThemedText type="link">Sign in with Google</ThemedText>
          {isLoading ? <ActivityIndicator size="small" /> : <View style={styles.spacer} />}
        </Pressable>

        {errorMessage ? (
          <ThemedText style={[styles.error, { color: dangerColor }]}>{errorMessage}</ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
    opacity: 0.7,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  logo: {
    width: 22,
    height: 22,
  },
  spacer: {
    width: 16,
  },
  error: {
    marginTop: 16,
  },
});
