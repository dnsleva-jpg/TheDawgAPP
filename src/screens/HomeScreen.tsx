import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../constants/designSystem';
import { getStreakData, StreakData } from '../utils/streakManager';
import { getStartDate, getCalendarDayNumber, setStartDate } from '../utils/rewireManager';
import { getOnboardingData } from '../onboarding/onboardingStorage';
import { getBrainRecoveryScore, getBrainRecoveryTrend } from '../utils/brainRecoveryService';
import { getChallengeForDay, getChallengeVerificationType, getChallengeForDifficulty } from '../data/challenges';
import type { Challenge, VerificationType } from '../data/challenges';
import type { OnboardingData } from '../onboarding/types';
import { isFocusCheckDue } from '../utils/focusCheckService';
import { getShieldStats, type ShieldStats } from '../utils/shieldService';
import { getDailyCheckIn, type DailyCheckIn } from '../utils/focusScoreService';
import { getTodayPickups } from '../utils/pickupService';
import { ShibaMascot } from '../components/ShibaMascot';
import { Ionicons } from '@expo/vector-icons';
import { PermissionBanner } from '../components/PermissionPrompt';
import { getMoodMessage } from '../constants/pawsCopy';
import { getLatestReport, getScreenTimeGoal, type WeeklyReport, type ScreenTimeGoal } from '../utils/screenTimeService';

const GOAL_COPY: Record<string, string> = {
  "I pick up my phone without thinking": "Let's rewire the autopilot.",
  "I can't focus for more than a few minutes": "Let's rebuild that.",
  "I scroll instead of sleeping": "Tonight, put it down.",
  "I've tried app blockers — they don't work": "This time you'll have proof.",
  "I waste hours every day and feel guilty": "Take the hours back.",
  "I want to prove I can control my attention": "Prove it.",
  "I'm into the science and want a real program": "Let's measure everything.",
};

const CATEGORY_EMOJI: Record<string, string> = {
  dopamine_reset: '🧠',
  attention_restoration: '🎯',
  prefrontal: '💡',
  social: '👥',
  sleep_circadian: '🌙',
  boredom_tolerance: '🧘',
  creative_flow: '🎨',
};

interface ChallengeStartParams {
  verificationType: VerificationType;
  title: string;
  description: string;
  duration: string;
  timerSeconds?: number;
  minCharacters?: number;
  dayNumber: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completionPrompt: string;
}

// ─── Focus Score Hero Ring ────────────────────────────────

const SHIBA_IMG = require('../../assets/shiba/shiba-thriving.png');

