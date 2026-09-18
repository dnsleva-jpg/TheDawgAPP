import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────

export type LevelName = 'Pup' | 'Scout' | 'Guardian' | 'Sensei' | 'ZenMaster';

export interface PawsLevel {
  name: LevelName;
  label: string;
  emoji: string;
  durationSeconds: number;
  blinkRange: [number, number]; // [min, max] seconds for Paws to blink
  distractions: boolean;
  winsToUnlock: number;
}

export interface BeatPawsSession {
  id: string;
  date: string;
  score: number;
  blinks: number;
  stillnessPercent: number;
  durationSeconds: number;
  won: boolean;
  levelName: LevelName;
  longestStretch: number; // longest seconds without blinking
  timestamp: number;
}

export interface BeatPawsStats {
  totalMatches: number;
  totalWins: number;
  winRate: number;
  bestScore: number;
  currentLevel: LevelName;
  winsAtCurrentLevel: number;
  streak: number;
  longestStreak: number;
  baselineScore: number | null;
}

// ─── Levels ──────────────────────────────────────────────

export const LEVELS: PawsLevel[] = [
  { name: 'Pup', label: 'Pup', emoji: '🥉', durationSeconds: 20, blinkRange: [12, 18], distractions: false, winsToUnlock: 0 },
  { name: 'Scout', label: 'Scout', emoji: '🥈', durationSeconds: 30, blinkRange: [18, 25], distractions: false, winsToUnlock: 5 },
  { name: 'Guardian', label: 'Guardian', emoji: '🥇', durationSeconds: 45, blinkRange: [25, 35], distractions: true, winsToUnlock: 5 },
  { name: 'Sensei', label: 'Sensei', emoji: '💎', durationSeconds: 60, blinkRange: [35, 50], distractions: true, winsToUnlock: 5 },
  { name: 'ZenMaster', label: 'Zen Master', emoji: '👑', durationSeconds: 90, blinkRange: [999, 999], distractions: true, winsToUnlock: 5 },
];

// ─── Storage Keys ────────────────────────────────────────

const SESSIONS_KEY = 'dawg_beat_paws_sessions';
const LEVEL_KEY = 'dawg_beat_paws_level';
const WINS_KEY = 'dawg_beat_paws_wins_at_level';
const STREAK_KEY = 'dawg_beat_paws_streak';
const LONGEST_STREAK_KEY = 'dawg_beat_paws_longest_streak';
const BASELINE_KEY = 'dawg_beat_paws_baseline';

// ─── Helpers ─────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Level Management ────────────────────────────────────

export async function getCurrentLevel(): Promise<PawsLevel> {
  try {
    const name = await AsyncStorage.getItem(LEVEL_KEY);
    const level = LEVELS.find((l) => l.name === name);
    return level ?? LEVELS[0];
  } catch {
    return LEVELS[0];
  }
}

export async function getWinsAtCurrentLevel(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(WINS_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function checkLevelUp(): Promise<PawsLevel | null> {
  const current = await getCurrentLevel();
  const wins = await getWinsAtCurrentLevel();
  const currentIdx = LEVELS.findIndex((l) => l.name === current.name);
  const nextLevel = LEVELS[currentIdx + 1];

  if (nextLevel && wins >= nextLevel.winsToUnlock) {
    await AsyncStorage.setItem(LEVEL_KEY, nextLevel.name);
    await AsyncStorage.setItem(WINS_KEY, '0');
    return nextLevel;
  }
  return null;
}

/**
 * Generate Paws's blink time for this match.
 * Returns seconds into the match when Paws will blink.
 * ZenMaster: Paws never blinks (returns Infinity).
 */
export function generatePawsBlinkTime(level: PawsLevel): number {
  if (level.name === 'ZenMaster') return Infinity;
  return randomInRange(level.blinkRange[0], level.blinkRange[1]);
}

// ─── Session Management ──────────────────────────────────

export async function saveBeatPawsSession(session: BeatPawsSession): Promise<void> {
  try {
    const all = await getBeatPawsHistory();
    all.push(session);
    // Keep last 500
    const trimmed = all.slice(-500);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));

    // Update wins at current level
    if (session.won) {
      const wins = await getWinsAtCurrentLevel();
      await AsyncStorage.setItem(WINS_KEY, String(wins + 1));
    }

    // Update streak
    await updateStreak();
  } catch {}
}

