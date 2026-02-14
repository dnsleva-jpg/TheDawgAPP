import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '../types';

const START_DATE_KEY = 'rawdawg_start_date';

// ─── Start Date ───────────────────────────────────────────

export async function getStartDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(START_DATE_KEY);
  } catch {
    return null;
  }
}

export async function setStartDate(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(START_DATE_KEY, date);
  } catch {
    // Silently fail
  }
}

/**
 * Ensure a start date exists. If not, use earliest session date.
 */
export async function ensureStartDate(sessions: Session[]): Promise<string> {
  const existing = await getStartDate();
  if (existing) return existing;

  // Find earliest session date
  const dates = sessions
    .filter((s) => s.completed && s.date)
    .map((s) => s.date)
    .sort();
  const earliest = dates[0] || new Date().toISOString().split('T')[0];
  await setStartDate(earliest);
  return earliest;
}

// ─── Rewire Day ───────────────────────────────────────────

/**
 * Count unique calendar days with at least one completed session since start date.
 */
export function getRewireDay(sessions: Session[], startDate: string): number {
  const uniqueDays = new Set<string>();
  for (const s of sessions) {
    if (s.completed && s.date && s.date >= startDate) {
      uniqueDays.add(s.date);
    }
  }
  return uniqueDays.size;
}

// ─── Trends ───────────────────────────────────────────────

export interface TrendItem {
  label: string;
  current: number;
  previous: number;
  change: number; // percentage change
  improving: boolean;
}

export interface TrendData {
  stillness: TrendItem;
  focus: TrendItem;
  endurance: TrendItem;
  hasEnoughData: boolean;
}

/**
 * Compare avg of last 7 scored sessions vs previous 7.
 */
export function computeTrends(sessions: Session[]): TrendData {
  const scored = sessions
    .filter((s) => s.rawDawgScore != null && s.stillnessPercent != null)
    .sort((a, b) => b.timestamp - a.timestamp);

  const hasEnoughData = scored.length >= 14;
  const recent = scored.slice(0, 7);
  const previous = scored.slice(7, 14);

  const avg = (arr: Session[], fn: (s: Session) => number) =>
    arr.length > 0 ? arr.reduce((sum, s) => sum + fn(s), 0) / arr.length : 0;

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

  const recentStillness = avg(recent, (s) => s.stillnessPercent ?? 0);
  const prevStillness = avg(previous, (s) => s.stillnessPercent ?? 0);

  const recentBpm = avg(recent, (s) => s.blinksPerMinute ?? 17);
  const prevBpm = avg(previous, (s) => s.blinksPerMinute ?? 17);

  const recentDuration = avg(recent, (s) => s.duration);
  const prevDuration = avg(previous, (s) => s.duration);

  return {
    stillness: {
      label: 'STILLNESS',
      current: recentStillness,
      previous: prevStillness,
      change: pctChange(recentStillness, prevStillness),
      improving: recentStillness >= prevStillness,
    },
    focus: {
      label: 'FOCUS',
      current: recentBpm,
      previous: prevBpm,
      change: pctChange(prevBpm, recentBpm), // Lower blinks = better focus
      improving: recentBpm <= prevBpm,
    },
    endurance: {
      label: 'ENDURANCE',
      current: recentDuration,
      previous: prevDuration,
      change: pctChange(recentDuration, prevDuration),
      improving: recentDuration >= prevDuration,
    },
    hasEnoughData,
  };
}

// ─── Brain vs Average ─────────────────────────────────────

export interface ComparisonItem {
  label: string;
  userValue: number;
  baseline: number;
  percentile: number; // e.g. "better than X%"
  description: string;
}

export interface BrainComparison {
  stillness: ComparisonItem;
  focus: ComparisonItem;
  endurance: ComparisonItem;
  hasData: boolean;
}

const BASELINES = { stillness: 75, blinksPerMin: 17, durationSec: 300 };

