import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type GoogleSignInSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type GoogleSignInSheetProps = {
  onSuccess?: () => void;
};

const googleLogo = require('../assets/images/google-sign-in.png');
type SignInWithIdToken = (params: { provider: 'google'; token: string }) => Promise<{ error: Error | null }>;

export const GoogleSignInSheet = forwardRef<GoogleSignInSheetRef, GoogleSignInSheetProps>(
  function GoogleSignInSheet({ onSuccess }, ref) {
    const modalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['40%'], []);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      profileImageSize: 120
    });

    const present = useCallback(() => {
      setErrorMessage(null);
      modalRef.current?.present();
    }, []);

    const dismiss = useCallback(() => {
      modalRef.current?.dismiss();
    }, []);

    const backgroundColor = useThemeColor({}, 'background');
    const borderColor = useThemeColor({}, 'border');
    const dangerColor = useThemeColor({}, 'danger');

    useImperativeHandle(ref, () => ({ present, dismiss }), [present, dismiss]);

    const handleGoogleSignIn = useCallback(async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
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
          throw error;
        }

        onSuccess?.();
        dismiss();
      } catch (error: unknown) {
        const errorCode =
          typeof error === 'object' && error !== null && 'code' in error
            ? (error as { code?: string }).code
            : undefined;

        if (errorCode === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Google sign-in failed');
      } finally {
        setIsLoading(false);
      }
    }, [dismiss, onSuccess]);

    return (
      <BottomSheetModal
        ref={modalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor }}
        handleIndicatorStyle={{ backgroundColor: borderColor }}
      >
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
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
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
