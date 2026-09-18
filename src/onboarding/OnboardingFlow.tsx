import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { OnboardingNavigator } from '../screens/onboarding/OnboardingNavigator';
import { OnboardingContextProvider } from '../context/OnboardingContext';
import { setOnboardingComplete } from './onboardingStorage';
import { logOnboardingComplete } from '../utils/analyticsService';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const handleComplete = useCallback(async () => {
    await setOnboardingComplete();
    logOnboardingComplete({});
    onComplete();
  }, [onComplete]);

  return (
    <OnboardingContextProvider>
      <StatusBar style="dark" />
      <OnboardingNavigator onComplete={handleComplete} />
    </OnboardingContextProvider>
  );
}
