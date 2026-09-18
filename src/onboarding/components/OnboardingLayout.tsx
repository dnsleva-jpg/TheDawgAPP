import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/designSystem';
import { ProgressBar } from './ProgressBar';
import { ONBOARDING_SCREENS } from '../types';

interface OnboardingLayoutProps {
  screenIndex: number;
  children: React.ReactNode;
  showProgress?: boolean;
  scrollable?: boolean;
}

export function OnboardingLayout({
  screenIndex,
  children,
  showProgress = true,
  scrollable = true,
}: OnboardingLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showProgress && (
        <ProgressBar current={screenIndex + 1} total={ONBOARDING_SCREENS.length} />
      )}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scrollable ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + 24 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content, { paddingBottom: insets.bottom + 24 }]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
