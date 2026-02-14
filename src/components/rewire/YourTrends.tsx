import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import type { TrendData, TrendItem } from '../../utils/rewireManager';

interface Props {
  trends: TrendData;
  isPro: boolean;
  onLockPress: () => void;
}

const MESSAGES: Record<string, { up: string; down: string }> = {
  STILLNESS: {
    up: "You're getting stiller",
    down: 'More restless this week — keep pushing',
  },
  FOCUS: {
    up: 'Your focus is sharpening',
    down: 'Focus slipped — brain fog fighting back',
  },
  ENDURANCE: {
    up: "You're lasting longer",
    down: 'Sessions got shorter — challenge yourself',
  },
};

function TrendCard({ item }: { item: TrendItem }) {
  const msg = MESSAGES[item.label];
  const arrow = item.improving ? '↑' : '↓';
  const color = item.improving ? '#27AE60' : '#E74C3C';
  const text = item.improving ? msg.up : msg.down;

  return (
    <View style={styles.trendCard}>
      <View style={styles.trendHeader}>
        <Text style={styles.trendLabel}>{item.label}</Text>
        <Text style={[styles.trendChange, { color }]}>
          {arrow} {Math.abs(item.change)}%
        </Text>
      </View>
      <Text style={[styles.trendMessage, { color }]}>{text}</Text>
    </View>
  );
}

export function YourTrends({ trends, isPro, onLockPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>YOUR TRENDS</Text>
      <View style={styles.card}>
        {isPro && trends.hasEnoughData ? (
          <View style={styles.trendsColumn}>
            <TrendCard item={trends.stillness} />
            <TrendCard item={trends.focus} />
            <TrendCard item={trends.endurance} />
          </View>
        ) : isPro && !trends.hasEnoughData ? (
          <View style={styles.placeholderWrap}>
            <Text style={styles.placeholderText}>
              Need more sessions to see trends
            </Text>
          </View>
        ) : (
          <>
            {/* Placeholder behind blur */}
            <View style={styles.placeholderCards}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.trendCard, { opacity: 0.3 }]}>
                  <View style={styles.trendHeader}>
                    <View style={styles.fakeBar} />
                    <View style={[styles.fakeBar, { width: 40 }]} />
                  </View>
                  <View style={[styles.fakeBar, { width: '60%' }]} />
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
              <Text style={styles.lockText}>See if your brain is improving</Text>
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
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 160,
  },
  trendsColumn: {
    gap: 12,
  },
  trendCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textSecondary,
    letterSpacing: 1,
  },
  trendChange: {
    fontSize: 14,
    fontFamily: FONTS.monoBold,
  },
  trendMessage: {
    fontSize: 13,
    fontFamily: FONTS.body,
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
  placeholderCards: {
    gap: 10,
  },
  fakeBar: {
    height: 10,
    width: 80,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
