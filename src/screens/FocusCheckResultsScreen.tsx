import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/designSystem';
import type { FocusCheckComparison } from '../utils/focusCheckService';
import { getFocusCheckSchedule } from '../utils/focusCheckService';

interface FocusCheckResultsScreenProps {
  comparison: FocusCheckComparison;
  currentDay: number;
  onGoHome: () => void;
}

export function FocusCheckResultsScreen({ comparison, currentDay, onGoHome }: FocusCheckResultsScreenProps) {
  const { current, previous, baseline, dawgScoreDelta, baselineDelta, blinkDelta, stillnessDelta } = comparison;
  const [daysUntilNext, setDaysUntilNext] = React.useState<number | null>(null);

  React.useEffect(() => {
    getFocusCheckSchedule(currentDay).then((schedule) => {
      const diff = schedule.nextCheckDay - currentDay;
      setDaysUntilNext(diff > 0 ? diff : null);
    }).catch(() => {});
  }, [currentDay]);

  const gradeColor = getGradeColor(scoreToGrade(current.dawgScore));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerLabel}>FOCUS CHECK #{current.testNumber}</Text>
        <Text style={styles.headerSubLabel}>Day {current.dayNumber}</Text>

        {/* Main Score */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreNumber, { color: gradeColor }]}>
            {Math.round(current.dawgScore)}
          </Text>
          <View style={[styles.gradeBadge, { borderColor: gradeColor, backgroundColor: gradeColor + '22' }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>
              {scoreToGrade(current.dawgScore)}
            </Text>
          </View>
        </View>

        {/* Deltas */}
        <View style={styles.deltaRow}>
          {dawgScoreDelta !== null && (
            <DeltaChip
              label="vs. Last Check"
              value={dawgScoreDelta}
              suffix=" pts"
            />
          )}
          {baselineDelta !== null && (
            <DeltaChip
              label="vs. Baseline"
              value={baselineDelta}
              suffix=" pts"
            />
          )}
        </View>

        {/* Sub-scores */}
        <Text style={styles.sectionTitle}>BREAKDOWN</Text>
        <View style={styles.metricsContainer}>
          <MetricRow
            label="Stillness"
            value={`${Math.round(current.stillnessPercent)}%`}
            delta={stillnessDelta}
            suffix="%"
          />
          <MetricRow
            label="Blinks/min"
            value={current.blinksPerMinute.toFixed(1)}
            delta={blinkDelta}
            suffix=""
            invertDelta
          />
          <MetricRow
            label="Focus Score"
            value={Math.round(current.blinkScore).toString()}
            delta={null}
            suffix=""
          />
        </View>

        {/* Next check info */}
        <View style={styles.nextCheckCard}>
          <Text style={styles.nextCheckEmoji}>📅</Text>
          <Text style={styles.nextCheckText}>
            {daysUntilNext != null
              ? `Next Focus Check in ${daysUntilNext} day${daysUntilNext === 1 ? '' : 's'} — keep up your daily challenges`
              : 'All Focus Checks complete — you made it!'}
          </Text>
        </View>

        {/* Go Home */}
        <TouchableOpacity style={styles.homeButton} onPress={onGoHome} activeOpacity={0.8}>
          <Text style={styles.homeButtonText}>DONE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────

function DeltaChip({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const isPositive = value > 0;
  const color = isPositive ? COLORS.verified : value < 0 ? COLORS.coral : COLORS.textMuted;
  const arrow = isPositive ? '↑' : value < 0 ? '↓' : '—';

  return (
    <View style={[styles.deltaChip, { borderColor: color + '44' }]}>
      <Text style={[styles.deltaValue, { color }]}>
        {arrow} {Math.abs(Math.round(value))}{suffix}
      </Text>
      <Text style={styles.deltaLabel}>{label}</Text>
    </View>
  );
}

function MetricRow({ label, value, delta, suffix, invertDelta }: {
  label: string;
  value: string;
  delta: number | null;
  suffix: string;
  invertDelta?: boolean;
}) {
  const displayDelta = delta !== null ? (invertDelta ? -delta : delta) : null;
  const isPositive = displayDelta !== null ? displayDelta > 0 : false;
  const deltaColor = displayDelta !== null
    ? (isPositive ? COLORS.verified : displayDelta < 0 ? COLORS.coral : COLORS.textMuted)
    : COLORS.textMuted;

  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRight}>
        <Text style={styles.metricValue}>{value}</Text>
        {displayDelta !== null && (
          <Text style={[styles.metricDelta, { color: deltaColor }]}>
            {displayDelta > 0 ? '+' : ''}{Math.round(displayDelta)}{suffix}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function scoreToGrade(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'S': return '#9B59B6';
    case 'A': return '#2ECC71';
    case 'B': return '#3498DB';
    case 'C': return '#FFBE0B';
    case 'D': return '#FF8C42';
    case 'F': return '#D4820A';
    default: return '#B8B3AC';
  }
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  content: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },

  // Header
  headerLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerSubLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    marginTop: 4,
  },

  // Score
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreNumber: {
    fontFamily: FONTS.display,
    fontSize: 80,
    lineHeight: 80,
  },
  gradeBadge: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    marginTop: 8,
  },
  gradeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
  },

  // Deltas
  deltaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  deltaChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
  },
  deltaValue: {
    fontFamily: FONTS.monoBold,
    fontSize: 16,
  },
  deltaLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },

  // Metrics
  metricsContainer: {
    width: '100%',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 24,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgSurfaceLight,
  },
  metricLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontFamily: FONTS.monoBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  metricDelta: {
    fontFamily: FONTS.mono,
    fontSize: 13,
  },

  // Next check
  nextCheckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 12,
    width: '100%',
    marginBottom: 32,
  },
  nextCheckEmoji: {
    fontSize: 24,
  },
  nextCheckText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Button
  homeButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    paddingHorizontal: 48,
    ...SHADOWS.coralButton,
  },
  homeButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: '#1C1208',
    letterSpacing: 1,
  },
});
