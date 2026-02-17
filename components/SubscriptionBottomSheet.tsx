import { ThemedText } from '@/components/ThemedText';
import { Colors, UI } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

type PlanId = 'monthly' | 'annual';

type PlanOption = {
  id: PlanId;
  label: string;
  price: string;
  description: string;
  badge?: string;
};

const PLANS: PlanOption[] = [
  {
    id: 'monthly',
    label: 'Pro Monthly',
    price: '$9.99/month',
    description: 'Flexible month to month plan.',
  },
  {
    id: 'annual',
    label: 'Pro Annual',
    price: '$79.99/year',
    description: 'Save 33% compared to monthly billing.',
    badge: 'Best value',
  },
];

export function SubscriptionBottomSheet() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const runMockAsync = (onComplete: () => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(onComplete, 900);
  };

  const onSubscribe = () => {
    setStatusMessage(null);
    setIsPurchasing(true);

    runMockAsync(() => {
      setIsPurchasing(false);
      setStatusMessage(
        'Template placeholder: connect this action to RevenueCat purchasePackage().'
      );
    });
  };

  const onRestorePurchases = () => {
    setStatusMessage(null);
    setIsRestoring(true);

    runMockAsync(() => {
      setIsRestoring(false);
      setStatusMessage(
        'Template placeholder: connect this action to RevenueCat restorePurchases().'
      );
    });
  };

  return (
    <View style={[styles.container, { height: windowHeight * UI.subscriptionSheet.heightRatio }]}>
      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          Unlock Pro
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Add RevenueCat offerings here and gate premium content with active entitlements.
        </ThemedText>

        <View style={styles.planList}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
              >
                <View>
                  <View style={styles.planHeader}>
                    <ThemedText type="defaultSemiBold">{plan.label}</ThemedText>
                    {plan.badge ? <ThemedText style={styles.badge}>{plan.badge}</ThemedText> : null}
                  </View>
                  <ThemedText style={styles.planDescription}>{plan.description}</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">{plan.price}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={onSubscribe}
          disabled={isPurchasing || isRestoring}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            (isPurchasing || isRestoring) && styles.buttonDisabled,
          ]}
        >
          {isPurchasing ? (
            <ActivityIndicator color={Colors.dark.text} />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Continue with {selectedPlan}</ThemedText>
          )}
        </Pressable>

        <Pressable
          onPress={onRestorePurchases}
          disabled={isPurchasing || isRestoring}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
            (isPurchasing || isRestoring) && styles.buttonDisabled,
          ]}
        >
          {isRestoring ? (
            <ActivityIndicator color={Colors.light.text} />
          ) : (
            <ThemedText style={styles.secondaryButtonText}>Restore purchases</ThemedText>
          )}
        </Pressable>

        {statusMessage ? <ThemedText style={styles.statusMessage}>{statusMessage}</ThemedText> : null}

        <Pressable onPress={() => router.back()} style={styles.notNowButton}>
          <ThemedText style={styles.notNowText}>Not now</ThemedText>
        </Pressable>
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
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  card: {
    width: '100%',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 4,
  },
  planList: {
    gap: 10,
  },
  planCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  planCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: 'rgba(84, 242, 84, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planDescription: {
    opacity: 0.75,
    marginTop: 2,
  },
  badge: {
    color: Colors.light.tint,
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: Colors.dark.text,
    textTransform: 'capitalize',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    color: Colors.light.text,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  statusMessage: {
    fontSize: 12,
    color: Colors.light.gray,
    textAlign: 'center',
  },
  notNowButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  notNowText: {
    opacity: 0.6,
  },
});
