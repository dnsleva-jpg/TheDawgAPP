import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Feature Gates ───────────────────────────────────────

export type ProFeature =
  | 'medium_hard_difficulty'
  | 'unlimited_shield_apps'
  | 'all_interventions'
  | 'focus_checks'
  | 'brain_recovery'
  | 'weekly_insights'
  | 'milestones'
  | 'walk_mode'
  | 'share_cards';

const PRO_KEY = 'dawg_pro_status';
const FREE_SHIELD_APP_LIMIT = 2;
const FREE_DIFFICULTY = 'easy';

// ─── Pro Status ──────────────────────────────────────────

export async function getProStatus(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(PRO_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setProStatus(isPro: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PRO_KEY, isPro ? 'true' : 'false');
  } catch {}
}

// ─── Feature Checks ──────────────────────────────────────

export function canAccessDifficulty(difficulty: string, isPro: boolean): boolean {
  if (isPro) return true;
  return difficulty === FREE_DIFFICULTY;
}

export function getShieldAppLimit(isPro: boolean): number {
  return isPro ? Infinity : FREE_SHIELD_APP_LIMIT;
}

export function canAccessFeature(feature: ProFeature, isPro: boolean): boolean {
  if (isPro) return true;
  // Free tier: only basic features
  return false;
}

// ─── Paywall Copy ────────────────────────────────────────

export interface PaywallTrigger {
  title: string;
  subtitle: string;
  feature: ProFeature;
}

export const PAYWALL_TRIGGERS: Record<ProFeature, PaywallTrigger> = {
  medium_hard_difficulty: {
    title: 'Unlock All Difficulties',
    subtitle: 'Push yourself with Medium and Hard challenges',
    feature: 'medium_hard_difficulty',
  },
  unlimited_shield_apps: {
    title: 'Protect All Your Apps',
    subtitle: 'Shield unlimited apps from doom scrolling',
    feature: 'unlimited_shield_apps',
  },
  all_interventions: {
    title: 'Varied Interventions',
    subtitle: 'Math problems, emotion checks, body scans & more',
    feature: 'all_interventions',
  },
  focus_checks: {
    title: 'Focus Checks',
    subtitle: 'Track your focus with camera-based assessments',
    feature: 'focus_checks',
  },
  brain_recovery: {
    title: 'Brain Recovery Score',
    subtitle: 'See your composite recovery progress over 90 days',
    feature: 'brain_recovery',
  },
  weekly_insights: {
    title: 'Weekly Insights',
    subtitle: 'AI-powered patterns and suggestions from your data',
    feature: 'weekly_insights',
  },
  milestones: {
    title: 'Milestone Celebrations',
    subtitle: 'Celebrate your progress at Day 7, 14, 30, 60, 90',
    feature: 'milestones',
  },
  walk_mode: {
    title: 'Walk Mode',
    subtitle: 'Phone-free walking challenges',
    feature: 'walk_mode',
  },
  share_cards: {
    title: 'Share Cards',
    subtitle: 'Share your progress on social media',
    feature: 'share_cards',
  },
};

// ─── Pricing ─────────────────────────────────────────────

export const PRICING = {
  monthly: { price: '$2.99', period: 'month', trialDays: 7 },
  annual: { price: '$19.99', period: 'year', trialDays: 7, savings: '44%' },
} as const;

export const PRO_FEATURES_LIST = [
  { icon: 'flash-outline', text: 'All difficulty tiers (Easy / Medium / Hard)' },
  { icon: 'shield-checkmark-outline', text: 'Unlimited Shield apps + 5 interventions' },
  { icon: 'eye-outline', text: 'Focus Checks (camera-based assessments)' },
  { icon: 'trending-up-outline', text: 'Brain Recovery Score + trend chart' },
  { icon: 'bulb-outline', text: 'Smart suggestions & weekly insights' },
  { icon: 'trophy-outline', text: 'Milestones & celebrations' },
  { icon: 'walk-outline', text: 'Walk Mode + share cards' },
] as const;
