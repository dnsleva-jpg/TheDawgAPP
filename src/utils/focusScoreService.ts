import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────

export interface DailyCheckIn {
  id: string;
  date: string;                              // YYYY-MM-DD
  completedAt: number;                       // Unix timestamp
  mentalClarity: 1 | 2 | 3 | 4 | 5;
  compulsiveChecking: 1 | 2 | 3 | 4 | 5;
  usageIntentionality: 1 | 2 | 3 | 4 | 5;
  socialConnection: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  focusScore: number;                        // 0-100
  grade: string;                             // S/A/B/C/D/F
  completedSessionYesterday: boolean;
}

export type CheckInAnswer = 1 | 2 | 3 | 4 | 5;

export interface CheckInAnswers {
  mentalClarity: CheckInAnswer;
  compulsiveChecking: CheckInAnswer;
  usageIntentionality: CheckInAnswer;
  socialConnection: CheckInAnswer;
  sleepQuality: CheckInAnswer;
}

export interface SmartSuggestion {
  category: keyof CheckInAnswers;
  emoji: string;
  text: string;
}

export interface CorrelationInsight {
  text: string;
  delta: number;     // percentage difference
  positive: boolean; // whether higher is better
}

// ─── Constants ────────────────────────────────────────────

const STORAGE_KEY = 'dawg_daily_checkins';

const WEIGHTS = {
  mentalClarity: 0.25,
  compulsiveChecking: 0.25,
  usageIntentionality: 0.20,
  socialConnection: 0.15,
  sleepQuality: 0.15,
} as const;

const SESSION_BONUS = 5;

// ─── Questions ────────────────────────────────────────────

export const FOCUS_SCORE_QUESTIONS = [
  {
    key: 'mentalClarity' as const,
    question: "How's your head feel right now?",
    options: [
      { value: 1 as const, label: 'Total brain fog' },
      { value: 2 as const, label: 'Kind of foggy' },
      { value: 3 as const, label: 'Normal' },
      { value: 4 as const, label: 'Pretty sharp' },
      { value: 5 as const, label: 'Crystal clear' },
    ],
  },
  {
    key: 'compulsiveChecking' as const,
    question: 'How often did you reach for your phone without a reason yesterday?',
    options: [
      { value: 1 as const, label: 'Constantly' },
      { value: 2 as const, label: 'A lot' },
      { value: 3 as const, label: 'A few times' },
      { value: 4 as const, label: 'Once or twice' },
      { value: 5 as const, label: "Didn't happen" },
    ],
  },
  {
    key: 'usageIntentionality' as const,
    question: 'How much of your phone time yesterday was intentional?',
    options: [
      { value: 1 as const, label: 'I barely remember picking it up' },
      { value: 2 as const, label: 'Mostly mindless scrolling' },
      { value: 3 as const, label: 'About half and half' },
      { value: 4 as const, label: 'Most of it was intentional' },
      { value: 5 as const, label: 'Almost all on purpose' },
    ],
  },
  {
    key: 'socialConnection' as const,
    question: 'Did you connect with anyone face-to-face yesterday?',
    options: [
      { value: 1 as const, label: 'Pretty isolated' },
      { value: 2 as const, label: 'Mostly texted / DMed people' },
      { value: 3 as const, label: 'Brief in-person interactions' },
      { value: 4 as const, label: 'Hung out with people' },
      { value: 5 as const, label: 'Deep conversation with someone I care about' },
    ],
  },
  {
    key: 'sleepQuality' as const,
    question: 'How was your sleep?',
    options: [
      { value: 1 as const, label: 'Barely slept' },
      { value: 2 as const, label: 'Restless / woke up tired' },
      { value: 3 as const, label: 'Okay' },
      { value: 4 as const, label: 'Slept well' },
      { value: 5 as const, label: 'Slept great, woke up refreshed' },
    ],
  },
];

// ─── Suggestions ──────────────────────────────────────────

const SUGGESTIONS: Record<keyof CheckInAnswers, SmartSuggestion> = {
  mentalClarity: {
    category: 'mentalClarity',
    emoji: '🚶',
    text: 'Try a 10-min walk before checking your phone this morning',
  },
  compulsiveChecking: {
    category: 'compulsiveChecking',
    emoji: '📱',
    text: 'Put your phone in another room for 1 hour today',
  },
  usageIntentionality: {
    category: 'usageIntentionality',
    emoji: '🎯',
    text: 'Before opening any app today, say out loud what you\'re going to do',
  },
  socialConnection: {
    category: 'socialConnection',
    emoji: '📞',
    text: 'Call someone you care about today — even 5 minutes counts',
  },
  sleepQuality: {
    category: 'sleepQuality',
    emoji: '🌙',
    text: 'Tonight: phone out of the bedroom 1 hour before bed',
  },
};

// ─── Scoring ──────────────────────────────────────────────

