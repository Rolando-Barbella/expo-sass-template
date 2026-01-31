import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Colors, UI } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null);
        setIsLoading(false);
      }
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <GestureHandlerRootView style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.light.tint} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="login-sheet"
          options={{
            presentation: 'formSheet',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            headerShown: false,
            contentStyle: styles.loginSheetContent,
            sheetGrabberVisible: true,
            sheetAllowedDetents: [UI.loginSheet.heightRatio],
            sheetInitialDetentIndex: 0,
            sheetExpandsWhenScrolledToEdge: true,
            sheetCornerRadius: 20,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  loginSheetContent: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
});