function FocusScoreRing({ score, grade, onPress, yesterdayScore }: {
  score: number;
  grade: string;
  onPress?: () => void;
  yesterdayScore?: number | null;
}) {
  const size = 180;
  const stroke = 10;
  const pct = Math.min(score / 100, 1);

  // Animated fill
  const fillAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Pulse glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    ).start();
  }, [pct, fillAnim, glowAnim]);

  const ringColor = score >= 80 ? '#2ECC71' : score >= 60 ? '#D4820A' : score >= 40 ? '#E67E22' : '#E74C3C';
  const delta = yesterdayScore != null ? score - yesterdayScore : null;

  // Animated rotation for the fill ring
  const rotation = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={ringStyles.container}
    >
      {/* Glow shadow */}
      <Animated.View style={[ringStyles.glow, {
        backgroundColor: ringColor,
        opacity: glowAnim,
      }]} />

      {/* Track ring */}
      <View style={[ringStyles.ring, { width: size, height: size, borderRadius: size / 2, borderWidth: stroke }]}>
        {/* Animated fill — 4 quadrant layers */}
        <AnimatedRingFill size={size} stroke={stroke} color={ringColor} fillAnim={fillAnim} />

        {/* Shiba inside */}
        <Image
          source={SHIBA_IMG}
          style={ringStyles.shiba}
          resizeMode="contain"
        />
      </View>

      {/* Score below ring */}
      <View style={ringStyles.scoreRow}>
        <Text style={[ringStyles.scoreNumber, { color: ringColor }]}>{score}</Text>
        <Text style={ringStyles.scoreGrade}>{grade}</Text>
      </View>

      {/* Delta chip */}
      {delta != null && delta !== 0 && (
        <View style={[ringStyles.deltaChip, { borderColor: delta > 0 ? '#2ECC71' + '44' : '#E74C3C' + '44' }]}>
          <Text style={[ringStyles.deltaText, { color: delta > 0 ? '#2ECC71' : '#E74C3C' }]}>
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta)} from yesterday
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Animated ring fill using 4 rotating half-circles
function AnimatedRingFill({ size, stroke, color, fillAnim }: {
  size: number; stroke: number; color: string; fillAnim: Animated.Value;
}) {
  // We use 4 quadrant borders that show/hide based on fill progress
  const topColor = fillAnim.interpolate({
    inputRange: [0, 0.01, 1],
    outputRange: ['transparent', color, color],
    extrapolate: 'clamp',
  });
  const rightColor = fillAnim.interpolate({
    inputRange: [0, 0.25, 0.26, 1],
    outputRange: ['transparent', 'transparent', color, color],
    extrapolate: 'clamp',
  });
  const bottomColor = fillAnim.interpolate({
    inputRange: [0, 0.5, 0.51, 1],
    outputRange: ['transparent', 'transparent', color, color],
    extrapolate: 'clamp',
  });
  const leftColor = fillAnim.interpolate({
    inputRange: [0, 0.75, 0.76, 1],
    outputRange: ['transparent', 'transparent', color, color],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={{
      position: 'absolute',
      top: -stroke,
      left: -stroke,
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: stroke,
      borderTopColor: topColor,
      borderRightColor: rightColor,
      borderBottomColor: bottomColor,
      borderLeftColor: leftColor,
      transform: [{ rotate: '-90deg' }],
    }} />
  );
}

const ringStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: 28,
  },
  ring: {
    borderColor: '#EDE9E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiba: {
    width: 90,
    height: 90,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 8,
  },
  scoreNumber: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 42,
  },
  scoreGrade: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: '#8A7A60',
  },
  deltaChip: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  deltaText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
  },
});

interface HomeScreenProps {
  onStartSession: (durationSeconds: number) => void;
  onStartWalkMode?: (durationMinutes: number) => void;
  onStartChallenge?: (params: ChallengeStartParams) => void;
  onStartSmallWin?: () => void;
  onStartFocusCheck?: () => void;
  isPro?: boolean;
  onPaywall?: (feature?: string) => void;
}