export function computeFocusScore(answers: CheckInAnswers, completedSessionYesterday: boolean): { score: number; grade: string } {
  const raw =
    answers.mentalClarity * WEIGHTS.mentalClarity +
    answers.compulsiveChecking * WEIGHTS.compulsiveChecking +
    answers.usageIntentionality * WEIGHTS.usageIntentionality +
    answers.socialConnection * WEIGHTS.socialConnection +
    answers.sleepQuality * WEIGHTS.sleepQuality;

  let score = Math.round(((raw - 1.0) / 4.0) * 100);
  if (completedSessionYesterday) {
    score = Math.min(100, score + SESSION_BONUS);
  }

  const grade = scoreToGrade(score);
  return { score, grade };
}

export function scoreToGrade(score: number): string {
  if (score >= 85) return 'S';
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  if (score >= 25) return 'D';
  return 'F';
}

export function gradeColor(grade: string): string {
  switch (grade) {
    case 'S': return '#2ECC71';
    case 'A': return '#1ABC9C';
    case 'B': return '#3498DB';
    case 'C': return '#FFBE0B';
    case 'D': return '#FF8C42';
    case 'F': return '#D4820A';
    default: return '#B8B3AC';
  }
}

// ─── Smart Suggestions ───────────────────────────────────

export function getSmartSuggestion(answers: CheckInAnswers): SmartSuggestion {
  const entries = Object.entries(answers) as [keyof CheckInAnswers, number][];
  const lowest = entries.reduce((min, curr) => (curr[1] < min[1] ? curr : min));
  return SUGGESTIONS[lowest[0]];
}

// ─── Storage ──────────────────────────────────────────────

async function getAllCheckIns(): Promise<DailyCheckIn[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveAllCheckIns(checkIns: DailyCheckIn[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
  } catch {
    // Silently fail
  }
}

export async function saveDailyCheckIn(checkIn: DailyCheckIn): Promise<void> {
  const all = await getAllCheckIns();
  // Replace if same date exists, otherwise append
  const idx = all.findIndex((c) => c.date === checkIn.date);
  if (idx >= 0) {
    all[idx] = checkIn;
  } else {
    all.push(checkIn);
  }
  await saveAllCheckIns(all);
}

export async function getDailyCheckIn(date: string): Promise<DailyCheckIn | null> {
  const all = await getAllCheckIns();
  return all.find((c) => c.date === date) ?? null;
}

export async function hasCheckedInToday(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const checkIn = await getDailyCheckIn(today);
  return checkIn !== null;
}

export async function getCheckInHistory(days: number = 7): Promise<DailyCheckIn[]> {
  const all = await getAllCheckIns();
  // Sort by date descending, take last N
  return all
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}

export async function getFocusScoreAverage(days: number = 7): Promise<number | null> {
  const history = await getCheckInHistory(days);
  if (history.length === 0) return null;
  const sum = history.reduce((acc, c) => acc + c.focusScore, 0);
  return Math.round(sum / history.length);
}

// ─── Correlation Insights ─────────────────────────────────

export async function getWeeklyInsight(): Promise<CorrelationInsight | null> {
  const all = await getAllCheckIns();
  if (all.length < 7) return null;

  // Sort chronologically
  const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));

  // Insight 1: Score trend over time
  const firstWeekAvg = sorted.slice(0, 7).reduce((s, c) => s + c.focusScore, 0) / 7;
  const lastWeekAvg = sorted.slice(-7).reduce((s, c) => s + c.focusScore, 0) / 7;
  const improvement = Math.round(((lastWeekAvg - firstWeekAvg) / Math.max(firstWeekAvg, 1)) * 100);

  if (Math.abs(improvement) >= 10) {
    return {
      text: improvement > 0
        ? `Your Focus Score has improved ${improvement}% since you started`
        : `Your Focus Score has dipped ${Math.abs(improvement)}% — time to refocus`,
      delta: improvement,
      positive: improvement > 0,
    };
  }

  // Insight 2: Session completion correlation
  const withSession = all.filter((c) => c.completedSessionYesterday);
  const withoutSession = all.filter((c) => !c.completedSessionYesterday);
  if (withSession.length >= 3 && withoutSession.length >= 3) {
    const avgWith = withSession.reduce((s, c) => s + c.focusScore, 0) / withSession.length;
    const avgWithout = withoutSession.reduce((s, c) => s + c.focusScore, 0) / withoutSession.length;
    const sessionDelta = Math.round(((avgWith - avgWithout) / Math.max(avgWithout, 1)) * 100);
    if (sessionDelta > 5) {
      return {
        text: `Your Focus Score is ${sessionDelta}% higher on days after you complete a challenge`,
        delta: sessionDelta,
        positive: true,
      };
    }
  }

  // Insight 3: Compulsive checking trend
  const earlyChecking = sorted.slice(0, Math.floor(sorted.length / 2)).reduce((s, c) => s + c.compulsiveChecking, 0) / Math.floor(sorted.length / 2);
  const lateChecking = sorted.slice(Math.floor(sorted.length / 2)).reduce((s, c) => s + c.compulsiveChecking, 0) / (sorted.length - Math.floor(sorted.length / 2));
  const checkingImprovement = Math.round(((lateChecking - earlyChecking) / Math.max(earlyChecking, 1)) * 100);
  if (checkingImprovement > 10) {
    return {
      text: `Your compulsive phone checking has improved ${checkingImprovement}% since you started`,
      delta: checkingImprovement,
      positive: true,
    };
  }

  return null;
}
