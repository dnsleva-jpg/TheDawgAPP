import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingData } from './types';

const ONBOARDING_KEY = '@donothin_onboarding';
const ONBOARDING_COMPLETE_KEY = '@donothin_onboarding_complete';

export async function saveOnboardingData(data: Partial<OnboardingData>): Promise<void> {
  try {
    const existing = await getOnboardingData();
    const merged = { ...existing, ...data };
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(merged));
  } catch {
    // Silently fail — app continues
  }
}

export async function getOnboardingData(): Promise<Partial<OnboardingData>> {
  try {
    const data = await AsyncStorage.getItem(ONBOARDING_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    await saveOnboardingData({ onboardingCompletedAt: new Date().toISOString() });
  } catch {
    // Silently fail
  }
}

export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch {
    // Silently fail
  }
}
