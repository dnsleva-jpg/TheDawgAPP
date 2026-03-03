import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import type { BrainComparison, ComparisonItem } from '../../utils/rewireManager';

interface Props {
  data: BrainComparison;
  isPro: boolean;
  onLockPress: () => void;
}

function ComparisonRow({ item }: { item: ComparisonItem }) {
  const userPct = Math.min(100, Math.max(5, (item.userValue / Math.max(item.baseline, item.userValue)) * 100));
  const basePct = Math.min(100, Math.max(5, (item.baseline / Math.max(item.baseline, item.userValue)) * 100));

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <View style={styles.barsContainer}>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>You</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFillUser, { width: `${userPct}%` }]} />
          </View>
        </View>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Avg</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFillBaseline, { width: `${basePct}%` }]} />
          </View>
        </View>
      </View>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
}

export function BrainVsAverage({ data, isPro, onLockPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>YOUR BRAIN VS AVERAGE</Text>
      <View style={styles.card}>
        {data.hasData ? (
          <>
            <ComparisonRow item={data.stillness} />
            <View style={styles.divider} />
            <ComparisonRow item={data.focus} />
            <View style={styles.divider} />
            <ComparisonRow item={data.endurance} />
          </>
        ) : (
          <View style={styles.placeholderWrap}>
            <Text style={styles.placeholderText}>
              Need more sessions to see how your brain compares
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    fontSize: 22,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.card,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
  },
  row: {
    gap: 8,
  },
  rowLabel: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textSecondary,
    letterSpacing: 1,
  },
  barsContainer: {
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textMuted,
    width: 26,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFillUser: {
    height: '100%',
    backgroundColor: DS_COLORS.coral,
    borderRadius: 5,
  },
  barFillBaseline: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
  },
  description: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 12,
  },
  placeholderWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
});
