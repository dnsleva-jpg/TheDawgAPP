import AsyncStorage from '@react-native-async-storage/async-storage';

const PRO_KEY = 'rawdawg_pro';

/**
 * Check if the user has Pro status.
 * Returns false by default (free tier).
 */
export async function getIsProUser(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PRO_KEY);
    return value === 'true';
  } catch (_) {
    return false;
  }
}

/**
 * Set Pro status. In the future this will be called
 * after a successful in-app purchase verification.
 */
export async function setIsProUser(isPro: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PRO_KEY, isPro ? 'true' : 'false');
  } catch (_) {
    // Silently fail
  }
}
