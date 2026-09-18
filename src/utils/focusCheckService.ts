import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────

export interface FocusCheckResult {
  testNumber: number;           // 1-23 (checks over 90 days)
  dayNumber: number;            // which day of the 90
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: string;            // links to Session record
  dawgScore: number;
  stillnessScore: number;
  blinkScore: number;
  blinksPerMinute: number;
  stillnessPercent: number;
  date: string;                 // YYYY-MM-DD
  timestamp: number;
}

export interface FocusCheckSchedule {
  nextCheckDay: number;
  lastCheckDay: number;
  lastCheckDate: string | null;
  totalCompleted: number;
}

export interface FocusCheckComparison {
  current: FocusCheckResult;
  previous: FocusCheckResult | null;
  baseline: { dawgScore: number; blinksPerMinute: number; stillnessPercent: number } | null;
  dawgScoreDelta: number | null;       // vs previous
  baselineDelta: number | null;        // vs baseline
  blinkDelta: number | null;           // vs previous
  stillnessDelta: number | null;       // vs previous
}

// ─── Constants ────────────────────────────────────────────

const STORAGE_KEY = 'dawg_focus_checks';
const CHECK_INTERVAL = 4; // days between checks

// Focus Check durations by difficulty (seconds)
export const FOCUS_CHECK_DURATIONS = {
  easy: 180,    // 3 minutes
  medium: 300,  // 5 minutes
  hard: 600,    // 10 minutes
} as const;

// Days when Focus Checks are scheduled (every 4 days starting at day 1)
export function getFocusCheckDays(): number[] {
  const days: number[] = [];
  for (let d = 1; d <= 90; d += CHECK_INTERVAL) {
    days.push(d);
  }
  return days; // [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89]
}

// ─── Storage ──────────────────────────────────────────────

async function getAllResults(): Promise<FocusCheckResult[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveAllResults(results: FocusCheckResult[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // Silently fail
  }
}

// ─── Public API ───────────────────────────────────────────

export async function saveFocusCheckResult(result: FocusCheckResult): Promise<void> {
  const all = await getAllResults();
  all.push(result);
  await saveAllResults(all);
}

export async function getFocusCheckResults(): Promise<FocusCheckResult[]> {
  const all = await getAllResults();
  return all.sort((a, b) => a.testNumber - b.testNumber);
}

export async function getFocusCheckSchedule(currentDay: number): Promise<FocusCheckSchedule> {
  const all = await getAllResults();
  const checkDays = getFocusCheckDays();

  const completedDays = new Set(all.map((r) => r.dayNumber));
  const lastCompleted = all.length > 0
    ? all.reduce((max, r) => r.dayNumber > max.dayNumber ? r : max)
    : null;

  // Next check day = first scheduled day >= currentDay that hasn't been completed
  const nextCheckDay = checkDays.find((d) => d >= currentDay && !completedDays.has(d))
    ?? checkDays[checkDays.length - 1];

  return {
    nextCheckDay,
    lastCheckDay: lastCompleted?.dayNumber ?? 0,
    lastCheckDate: lastCompleted?.date ?? null,
    totalCompleted: all.length,
  };
}

export async function isFocusCheckDue(currentDay: number): Promise<boolean> {
  const schedule = await getFocusCheckSchedule(currentDay);
  return currentDay >= schedule.nextCheckDay;
}

export async function getNextCheckTestNumber(): Promise<number> {
  const all = await getAllResults();
  return all.length + 1;
}

export async function getLatestComparison(
  currentResult: FocusCheckResult,
  baseline?: { dawgScore: number; blinksPerMinute: number; stillnessPercent: number } | null
): Promise<FocusCheckComparison> {
  const all = await getAllResults();
  // Previous is the second-to-last result (before the one just saved)
  const previousResults = all.filter((r) => r.testNumber < currentResult.testNumber);
  const previous = previousResults.length > 0
    ? previousResults[previousResults.length - 1]
    : null;

  return {
    current: currentResult,
    previous,
    baseline: baseline ?? null,
    dawgScoreDelta: previous ? currentResult.dawgScore - previous.dawgScore : null,
    baselineDelta: baseline ? currentResult.dawgScore - baseline.dawgScore : null,
    blinkDelta: previous ? previous.blinksPerMinute - currentResult.blinksPerMinute : null, // positive = improvement
    stillnessDelta: previous ? currentResult.stillnessPercent - previous.stillnessPercent : null,
  };
}

/**
 * Get the average dawgScore trend across the last N Focus Checks vs baseline.
 * Returns 0-100 sub-score for the Brain Recovery formula.
 */
export async function getFocusCheckTrendScore(
  baselineDawgScore: number
): Promise<number> {
  const all = await getAllResults();
  if (all.length === 0) return 50; // neutral

  // Average of last 3 checks
  const recent = all.slice(-3);
  const avgScore = recent.reduce((s, r) => s + r.dawgScore, 0) / recent.length;

  // Improvement from baseline (0 = no change, 100 = doubled score)
  if (baselineDawgScore <= 0) return 50;
  const improvement = ((avgScore - baselineDawgScore) / baselineDawgScore) * 100;

  // Map improvement to 0-100 scale: -50% improvement -> 0, 0% -> 50, +50% -> 100
  return Math.max(0, Math.min(100, 50 + improvement));
}
