import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@donothin:onboarding_data';

export interface OnboardingAnswers {
  userAmbition?: string;
  userGoal?: string;
  userPainPoint?: string;
  userIdentity?: string;
  userWorstTime?: string;
  userPriorAttempt?: string;
  userAge?: string;
  userScreenTime?: number;
  userCommitment?: string;  // Gollwitzer if-then plan (implementation intention)
  skippedScreenTime?: boolean; // user skipped Apple Screen Time during onboarding — prompt later
}

interface OnboardingContextValue {
  data: OnboardingAnswers;
  updateField: (key: keyof OnboardingAnswers, value: string | number | boolean) => void;
  daysThisYear: number;
  yearsOnPhone: number;
  yearsBack: number;
}

const OnboardingCtx = createContext<OnboardingContextValue>({
  data: {},
  updateField: () => {},
  daysThisYear: 0,
  yearsOnPhone: 0,
  yearsBack: 0,
});

export function useOnboarding() {
  return useContext(OnboardingCtx);
}

export function OnboardingContextProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingAnswers>({});

  // Load persisted data on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setData(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  // Persist on every change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const updateField = useCallback((key: keyof OnboardingAnswers, value: string | number | boolean) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const screenTime = data.userScreenTime ?? 4;
  const daysThisYear = Math.round((screenTime / 24) * 365);
  const yearsOnPhone = Math.round((screenTime * 365 * 70) / 24 / 365);
  const yearsBack = Math.round(yearsOnPhone * 0.7);

  return (
    <OnboardingCtx.Provider value={{ data, updateField, daysThisYear, yearsOnPhone, yearsBack }}>
      {children}
    </OnboardingCtx.Provider>
  );
}
