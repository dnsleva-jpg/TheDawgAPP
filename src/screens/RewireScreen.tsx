import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../constants/designSystem';
import { getSessions } from '../utils/storage';
import { getStreakData, StreakData } from '../utils/streakManager';
import {
  ensureStartDate,
  getRewireDay,
  computeTrends,
  computeBrainVsAverage,
} from '../utils/rewireManager';
import { evaluateChallenges } from '../utils/challengeManager';
import type { Session } from '../types';

// Sub-components
import { RewireTimeline } from '../components/rewire/RewireTimeline';
import { TodaysDose } from '../components/rewire/TodaysDose';
import { FocusTrajectory } from '../components/rewire/FocusTrajectory';
import { BrainVsAverage } from '../components/rewire/BrainVsAverage';
import { YourTrends } from '../components/rewire/YourTrends';
import { RewireStreak } from '../components/rewire/RewireStreak';
import { ChallengesSection } from '../components/rewire/ChallengesSection';
import { ScienceCards } from '../components/rewire/ScienceCards';
import { SessionLog } from '../components/rewire/SessionLog';
import { SourcesModal } from '../components/rewire/SourcesModal';

export function RewireScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastSessionDate: null,
    longestStreak: 0,
  });
  const isPro = true; // Pro features unlocked for all users (IAP coming later)
  const [startDate, setStartDateState] = useState<string>('');
  const [showSources, setShowSources] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sess, streak] = await Promise.all([
        getSessions(),
        getStreakData(),
      ]);
      const start = await ensureStartDate(sess);
      setSessions(sess);
      setStreakData(streak);
      setStartDateState(start);
    } catch {
      // Defaults remain
    } finally {
      setLoading(false);
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const openPaywall = useCallback(() => {}, []); // No-op — paywall disabled

  const handleTimelineScrollOffset = useCallback((y: number) => {
    // Center today's node vertically on screen
    const halfScreen = Dimensions.get('window').height / 2;
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - halfScreen), animated: true });
    }, 100);
  }, []);

  // ─── Computed Data ────────────────────────────────────────
  const rewireDay = useMemo(
    () => (startDate ? getRewireDay(sessions, startDate) : 0),
    [sessions, startDate]
  );

  const trends = useMemo(() => computeTrends(sessions), [sessions]);
  const brainComparison = useMemo(() => computeBrainVsAverage(sessions), [sessions]);
  const challenges = useMemo(
    () => evaluateChallenges(sessions, streakData, isPro),
    [sessions, streakData, isPro]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>YOUR REWIRE</Text>
          {rewireDay > 0 && (
            <View style={styles.dayPill}>
              <Text style={styles.dayPillText}>Day {rewireDay}</Text>
            </View>
          )}
        </View>

        {/* ─── 1. Rewire Timeline ──────────────────────────── */}
        <RewireTimeline
          sessions={sessions}
          startDate={startDate}
          onCurrentDayYOffset={handleTimelineScrollOffset}
        />

        {/* ─── 2. Today's Dose ─────────────────────────────── */}
        <TodaysDose sessions={sessions} />

        {/* ─── 3. Focus Trajectory ─────────────────────────── */}
        <FocusTrajectory
          sessions={sessions}
          isPro={isPro}
          onLockPress={openPaywall}
        />

        {/* ─── 4. Brain vs Average ─────────────────────────── */}
        <BrainVsAverage
          data={brainComparison}
          isPro={isPro}
          onLockPress={openPaywall}
        />

        {/* ─── 5. Your Trends ──────────────────────────────── */}
        <YourTrends
          trends={trends}
          isPro={isPro}
          onLockPress={openPaywall}
        />

        {/* ─── 6. Rewire Streak ────────────────────────────── */}
        <RewireStreak
          streakData={streakData}
          sessions={sessions}
          isPro={isPro}
          onLockPress={openPaywall}
        />

        {/* ─── 7. Challenges ───────────────────────────────── */}
        <ChallengesSection
          challenges={challenges}
          isPro={isPro}
          onLockPress={openPaywall}
        />

        {/* ─── 8. The Science ──────────────────────────────── */}
        <ScienceCards />

        {/* ─── 9. Session Log ──────────────────────────────── */}
        <SessionLog
          sessions={sessions}
          isPro={isPro}
          onLockPress={openPaywall}
        />

        {/* ─── 10. View Sources ────────────────────────────── */}
        <View style={styles.sourcesSection}>
          <Text style={styles.sourcesIntro}>
            Based on peer-reviewed neuroscience research
          </Text>
          <TouchableOpacity
            onPress={() => setShowSources(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.sourcesLink}>View Sources</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            For educational purposes only. Not medical advice. Consult a healthcare professional for medical concerns.
          </Text>
        </View>
      </ScrollView>

      {/* ─── Modals ────────────────────────────────────────── */}
      <SourcesModal
        visible={showSources}
        onDismiss={() => setShowSources(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 28,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 3,
    textAlign: 'center',
  },
  dayPill: {
    backgroundColor: DS_COLORS.coral,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  dayPillText: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  // Sources
  sourcesSection: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  sourcesIntro: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    textAlign: 'center',
  },
  sourcesLink: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.coral,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
