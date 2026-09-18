import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '../types';
import type { StreakData } from './streakManager';

const CHALLENGES_KEY = 'dawg_challenges';

// ─── Types ────────────────────────────────────────────────

export interface ChallengeDefinition {
  id: string;
  title: string;
  icon: string;
  description: string;
  target: number;
  isPro: boolean;
  unlockCondition: (ctx: UnlockContext) => boolean;
}

export interface EvaluatedChallenge extends ChallengeDefinition {
  progress: number;
  completed: boolean;
  completedDate?: string;
  unlocked: boolean;
}

interface UnlockContext {
  totalSessions: number;
  challenge1Done: boolean;
  challenge2Done: boolean;
  challenge5Done: boolean;
  isPro: boolean;
}

interface ChallengeState {
  [id: string]: {
    progress: number;
    completed: boolean;
    completedDate?: string;
  };
}

// ─── Challenge Definitions ────────────────────────────────

const CHALLENGE_DEFS: ChallengeDefinition[] = [
  {
    id: 'survive_withdrawal',
    title: 'SURVIVE THE WITHDRAWAL',
    icon: '⚡',
    description: '3 sessions in your first 3 days. Get through the hardest part.',
    target: 3,
    isPro: false,
    unlockCondition: () => true, // Always unlocked
  },
  {
    id: 'four_day_reset',
    title: 'THE FOUR DAY RESET',
    icon: '🔄',
    description: '4 days in a row. 20 minutes each. That\'s when your brain starts to change.',
    target: 4,
    isPro: false,
    unlockCondition: (ctx) => ctx.challenge1Done,
  },
  {
    id: 'blink_master',
    title: 'BLINK MASTER',
    icon: '👁',
    description: 'Hit a focus score above 80 three times. Prove your eyes can stay open.',
    target: 3,
    isPro: false,
    unlockCondition: (ctx) => ctx.totalSessions >= 5,
  },
  {
    id: 'stone_wall',
    title: 'THE STONE WALL',
    icon: '🪨',
    description: 'Stillness above 90 for five sessions. Become unmovable.',
    target: 5,
    isPro: true,
    unlockCondition: (ctx) => ctx.challenge2Done,
  },
  {
    id: 'two_week_rewire',
    title: 'TWO WEEK REWIRE',
    icon: '📅',
    description: '14 days straight. One session minimum. This is where real change happens.',
    target: 14,
    isPro: true,
    unlockCondition: (ctx) => ctx.challenge2Done,
  },
  {
    id: 'ruthless_survivor',
    title: 'RUTHLESS SURVIVOR',
    icon: '💀',
    description: '3 Ruthless Mode sessions completed. No quitting. No escape.',
    target: 3,
    isPro: true,
    unlockCondition: (ctx) => ctx.totalSessions >= 10 && ctx.isPro,
  },
  {
    id: 'full_rewire',
    title: 'THE FULL REWIRE',
    icon: '👑',
    description: '90 days. Every single day. This is the final boss.',
    target: 90,
    isPro: true,
    unlockCondition: (ctx) => ctx.challenge5Done,
  },
];

// ─── Storage ──────────────────────────────────────────────

export async function getChallengeState(): Promise<ChallengeState> {
  try {
    const data = await AsyncStorage.getItem(CHALLENGES_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // fall through
  }
  return {};
}

export async function saveChallengeState(state: ChallengeState): Promise<void> {
  try {
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(state));
  } catch {
    // Silently fail
  }
}

// ─── Evaluation ───────────────────────────────────────────

function computeProgress(
  def: ChallengeDefinition,
  sessions: Session[],
  streakData: StreakData
): number {
  const scored = sessions.filter((s) => s.dawgScore != null);

  switch (def.id) {
    case 'survive_withdrawal': {
      // 3 sessions in first 3 days — just count total sessions up to 3
      const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
      return Math.min(def.target, dates.size);
    }
    case 'four_day_reset': {
      // 4 consecutive days with 20+ min sessions
      const longDays = new Set(
        sessions
          .filter((s) => s.completed && s.duration >= 1200) // 20 min = 1200 sec
          .map((s) => s.date)
      );
      // Find longest consecutive run of these days
      const sortedDays = Array.from(longDays).sort();
      let maxRun = 0;
      let currentRun = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          currentRun++;
        } else {
          maxRun = Math.max(maxRun, currentRun);
          currentRun = 1;
        }
      }
      maxRun = Math.max(maxRun, currentRun);
      return Math.min(def.target, sortedDays.length > 0 ? maxRun : 0);
    }
    case 'blink_master': {
      // Focus score (blinkScore) above 80, three times
      const highFocus = scored.filter((s) => (s.blinkScore ?? 0) > 80);
      return Math.min(def.target, highFocus.length);
    }
    case 'stone_wall': {
      // Stillness above 90 for 5 sessions
      const highStill = scored.filter((s) => (s.stillnessPercent ?? 0) > 90);
      return Math.min(def.target, highStill.length);
    }
    case 'two_week_rewire': {
      // 14 days straight — use current streak or longest
      return Math.min(def.target, Math.max(streakData.currentStreak, streakData.longestStreak));
    }
    case 'ruthless_survivor': {
      // 3 Ruthless Mode sessions completed
      const ruthless = sessions.filter(
        (s) => s.completed && s.protectionLevel === 'ruthless'
      );
      return Math.min(def.target, ruthless.length);
    }
    case 'full_rewire': {
      // 90 day streak
      return Math.min(def.target, Math.max(streakData.currentStreak, streakData.longestStreak));
    }
    default:
      return 0;
  }
}

export function evaluateChallenges(
  sessions: Session[],
  streakData: StreakData,
  isPro: boolean
): EvaluatedChallenge[] {
  const state = {} as ChallengeState; // We compute fresh from sessions

  // Pre-compute unlock context values
  const totalSessions = sessions.filter((s) => s.completed).length;

  // First pass: compute progress
  const results: EvaluatedChallenge[] = CHALLENGE_DEFS.map((def) => {
    const progress = computeProgress(def, sessions, streakData);
    const completed = progress >= def.target;
    return {
      ...def,
      progress,
      completed,
      unlocked: false, // filled in second pass
    };
  });

  // Build unlock context
  const ctx: UnlockContext = {
    totalSessions,
    challenge1Done: results[0]?.completed ?? false,
    challenge2Done: results[1]?.completed ?? false,
    challenge5Done: results[4]?.completed ?? false,
    isPro,
  };

  // Second pass: determine unlocked state
  for (const r of results) {
    r.unlocked = r.unlockCondition(ctx);
  }

  return results;
}
