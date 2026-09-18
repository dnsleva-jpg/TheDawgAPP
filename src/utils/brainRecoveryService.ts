import { getSessions } from './storage';
import { getStartDate, getCalendarDayNumber, getCompletedDailyChallenges } from './rewireManager';
import { getStreakData } from './streakManager';
import { getOnboardingData } from '../onboarding/onboardingStorage';
import { getFocusCheckTrendScore } from './focusCheckService';
import { getFocusScoreAverage } from './focusScoreService';
import { getShieldStats } from './shieldService';
import type { Session } from '../types';

interface BrainRecoveryResult {
  score: number;                    // 0-100 composite
  focusScoreTrend: number;          // 0-100 sub-score (30% weight)
  challengeConsistency: number;     // 0-100 sub-score (25% weight)
  focusCheckTrend: number;          // 0-100 sub-score (20% weight)
  shieldResistance: number;         // 0-100 sub-score (15% weight)
  streakBonus: number;              // 0-100 sub-score (10% weight)
  dayNumber: number;
}

interface DailyBrainRecovery {
  dayNumber: number;
  date: string;
  score: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get scored sessions from the last N days.
 */
function getRecentScoredSessions(sessions: Session[], days: number): Session[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return sessions.filter(
    (s) => s.completed && s.dawgScore !== undefined && s.timestamp >= cutoff
  );
}

/**
 * Calculate 7-day average of a numeric session field.
 */
function avg7d(sessions: Session[], field: (s: Session) => number | undefined): number {
  const recent = getRecentScoredSessions(sessions, 7);
  if (recent.length === 0) return 0;
  const values = recent.map(field).filter((v): v is number => v !== undefined);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate the Brain Recovery Score.
 *
 * V2 Formula:
 *   Focus Score Trend 30% + Challenge Consistency 25% +
 *   Focus Check Trend 20% + Shield Resistance 15% + Streak Bonus 10%
 */
export async function getBrainRecoveryScore(): Promise<BrainRecoveryResult> {
  const [sessions, onboarding, startDateStr, manualChallenges, streakData, focusScoreAvg, shieldStats] = await Promise.all([
    getSessions(),
    getOnboardingData(),
    getStartDate(),
    getCompletedDailyChallenges(),
    getStreakData(),
    getFocusScoreAverage(7),
    getShieldStats(),
  ]);

  const dayNumber = startDateStr ? getCalendarDayNumber(startDateStr) : 1;
  const baselineDawgScore = onboarding.baselineScore ?? 50;
  const daysElapsed = Math.max(1, dayNumber);

  // ─── 1. Focus Score Trend (30%) ─────────────────────────
  // 7-day rolling average of daily Focus Score check-ins (0-100)
  const focusScoreTrend = focusScoreAvg ?? 50; // neutral if no check-ins yet

  // ─── 2. Challenge Consistency (25%) ─────────────────────
  const sessionDatesWithChallenge = new Set<string>();
  for (const s of sessions) {
    if (s.completed && s.date) {
      sessionDatesWithChallenge.add(s.date);
    }
  }
  const totalCompletedDays = new Set([
    ...Array.from(sessionDatesWithChallenge),
    ...manualChallenges.map(String),
  ]).size;
  const challengeConsistency = clamp((totalCompletedDays / daysElapsed) * 100, 0, 100);

  // ─── 3. Focus Check Trend (20%) ────────────────────────
  // Improvement in Focus Check dawgScores over time vs baseline
  const focusCheckTrend = await getFocusCheckTrendScore(baselineDawgScore);

  // ─── 4. Shield Resistance (15%) ────────────────────────
  // Doom scroll resist rate (resisted / total interceptions)
  const shieldResistance = shieldStats.totalInterceptions > 0
    ? clamp(shieldStats.resistRate, 0, 100)
    : 50; // neutral if no interceptions

  // ─── 5. Streak Bonus (10%) ─────────────────────────────
  const currentStreak = streakData.currentStreak;
  const streakBonus = clamp((currentStreak / Math.max(1, daysElapsed)) * 100, 0, 100);

  // ─── Composite Score ────────────────────────────────────
  const score = clamp(
    Math.round(
      focusScoreTrend * 0.30 +
      challengeConsistency * 0.25 +
      focusCheckTrend * 0.20 +
      shieldResistance * 0.15 +
      streakBonus * 0.10
    ),
    0,
    100
  );

  return {
    score,
    focusScoreTrend: Math.round(focusScoreTrend),
    challengeConsistency: Math.round(challengeConsistency),
    focusCheckTrend: Math.round(focusCheckTrend),
    shieldResistance: Math.round(shieldResistance),
    streakBonus: Math.round(streakBonus),
    dayNumber,
  };
}

/**
 * Get daily Brain Recovery scores for charting.
 * Returns one entry per day the user had at least one session.
 */
export async function getBrainRecoveryTrend(): Promise<DailyBrainRecovery[]> {
  const [sessions, onboarding, startDateStr, manualChallenges, streakData] = await Promise.all([
    getSessions(),
    getOnboardingData(),
    getStartDate(),
    getCompletedDailyChallenges(),
    getStreakData(),
  ]);

  if (!startDateStr) return [];

  const baselineBlinks = onboarding.baselineBlinks ?? 17;
  const baselineStillness = onboarding.baselineStillness ?? 50;
  const scoredSessions = sessions.filter((s) => s.completed && s.dawgScore !== undefined);
  if (scoredSessions.length === 0) return [];

  // Group sessions by date
  const byDate = new Map<string, Session[]>();
  for (const s of scoredSessions) {
    const existing = byDate.get(s.date) || [];
    existing.push(s);
    byDate.set(s.date, existing);
  }

  const totalDays = getCalendarDayNumber(startDateStr);
  const manualSet = new Set(manualChallenges);
  const trend: DailyBrainRecovery[] = [];

  // Compute a running score for each day
  const startDate = new Date(startDateStr + 'T00:00:00');

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d - 1);
    const dateStr = date.toISOString().split('T')[0];

    // Sessions up to this day
    const sessionsToDate = scoredSessions.filter(
      (s) => s.date <= dateStr
    );
    if (sessionsToDate.length === 0) continue;

    // Challenge consistency up to day d
    const sessionDates = new Set(sessionsToDate.map((s) => s.date));
    const challengeDays = new Set([
      ...Array.from(sessionDates),
      ...manualChallenges.filter((mc) => mc <= d).map(String),
    ]).size;
    const cc = clamp((challengeDays / d) * 100, 0, 100);

    // 7-day window blink avg
    const windowStart = new Date(date);
    windowStart.setDate(windowStart.getDate() - 7);
    const windowStr = windowStart.toISOString().split('T')[0];
    const recentSessions = sessionsToDate.filter((s) => s.date > windowStr);

    const blinkVals = recentSessions
      .map((s) => s.blinksPerMinute)
      .filter((v): v is number => v !== undefined);
    const avgBlinks = blinkVals.length > 0
      ? blinkVals.reduce((a, b) => a + b, 0) / blinkVals.length
      : baselineBlinks;
    const blinkDrop = baselineBlinks - avgBlinks;
    const bi = clamp((blinkDrop / Math.max(1, baselineBlinks * 0.5)) * 100, 0, 100);

    const stillVals = recentSessions
      .map((s) => s.stillnessPercent)
      .filter((v): v is number => v !== undefined);
    const avgStill = stillVals.length > 0
      ? stillVals.reduce((a, b) => a + b, 0) / stillVals.length
      : baselineStillness;
    const stillGain = avgStill - baselineStillness;
    const si = clamp(50 + (stillGain / Math.max(1, 100 - baselineStillness)) * 50, 0, 100);

    // Streak bonus approximation (use current streak if last day, else estimate)
    const sb = d === totalDays
      ? clamp((streakData.currentStreak / Math.max(1, d)) * 100, 0, 100)
      : clamp((challengeDays / d) * 100, 0, 100); // approximate

    const score = clamp(Math.round(cc * 0.30 + bi * 0.30 + si * 0.25 + sb * 0.15), 0, 100);

    trend.push({ dayNumber: d, date: dateStr, score });
  }

  return trend;
}