export function computeBrainVsAverage(sessions: Session[]): BrainComparison {
  const scored = sessions.filter(
    (s) => s.rawDawgScore != null && s.stillnessPercent != null
  );
  const hasData = scored.length > 0;

  const avgStillness =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + (s.stillnessPercent ?? 0), 0) / scored.length
      : 0;
  const avgBpm =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + (s.blinksPerMinute ?? 17), 0) / scored.length
      : 17;
  const avgDuration =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + s.duration, 0) / scored.length
      : 0;

  const stillPct = Math.min(99, Math.max(1, Math.round((avgStillness / BASELINES.stillness) * 50 + 25)));
  const focusPct = Math.min(99, Math.max(1, Math.round(((BASELINES.blinksPerMin - avgBpm) / BASELINES.blinksPerMin) * 50 + 50)));
  const endPct = Math.min(99, Math.max(1, Math.round((avgDuration / BASELINES.durationSec) * 50 + 10)));

  const focusDesc =
    avgBpm <= BASELINES.blinksPerMin
      ? `Your focus is ${Math.abs(focusPct - 50)}% deeper than the average person`
      : 'Keep going — your focus is still building';

  return {
    stillness: {
      label: 'STILLNESS',
      userValue: avgStillness,
      baseline: BASELINES.stillness,
      percentile: stillPct,
      description: `You're stiller than ${stillPct}% of people who try this`,
    },
    focus: {
      label: 'FOCUS',
      userValue: avgBpm,
      baseline: BASELINES.blinksPerMin,
      percentile: focusPct,
      description: focusDesc,
    },
    endurance: {
      label: 'ENDURANCE',
      userValue: avgDuration,
      baseline: BASELINES.durationSec,
      percentile: endPct,
      description: `You sit ${endPct}% longer than most people can handle`,
    },
    hasData,
  };
}

// ─── Timeline ─────────────────────────────────────────────

export type DayStatus = 'completed' | 'current' | 'currentCompleted' | 'missed' | 'future';

export interface TimelineDayStatus {
  dayNumber: number; // 1-90
  date: string; // YYYY-MM-DD
  status: DayStatus;
}

/**
 * How many calendar days since startDate (1-based, capped at 90).
 */
export function getCalendarDayNumber(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(90, Math.max(1, diff + 1));
}

/**
 * Build an array of 90 day statuses for the timeline.
 * Each entry describes whether the user completed, missed, is currently on, or hasn't reached that day.
 */
export function getTimelineDayStatuses(
  sessions: Session[],
  startDate: string
): TimelineDayStatus[] {
  const today = getTodayDateString();
  const calendarDay = getCalendarDayNumber(startDate);

  // Build a set of dates that have at least one completed session
  const sessionDates = new Set<string>();
  for (const s of sessions) {
    if (s.completed && s.date) sessionDates.add(s.date);
  }

  const result: TimelineDayStatus[] = [];
  const startMs = new Date(startDate + 'T00:00:00').getTime();

  for (let i = 0; i < 90; i++) {
    const dayNumber = i + 1;
    const dateMs = startMs + i * 24 * 60 * 60 * 1000;
    const d = new Date(dateMs);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let status: DayStatus;
    if (dateStr === today) {
      status = sessionDates.has(dateStr) ? 'currentCompleted' : 'current';
    } else if (dayNumber < calendarDay) {
      status = sessionDates.has(dateStr) ? 'completed' : 'missed';
    } else {
      status = 'future';
    }

    result.push({ dayNumber, date: dateStr, status });
  }

  return result;
}

// ─── Milestone Celebrations ───────────────────────────────

const CELEBRATED_KEY = 'rawdawg_celebrated_milestones';

export async function getCelebratedMilestones(): Promise<number[]> {
  try {
    const data = await AsyncStorage.getItem(CELEBRATED_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // fall through
  }
  return [];
}

export async function setCelebratedMilestone(day: number): Promise<void> {
  try {
    const current = await getCelebratedMilestones();
    if (!current.includes(day)) {
      current.push(day);
      await AsyncStorage.setItem(CELEBRATED_KEY, JSON.stringify(current));
    }
  } catch {
    // Silently fail
  }
}

// ─── Helpers ──────────────────────────────────────────────

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTodaysSessions(sessions: Session[]): Session[] {
  const today = getTodayDateString();
  return sessions.filter((s) => s.date === today && s.completed);
}

export function getTodayTotalDuration(sessions: Session[]): number {
  return getTodaysSessions(sessions).reduce((sum, s) => sum + s.duration, 0);
}
