import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Session } from '@supabase/supabase-js';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const displayName = getDisplayName(session);

  const onSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    router.replace('/');
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={Colors.light.tint} />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.subtitle}>No active session.</ThemedText>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/login-sheet')}>
          <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
            Sign in
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Home</ThemedText>
      <ThemedText style={styles.subtitle}>Welcome, {displayName}</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardLabel}>
          Session token
        </ThemedText>
        <ThemedText selectable style={styles.tokenText}>
          {session.access_token}
        </ThemedText>
      </ThemedView>

      <Pressable style={styles.secondaryButton} onPress={onSignOut} disabled={isSigningOut}>
        <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

function getDisplayName(session: Session | null) {
  if (!session) {
    return 'User';
  }

  const metadata = session.user.user_metadata;
  const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name : '';
  if (fullName.length > 0) {
    return fullName;
  }

  const name = typeof metadata?.name === 'string' ? metadata.name : '';
  if (name.length > 0) {
    return name;
  }

  return typeof session.user.email === 'string' && session.user.email.length > 0
    ? session.user.email
    : 'User';
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    backgroundColor: Colors.light.background,
  },
  subtitle: {
    opacity: 0.7,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  cardLabel: {
    opacity: 0.8,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.light.text,
  },
  primaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.dark.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    padding: 24,
    gap: 12,
  },
});
