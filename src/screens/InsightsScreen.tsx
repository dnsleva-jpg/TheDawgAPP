import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/designSystem';
import {
  getShieldStats,
  getShieldConfig,
  getPerAppStats,
  saveShieldConfig,
  DOOM_SCROLL_APPS,
  type ShieldStats,
  type ShieldConfig,
  type AppInterceptionStats,
} from '../utils/shieldService';
import {
  getCheckInHistory,
  getFocusScoreAverage,
  getWeeklyInsight,
  type DailyCheckIn,
  type CorrelationInsight,
} from '../utils/focusScoreService';
import { getTodayPickups, getWeeklyAvgPickups } from '../utils/pickupService';

interface InsightsScreenProps {
  onNavigateToSettings?: () => void;
}

export function InsightsScreen({ onNavigateToSettings }: InsightsScreenProps = {}) {
  const [shieldStats, setShieldStats] = useState<ShieldStats | null>(null);
  const [shieldConfig, setShieldConfig] = useState<ShieldConfig | null>(null);
  const [appStats, setAppStats] = useState<AppInterceptionStats[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [avgScore, setAvgScore] = useState(0);
  const [weeklyInsight, setWeeklyInsight] = useState<CorrelationInsight | null>(null);
  const [todayPickups, setTodayPickups] = useState(0);
  const [avgPickups, setAvgPickups] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [ss, sc, as, ci, avg, insight, pickups, avgP] = await Promise.all([
      getShieldStats(),
      getShieldConfig(),
      getPerAppStats(),
      getCheckInHistory(7),
      getFocusScoreAverage(7),
      getWeeklyInsight(),
      getTodayPickups(),
      getWeeklyAvgPickups(),
    ]);
    setShieldStats(ss);
    setShieldConfig(sc);
    setAppStats(as);
    setCheckIns(ci);
    setAvgScore(avg ?? 0);
    setWeeklyInsight(insight);
    setTodayPickups(pickups);
    setAvgPickups(avgP);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const shieldActive = (shieldConfig?.enabledApps.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.coral} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>INSIGHTS</Text>

        {/* ─── Shield Setup Prompt ─────────────────────────── */}
        {!shieldActive && (
          <TouchableOpacity
            style={styles.setupCard}
            onPress={onNavigateToSettings}
            activeOpacity={0.8}
          >
            <View style={styles.setupIconCircle}>
              <Ionicons name="shield-outline" size={28} color={COLORS.coral} />
            </View>
            <View style={styles.setupText}>
              <Text style={styles.setupTitle}>Set Up Your Shield</Text>
              <Text style={styles.setupSub}>
                Choose apps to protect against doom scrolling. Takes 30 seconds per app.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        {/* ─── Weekly Focus Score ──────────────────────────── */}
        <Text style={styles.sectionTitle}>FOCUS SCORE</Text>
        <View style={styles.scoreCard}>
          <View style={styles.scoreMain}>
            <Text style={styles.scoreNumber}>{Math.round(avgScore)}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
          <Text style={styles.scoreLabel}>7-day average</Text>

          {/* Mini sparkline of last 7 check-ins */}
          {checkIns.length >= 2 && (
            <View style={styles.sparkline}>
              {checkIns.slice(-7).map((ci, i) => {
                const height = Math.max(4, (ci.focusScore / 100) * 40);
                return (
                  <View
                    key={i}
                    style={[
                      styles.sparkBar,
                      { height, backgroundColor: ci.focusScore >= 60 ? COLORS.verified : ci.focusScore >= 40 ? COLORS.amber : COLORS.coral },
                    ]}
                  />
                );
              })}
            </View>
          )}

          {weeklyInsight && (
            <View style={styles.insightBubble}>
              <Ionicons name="bulb-outline" size={14} color={COLORS.amber} />
              <Text style={styles.insightText}>{weeklyInsight.text}</Text>
            </View>
          )}
        </View>

        {/* ─── Phone Pickups ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>PHONE PICKUPS</Text>
        <View style={styles.pickupRow}>
          <View style={styles.pickupCard}>
            <Text style={styles.pickupNumber}>{todayPickups}</Text>
            <Text style={styles.pickupLabel}>Today</Text>
          </View>
          <View style={styles.pickupCard}>
            <Text style={styles.pickupNumber}>{avgPickups}</Text>
            <Text style={styles.pickupLabel}>Daily avg</Text>
          </View>
        </View>

        {/* ─── Shield Stats ───────────────────────────────── */}
        {shieldActive && shieldStats && (
          <>
            <Text style={styles.sectionTitle}>DOOM SCROLL SHIELD</Text>
            <View style={styles.shieldRow}>
              <StatCard value={shieldStats.todayInterceptions} label="Intercepted" sublabel="today" color={COLORS.amber} />
              <StatCard value={shieldStats.todayResisted} label="Resisted" sublabel="today" color={COLORS.verified} />
              <StatCard
                value={shieldStats.todayInterceptions > 0
                  ? Math.round((shieldStats.todayResisted / shieldStats.todayInterceptions) * 100)
                  : 0}
                label="Resist Rate"
                sublabel="%"
                color={COLORS.coral}
              />
            </View>

            {/* Weekly totals */}
            <View style={styles.weeklyCard}>
              <View style={styles.weeklyRow}>
                <Text style={styles.weeklyLabel}>This week</Text>
                <Text style={styles.weeklyValue}>
                  {shieldStats.weekResisted}/{shieldStats.weekInterceptions} resisted
                </Text>
              </View>
              <View style={styles.weeklyRow}>
                <Text style={styles.weeklyLabel}>All time</Text>
                <Text style={styles.weeklyValue}>
                  {shieldStats.totalResisted}/{shieldStats.totalInterceptions} ({shieldStats.resistRate}%)
                </Text>
              </View>
            </View>

            {/* Per-app breakdown */}
            {appStats.length > 0 && (
              <View style={styles.appsCard}>
                {appStats.map((app, i) => (
                  <View key={app.app} style={[styles.appRow, i > 0 && styles.appRowBorder]}>
                    <Text style={styles.appEmoji}>{app.emoji}</Text>
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.label}</Text>
                      <Text style={styles.appStat}>
                        {app.totalInterceptions > 0
                          ? `${app.totalResisted}/${app.totalInterceptions} resisted`
                          : 'No interceptions yet'}
                      </Text>
                    </View>
                    {app.totalInterceptions > 0 && (
                      <Text style={[styles.appRate, {
                        color: app.resistRate >= 50 ? COLORS.verified : COLORS.amber,
                      }]}>
                        {app.resistRate}%
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatCard({ value, label, sublabel, color }: {
  value: number; label: string; sublabel: string; color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 36,
    fontFamily: FONTS.display,
    color: COLORS.textPrimary,
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },

  // Setup prompt
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.coral + '33',
  },
  setupIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.coral + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupText: {
    flex: 1,
  },
  setupTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  setupSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  // Section
  sectionTitle: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 20,
    marginLeft: 4,
  },

  // Focus Score
  scoreCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontFamily: FONTS.display,
    fontSize: 56,
    color: COLORS.textPrimary,
  },
  scoreUnit: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  scoreLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 16,
    height: 40,
  },
  sparkBar: {
    width: 18,
    borderRadius: 4,
  },
  insightBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurfaceLight,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 16,
  },
  insightText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Pickups
  pickupRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickupCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    alignItems: 'center',
  },
  pickupNumber: {
    fontFamily: FONTS.display,
    fontSize: 36,
    color: COLORS.textPrimary,
  },
  pickupLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Shield
  shieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 28,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Weekly
  weeklyCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginTop: 10,
    gap: 10,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  weeklyValue: {
    fontFamily: FONTS.monoBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  // Apps
  appsCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginTop: 10,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  appRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.bgSurfaceLight,
  },
  appEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  appStat: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  appRate: {
    fontFamily: FONTS.monoBold,
    fontSize: 14,
  },
});
