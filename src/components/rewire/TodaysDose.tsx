import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import type { Session } from '../../types';
import { getTodaysSessions } from '../../utils/rewireManager';

interface Props {
  sessions: Session[];
}

const HINTS = [
  '20 minutes a day can meaningfully shift how you relate to your phone.',
  'Each session is practice for the skill of sustained attention.',
  'Many people report feeling clearer and more focused after consistent practice.',
  'Sitting with no stimulation is one of the hardest things to do — and one of the most rewarding.',
  "You're training yourself to do what most people would rather take an electric shock than attempt.",
];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TodaysDose({ sessions }: Props) {
  const todaySessions = useMemo(() => getTodaysSessions(sessions), [sessions]);
  const todayCompleted = todaySessions.length > 0;
  const todayDuration = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const hint = useMemo(() => HINTS[Math.floor(Math.random() * HINTS.length)], []);

  return (
    <View style={styles.card}>
      <Text style={styles.header}>TODAY'S DOSE</Text>

      {todayCompleted ? (
        <Text style={styles.statusText}>
          You sat for {formatDuration(todayDuration)} today ✓
        </Text>
      ) : (
        <View>
          <Text style={styles.statusText}>No session yet today</Text>
          <Text style={styles.waitingText}>Your next session is waiting</Text>
        </View>
      )}

      <Text style={styles.hintText}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.card,
    padding: 20,
    gap: 12,
  },
  header: {
    fontSize: 22,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  statusText: {
    fontSize: 20,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textPrimary,
  },
  waitingText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.coral,
    opacity: 0.6,
    marginTop: 4,
  },
  hintText: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
