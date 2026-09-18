export interface OnboardingData {
  userGoal: string;
  userPainPoints: string[];
  doomScrollApps: string[];
  stillnessLevel: string;
  practiceTime: string;
  tinderCardAgreements: string[];
  baselineScore: number;
  baselineGrade: string;
  baselineLabel: string;
  baselineGradeColor: string;
  baselineBlinks: number;
  baselineStillness: number;
  baselineDuration: number;
  shortcutsConfigured: boolean;
  onboardingCompletedAt: string;
}

export type OnboardingScreen =
  | 'Welcome'
  | 'Goal'
  | 'PainPoints'
  | 'ScreenTime'
  | 'DoomScrollApps'
  | 'SocialProof'
  | 'TinderCards'
  | 'Solution'
  | 'Comparison'
  | 'Preference'
  | 'CameraPermission'
  | 'Processing'
  | 'Demo'
  | 'ValueDelivery'
  | 'ShortcutsSetup'
  | 'Notifications'
  | 'Account'
  | 'Paywall';

export const ONBOARDING_SCREENS: OnboardingScreen[] = [
  'Welcome',
  'Goal',
  'PainPoints',
  'ScreenTime',
  'DoomScrollApps',
  'SocialProof',
  'TinderCards',
  'Solution',
  'Comparison',
  'Preference',
  'CameraPermission',
  'Processing',
  'Demo',
  'ValueDelivery',
  'ShortcutsSetup',
  'Notifications',
  'Account',
  'Paywall',
];
