import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../constants/designSystem';
import { Session } from '../types';
import { getSessions } from '../utils/storage';
import { getStreakData, StreakData } from '../utils/streakManager';
import { getDateString } from '../utils/stats';


const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Grade helpers ────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 90) return '#8E44AD';
  if (score >= 80) return '#27AE60';
  if (score >= 65) return '#2980B9';
  if (score >= 50) return '#F39C12';
  if (score >= 30) return '#E67E22';
  return '#E74C3C';
}

function scoreGrade(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function getGradeWithModifier(score: number, baseGrade: string): string {
  const bands: { grade: string; min: number; max: number }[] = [
    { grade: 'S', min: 90, max: 100 },
    { grade: 'A', min: 80, max: 89 },
    { grade: 'B', min: 65, max: 79 },
    { grade: 'C', min: 50, max: 64 },
    { grade: 'D', min: 30, max: 49 },
  ];
  const band = bands.find((b) => b.grade === baseGrade);
  if (!band) return baseGrade;
  const range = band.max - band.min + 1;
  const third = range / 3;
  if (score >= band.min + 2 * third) return `${baseGrade}+`;
  if (score < band.min + third) return `${baseGrade}-`;
  return baseGrade;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
  }
  return dateStr;
}

const PROTECTION_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: 'EASY', color: '#2ECC71' },
  strict: { label: 'STRICT', color: '#F39C12' },
  ruthless: { label: 'RUTHLESS', color: '#E74C3C' },
};

// ─── Chart config ─────────────────────────────────────────────────────────────
const CHART_HEIGHT = 180;
const CHART_PADDING_LEFT = 32;
const CHART_PADDING_RIGHT = 12;
const CHART_PADDING_TOP = 8;
const CHART_PADDING_BOTTOM = 24;
const CHART_INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

