import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/designSystem';
import {
  getShieldStats,
  getShieldConfig,
  getPerAppStats,
  type ShieldStats,
  type ShieldConfig,
  type AppInterceptionStats,
} from '../utils/shieldService';

export function ShieldScreen() {
  const [stats, setStats] = useState<ShieldStats | null>(null);
  const [config, setConfig] = useState<ShieldConfig | null>(null);
  const [appStats, setAppStats] = useState<AppInterceptionStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [s, c, a] = await Promise.all([
      getShieldStats(),
      getShieldConfig(),
      getPerAppStats(),
    ]);
    setStats(s);
    setConfig(c);
    setAppStats(a);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!stats || !config) return null;

  const isActive = config.enabledApps.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.coral} />
      }
    >
      {/* Shield Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]} />
          <Text style={styles.statusLabel}>
            {isActive ? 'SHIELD ACTIVE' : 'SHIELD INACTIVE'}
          </Text>
        </View>
        <Text style={styles.statusSub}>
          {isActive
            ? `Protecting you from ${config.enabledApps.length} app${config.enabledApps.length === 1 ? '' : 's'}`
            : 'Set up your Shield in Settings to get started'}
        </Text>
      </View>

      {/* Today's Stats */}
      <Text style={styles.sectionTitle}>TODAY</Text>
      <View style={styles.statsRow}>
        <StatCard
          value={stats.todayInterceptions}
          label="Intercepted"
          color={COLORS.amber}
        />
        <StatCard
          value={stats.todayResisted}
          label="Resisted"
          color={COLORS.verified}
        />
        <StatCard
          value={stats.todayInterceptions > 0
            ? Math.round((stats.todayResisted / stats.todayInterceptions) * 100)
            : 0}
          label="Resist Rate"
          suffix="%"
          color={COLORS.coral}
        />
      </View>

      {/* Weekly Stats */}
      <Text style={styles.sectionTitle}>THIS WEEK</Text>
      <View style={styles.statsRow}>
        <StatCard
          value={stats.weekInterceptions}
          label="Intercepted"
          color={COLORS.amber}
        />
        <StatCard
          value={stats.weekResisted}
          label="Resisted"
          color={COLORS.verified}
        />
        <StatCard
          value={stats.weekInterceptions > 0
            ? Math.round((stats.weekResisted / stats.weekInterceptions) * 100)
            : 0}
          label="Resist Rate"
          suffix="%"
          color={COLORS.coral}
        />
      </View>

      {/* Per-App Breakdown */}
      {appStats.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>SHIELDED APPS</Text>
          <View style={styles.appsContainer}>
            {appStats.map((app) => (
              <View key={app.app} style={styles.appRow}>
                <Text style={styles.appEmoji}>{app.emoji}</Text>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.label}</Text>
                  <Text style={styles.appStat}>
                    {app.totalInterceptions > 0
                      ? `${app.totalResisted}/${app.totalInterceptions} resisted (${app.resistRate}%)`
                      : 'No interceptions yet'}
                  </Text>
                </View>
                {app.totalInterceptions > 0 && (
                  <View style={styles.appResistBadge}>
                    <Text style={[
                      styles.appResistText,
                      { color: app.resistRate >= 50 ? COLORS.verified : COLORS.amber },
                    ]}>
                      {app.resistRate}%
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {/* Empty state */}
      {!isActive && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛡️</Text>
          <Text style={styles.emptyTitle}>Your Doom Scroll Shield</Text>
          <Text style={styles.emptyText}>
            When you try to open a doom scroll app, we'll help you pause and breathe before deciding.
            Set up your Shield in Settings to get started.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Stat Card Component ──────────────────────────────────

function StatCard({ value, label, suffix, color }: {
  value: number;
  label: string;
  suffix?: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>
        {value}{suffix ?? ''}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 100,
  },

  // Status
  statusCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.card,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotActive: {
    backgroundColor: COLORS.verified,
  },
  statusDotInactive: {
    backgroundColor: COLORS.textMuted,
  },
  statusLabel: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  statusSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Section
  sectionTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 32,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Apps
  appsContainer: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 24,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgSurfaceLight,
  },
  appEmoji: {
    fontSize: 24,
    marginRight: 14,
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
  appResistBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.bgSurfaceLight,
    borderRadius: RADIUS.pill,
  },
  appResistText: {
    fontFamily: FONTS.monoBold,
    fontSize: 13,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
