import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Intervention Types ──────────────────────────────────

export type InterventionType = 'breathing' | 'emotion_check' | 'math_problem' | 'intention_prompt' | 'body_scan';

export interface Intervention {
  type: InterventionType;
  label: string;
  emoji: string;
  durationSec: number;
  description: string;
}

export const INTERVENTIONS: Intervention[] = [
  {
    type: 'breathing',
    label: 'Box Breathing',
    emoji: '🫁',
    durationSec: 30,
    description: 'Inhale 4s, hold 4s, exhale 4s, hold 4s',
  },
  {
    type: 'emotion_check',
    label: 'Emotion Check',
    emoji: '🪞',
    durationSec: 15,
    description: 'How are you feeling right now?',
  },
  {
    type: 'math_problem',
    label: 'Math Problem',
    emoji: '🧮',
    durationSec: 20,
    description: 'Solve a quick problem to unlock',
  },
  {
    type: 'intention_prompt',
    label: 'Set Intention',
    emoji: '🎯',
    durationSec: 15,
    description: 'What do you actually need from this app?',
  },
  {
    type: 'body_scan',
    label: 'Body Scan',
    emoji: '🧘',
    durationSec: 20,
    description: 'Notice how your body feels for a moment',
  },
];

// ─── Emotion Options ─────────────────────────────────────

export const EMOTIONS = [
  { emoji: '😐', label: 'Bored' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😔', label: 'Lonely' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🥱', label: 'Tired' },
  { emoji: '😊', label: 'Good actually' },
] as const;

// ─── Math Problems ───────────────────────────────────────

export interface MathProblem {
  question: string;
  answer: number;
}

export function generateMathProblem(): MathProblem {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 80) + 12;
      b = Math.floor(Math.random() * 80) + 12;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 80) + 30;
      b = Math.floor(Math.random() * (a - 5)) + 5;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 12) + 3;
      b = Math.floor(Math.random() * 12) + 3;
      answer = a * b;
      break;
  }

  return { question: `${a!} ${op} ${b!}`, answer: answer! };
}

// ─── Body Scan Prompts ───────────────────────────────────

export const BODY_SCAN_STEPS = [
  'Notice your feet on the ground...',
  'Feel your hands — are they tense?',
  'Relax your shoulders...',
  'Unclench your jaw...',
  'Take one slow breath...',
] as const;

// ─── Random Selection ────────────────────────────────────

const USAGE_KEY = 'dawg_intervention_usage';

interface InterventionUsage {
  [type: string]: number; // timestamp of last use
}

/**
 * Pick a random intervention, weighted away from recently used ones.
 * Prevents the same intervention from appearing back-to-back.
 */
export async function pickIntervention(): Promise<Intervention> {
  try {
    const data = await AsyncStorage.getItem(USAGE_KEY);
    const usage: InterventionUsage = data ? JSON.parse(data) : {};
    const now = Date.now();

    // Sort by least recently used
    const sorted = [...INTERVENTIONS].sort((a, b) => {
      const aLast = usage[a.type] ?? 0;
      const bLast = usage[b.type] ?? 0;
      return aLast - bLast;
    });

    // Pick from the top 3 least-recently-used
    const pool = sorted.slice(0, 3);
    const pick = pool[Math.floor(Math.random() * pool.length)];

    // Record usage
    usage[pick.type] = now;
    await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage));

    return pick;
  } catch {
    return INTERVENTIONS[0]; // fallback to breathing
  }
}