const GRADE_BANDS = [
  { min: 90, max: 100, color: 'rgba(142, 68, 173, 0.08)' },
  { min: 80, max: 89,  color: 'rgba(39, 174, 96, 0.08)' },
  { min: 65, max: 79,  color: 'rgba(41, 128, 185, 0.06)' },
  { min: 50, max: 64,  color: 'rgba(243, 156, 18, 0.06)' },
  { min: 0,  max: 49,  color: 'rgba(231, 76, 60, 0.05)' },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface StatsScreenProps {
  onGoBack: () => void;
}

export function StatsScreen({ onGoBack }: StatsScreenProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastSessionDate: null,
    longestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const isPro = true; // Pro features unlocked for all users (IAP coming later)
  const openPaywall = () => {}; // No-op — paywall disabled

  useEffect(() => {
    (async () => {
      try {
        const [allSessions, streak] = await Promise.all([
          getSessions(),
          getStreakData(),
        ]);
        setSessions(allSessions.filter(s => s.completed));
        setStreakData(streak);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);


  // ─── Derived data ─────────────────────────────────────────────────────────
  const scoredSessions = useMemo(
    () => sessions.filter(s => s.dawgScore != null).sort((a, b) => a.timestamp - b.timestamp),
    [sessions],
  );

  const bestSession = useMemo(() => {
    if (scoredSessions.length === 0) return null;
    return scoredSessions.reduce((best, s) =>
      (s.dawgScore || 0) > (best.dawgScore || 0) ? s : best
    );
  }, [scoredSessions]);

  const avg7d = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = scoredSessions.filter(s => s.timestamp >= sevenDaysAgo);
    if (recent.length === 0) return null;
    return Math.round(
      recent.reduce((sum, s) => sum + (s.dawgScore || 0), 0) / recent.length
    );
  }, [scoredSessions]);

  const chartSessions = useMemo(
    () => scoredSessions.slice(-14),
    [scoredSessions],
  );

  const rollingAvg = useMemo(() => {
    return chartSessions.map((_, i) => {
      const start = Math.max(0, i - 2);
      const win = chartSessions.slice(start, i + 1);
      return win.reduce((s, sess) => s + (sess.dawgScore || 0), 0) / win.length;
    });
  }, [chartSessions]);

  const weekOverWeek = useMemo(() => {
    const now = Date.now();
    const thisWeekStart = now - 7 * 24 * 60 * 60 * 1000;
    const lastWeekStart = now - 14 * 24 * 60 * 60 * 1000;

    const thisWeek = scoredSessions.filter(s => s.timestamp >= thisWeekStart);
    const lastWeek = scoredSessions.filter(s => s.timestamp >= lastWeekStart && s.timestamp < thisWeekStart);

    if (thisWeek.length === 0 || lastWeek.length === 0) return null;

    const thisAvg = Math.round(thisWeek.reduce((s, sess) => s + (sess.dawgScore || 0), 0) / thisWeek.length);
    const lastAvg = Math.round(lastWeek.reduce((s, sess) => s + (sess.dawgScore || 0), 0) / lastWeek.length);
    const change = lastAvg > 0 ? Math.round(((thisAvg - lastAvg) / lastAvg) * 100) : 0;

    return { thisAvg, lastAvg, change };
  }, [scoredSessions]);

  const last7Days = useMemo(() => {
    const days: { label: string; date: string; completed: boolean; isToday: boolean }[] = [];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const sessionDates = new Set(sessions.map(s => s.date));
    const today = getDateString(new Date());

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = getDateString(d);
      days.push({
        label: dayLabels[d.getDay()],
        date: dateStr,
        completed: sessionDates.has(dateStr),
        isToday: dateStr === today,
      });
    }
    return days;
  }, [sessions]);

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20),
    [sessions],
  );

  // ─── Chart renderer ───────────────────────────────────────────────────────
  const chartWidth = SCREEN_WIDTH - 48;
  const chartInnerWidth = chartWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;

  const scoreToY = (score: number) => {
    return CHART_PADDING_TOP + CHART_INNER_HEIGHT * (1 - score / 100);
  };

  const renderChart = () => {
    if (chartSessions.length < 2) {
      return (
        <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
          <Text style={styles.chartPlaceholder}>
            Complete a session to see your progress
          </Text>
        </View>
      );
    }

    const pointSpacing = chartInnerWidth / (chartSessions.length - 1);

    return (
      <View style={[styles.chartContainer, { height: CHART_HEIGHT, width: chartWidth }]}>
        {/* Grade band backgrounds */}
        {GRADE_BANDS.map((band) => {
          const top = scoreToY(band.max);
          const bottom = scoreToY(band.min);
          return (
            <View
              key={band.min}
              style={{
                position: 'absolute',
                left: CHART_PADDING_LEFT,
                right: CHART_PADDING_RIGHT,
                top,
                height: bottom - top,
                backgroundColor: band.color,
              }}
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((val) => (
          <Text
            key={val}
            style={[styles.yAxisLabel, { top: scoreToY(val) - 6 }]}
          >
            {val}
          </Text>
        ))}

        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((val) => (
          <View
            key={`line-${val}`}
            style={{
              position: 'absolute',
              left: CHART_PADDING_LEFT,
              right: CHART_PADDING_RIGHT,
              top: scoreToY(val),
              height: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          />
        ))}

        {/* Rolling average line */}
        {rollingAvg.map((avg, i) => {
          if (i === 0) return null;
          const x1 = CHART_PADDING_LEFT + (i - 1) * pointSpacing;
          const y1 = scoreToY(rollingAvg[i - 1]);
          const x2 = CHART_PADDING_LEFT + i * pointSpacing;
          const y2 = scoreToY(avg);
          return (
            <LineSegment key={`avg-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} color="rgba(255, 255, 255, 0.2)" width={1.5} />
          );
        })}

        {/* Main score line */}
        {chartSessions.map((sess, i) => {
          if (i === 0) return null;
          const score = sess.dawgScore || 0;
          const prevScore = chartSessions[i - 1].dawgScore || 0;
          const x1 = CHART_PADDING_LEFT + (i - 1) * pointSpacing;
          const y1 = scoreToY(prevScore);
          const x2 = CHART_PADDING_LEFT + i * pointSpacing;
          const y2 = scoreToY(score);
          return (
            <LineSegment key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} color={DS_COLORS.coral} width={2} />
          );
        })}

        {/* Score dots */}
        {chartSessions.map((sess, i) => {
          const score = sess.dawgScore || 0;
          const x = CHART_PADDING_LEFT + i * pointSpacing;
          const y = scoreToY(score);
          return (
            <View
              key={`dot-${i}`}
              style={{
                position: 'absolute',
                left: x - 3,
                top: y - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: DS_COLORS.coral,
              }}
            />
          );
        })}

        {/* X-axis labels */}
        {chartSessions.map((sess, i) => {
          const x = CHART_PADDING_LEFT + i * pointSpacing;
          const showLabel = chartSessions.length <= 7 || i % Math.ceil(chartSessions.length / 7) === 0 || i === chartSessions.length - 1;
          if (!showLabel) return null;
          return (
            <Text
              key={`xlabel-${i}`}
              style={[styles.xAxisLabel, { left: x - 14, top: CHART_HEIGHT - CHART_PADDING_BOTTOM + 4 }]}
            >
              {formatDateLabel(sess.date)}
            </Text>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── 1. HEADER ─────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>YOUR STATS</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
          </View>
        </View>

        {/* ─── 2. SCORE SUMMARY CARDS ────────────────────────────────── */}
        <View style={styles.summaryRow}>
          {/* Best Score — always visible */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>BEST</Text>
            {bestSession ? (
              <>
                <Text style={[styles.summaryValue, { color: scoreColor(bestSession.dawgScore || 0) }]}>
                  {Math.round(bestSession.dawgScore || 0)}
                </Text>
                <Text style={[styles.summaryGrade, { color: scoreColor(bestSession.dawgScore || 0) }]}>
                  {getGradeWithModifier(bestSession.dawgScore || 0, bestSession.grade || 'F')}
                </Text>
              </>
            ) : (
              <Text style={styles.summaryEmpty}>—</Text>
            )}
          </View>

          {/* Avg Score */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>AVG 7D</Text>
            {avg7d != null ? (
              <>
                <Text style={[styles.summaryValue, { color: scoreColor(avg7d) }]}>{avg7d}</Text>
                <Text style={[styles.summaryGrade, { color: scoreColor(avg7d) }]}>{scoreGrade(avg7d)}</Text>
              </>
            ) : (
              <Text style={styles.summaryEmpty}>—</Text>
            )}
          </View>

          {/* Total Sessions — always visible */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>SESSIONS</Text>
            <Text style={[styles.summaryValue, { color: DS_COLORS.textPrimary }]}>
              {sessions.length}
            </Text>
            <Text style={styles.summarySubtext}>total</Text>
          </View>
        </View>

        {/* ─── 3. SCORE CHART ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCORE HISTORY</Text>
          {renderChart()}
        </View>

        {/* ─── 4. STREAK SECTION ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STREAK</Text>
          <View style={styles.streakCard}>
            <View style={styles.streakInfoRow}>
              <View style={styles.streakMain}>
                <Text style={styles.streakBigNumber}>{streakData.currentStreak}</Text>
                <Text style={styles.streakDaysLabel}>
                  {streakData.currentStreak === 1 ? 'day' : 'days'}
                </Text>
                <Text style={styles.streakFlameIcon}>🔥</Text>
              </View>
              <Text style={styles.streakBest}>
                Best: {streakData.longestStreak} {streakData.longestStreak === 1 ? 'day' : 'days'}
              </Text>
            </View>

            {/* Last 7 days circles — always visible (retention hook) */}
            <View style={styles.weekRow}>
              {last7Days.map((day) => (
                <View key={day.date} style={styles.dayColumn}>
                  <View
                    style={[
                      styles.dayCircle,
                      day.completed && styles.dayCircleFilled,
                      day.isToday && !day.completed && styles.dayCircleToday,
                    ]}
                  >
                    {day.completed && <Text style={styles.dayCheck}>✓</Text>}
                  </View>
                  <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ─── 5. SESSION HISTORY ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
          {recentSessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet</Text>
          ) : (
            <View style={styles.historyList}>
              {recentSessions.slice(0, 20).map((sess, i) => (
                <SessionRow key={sess.id} session={sess} showBorder={i > 0} />
              ))}
            </View>
          )}
        </View>

        {/* ─── 6. WEEK OVER WEEK ─────────────────────────────────────── */}
        {weekOverWeek && scoredSessions.length >= 7 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THIS WEEK vs LAST WEEK</Text>
            <View style={styles.wowCard}>
              <View style={styles.wowBarsRow}>
                <View style={styles.wowBarColumn}>
                  <View style={styles.wowBarTrack}>
                    <View
                      style={[styles.wowBarFill, { height: `${weekOverWeek.lastAvg}%`, backgroundColor: scoreColor(weekOverWeek.lastAvg), opacity: 0.4 }]}
                    />
                  </View>
                  <Text style={styles.wowBarValue}>{weekOverWeek.lastAvg}</Text>
                  <Text style={styles.wowBarLabel}>Last wk</Text>
                </View>
                <View style={styles.wowBarColumn}>
                  <View style={styles.wowBarTrack}>
                    <View
                      style={[styles.wowBarFill, { height: `${weekOverWeek.thisAvg}%`, backgroundColor: scoreColor(weekOverWeek.thisAvg) }]}
                    />
                  </View>
                  <Text style={styles.wowBarValue}>{weekOverWeek.thisAvg}</Text>
                  <Text style={styles.wowBarLabel}>This wk</Text>
                </View>
              </View>
              <View style={styles.wowChange}>
                <Text style={[styles.wowChangeText, { color: weekOverWeek.change >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                  {weekOverWeek.change >= 0 ? '↑' : '↓'} {Math.abs(weekOverWeek.change)}%
                </Text>
                <Text style={styles.wowChangeLabel}>
                  {weekOverWeek.change >= 0 ? 'improvement' : 'decrease'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Session Row sub-component ──────────────────────────────────────────────
function SessionRow({ session, showBorder }: { session: Session; showBorder: boolean }) {
  const dateObj = new Date(session.timestamp);
  const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const hasScore = session.dawgScore != null;
  const score = session.dawgScore || 0;
  const grade = session.grade || 'F';
  const protection = session.protectionLevel;

  return (
    <View style={[styles.historyRow, showBorder && styles.historyRowBorder]}>
      <Text style={styles.historyDate}>{dateLabel}</Text>
      <View style={styles.historyCenter}>
        {hasScore ? (
          <Text style={[styles.historyScore, { color: scoreColor(score) }]}>
            {Math.round(score)} {getGradeWithModifier(score, grade)}
          </Text>
        ) : (
          <Text style={styles.historyNoScore}>—</Text>
        )}
      </View>
      <Text style={styles.historyDuration}>{formatDuration(session.duration)}</Text>
      {protection && protection !== 'easy' && PROTECTION_LABELS[protection] && (
        <View style={[styles.historyBadge, { borderColor: PROTECTION_LABELS[protection].color }]}>
          <Text style={[styles.historyBadgeText, { color: PROTECTION_LABELS[protection].color }]}>
            {PROTECTION_LABELS[protection].label}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Line Segment Component (RN Views) ──────────────────────────────────────
function LineSegment({
  x1, y1, x2, y2, color, width: lineWidth,
}: {
  x1: number; y1: number; x2: number; y2: number; color: string; width: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <View
      style={{
        position: 'absolute',
        left: x1,
        top: y1 - lineWidth / 2,
        width: length,
        height: lineWidth,
        backgroundColor: color,
        borderRadius: lineWidth / 2,
        transform: [
          { translateX: 0 },
          { translateY: lineWidth / 2 },
          { rotate: `${angle}deg` },
        ],
        transformOrigin: 'left center',
      }}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // ─── 1. Header ──────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backArrow: {
    fontSize: 24,
    color: DS_COLORS.textPrimary,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  proBadge: {
    backgroundColor: DS_COLORS.coral,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DS_COLORS.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  streakFlame: {
    fontSize: 14,
  },
  streakNumber: {
    fontSize: 16,
    fontFamily: FONTS.monoBold,
    color: DS_COLORS.coral,
  },

  // ─── 2. Summary Cards ──────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: FONTS.display,
    letterSpacing: 1,
  },
  summaryGrade: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    letterSpacing: 1,
  },
  summarySubtext: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  summaryEmpty: {
    fontSize: 28,
    fontFamily: FONTS.display,
    color: DS_COLORS.textDisabled,
  },
  summaryLockIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  summaryProText: {
    fontSize: 10,
    fontFamily: FONTS.heading,
    color: DS_COLORS.coral,
    letterSpacing: 1.5,
  },

  // ─── 3. Chart ─────────────────────────────────────────────────────────
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  yAxisLabel: {
    position: 'absolute',
    left: 4,
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textDisabled,
    width: 24,
    textAlign: 'right',
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textDisabled,
    width: 28,
    textAlign: 'center',
  },
  chartBlurOverlay: {
    position: 'absolute',
    overflow: 'hidden',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLockContent: {
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
  },
  chartLockIcon: {
    fontSize: 20,
  },
  chartLockText: {
    fontSize: 12,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  // ─── 4. Streak ────────────────────────────────────────────────────────
  streakCard: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: 12,
    padding: 20,
    gap: 20,
  },
  streakInfoRow: {
    alignItems: 'center',
    gap: 4,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  streakBigNumber: {
    fontSize: 48,
    fontFamily: FONTS.display,
    color: DS_COLORS.coral,
    letterSpacing: 2,
  },
  streakDaysLabel: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textSecondary,
  },
  streakFlameIcon: {
    fontSize: 24,
  },
  streakBest: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  streakLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  streakLockedIcon: {
    fontSize: 13,
  },
  streakLockedText: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textDisabled,
  },
  streakProPill: {
    backgroundColor: DS_COLORS.coral,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  streakProPillText: {
    fontSize: 8,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 1,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleFilled: {
    backgroundColor: DS_COLORS.coral,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: DS_COLORS.coral,
  },
  dayCheck: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textMuted,
  },
  dayLabelToday: {
    color: DS_COLORS.coral,
  },

  // ─── 5. Session History ───────────────────────────────────────────────
  historyList: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  historyRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  historyDate: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    width: 50,
  },
  historyCenter: {
    flex: 1,
  },
  historyScore: {
    fontSize: 15,
    fontFamily: FONTS.heading,
  },
  historyNoScore: {
    fontSize: 15,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textDisabled,
  },
  historyDuration: {
    fontSize: 13,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  historyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  historyBadgeText: {
    fontSize: 8,
    fontFamily: FONTS.heading,
    letterSpacing: 1,
  },
  historyBlurWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  unlockButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  unlockButtonText: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: DS_COLORS.coral,
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },

  // ─── 6. Week over Week ────────────────────────────────────────────────
  wowCard: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 24,
  },
  wowCardLocked: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  wowBarsRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-end',
    flex: 1,
  },
  wowBarColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  wowBarTrack: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  wowBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  wowBarValue: {
    fontSize: 18,
    fontFamily: FONTS.monoBold,
    color: DS_COLORS.textPrimary,
  },
  wowBarLabel: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  wowChange: {
    alignItems: 'center',
    gap: 4,
  },
  wowChangeText: {
    fontSize: 22,
    fontFamily: FONTS.heading,
  },
  wowChangeLabel: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },

  // ─── Locked overlay ──────────────────────────────────────────────────
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 20,
    zIndex: 11,
  },
  lockedText: {
    fontSize: 13,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0.5,
    zIndex: 11,
  },
});