export async function getBeatPawsHistory(): Promise<BeatPawsSession[]> {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getTodaysBestScore(): Promise<number> {
  const today = getToday();
  const all = await getBeatPawsHistory();
  const todaySessions = all.filter((s) => s.date === today);
  if (todaySessions.length === 0) return 0;
  return Math.max(...todaySessions.map((s) => s.score));
}

export async function getTodaysMatches(): Promise<BeatPawsSession[]> {
  const today = getToday();
  const all = await getBeatPawsHistory();
  return all.filter((s) => s.date === today);
}

// ─── Baseline ────────────────────────────────────────────

export async function setBaselineScore(score: number): Promise<void> {
  await AsyncStorage.setItem(BASELINE_KEY, String(score));
}

export async function getBaselineScore(): Promise<number | null> {
  try {
    const val = await AsyncStorage.getItem(BASELINE_KEY);
    return val ? parseFloat(val) : null;
  } catch {
    return null;
  }
}

// ─── Streak ──────────────────────────────────────────────

async function updateStreak(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    const streakData = data ? JSON.parse(data) : { count: 0, lastDate: null };
    const today = getToday();

    if (streakData.lastDate === today) return; // Already counted today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streakData.lastDate === yesterdayStr) {
      streakData.count += 1;
    } else if (streakData.lastDate !== today) {
      streakData.count = 1;
    }
    streakData.lastDate = today;

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streakData));

    // Update longest
    const longest = await AsyncStorage.getItem(LONGEST_STREAK_KEY);
    const longestNum = longest ? parseInt(longest, 10) : 0;
    if (streakData.count > longestNum) {
      await AsyncStorage.setItem(LONGEST_STREAK_KEY, String(streakData.count));
    }
  } catch {}
}

export async function getBeatPawsStreak(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    if (!data) return 0;
    const streakData = JSON.parse(data);

    // Check if streak is still valid
    const today = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streakData.lastDate === today || streakData.lastDate === yesterdayStr) {
      return streakData.count;
    }
    return 0; // Streak broken
  } catch {
    return 0;
  }
}

// ─── Score Calculation ───────────────────────────────────

export function calculateBeatPawsScore(
  totalBlinks: number,
  movementEvents: number,
  longestNoBlinkStretch: number,
  streakDays: number,
): number {
  let score = 100;
  score -= totalBlinks * 8;
  score -= movementEvents * 5;
  score += longestNoBlinkStretch * 2;
  score += Math.min(streakDays * 2, 14);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Stats ───────────────────────────────────────────────

export async function getBeatPawsStats(): Promise<BeatPawsStats> {
  const all = await getBeatPawsHistory();
  const level = await getCurrentLevel();
  const winsAtLevel = await getWinsAtCurrentLevel();
  const streak = await getBeatPawsStreak();
  const baseline = await getBaselineScore();
  const longestData = await AsyncStorage.getItem(LONGEST_STREAK_KEY);

  const wins = all.filter((s) => s.won).length;
  const bestScore = all.length > 0 ? Math.max(...all.map((s) => s.score)) : 0;

  return {
    totalMatches: all.length,
    totalWins: wins,
    winRate: all.length > 0 ? Math.round((wins / all.length) * 100) : 0,
    bestScore,
    currentLevel: level.name,
    winsAtCurrentLevel: winsAtLevel,
    streak,
    longestStreak: longestData ? parseInt(longestData, 10) : 0,
    baselineScore: baseline,
  };
}
