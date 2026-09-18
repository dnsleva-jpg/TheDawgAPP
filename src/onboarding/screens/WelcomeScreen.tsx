import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, BRAND } from '../../constants/designSystem';
import { OnboardingButton } from '../components/OnboardingButton';

interface WelcomeScreenProps {
  onNext: () => void;
  onLogin: () => void;
}

export function WelcomeScreen({ onNext, onLogin }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.brand}>{BRAND.appName}</Text>

        <View style={styles.heroCard}>
          <Text style={styles.scoreLabel}>DO NOTHIN. SCORE</Text>
          <Text style={styles.scoreValue}>82</Text>
          <Text style={styles.gradeText}>A- FOCUSED</Text>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>91%</Text>
              <Text style={styles.statLabel}>stillness</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>blinks/min</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>15:00</Text>
              <Text style={styles.statLabel}>duration</Text>
            </View>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>CAMERA VERIFIED</Text>
          </View>
        </View>

        <Text style={styles.headline}>Your phone addiction{'\n'}ends here.</Text>
        <Text style={styles.subheadline}>
          The only app that proves your attention span is improving — with camera-verified data.
        </Text>
      </View>

      <View style={styles.footer}>
        <OnboardingButton title="Let's fix this" onPress={onNext} />
        <OnboardingButton title="Already have an account? Log in" onPress={onLogin} variant="text" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  brand: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.coral,
    letterSpacing: 2,
    marginBottom: 32,
  },
  heroCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 22,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.06)',
  },
  scoreLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  scoreValue: {
    fontFamily: FONTS.display,
    fontSize: 72,
    color: COLORS.textPrimary,
    lineHeight: 76,
  },
  gradeText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: '#27AE60',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.monoBold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.25)',
  },
  verifiedText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: '#2ECC71',
    letterSpacing: 1,
  },
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  footer: {
    gap: 4,
  },
});
