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
  getEntitlement,
  getRevenueCatApiKey,
  getRevenueCatSetupMessage,
  hasProEntitlement,
  isPurchaseCancelled,
  isRevenueCatSupportedPlatform,
  summarizeEntitlements,
  summarizeOfferings,
} from '@/lib/revenuecat';

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
  purchasePackage: (aPackage: PurchasesPackage) => Promise<boolean>;
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
    console.log('[RevenueCat] Refresh start', getRevenueCatDebugContext());

    const [nextCustomerInfo, offerings] = await Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getOfferings(),
    ]);

    console.log('[RevenueCat] Refresh customer info', {
      appUserID: nextCustomerInfo.originalAppUserId,
      entitlements: summarizeEntitlements(nextCustomerInfo),
    });
    console.log('[RevenueCat] Refresh offerings', summarizeOfferings(offerings));

    setCustomerInfo(nextCustomerInfo);
    setCurrentOffering(getCurrentOffering(offerings));
  }, []);

  useEffect(() => {
    if (!canUseRevenueCat()) {
      console.warn('[RevenueCat] Configuration blocked', {
        ...getRevenueCatDebugContext(),
        setupMessage: getRevenueCatSetupMessage(),
      });
      setConfigError(getRevenueCatSetupMessage());
      setIsReady(true);
      return;
    }

    let isMounted = true;

    console.log('[RevenueCat] Configuring Purchases', getRevenueCatDebugContext());
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
      console.log('[RevenueCat] Customer info updated', {
        appUserID: nextCustomerInfo.originalAppUserId,
        entitlements: summarizeEntitlements(nextCustomerInfo),
      });

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
      console.log('[RevenueCat] Purchase start', {
        packageIdentifier: aPackage.identifier,
        packageType: aPackage.packageType,
        productId: aPackage.product.identifier,
        entitlementId: REVENUECAT_ENTITLEMENT_ID,
      });
      const { customerInfo: nextCustomerInfo } = await Purchases.purchasePackage(aPackage);
      console.log('[RevenueCat] Purchase result', {
        appUserID: nextCustomerInfo.originalAppUserId,
        entitlements: summarizeEntitlements(nextCustomerInfo),
      });
      setCustomerInfo(nextCustomerInfo);
      return hasProEntitlement(nextCustomerInfo);
    } catch (error) {
      if (!isPurchaseCancelled(error)) {
        console.warn('RevenueCat purchase failed', error);
      }

      return false;
    }
  };

  const restorePurchases = async () => {
    try {
      console.log('[RevenueCat] Restore start', {
        entitlementId: REVENUECAT_ENTITLEMENT_ID,
      });
      const nextCustomerInfo = await Purchases.restorePurchases();
      console.log('[RevenueCat] Restore result', {
        appUserID: nextCustomerInfo.originalAppUserId,
        entitlements: summarizeEntitlements(nextCustomerInfo),
      });
      setCustomerInfo(nextCustomerInfo);
      return hasProEntitlement(nextCustomerInfo);
    } catch (error) {
      console.warn('RevenueCat restore failed', error);
      return false;
    }
  };

  const presentPaywallIfNeeded = async () => {
    console.log('[RevenueCat] Present paywall if needed', {
      entitlementId: REVENUECAT_ENTITLEMENT_ID,
    });
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      displayCloseButton: true,
      requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_ID,
    });

    console.log('[RevenueCat] Paywall result', {
      result,
      entitlementId: REVENUECAT_ENTITLEMENT_ID,
    });

    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      await refresh();
    }

    return result;
  };

  const presentCustomerCenter = async () => {
    console.log('[RevenueCat] Present customer center');
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