export function HomeScreen({ onStartSession, onStartWalkMode, onStartChallenge, onStartSmallWin, onStartFocusCheck, isPro = false, onPaywall }: HomeScreenProps) {
  const [selectedDuration] = useState(300); // default 5 min
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, lastSessionDate: null, longestStreak: 0 });
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [brainRecovery, setBrainRecovery] = useState<number>(0);
  const [prevWeekRecovery, setPrevWeekRecovery] = useState<number>(0);
  const [todayChallenge, setTodayChallenge] = useState<Challenge | undefined>(undefined);
  const [dayNumber, setDayNumber] = useState(1);
  const [focusCheckDue, setFocusCheckDue] = useState(false);
  const [shieldStats, setShieldStats] = useState<ShieldStats | null>(null);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [todayPickups, setTodayPickups] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [screenTimeReport, setScreenTimeReport] = useState<WeeklyReport | null>(null);
  const [screenTimeGoal, setScreenTimeGoalState] = useState<ScreenTimeGoal | null>(null);

  const personalizedSubtitle = onboardingData.userGoal
    ? (GOAL_COPY[onboardingData.userGoal] || 'Own Your Attention')
    : 'Own Your Attention';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [ob, streak, recovery, startDate, shield, checkIn, trend, pickups, stReport, stGoal] = await Promise.all([
        getOnboardingData(),
        getStreakData(),
        getBrainRecoveryScore(),
        getStartDate(),
        getShieldStats(),
        getDailyCheckIn(today),
        getBrainRecoveryTrend(),
        getTodayPickups(),
        getLatestReport(),
        getScreenTimeGoal(),
      ]);
      setOnboardingData(ob);
      setStreakData(streak);
      setBrainRecovery(recovery.score);
      setTodayPickups(pickups);
      setScreenTimeReport(stReport);
      setScreenTimeGoalState(stGoal);

      // Compute previous week's recovery for trend arrow
      if (trend.length >= 7) {
        const weekAgoScore = trend[Math.max(0, trend.length - 7)]?.score ?? 0;
        setPrevWeekRecovery(weekAgoScore);
      }
      setShieldStats(shield);
      setTodayCheckIn(checkIn);
      setSelectedDifficulty('medium'); // Reset difficulty on data reload

      if (!startDate) {
        await setStartDate(today);
        setDayNumber(1);
        setTodayChallenge(getChallengeForDay(1));
        setFocusCheckDue(await isFocusCheckDue(1));
      } else {
        const dn = getCalendarDayNumber(startDate);
        setDayNumber(dn);
        setTodayChallenge(getChallengeForDay(dn));
        setFocusCheckDue(await isFocusCheckDue(dn));
      }
    } catch {}
  };

  const recoveryDelta = brainRecovery - prevWeekRecovery;
  const trendArrow = recoveryDelta > 0 ? '↑' : recoveryDelta < 0 ? '↓' : '—';
  const trendColor = recoveryDelta > 0 ? DS_COLORS.verified : recoveryDelta < 0 ? '#E74C3C' : DS_COLORS.textMuted;

  const focusScore = todayCheckIn?.focusScore ?? 0;
  const focusGrade = todayCheckIn?.grade ?? '—';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ─── Header ─── */}
        <Text style={styles.title} accessibilityRole="header">DO NOTHIN.</Text>
        <Text style={styles.subtitle}>{personalizedSubtitle}</Text>

        {/* ─── Focus Score Hero (Shiba + Ring + Score) ─── */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>FOCUS SCORE</Text>
          <FocusScoreRing
            score={focusScore}
            grade={focusGrade}
            yesterdayScore={null}
            onPress={() => setShowBreakdown(true)}
          />
        </View>

        {/* ─── Stat Cards Row ─── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={18} color={DS_COLORS.accent} />
            <Text style={styles.statValue}>{streakData.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="phone-portrait-outline" size={18} color={DS_COLORS.accent} />
            <Text style={styles.statValue}>{todayPickups}</Text>
            <Text style={styles.statLabel}>Pickups</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={18} color={DS_COLORS.accent} />
            <Text style={styles.statValue}>{brainRecovery}%</Text>
            <Text style={styles.statLabel}>Recovery</Text>
          </View>
        </View>

        {/* ─── Focus Check Banner ─── */}
        {focusCheckDue && (
          <TouchableOpacity
            style={styles.focusCheckBanner}
            onPress={() => onStartFocusCheck?.()}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={20} color={DS_COLORS.accent} />
            <View style={styles.focusCheckText}>
              <Text style={styles.focusCheckTitle}>Focus Check Ready</Text>
              <Text style={styles.focusCheckSub}>See how your focus has changed</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS_COLORS.textMuted} />
          </TouchableOpacity>
        )}

        {/* ─── Daily Challenge Card ─── */}
        {todayChallenge && (
          <View style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeDay}>DAY {dayNumber}</Text>
              <View style={styles.difficultyDots}>
                {[1, 2, 3, 4, 5].map((d) => (
                  <View
                    key={d}
                    style={[
                      styles.difficultyDot,
                      d <= todayChallenge.difficulty && styles.difficultyDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.challengeBody}>
              <Text style={styles.challengeEmoji}>
                {CATEGORY_EMOJI[todayChallenge.category] || '🧠'}
              </Text>
              <View style={styles.challengeText}>
                <Text style={styles.challengeTitle}>{todayChallenge.title}</Text>
                <Text style={styles.challengeDuration}>
                  {getChallengeForDifficulty(todayChallenge, selectedDifficulty).duration}
                </Text>
              </View>
            </View>

            {/* Difficulty Tier Selector */}
            <View style={styles.tierRow}>
              {(['easy', 'medium', 'hard'] as const).map((tier) => (
                <TouchableOpacity
                  key={tier}
                  style={[
                    styles.tierButton,
                    selectedDifficulty === tier && styles.tierButtonActive,
                    !isPro && tier !== 'easy' && styles.tierButtonLocked,
                  ]}
                  onPress={() => {
                    if (!isPro && tier !== 'easy') {
                      onPaywall?.('medium_hard_difficulty');
                    } else {
                      setSelectedDifficulty(tier);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tierIcon}>
                    {!isPro && tier !== 'easy' ? '🔒' : tier === 'easy' ? '🟢' : tier === 'medium' ? '🟡' : '🔴'}
                  </Text>
                  <Text style={[
                    styles.tierLabel,
                    selectedDifficulty === tier && styles.tierLabelActive,
                  ]}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.challengeCta}
              onPress={() => {
                const vType = getChallengeVerificationType(todayChallenge);
                const tierData = getChallengeForDifficulty(todayChallenge, selectedDifficulty);

                if (onStartChallenge) {
                  onStartChallenge({
                    verificationType: vType,
                    title: todayChallenge.title,
                    description: tierData.description,
                    duration: tierData.duration,
                    timerSeconds: tierData.timerSeconds,
                    minCharacters: tierData.minCharacters,
                    dayNumber,
                    difficulty: selectedDifficulty,
                    completionPrompt: todayChallenge.completionPrompt,
                  });
                } else {
                  onStartSession(tierData.timerSeconds ?? selectedDuration);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.challengeCtaText}>START CHALLENGE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallWinButton}
              onPress={() => onStartSmallWin?.()}
              activeOpacity={0.7}
            >
              <Text style={styles.smallWinText}>Not today — Small Win</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ─── Score Breakdown Modal ─── */}
      {showBreakdown && (
        <View style={breakdownStyles.overlay}>
          <TouchableOpacity
            style={breakdownStyles.backdrop}
            activeOpacity={1}
            onPress={() => setShowBreakdown(false)}
          />
          <View style={breakdownStyles.sheet}>
            <View style={breakdownStyles.handle} />
            <Text style={breakdownStyles.sheetTitle}>How is your score calculated?</Text>

            {dayNumber < 7 ? (
              <>
                {/* Calibration state — like Whoop's "need more data" */}
                <Text style={breakdownStyles.sheetSub}>
                  We need 7 days of check-ins and at least 1 Focus Test to calculate an accurate score. Right now we're estimating based on what we have.
                </Text>
                <View style={breakdownStyles.calibrationBar}>
                  <View style={breakdownStyles.calibrationTrack}>
                    <View style={[breakdownStyles.calibrationFill, { width: `${Math.round((dayNumber / 7) * 100)}%` }]} />
                  </View>
                  <Text style={breakdownStyles.calibrationText}>
                    Day {dayNumber} of 7 — Calibrating
                  </Text>
                </View>
              </>
            ) : (
              <Text style={breakdownStyles.sheetSub}>
                Your Focus Score is calculated from 4 daily inputs. Complete all to maximize accuracy.
              </Text>
            )}

            <View style={breakdownStyles.table}>
              <BreakdownRow
                label="Focus Check-In"
                detail="5 daily questions"
                points={todayCheckIn ? `+${Math.round(todayCheckIn.focusScore * 0.35)}` : '—'}
                weight="35%"
              />
              <BreakdownRow
                label="Screen Time"
                detail={screenTimeReport
                  ? `${screenTimeReport.reportedHours}h / ${screenTimeReport.goalHours}h goal`
                  : screenTimeGoal
                    ? `Goal: ${screenTimeGoal.dailyHoursGoal.toFixed(1)}h/day`
                    : 'Set up in onboarding'}
                points={screenTimeReport
                  ? screenTimeReport.metGoal ? '+25' : `+${Math.max(0, Math.round(25 * (screenTimeReport.goalHours / Math.max(screenTimeReport.reportedHours, 0.1))))}`
                  : '—'}
                weight="25%"
              />
              <BreakdownRow
                label="Challenge"
                detail={todayCheckIn ? 'Completed today' : 'Not yet'}
                points={todayCheckIn ? '+20' : '0'}
                weight="20%"
              />
              <BreakdownRow
                label="Pickups"
                detail={`${todayPickups} today`}
                points={todayPickups < 30 ? '+12' : todayPickups < 60 ? '+6' : '+0'}
                weight="10%"
              />
              <BreakdownRow
                label="Streak"
                detail={`${streakData.currentStreak} days`}
                points={streakData.currentStreak >= 7 ? '+10' : streakData.currentStreak >= 3 ? '+6' : `+${streakData.currentStreak * 2}`}
                weight="10%"
              />
            </View>

            <View style={breakdownStyles.totalRow}>
              <Text style={breakdownStyles.totalLabel}>Total Score</Text>
              <Text style={breakdownStyles.totalValue}>{focusScore} / 100</Text>
            </View>

            <TouchableOpacity
              style={breakdownStyles.closeButton}
              onPress={() => setShowBreakdown(false)}
              activeOpacity={0.8}
            >
              <Text style={breakdownStyles.closeText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function BreakdownRow({ label, detail, points, weight }: {
  label: string; detail: string; points: string; weight: string;
}) {
  return (
    <View style={breakdownStyles.row}>
      <View style={breakdownStyles.rowLeft}>
        <Text style={breakdownStyles.rowLabel}>{label}</Text>
        <Text style={breakdownStyles.rowDetail}>{detail}</Text>
      </View>
      <View style={breakdownStyles.rowRight}>
        <Text style={breakdownStyles.rowPoints}>{points}</Text>
        <Text style={breakdownStyles.rowWeight}>{weight}</Text>
      </View>
    </View>
  );
}

const breakdownStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,18,8,0.4)',
  },
  sheet: {
    backgroundColor: '#F7F4EE',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0D8CC',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    color: '#1C1208',
    marginBottom: 6,
  },
  sheetSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8A7A60',
    marginBottom: 20,
    lineHeight: 20,
  },
  calibrationBar: {
    marginBottom: 20,
    gap: 8,
  },
  calibrationTrack: {
    height: 8,
    backgroundColor: '#EDE9E0',
    borderRadius: 100,
    overflow: 'hidden',
  },
  calibrationFill: {
    height: '100%',
    backgroundColor: '#D4820A',
    borderRadius: 100,
  },
  calibrationText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    color: '#D4820A',
    textAlign: 'center',
  },
  table: {
    backgroundColor: '#EDE9E0',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8CC',
  },
  rowLeft: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: '#1C1208',
  },
  rowDetail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#B0A090',
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowPoints: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 16,
    color: '#D4820A',
  },
  rowWeight: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#B0A090',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  totalLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#1C1208',
  },
  totalValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 20,
    color: '#D4820A',
  },
  closeButton: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#F7F4EE',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#1C1208',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#8A7A60',
    textAlign: 'center',
    marginBottom: 16,
  },
  // ─── Mascot ───
  mascotContainer: {
    marginBottom: 16,
  },
  // ─── Score Section ───
  scoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#B0A090',
    letterSpacing: 2,
    marginBottom: 4,
  },
  // ─── Stat Cards Row ───
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#EDE9E0',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    color: '#1C1208',
  },
  statLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#8A7A60',
  },
  // ─── Challenge Card ───
  challengeCard: {
    backgroundColor: '#EDE9E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeDay: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    color: '#D4820A',
    letterSpacing: 1.5,
  },
  difficultyDots: {
    flexDirection: 'row',
    gap: 4,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0D8CC',
  },
  difficultyDotActive: {
    backgroundColor: '#D4820A',
  },
  challengeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  challengeEmoji: {
    fontSize: 32,
  },
  challengeText: {
    flex: 1,
  },
  challengeTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 17,
    color: '#1C1208',
    lineHeight: 22,
    marginBottom: 2,
  },
  challengeDuration: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#8A7A60',
  },
  challengeCta: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  challengeCtaText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#F7F4EE',
    letterSpacing: 0.5,
  },
  // ─── Focus Check Banner ───
  focusCheckBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9E0',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4820A',
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  focusCheckText: { flex: 1 },
  focusCheckTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: '#D4820A',
  },
  focusCheckSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#8A7A60',
    marginTop: 2,
  },
  // ─── Difficulty Tiers ───
  tierRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tierButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#E4DDD2',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tierButtonActive: {
    borderColor: '#D4820A',
    backgroundColor: '#EDE9E0',
  },
  tierButtonLocked: {
    opacity: 0.5,
  },
  tierIcon: { fontSize: 12 },
  tierLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    color: '#B0A090',
  },
  tierLabelActive: {
    color: '#D4820A',
  },
  // ─── Small Win ───
  smallWinButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  smallWinText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#B0A090',
  },
  walkButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 106, 0.4)',
  },
  walkButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.coral,
    letterSpacing: 0,
  },
});
