import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import type { Session } from '../../types';

interface Props {
  sessions: Session[];
  isPro: boolean;
  onLockPress: () => void;
}

const CHART_HEIGHT = 160;
const CHART_PADDING = 8;

const GRADE_BANDS = [
  { min: 90, max: 100, color: 'rgba(142, 68, 173, 0.08)' }, // S – purple
  { min: 80, max: 89, color: 'rgba(39, 174, 96, 0.08)' },   // A – green
  { min: 65, max: 79, color: 'rgba(41, 128, 185, 0.08)' },   // B – blue
  { min: 50, max: 64, color: 'rgba(243, 156, 18, 0.08)' },   // C – amber
  { min: 0, max: 49, color: 'rgba(231, 76, 60, 0.08)' },     // D/F – red
];

function scoreToY(score: number): number {
  return CHART_HEIGHT - (score / 100) * CHART_HEIGHT;
}

export function FocusTrajectory({ sessions, isPro, onLockPress }: Props) {
  const scoredSessions = useMemo(() => {
    return sessions
      .filter((s) => s.rawDawgScore != null)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-14);
  }, [sessions]);

  if (scoredSessions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>FOCUS TRAJECTORY</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Complete a session to start tracking</Text>
        </View>
      </View>
    );
  }

  const visibleCount = isPro ? scoredSessions.length : Math.min(3, scoredSessions.length);
  const showBlur = !isPro && scoredSessions.length > 3;
  const chartWidth = 300; // approx usable width
  const spacing = scoredSessions.length > 1 ? chartWidth / (scoredSessions.length - 1) : chartWidth;

  // Compute rolling average (3-session)
  const rollingAvg = scoredSessions.map((s, i) => {
    const window = scoredSessions.slice(Math.max(0, i - 2), i + 1);
    return window.reduce((sum, w) => sum + (w.rawDawgScore ?? 0), 0) / window.length;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>FOCUS TRAJECTORY</Text>
      <View style={styles.chartCard}>
        {/* Grade band backgrounds */}
        <View style={styles.chartArea}>
          {GRADE_BANDS.map((band) => (
            <View
              key={band.min}
              style={[
                styles.gradeBand,
                {
                  top: scoreToY(band.max),
                  height: ((band.max - band.min) / 100) * CHART_HEIGHT,
                  backgroundColor: band.color,
                },
              ]}
            />
          ))}

          {/* Score dots + line */}
          {scoredSessions.map((s, i) => {
            const x = scoredSessions.length > 1 ? (i / (scoredSessions.length - 1)) * chartWidth : chartWidth / 2;
            const y = scoreToY(s.rawDawgScore ?? 0);
            const isVisible = i < visibleCount;

            return (
              <View key={s.id}>
                {/* Rolling average dot */}
                {isPro && (
                  <View
                    style={[
                      styles.avgDot,
                      { left: x + CHART_PADDING - 3, top: scoreToY(rollingAvg[i]) - 3 },
                    ]}
                  />
                )}
                {/* Score dot */}
                <View
                  style={[
                    styles.scoreDot,
                    {
                      left: x + CHART_PADDING - 4,
                      top: y - 4,
                      opacity: isVisible ? 1 : 0.3,
                    },
                  ]}
                />
                {/* Line to next */}
                {i < scoredSessions.length - 1 && (
                  <View
                    style={[
                      styles.lineSegment,
                      {
                        left: x + CHART_PADDING,
                        top: y,
                        width: spacing,
                        opacity: i < visibleCount - 1 ? 1 : 0.2,
                        transform: [
                          {
                            rotate: `${Math.atan2(
                              scoreToY(scoredSessions[i + 1]?.rawDawgScore ?? 0) - y,
                              spacing
                            )}rad`,
                          },
                        ],
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}

          {/* Y-axis labels */}
          <Text style={[styles.yLabel, { top: scoreToY(100) - 6 }]}>100</Text>
          <Text style={[styles.yLabel, { top: scoreToY(50) - 6 }]}>50</Text>
          <Text style={[styles.yLabel, { top: scoreToY(0) - 6 }]}>0</Text>
        </View>

        {/* X-axis date labels */}
        <View style={styles.xAxis}>
          {scoredSessions.map((s, i) => {
            if (scoredSessions.length > 7 && i % 2 !== 0 && i !== scoredSessions.length - 1) return null;
            const d = new Date(s.timestamp);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            return (
              <Text key={s.id} style={styles.xLabel}>
                {label}
              </Text>
            );
          })}
        </View>

        {/* Blur overlay for free users */}
        {showBlur && (
          <TouchableOpacity
            style={styles.blurOverlay}
            onPress={onLockPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['transparent', 'rgba(26, 26, 46, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>See where your focus is heading</Text>
          </TouchableOpacity>
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
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.card,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  chartArea: {
    height: CHART_HEIGHT,
    position: 'relative',
    marginLeft: 28,
  },
  gradeBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 2,
  },
  scoreDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DS_COLORS.coral,
  },
  avgDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: DS_COLORS.coral,
    transformOrigin: 'left center',
  },
  yLabel: {
    position: 'absolute',
    left: -26,
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textMuted,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginLeft: 28,
  },
  xLabel: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textMuted,
  },
  placeholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.card,
    padding: 32,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  blurOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '55%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockIcon: {
    fontSize: 24,
  },
  lockText: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
  },
});
