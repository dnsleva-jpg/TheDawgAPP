import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        {isPro && data.hasData ? (
          <>
            <ComparisonRow item={data.stillness} />
            <View style={styles.divider} />
            <ComparisonRow item={data.focus} />
            <View style={styles.divider} />
            <ComparisonRow item={data.endurance} />
          </>
        ) : (
          <>
            {/* Placeholder bars behind the blur */}
            <View style={styles.placeholderBars}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.placeholderRow}>
                  <View style={[styles.barTrack, { opacity: 0.3 }]}>
                    <View style={[styles.barFillUser, { width: '65%' }]} />
                  </View>
                  <View style={[styles.barTrack, { opacity: 0.2 }]}>
                    <View style={[styles.barFillBaseline, { width: '50%' }]} />
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.lockOverlay}
              onPress={onLockPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['transparent', 'rgba(26, 26, 46, 0.95)']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockText}>See how your brain compares</Text>
            </TouchableOpacity>
          </>
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
  placeholderBars: {
    gap: 20,
    opacity: 0.5,
  },
  placeholderRow: {
    gap: 4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockIcon: {
    fontSize: 28,
  },
  lockText: {
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
  },
});
