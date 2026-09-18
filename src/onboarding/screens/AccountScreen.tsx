import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { AuthContext } from '../../../contexts/AuthContext';

interface AccountScreenProps {
  onNext: () => void;
  screenIndex: number;
  baselineGrade?: string;
  baselineScore?: number;
  baselineGradeColor?: string;
}

export function AccountScreen({
  onNext,
  screenIndex,
  baselineGrade,
  baselineScore,
  baselineGradeColor,
}: AccountScreenProps) {
  const { signInWithApple, user } = useContext(AuthContext);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleAppleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithApple();
      onNext();
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign-in failed', 'Please try again or skip for now.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // If already signed in, auto-advance
  if (user) {
    onNext();
    return null;
  }

  return (
    <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
      <View style={styles.content}>
        {/* Mini score card thumbnail */}
        {baselineScore !== undefined && (
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>YOUR BASELINE</Text>
            <Text style={[styles.miniScore, { color: baselineGradeColor || COLORS.coral }]}>
              {Math.round(baselineScore)} {baselineGrade}
            </Text>
          </View>
        )}

        <Text style={styles.headline}>Save your progress.</Text>
        <Text style={styles.subheadline}>
          Create a free account to keep your score and start the 90-day program.
        </Text>

        <View style={styles.bullets}>
          <View style={styles.bullet}>
            <Text style={styles.bulletIcon}>🔄</Text>
            <Text style={styles.bulletText}>Sync your data across devices</Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletIcon}>📊</Text>
            <Text style={styles.bulletText}>Track your Brain Recovery Score over time</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={RADIUS.button}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}
        <OnboardingButton title="Skip for now" onPress={onNext} variant="text" />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    width: '60%',
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.06)',
  },
  miniLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  miniScore: {
    fontFamily: FONTS.display,
    fontSize: 36,
  },
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  bullets: {
    alignSelf: 'stretch',
    gap: 14,
    marginBottom: 8,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletIcon: {
    fontSize: 22,
  },
  bulletText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  footer: {
    gap: 8,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 56,
  },
});
