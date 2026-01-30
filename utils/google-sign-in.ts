import { supabase } from '@/lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { Provider } from '@supabase/auth-js';

export type UserRow = {
  id: string;
  email: string;
  name: string;
  image: string;
  surname: string;
  is_pay: boolean;
  expo_push_token: string | null;
  created_at: string;
};

type GoogleSignInCallbacks = {
  onLoadingChange: (isLoading: boolean) => void;
  onError: (message: string | null) => void;
  onSuccess: () => void;
};

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    profileImageSize: 120,
  });
}

export async function handleGoogleSignIn({ onLoadingChange, onError, onSuccess }: GoogleSignInCallbacks) {
  try {
    onLoadingChange(true);
    onError(null);

    await GoogleSignin.hasPlayServices();
    const googleSignInResult = await GoogleSignin.signIn();

    if (googleSignInResult.type === 'cancelled') {
      return;
    }
    const { idToken } = await GoogleSignin.getTokens();

    if (!idToken) {
      throw new Error('Missing Google ID token');
    }

    const googleProvider: Provider = 'google';
    const googleAuthResult = await supabase.auth.signInWithIdToken({
      provider: googleProvider,
      token: idToken,
    });

    if (googleAuthResult.error) {
      console.error('Supabase auth error:', googleAuthResult.error);
      throw googleAuthResult.error;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Supabase could not get user after Google sign-in', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Missing user after Google sign-in');
    }

    if (!authData.user.id || typeof authData.user.id !== 'string') {
      throw new Error('Missing user id after Google sign-in');
    }

    const googleUser = googleSignInResult?.data?.user;
    const name = typeof googleUser?.givenName === 'string' ? googleUser.givenName : '';
    const surname = typeof googleUser?.familyName === 'string' ? googleUser.familyName : '';
    const email =
      typeof googleUser?.email === 'string'
        ? googleUser.email
        : typeof authData.user.email === 'string'
          ? authData.user.email
          : '';
    const image = typeof googleUser?.photo === 'string' ? googleUser.photo : '';

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

    const { error: profileError } = await supabase.from('users').upsert(userRow, { onConflict: 'id' });

    if (profileError) {
      console.error('Supabase user upsert error:', profileError);
      throw profileError;
    }

    onSuccess();
  } catch (error: unknown) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined;

    const isCancelled =
      errorCode === statusCodes.SIGN_IN_CANCELLED ||
      errorCode === 'SIGN_IN_CANCELLED' ||
      (error instanceof Error && /cancel/i.test(error.message));

    if (isCancelled) {
      onError(null);
      return;
    }

    console.error('Google sign-in error:', error);

    onError(error instanceof Error ? error.message : 'Google sign-in failed');
  } finally {
    onLoadingChange(false);
  }
}
