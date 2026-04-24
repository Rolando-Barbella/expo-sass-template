import { ThemedText } from '@/components/ThemedText';
import { Colors, UI } from '@/constants/theme';
import {
  REVENUECAT_ENTITLEMENT_ID,
  type RevenueCatPlanId,
  getPackageForPlan,
} from '@/lib/revenuecat';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

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

type BusyAction =
  | 'customer-center'
  | 'paywall'
  | 'purchase'
  | 'refresh'
  | 'restore'
  | null;

export function SubscriptionBottomSheet() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const {
    appUserId,
    clearLastError,
    configError,
    currentOffering,
    entitlement,
    hasProAccess,
    isAnonymous,
    isConfigured,
    isReady,
    isSupported,
    lastError,
    presentCustomerCenter,
    presentPaywallIfNeeded,
    purchasePackage,
    refreshCustomerInfo,
    refreshOfferings,
    restorePurchases,
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
      setStatusMessage('The selected product is not attached to the current RevenueCat offering.');
      return;
    }

    setBusyAction('purchase');
    setStatusMessage(null);
    clearLastError();

    const result = await purchasePackage(selectedPackage);

    setBusyAction(null);

    if (result.ok) {
      setStatusMessage('Sass Template Pro unlocked successfully.');
      router.back();
      return;
    }

    setStatusMessage(result.error ?? 'The purchase could not be completed.');
  };

  const onRestorePurchases = async () => {
    setBusyAction('restore');
    setStatusMessage(null);
    clearLastError();

    const result = await restorePurchases();

    setBusyAction(null);

    if (result.ok) {
      setStatusMessage(
        result.customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
          ? 'Purchases restored. Sass Template Pro is active.'
          : 'Restore completed. No active Sass Template Pro entitlement was found.'
      );
      return;
    }

    setStatusMessage(result.error ?? 'Restore purchases failed.');
  };

  const onRefreshStatus = async () => {
    setBusyAction('refresh');
    setStatusMessage(null);
    clearLastError();

    await Promise.all([refreshCustomerInfo(), refreshOfferings()]);

    setBusyAction(null);
    setStatusMessage('RevenueCat customer info and offerings refreshed.');
  };

  const onPresentPaywall = async () => {
    setBusyAction('paywall');
    setStatusMessage(null);
    clearLastError();

    try {
      const result = await presentPaywallIfNeeded();

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
          setStatusMessage('The RevenueCat paywall completed a purchase successfully.');
          router.back();
          break;
        case PAYWALL_RESULT.RESTORED:
          setStatusMessage('The RevenueCat paywall restored a previous purchase.');
          break;
        case PAYWALL_RESULT.NOT_PRESENTED:
          setStatusMessage('The paywall was not shown because Sass Template Pro is already active.');
          break;
        case PAYWALL_RESULT.CANCELLED:
          setStatusMessage('The paywall was dismissed before purchase.');
          break;
        default:
          setStatusMessage('The RevenueCat paywall closed without unlocking the entitlement.');
          break;
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to present the paywall.');
    } finally {
      setBusyAction(null);
    }
  };

  const onOpenCustomerCenter = async () => {
    setBusyAction('customer-center');
    setStatusMessage(null);
    clearLastError();

    try {
      await presentCustomerCenter();
      setStatusMessage('Customer Center closed.');
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Unable to open Customer Center.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const feedbackMessage = lastError ?? statusMessage ?? configError;
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
            {hasProAccess ? 'Sass Template Pro Active' : 'Unlock Sass Template Pro'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            RevenueCat now powers manual package purchases, entitlement checks, restore flows,
            paywalls, and Customer Center in this Expo app.
          </ThemedText>

          <View style={styles.summaryCard}>
            <ThemedText type="defaultSemiBold">
              {hasProAccess ? 'Entitlement active' : 'Free plan'}
            </ThemedText>
            <ThemedText style={styles.summaryText}>{entitlementSummary}</ThemedText>
            <ThemedText style={styles.summaryText}>
              Offering: {currentOffering?.identifier ?? 'No offering returned yet'}
            </ThemedText>
            <ThemedText style={styles.summaryText}>
              App user: {appUserId ?? (isAnonymous ? 'Anonymous RevenueCat user' : 'Loading...')}
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
                        : 'Attach this product to the current RevenueCat offering.'}
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

          <Pressable
            onPress={onPresentPaywall}
            disabled={isBusy || !isConfigured}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              (isBusy || !isConfigured) && styles.buttonDisabled,
            ]}
          >
            {busyAction === 'paywall' ? (
              <ActivityIndicator color={Colors.light.text} />
            ) : (
              <ThemedText style={styles.secondaryButtonText}>Present RevenueCat paywall</ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={onRestorePurchases}
            disabled={isBusy || !isConfigured}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              (isBusy || !isConfigured) && styles.buttonDisabled,
            ]}
          >
            {busyAction === 'restore' ? (
              <ActivityIndicator color={Colors.light.text} />
            ) : (
              <ThemedText style={styles.secondaryButtonText}>Restore purchases</ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={onOpenCustomerCenter}
            disabled={isBusy || !isConfigured}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              (isBusy || !isConfigured) && styles.buttonDisabled,
            ]}
          >
            {busyAction === 'customer-center' ? (
              <ActivityIndicator color={Colors.light.text} />
            ) : (
              <ThemedText style={styles.secondaryButtonText}>Open Customer Center</ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={onRefreshStatus}
            disabled={isBusy || !isReady || !isConfigured}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              (isBusy || !isReady || !isConfigured) && styles.buttonDisabled,
            ]}
          >
            {busyAction === 'refresh' ? (
              <ActivityIndicator color={Colors.light.text} />
            ) : (
              <ThemedText style={styles.secondaryButtonText}>Refresh customer info</ThemedText>
            )}
          </Pressable>

          {feedbackMessage ? <ThemedText style={styles.statusMessage}>{feedbackMessage}</ThemedText> : null}

          <Pressable onPress={() => router.back()} style={styles.notNowButton}>
            <ThemedText style={styles.notNowText}>Not now</ThemedText>
          </Pressable>
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
    backgroundColor: 'rgba(84, 242, 84, 0.08)',
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
    borderColor: Colors.light.tint,
    backgroundColor: 'rgba(84, 242, 84, 0.1)',
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
    lineHeight: 20,
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
