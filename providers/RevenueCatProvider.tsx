import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  REVENUECAT_ENTITLEMENT_ID,
  canUseRevenueCat,
  getCurrentOffering,
  getRevenueCatDebugContext,
  getRevenueCatErrorDetails,
  getEntitlement,
  getRevenueCatApiKey,
  getRevenueCatSetupMessage,
  hasProEntitlement,
  isPurchaseCancelled,
  isRevenueCatSupportedPlatform,
  summarizeEntitlements,
  summarizeOfferings,
} from '@/lib/revenuecat';

type PurchaseResult = {
  errorMessage: string | null;
  unlocked: boolean;
};

type RevenueCatContextValue = {
  configError: string | null;
  currentOffering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  entitlement: ReturnType<typeof getEntitlement>;
  hasProAccess: boolean;
  isConfigured: boolean;
  isReady: boolean;
  isSupported: boolean;
  presentCustomerCenter: () => Promise<void>;
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  purchasePackage: (aPackage: PurchasesPackage) => Promise<PurchaseResult>;
  refresh: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);

  const refresh = useCallback(async () => {
    const [nextCustomerInfo, offerings] = await Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getOfferings(),
    ]);
    setCustomerInfo(nextCustomerInfo);
    setCurrentOffering(getCurrentOffering(offerings));
  }, []);

  useEffect(() => {
    if (!canUseRevenueCat()) {
      setConfigError(getRevenueCatSetupMessage());
      setIsReady(true);
      return;
    }

    let isMounted = true;
    Purchases.configure({ apiKey: getRevenueCatApiKey()! });
    setIsConfigured(true);

    refresh()
      .catch((error) => {
        console.warn('[RevenueCat] Initial refresh failed', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    const listener = (nextCustomerInfo: CustomerInfo) => {

      if (isMounted) {
        setCustomerInfo(nextCustomerInfo);
      }
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      isMounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [refresh]);

  const purchasePackage = async (aPackage: PurchasesPackage) => {
    try {
      const { customerInfo: nextCustomerInfo } = await Purchases.purchasePackage(aPackage);
     
      setCustomerInfo(nextCustomerInfo);

      if (!hasProEntitlement(nextCustomerInfo)) {
        return {
          errorMessage: `Purchase completed, but RevenueCat did not grant the entitlement "${REVENUECAT_ENTITLEMENT_ID}".`,
          unlocked: false,
        };
      }

      return {
        errorMessage: null,
        unlocked: true,
      };
    } catch (error) {
      const errorDetails = getRevenueCatErrorDetails(error);

      if (!isPurchaseCancelled(error)) {
        console.warn('RevenueCat purchase failed', errorDetails);
      }

      return {
        errorMessage: isPurchaseCancelled(error)
          ? 'Purchase cancelled.'
          : errorDetails.underlyingErrorMessage || errorDetails.message,
        unlocked: false,
      };
    }
  };

  const restorePurchases = async () => {
    try {
      const nextCustomerInfo = await Purchases.restorePurchases();

      setCustomerInfo(nextCustomerInfo);
      return hasProEntitlement(nextCustomerInfo);
    } catch (error) {
      console.warn('RevenueCat restore failed', error);
      return false;
    }
  };

  const presentPaywallIfNeeded = async () => {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      displayCloseButton: true,
      requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_ID,
    });

    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      await refresh();
    }

    return result;
  };

  const presentCustomerCenter = async () => {
    await RevenueCatUI.presentCustomerCenter();
    await refresh();
  };

  const entitlement = getEntitlement(customerInfo);
  const hasProAccess = hasProEntitlement(customerInfo);

  return (
    <RevenueCatContext.Provider
      value={{
        configError,
        currentOffering,
        customerInfo,
        entitlement,
        hasProAccess,
        isConfigured,
        isReady,
        isSupported: isRevenueCatSupportedPlatform(),
        presentCustomerCenter,
        presentPaywallIfNeeded,
        purchasePackage,
        refresh,
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