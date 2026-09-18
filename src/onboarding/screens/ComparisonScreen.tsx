import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';

const ROWS = [
  'Measures real focus improvement',
  'Camera-verified sessions',
  '90-day structured program',
  'Shareable proof of progress',
  'Actually changes your brain',
];

interface ComparisonScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function ComparisonScreen({ onNext, screenIndex }: ComparisonScreenProps) {
  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>Not another app blocker.</Text>
      <Text style={styles.subheadline}>
        DO NOTHIN. doesn't block your phone. It trains your brain.
      </Text>

      <View style={styles.table}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.featureCell} />
          <View style={styles.headerCell}>
            <Text style={styles.headerBrand}>DO{'\n'}NOTHIN.</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerOther}>Forest</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerOther}>App{'\n'}Blockers</Text>
          </View>
        </View>

        {/* Data rows */}
        {ROWS.map((feature, i) => (
          <View
            key={feature}
            style={[styles.row, i % 2 === 0 && styles.rowAlt]}
          >
            <View style={styles.featureCell}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
            <View style={styles.dataCell}>
              <Text style={styles.check}>✅</Text>
            </View>
            <View style={styles.dataCell}>
              <Text style={styles.cross}>✗</Text>
            </View>
            <View style={styles.dataCell}>
              <Text style={styles.cross}>✗</Text>
            </View>
          </View>
        ))}
      </View>

      <OnboardingButton title="Set up my program" onPress={onNext} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 28,
  },
  table: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8CC',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  featureCell: {
    flex: 2.2,
    justifyContent: 'center',
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    color: COLORS.coral,
    textAlign: 'center',
    lineHeight: 15,
  },
  headerOther: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  rowAlt: {
    backgroundColor: 'rgba(28,18,8,0.02)',
  },
  featureText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  dataCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 16,
  },
  cross: {
    fontSize: 16,
    color: 'rgba(231, 76, 60, 0.5)',
    fontWeight: '700',
  },
});
