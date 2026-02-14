import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import type { Session } from '../../types';

interface Props {
  sessions: Session[];
  isPro: boolean;
  onLockPress: () => void;
}

function gradeColor(grade: string): string {
  const colors: Record<string, string> = {
    S: '#8E44AD', A: '#27AE60', B: '#2980B9', C: '#F39C12', D: '#E67E22', F: '#E74C3C',
  };
  return colors[grade?.charAt(0)] ?? DS_COLORS.textMuted;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function SessionRow({ session }: { session: Session }) {
  const d = new Date(session.timestamp);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const hasScore = session.rawDawgScore != null;

  return (
    <View style={styles.row}>
      <Text style={styles.rowDate}>{dateStr}</Text>
      {hasScore ? (
        <Text style={[styles.rowScore, { color: gradeColor(session.grade ?? '') }]}>
          {Math.round(session.rawDawgScore!)} {session.grade}
        </Text>
      ) : (
        <Text style={styles.rowNoScore}>—</Text>
      )}
      <Text style={styles.rowDuration}>{formatDuration(session.duration)}</Text>
      {session.protectionLevel && session.protectionLevel !== 'easy' && (
        <View style={styles.protBadge}>
          <Text style={styles.protBadgeText}>
            {session.protectionLevel.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

export function SessionLog({ sessions, isPro, onLockPress }: Props) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => b.timestamp - a.timestamp);

  const visibleCount = isPro ? 20 : 3;
  const visible = sorted.slice(0, expanded ? visibleCount : 0);
  const blurredCount = !isPro && sorted.length > 3 ? Math.min(3, sorted.length - 3) : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.header}>SESSION LOG</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.list}>
          {visible.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}

          {/* Blurred teaser rows for free users */}
          {!isPro && blurredCount > 0 && (
            <View style={styles.blurWrap}>
              {Array.from({ length: blurredCount }).map((_, i) => (
                <View key={i} style={styles.blurRow}>
                  <View style={styles.blurBar} />
                  <View style={[styles.blurBar, { width: 40 }]} />
                  <View style={[styles.blurBar, { width: 30 }]} />
                </View>
              ))}
              <TouchableOpacity onPress={onLockPress} activeOpacity={0.8}>
                <LinearGradient
                  colors={['transparent', 'rgba(26, 26, 46, 0.95)']}
                  style={StyleSheet.absoluteFill}
                />
              </TouchableOpacity>
            </View>
          )}

          {!isPro && sorted.length > 3 && (
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={onLockPress}
              activeOpacity={0.8}
            >
              <Text style={styles.unlockText}>See all sessions — Unlock Pro</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  chevron: {
    fontSize: 14,
    color: DS_COLORS.textMuted,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  rowDate: {
    fontSize: 12,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textMuted,
    width: 36,
  },
  rowScore: {
    fontSize: 14,
    fontFamily: FONTS.headingMedium,
    flex: 1,
  },
  rowNoScore: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    flex: 1,
  },
  rowDuration: {
    fontSize: 12,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textSecondary,
  },
  protBadge: {
    backgroundColor: 'rgba(255,190,11,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  protBadgeText: {
    fontSize: 8,
    fontFamily: FONTS.heading,
    color: DS_COLORS.amber,
    letterSpacing: 0.5,
  },
  blurWrap: {
    position: 'relative',
    overflow: 'hidden',
    gap: 6,
  },
  blurRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    opacity: 0.3,
  },
  blurBar: {
    height: 12,
    width: 60,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  unlockButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DS_COLORS.coral,
    marginTop: 4,
  },
  unlockText: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: DS_COLORS.coral,
  },
});
