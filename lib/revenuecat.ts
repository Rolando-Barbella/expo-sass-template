import Purchases, {
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';

export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'Sass Template Pro';

export const REVENUECAT_DEFAULT_OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID?.trim() || 'default';

export const REVENUECAT_PRODUCTS = {
  lifetime: 'lifetime',
  yearly: 'yearly',
  monthly: 'monthly',
} as const;

export type RevenueCatPlanId = keyof typeof REVENUECAT_PRODUCTS;

const PACKAGE_ALIASES: Record<RevenueCatPlanId, string[]> = {
  lifetime: ['lifetime', '$rc_lifetime'],
  yearly: ['yearly', 'annual', '$rc_annual'],
  monthly: ['monthly', '$rc_monthly'],
};

export function isRevenueCatSupportedPlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function getRevenueCatApiKey() {
  const key =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

  const trimmedKey = key?.trim();
  return trimmedKey ? trimmedKey : null;
}

export function getRevenueCatSetupMessage() {
  if (!isRevenueCatSupportedPlatform()) {
    return 'RevenueCat subscriptions require an iOS or Android build. Web and Expo Go cannot complete live purchases.';
  }

  return Platform.OS === 'ios'
    ? 'Missing EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY.'
    : 'Missing EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY.';
}

export function selectCurrentOffering(offerings: PurchasesOfferings | null | undefined) {
  if (!offerings) {
    return null;
  }

  if (offerings.all[REVENUECAT_DEFAULT_OFFERING_ID]) {
    return offerings.all[REVENUECAT_DEFAULT_OFFERING_ID] ?? null;
  }

  if (offerings.current) {
    return offerings.current;
  }

  const firstOffering = Object.values(offerings.all)[0];
  return firstOffering ?? null;
}

function matchesPlanId(aPackage: PurchasesPackage, planId: RevenueCatPlanId) {
  const aliases = PACKAGE_ALIASES[planId];

  if (
    aliases.includes(aPackage.identifier) ||
    aliases.includes(aPackage.product.identifier)
  ) {
    return true;
  }

  if (planId === 'lifetime') {
    return aPackage.packageType === PACKAGE_TYPE.LIFETIME;
  }

  if (planId === 'yearly') {
    return aPackage.packageType === PACKAGE_TYPE.ANNUAL;
  }

  return aPackage.packageType === PACKAGE_TYPE.MONTHLY;
}

export function getPackageForPlan(
  offering: PurchasesOffering | null | undefined,
  planId: RevenueCatPlanId
) {
  if (!offering) {
    return null;
  }

  return offering.availablePackages.find((aPackage) => matchesPlanId(aPackage, planId)) ?? null;
}

export function getEntitlement(
  customerInfo: CustomerInfo | null | undefined,
  entitlementId = REVENUECAT_ENTITLEMENT_ID
) {
  if (!customerInfo) {
    return null;
  }

  return (
    customerInfo.entitlements.active[entitlementId] ??
    customerInfo.entitlements.all[entitlementId] ??
    null
  );
}

export function isPurchaseCancelled(error: unknown) {
  if (!isPurchasesError(error)) {
    return false;
  }

  return error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export function formatRevenueCatError(
  error: unknown,
  fallbackMessage = 'Something went wrong while talking to RevenueCat.'
) {
  if (!isPurchasesError(error)) {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }

  switch (error.code) {
    case Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return 'Purchase cancelled.';
    case Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return 'Purchase is pending approval. Check the store account again in a moment.';
    case Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case Purchases.PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return 'A network error interrupted the RevenueCat request. Try again with a stable connection.';
    case Purchases.PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR:
      return 'Another purchase request is already in progress.';
    case Purchases.PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
    case Purchases.PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      return 'RevenueCat is not configured correctly. Verify your public SDK key and dashboard setup.';
    default:
      return error.message || fallbackMessage;
  }
}

function isPurchasesError(error: unknown): error is PurchasesError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error
  );
}
