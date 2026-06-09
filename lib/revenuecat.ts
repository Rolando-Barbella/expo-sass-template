import Purchases, {
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
} from 'react-native-purchases';
import { NativeModules, Platform } from 'react-native';

export const REVENUECAT_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'Sass Template Pro';
export const REVENUECAT_OFFERING_ID = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID?.trim() || null;

export type RevenueCatPlanId = 'lifetime' | 'yearly' | 'monthly';

export function isRevenueCatSupportedPlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function isRevenueCatNativeModuleAvailable() {
  return NativeModules.RNPurchases != null;
}

export function canUseRevenueCat() {
  return isRevenueCatSupportedPlatform() && isRevenueCatNativeModuleAvailable() && Boolean(getRevenueCatApiKey());
}

export function getRevenueCatApiKey() {
  const key =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

  return key?.trim() || null;
}

export function getRevenueCatSetupMessage() {
  if (!isRevenueCatSupportedPlatform()) {
    return 'RevenueCat subscriptions require an iOS or Android build.';
  }

  if (!isRevenueCatNativeModuleAvailable()) {
    return 'RevenueCat native module not found. Rebuild your development client after installing react-native-purchases.';
  }

  return Platform.OS === 'ios'
    ? 'Missing EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY.'
    : 'Missing EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY.';
}

export function hasProEntitlement(customerInfo: CustomerInfo | null | undefined) {
  if (!customerInfo) {
    return false;
  }

  return typeof customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== 'undefined';
}

export function getEntitlement(customerInfo: CustomerInfo | null | undefined) {
  if (!customerInfo) {
    return null;
  }

  return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ?? null;
}

export function getCurrentOffering(offerings: PurchasesOfferings | null | undefined) {
  const selectedOffering = REVENUECAT_OFFERING_ID
    ? offerings?.all?.[REVENUECAT_OFFERING_ID] ?? null
    : offerings?.current ?? null;

  if (!selectedOffering?.availablePackages.length) {
    return null;
  }

  return selectedOffering;
}

export function getPackageForPlan(
  offering: PurchasesOffering | null | undefined,
  planId: RevenueCatPlanId
) {
  if (!offering) {
    return null;
  }

  return (
    offering.availablePackages.find((aPackage) => {
      if (planId === 'lifetime') {
        return aPackage.packageType === PACKAGE_TYPE.LIFETIME;
      }

      if (planId === 'yearly') {
        return aPackage.packageType === PACKAGE_TYPE.ANNUAL;
      }

      return aPackage.packageType === PACKAGE_TYPE.MONTHLY;
    }) ?? null
  );
}

export function isPurchaseCancelled(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  return error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export function getRevenueCatErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') {
    return {
      code: null,
      message: 'Unknown purchase error',
      readableErrorCode: null,
      userCancelled: false,
      underlyingErrorMessage: null,
    };
  }

  const typedError = error as {
    code?: string | number;
    message?: string;
    readableErrorCode?: string;
    userCancelled?: boolean;
    underlyingErrorMessage?: string;
  };

  return {
    code: typedError.code ?? null,
    message: typedError.message ?? 'Unknown purchase error',
    readableErrorCode: typedError.readableErrorCode ?? null,
    userCancelled: typedError.userCancelled ?? false,
    underlyingErrorMessage: typedError.underlyingErrorMessage ?? null,
  };
}

export function maskRevenueCatApiKey(key: string | null | undefined) {
  if (!key) {
    return null;
  }

  if (key.length <= 8) {
    return `${key.slice(0, 2)}***`;
  }

  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function summarizeEntitlements(customerInfo: CustomerInfo | null | undefined) {
  if (!customerInfo) {
    return {
      active: [],
      all: [],
      requested: REVENUECAT_ENTITLEMENT_ID,
      requestedFoundInActive: false,
    };
  }

  const active = Object.keys(customerInfo.entitlements.active);
  const all = Object.keys(customerInfo.entitlements.all);

  return {
    active,
    all,
    requested: REVENUECAT_ENTITLEMENT_ID,
    requestedFoundInActive: active.includes(REVENUECAT_ENTITLEMENT_ID),
  };
}

export function summarizeOfferings(offerings: PurchasesOfferings | null | undefined) {
  const current = offerings?.current;
  const selectedOffering = REVENUECAT_OFFERING_ID ? offerings?.all?.[REVENUECAT_OFFERING_ID] ?? null : current;

  return {
    configuredOfferingId: REVENUECAT_OFFERING_ID,
    allOfferingIds: offerings?.all ? Object.keys(offerings.all) : [],
    currentOfferingId: current?.identifier ?? null,
    selectedOfferingId: selectedOffering?.identifier ?? null,
    selectedPackageIds:
      selectedOffering?.availablePackages.map((aPackage) => ({
        identifier: aPackage.identifier,
        packageType: aPackage.packageType,
        productId: aPackage.product.identifier,
      })) ?? [],
  };
}

export function getRevenueCatDebugContext() {
  const apiKey = getRevenueCatApiKey();

  return {
    platform: Platform.OS,
    isSupportedPlatform: isRevenueCatSupportedPlatform(),
    nativeModuleAvailable: isRevenueCatNativeModuleAvailable(),
    canUseRevenueCat: canUseRevenueCat(),
    entitlementId: REVENUECAT_ENTITLEMENT_ID,
    offeringId: REVENUECAT_OFFERING_ID,
    apiKeyPresent: Boolean(apiKey),
    apiKeyPreview: maskRevenueCatApiKey(apiKey),
  };
}
