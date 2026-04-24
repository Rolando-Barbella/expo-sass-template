import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import Purchases, {
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesEntitlementInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { supabase } from '@/lib/supabase';
import {
  REVENUECAT_ENTITLEMENT_ID,
  formatRevenueCatError,
  getEntitlement,
  getRevenueCatApiKey,
  getRevenueCatSetupMessage,
  isPurchaseCancelled,
  isRevenueCatSupportedPlatform,
  selectCurrentOffering,
} from '@/lib/revenuecat';

type RevenueCatActionResult = {
  ok: boolean;
  cancelled?: boolean;
  customerInfo?: CustomerInfo | null;
  error?: string;
};

type RevenueCatContextValue = {
  appUserId: string | null;
  configError: string | null;
  currentOffering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  entitlement: PurchasesEntitlementInfo | null;
  hasProAccess: boolean;
  isAnonymous: boolean;
  isConfigured: boolean;
  isReady: boolean;
  isSupported: boolean;
  lastError: string | null;
  clearLastError: () => void;
  presentCustomerCenter: () => Promise<void>;
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  purchasePackage: (aPackage: PurchasesPackage) => Promise<RevenueCatActionResult>;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  refreshOfferings: () => Promise<PurchasesOffering | null>;
  restorePurchases: () => Promise<RevenueCatActionResult>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const bootstrapRef = useRef(false);
  const isConfiguredRef = useRef(false);
  const syncedUserIdRef = useRef<string | null>(null);

  const applyCustomerInfoRef = useRef((nextCustomerInfo: CustomerInfo | null) => {
    setCustomerInfo(nextCustomerInfo);
  });
  const syncSnapshotRef = useRef<() => Promise<CustomerInfo>>(async () => {
    const [nextCustomerInfo, offerings, nextAppUserId, nextIsAnonymous] = await Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getOfferings(),
      Purchases.getAppUserID(),
      Purchases.isAnonymous(),
    ]);

    applyCustomerInfoRef.current(nextCustomerInfo);
    setCurrentOffering(selectCurrentOffering(offerings));
    setAppUserId(nextAppUserId);
    setIsAnonymous(nextIsAnonymous);

    return nextCustomerInfo;
  });

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session ?? null);
      setIsSessionLoading(false);
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsSessionLoading(false);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSessionLoading || bootstrapRef.current) {
      return;
    }

    bootstrapRef.current = true;

    const apiKey = getRevenueCatApiKey();
    const isSupported = isRevenueCatSupportedPlatform();

    if (!isSupported || !apiKey) {
      setConfigError(getRevenueCatSetupMessage());
      setIsReady(true);
      return;
    }

    let isCancelled = false;
    let customerInfoListener: CustomerInfoUpdateListener | null = null;

    (async () => {
      try {
        Purchases.configure({
          apiKey,
          appUserID: session?.user.id,
          diagnosticsEnabled: __DEV__,
          entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
        });

        isConfiguredRef.current = true;
        syncedUserIdRef.current = session?.user.id ?? null;

        await Purchases.setLogLevel(
          __DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.INFO
        );

        customerInfoListener = (nextCustomerInfo) => {
          if (isCancelled) {
            return;
          }

          applyCustomerInfoRef.current(nextCustomerInfo);
          setLastError(null);
        };

        Purchases.addCustomerInfoUpdateListener(customerInfoListener);
        await syncSnapshotRef.current();

        if (!isCancelled) {
          setConfigError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setConfigError(
            formatRevenueCatError(error, 'RevenueCat failed to initialize for this app build.')
          );
        }
      } finally {
        if (!isCancelled) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      isCancelled = true;

      if (customerInfoListener) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
      }
    };
  }, [isSessionLoading, session?.user.id]);

  useEffect(() => {
    if (!isReady || !isConfiguredRef.current) {
      return;
    }

    const nextUserId = session?.user.id ?? null;

    if (syncedUserIdRef.current === nextUserId) {
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        setLastError(null);

        let nextCustomerInfo: CustomerInfo;

        if (nextUserId) {
          const result = await Purchases.logIn(nextUserId);
          nextCustomerInfo = result.customerInfo;
        } else {
          const currentlyAnonymous = await Purchases.isAnonymous();
          nextCustomerInfo = currentlyAnonymous
            ? await Purchases.getCustomerInfo()
            : await Purchases.logOut();
        }

        if (isCancelled) {
          return;
        }

        syncedUserIdRef.current = nextUserId;
        applyCustomerInfoRef.current(nextCustomerInfo);

        const [offerings, nextAppUserId, nextIsAnonymous] = await Promise.all([
          Purchases.getOfferings(),
          Purchases.getAppUserID(),
          Purchases.isAnonymous(),
        ]);

        if (isCancelled) {
          return;
        }

        setCurrentOffering(selectCurrentOffering(offerings));
        setAppUserId(nextAppUserId);
        setIsAnonymous(nextIsAnonymous);
      } catch (error) {
        if (!isCancelled) {
          setLastError(
            formatRevenueCatError(error, 'RevenueCat could not sync the current signed-in user.')
          );
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isReady, session?.user.id]);

  const refreshCustomerInfo = async () => {
    if (!isConfiguredRef.current) {
      return null;
    }

    try {
      setLastError(null);
      const nextCustomerInfo = await Purchases.getCustomerInfo();
      applyCustomerInfoRef.current(nextCustomerInfo);
      return nextCustomerInfo;
    } catch (error) {
      setLastError(formatRevenueCatError(error, 'Unable to refresh customer info.'));
      return null;
    }
  };

  const refreshOfferings = async () => {
    if (!isConfiguredRef.current) {
      return null;
    }

    try {
      setLastError(null);
      const offerings = await Purchases.getOfferings();
      const selectedOffering = selectCurrentOffering(offerings);
      setCurrentOffering(selectedOffering);
      return selectedOffering;
    } catch (error) {
      setLastError(formatRevenueCatError(error, 'Unable to refresh RevenueCat offerings.'));
      return null;
    }
  };

  const purchasePackage = async (aPackage: PurchasesPackage): Promise<RevenueCatActionResult> => {
    if (!isConfiguredRef.current) {
      const error = configError ?? 'RevenueCat is not ready yet.';
      setLastError(error);
      return { ok: false, error };
    }

    try {
      setLastError(null);
      const result = await Purchases.purchasePackage(aPackage);
      applyCustomerInfoRef.current(result.customerInfo);
      setAppUserId(await Purchases.getAppUserID());
      setIsAnonymous(await Purchases.isAnonymous());

      return {
        ok: true,
        customerInfo: result.customerInfo,
      };
    } catch (error) {
      const message = formatRevenueCatError(error, 'The purchase could not be completed.');

      if (!isPurchaseCancelled(error)) {
        setLastError(message);
      }

      return {
        ok: false,
        cancelled: isPurchaseCancelled(error),
        error: message,
      };
    }
  };

  const restorePurchases = async (): Promise<RevenueCatActionResult> => {
    if (!isConfiguredRef.current) {
      const error = configError ?? 'RevenueCat is not ready yet.';
      setLastError(error);
      return { ok: false, error };
    }

    try {
      setLastError(null);
      const nextCustomerInfo = await Purchases.restorePurchases();
      applyCustomerInfoRef.current(nextCustomerInfo);
      return {
        ok: true,
        customerInfo: nextCustomerInfo,
      };
    } catch (error) {
      const message = formatRevenueCatError(error, 'Restore purchases failed.');
      setLastError(message);
      return {
        ok: false,
        error: message,
      };
    }
  };

  const presentPaywall = async () => {
    if (!isConfiguredRef.current) {
      throw new Error(configError ?? 'RevenueCat is not ready yet.');
    }

    try {
      setLastError(null);
      const result = await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
        offering: currentOffering ?? undefined,
      });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        await syncSnapshotRef.current();
      }

      return result;
    } catch (error) {
      const message = formatRevenueCatError(error, 'The RevenueCat paywall could not be presented.');
      setLastError(message);
      throw new Error(message);
    }
  };

  const presentPaywallIfNeeded = async () => {
    if (!isConfiguredRef.current) {
      throw new Error(configError ?? 'RevenueCat is not ready yet.');
    }

    try {
      setLastError(null);
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        displayCloseButton: true,
        offering: currentOffering ?? undefined,
        requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_ID,
      });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        await syncSnapshotRef.current();
      }

      return result;
    } catch (error) {
      const message = formatRevenueCatError(
        error,
        'The entitlement-gated RevenueCat paywall could not be presented.'
      );
      setLastError(message);
      throw new Error(message);
    }
  };

  const presentCustomerCenter = async () => {
    if (!isConfiguredRef.current) {
      throw new Error(configError ?? 'RevenueCat is not ready yet.');
    }

    try {
      setLastError(null);
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onManagementOptionSelected: ({ option, url }) => {
            if (option === 'custom_url' && url) {
              Linking.openURL(url).catch(() => undefined);
            }
          },
          onRestoreCompleted: ({ customerInfo: nextCustomerInfo }) => {
            applyCustomerInfoRef.current(nextCustomerInfo);
            setLastError(null);
          },
          onRestoreFailed: ({ error }) => {
            setLastError(formatRevenueCatError(error, 'Customer Center restore failed.'));
          },
        },
      });

      await syncSnapshotRef.current();
    } catch (error) {
      const message = formatRevenueCatError(
        error,
        'The RevenueCat Customer Center could not be presented.'
      );
      setLastError(message);
      throw new Error(message);
    }
  };

  const entitlement = getEntitlement(customerInfo);
  const hasProAccess = Boolean(entitlement?.isActive);

  return (
    <RevenueCatContext.Provider
      value={{
        appUserId,
        clearLastError: () => setLastError(null),
        configError,
        currentOffering,
        customerInfo,
        entitlement,
        hasProAccess,
        isAnonymous,
        isConfigured: isConfiguredRef.current,
        isReady,
        isSupported: isRevenueCatSupportedPlatform(),
        lastError,
        presentCustomerCenter,
        presentPaywall,
        presentPaywallIfNeeded,
        purchasePackage,
        refreshCustomerInfo,
        refreshOfferings,
        restorePurchases,
      }}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);

  if (!context) {
    throw new Error('useRevenueCat must be used inside RevenueCatProvider');
  }

  return context;
}
