import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Replace with your actual RevenueCat API keys
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_KEY_HERE';

const ENTITLEMENT_ID = 'pro';

let isConfigured = false;

/**
 * Initialize RevenueCat SDK. Call once at app start.
 */
export async function configureRevenueCat(): Promise<void> {
  if (isConfigured) return;
  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    await Purchases.configure({ apiKey });
    isConfigured = true;
  } catch {
    // RevenueCat failed to configure — non-critical for development
  }
}

/**
 * Check if the user has an active "pro" entitlement.
 */
export async function checkProStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get available offerings for the paywall.
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
  } catch {
    // Failed to fetch offerings
  }
  return [];
}

/**
 * Purchase a specific package.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error: any) {
    if (!error.userCancelled) {
      throw error;
    }
    return false;
  }
}

/**
 * Restore previous purchases.
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Set the user ID for RevenueCat (call after auth).
 */
export async function setRevenueCatUserId(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch {
    // Non-critical
  }
}
