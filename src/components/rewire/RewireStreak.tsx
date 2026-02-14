import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import type { StreakData } from '../../utils/streakManager';
import type { Session } from '../../types';

interface Props {
  streakData: StreakData;
  sessions: Session[];
  isPro: boolean;
  onLockPress: () => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function TodayPulse() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return (
    <Animated.View
      style={[styles.todayPulse, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }) }]}
    />
  );
}

export function RewireStreak({ streakData, sessions, isPro, onLockPress }: Props) {
  // Build last 7 days
  const last7Days = useMemo(() => {
    const today = new Date();
    const sessionDates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
    const days: { date: string; dayLabel: string; hasSession: boolean; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0=Sun
      const labelIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      days.push({
        date: dateStr,
        dayLabel: DAY_LABELS[labelIdx],
        hasSession: sessionDates.has(dateStr),
        isToday: i === 0,
      });
    }
    return days;
  }, [sessions]);

  // Build 30-day heatmap (for Pro)
  const heatmap30 = useMemo(() => {
    if (!isPro) return [];
    const today = new Date();
    const sessionDates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
    const days: { date: string; hasSession: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, hasSession: sessionDates.has(dateStr) });
    }
    return days;
  }, [sessions, isPro]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>REWIRE STREAK</Text>
      <View style={styles.card}>
        {/* Current streak */}
        <View style={styles.streakRow}>
          <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
          <View>
            <Text style={styles.streakLabel}>days 🔥</Text>
            {isPro && (
              <Text style={styles.bestStreak}>Best: {streakData.longestStreak} days</Text>
            )}
          </View>
        </View>

        {/* 7-day circles */}
        <View style={styles.circlesRow}>
          {last7Days.map((day) => (
            <View key={day.date} style={styles.circleCol}>
              <View style={styles.circleWrapper}>
                {day.isToday && !day.hasSession && <TodayPulse />}
                <View
                  style={[
                    styles.circle,
                    day.hasSession && styles.circleFilled,
                    day.isToday && !day.hasSession && styles.circleToday,
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{day.dayLabel}</Text>
            </View>
          ))}
        </View>

        {/* 30-day heatmap (Pro only) */}
        {isPro && heatmap30.length > 0 && (
          <View style={styles.heatmapSection}>
            <Text style={styles.heatmapTitle}>30 DAYS</Text>
            <View style={styles.heatmapGrid}>
              {heatmap30.map((day) => (
                <View
                  key={day.date}
                  style={[
                    styles.heatmapCell,
                    day.hasSession && styles.heatmapCellActive,
                  ]}
                />
              ))}
            </View>
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
    gap: 20,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textSecondary,
  },
  bestStreak: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.coral,
    marginTop: 2,
  },
  circlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleCol: {
    alignItems: 'center',
    gap: 6,
  },
  circleWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DS_COLORS.coral,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  circleFilled: {
    backgroundColor: DS_COLORS.coral,
    borderColor: DS_COLORS.coral,
  },
  circleToday: {
    borderColor: DS_COLORS.coral,
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  heatmapSection: {
    gap: 8,
  },
  heatmapTitle: {
    fontSize: 10,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textMuted,
    letterSpacing: 1,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  heatmapCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heatmapCellActive: {
    backgroundColor: DS_COLORS.coral,
  },
});
