import { ThemedText } from '@/components/ThemedText';
import { Colors, UI } from '@/constants/theme';
import { type RevenueCatPlanId, getPackageForPlan } from '@/lib/revenuecat';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {  
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

const ACCENT_COLOR = '#3340e1';
const PLAN_ORDER: RevenueCatPlanId[] = ['yearly', 'monthly', 'lifetime'];

const PLAN_COPY: Record<
  RevenueCatPlanId,
  { badge?: string; description: string; label: string }
> = {
  lifetime: {
    description: 'One-time unlock for Sass Template Pro.',
    label: 'Lifetime',
  },
  yearly: {
    badge: 'Best value',
    description: 'Lower effective monthly pricing for committed users.',
    label: 'Yearly',
  },
  monthly: {
    description: 'Flexible month-to-month access to Sass Template Pro.',
    label: 'Monthly',
  },
};

type BusyAction = 'purchase' | null;

export function SubscriptionBottomSheet() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const {
    configError,
    currentOffering,
    entitlement,
    hasProAccess,
    isConfigured,
    isSupported,
    purchasePackage,
  } = useRevenueCat();
  const [selectedPlan, setSelectedPlan] = useState<RevenueCatPlanId>('yearly');
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const packagesByPlan = {
    lifetime: getPackageForPlan(currentOffering, 'lifetime'),
    yearly: getPackageForPlan(currentOffering, 'yearly'),
    monthly: getPackageForPlan(currentOffering, 'monthly'),
  };
  const selectedPackage = packagesByPlan[selectedPlan];
  const isBusy = busyAction !== null;
  const availablePlans = PLAN_ORDER.filter((planId) => packagesByPlan[planId] != null);
  const availablePlansKey = availablePlans.join(',');

  useEffect(() => {
    if (getPackageForPlan(currentOffering, selectedPlan)) {
      return;
    }

    const firstAvailablePlan = PLAN_ORDER.find((planId) =>
      getPackageForPlan(currentOffering, planId)
    );

    if (firstAvailablePlan) {
      setSelectedPlan(firstAvailablePlan);
    }
  }, [currentOffering, selectedPlan]);

  const onSubscribe = async () => {
    if (!selectedPackage) {
      setStatusMessage('The selected product is not available yet.');
      return;
    }

    setBusyAction('purchase');
    setStatusMessage(null);

    const result = await purchasePackage(selectedPackage);

    setBusyAction(null);

    if (result.unlocked) {
      setStatusMessage('Sass Template Pro unlocked successfully.');
      router.back();
      return;
    }

    setStatusMessage(result.errorMessage || 'The purchase could not be completed.');
  };

  const feedbackMessage = statusMessage ?? configError;
  const entitlementSummary = entitlement?.expirationDate
    ? `Access until ${new Date(entitlement.expirationDate).toLocaleDateString()}`
    : entitlement?.isActive
      ? 'Lifetime access'
      : 'No active entitlement';

  return (
    <View style={[styles.container, { height: windowHeight * UI.subscriptionSheet.heightRatio }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            {hasProAccess ? 'Sass Template Pro Active' : 'Sass Template Pro'}
          </ThemedText>

          <View style={styles.summaryCard}>
            <ThemedText type="defaultSemiBold">{hasProAccess ? 'Entitlement active' : 'Plan status'}</ThemedText>
            <ThemedText style={styles.summaryText}>{entitlementSummary}</ThemedText>
            <ThemedText style={styles.summaryText}>
              Offering: {currentOffering?.identifier ?? 'Loading...'}
            </ThemedText>
            {!isSupported ? (
              <ThemedText style={styles.warningText}>
                Live purchases require an iOS or Android native build.
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.planList}>
            {PLAN_ORDER.map((planId) => {
              const plan = PLAN_COPY[planId];
              const aPackage = packagesByPlan[planId];
              const isSelected = selectedPlan === planId;

              return (
                <Pressable
                  key={planId}
                  disabled={!aPackage || isBusy}
                  onPress={() => setSelectedPlan(planId)}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    !aPackage && styles.planCardDisabled,
                  ]}
                >
                  <View style={styles.planCopy}>
                    <View style={styles.planHeader}>
                      <ThemedText type="defaultSemiBold">
                        {aPackage?.product.title || plan.label}
                      </ThemedText>
                      {plan.badge ? <ThemedText style={styles.badge}>{plan.badge}</ThemedText> : null}
                    </View>
                    <ThemedText style={styles.planDescription}>
                      {aPackage?.product.description || plan.description}
                    </ThemedText>
                    <ThemedText style={styles.planCaption}>
                      {aPackage
                        ? `Product ID: ${aPackage.product.identifier}`
                        : 'Not available in the current offering.'}
                    </ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold">
                    {aPackage?.product.priceString || 'Unavailable'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onSubscribe}
            disabled={!selectedPackage || isBusy || !isConfigured}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              (!selectedPackage || isBusy || !isConfigured) && styles.buttonDisabled,
            ]}
          >
            {busyAction === 'purchase' ? (
              <ActivityIndicator color={Colors.dark.text} />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                Continue with {PLAN_COPY[selectedPlan].label}
              </ThemedText>
            )}
          </Pressable>

          {feedbackMessage ? <ThemedText style={styles.statusMessage}>{feedbackMessage}</ThemedText> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    width: '100%',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  title: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    backgroundColor: '#ffffff',
  },
  summaryText: {
    opacity: 0.8,
  },
  warningText: {
    color: Colors.light.danger,
    marginTop: 4,
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
  planCardDisabled: {
    opacity: 0.55,
  },
  planCardSelected: {
    borderColor: ACCENT_COLOR,
    backgroundColor: '#ffffff',
  },
  planCopy: {
    flex: 1,
    gap: 2,
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
  planCaption: {
    opacity: 0.55,
    fontSize: 12,
  },
  badge: {
    color: ACCENT_COLOR,
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 16,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: Colors.dark.text,
    textTransform: 'capitalize',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  statusMessage: {
    fontSize: 12,
    color: Colors.light.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
