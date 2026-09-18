// ─── Shiba Mood System ───────────────────────────────────
// Maps user's daily performance to a Shiba mood state.
// The Shiba reacts to your behavior — like BrainRot's brain avatar.

export type ShibaMood = 'thriving' | 'good' | 'meh' | 'struggling' | 'rotting';

export interface ShibaState {
  mood: ShibaMood;
  label: string;
  message: string;
  color: string;
}

// ─── Personality Lines ───────────────────────────────────

const THRIVING_LINES = [
  "You're crushing it. I'm honestly impressed.",
  "Phone? What phone? You're a legend.",
  "Your brain is literally healing right now.",
  "This is what freedom looks like.",
  "I'd wag my tail if I had one. Wait — I do.",
];

const GOOD_LINES = [
  "Solid day. Keep it up.",
  "Not bad at all. Your neurons approve.",
  "You're doing better than 90% of people today.",
  "Stay the course. This is working.",
  "Your future self is already thanking you.",
];

const MEH_LINES = [
  "Room for improvement. But you showed up.",
  "Eh, we've had better days. Tomorrow's fresh.",
  "At least you opened this app instead of TikTok.",
  "Average day. But consistency beats perfection.",
  "Could be worse. Could be scrolling right now.",
];

const STRUGGLING_LINES = [
  "Tough day. The path is still here though.",
  "Your brain is asking for help. Listen to it.",
  "One good decision right now changes everything.",
  "Put the phone down. I believe in you.",
  "Bad days are part of recovery. Don't quit.",
];

const ROTTING_LINES = [
  "Your brain called. It wants its dopamine back.",
  "This is the doom scroll talking. Fight back.",
  "I'm literally rotting over here. Help me out.",
  "Remember why you downloaded this app?",
  "Rock bottom is a foundation to build on.",
];

const MOOD_LINES: Record<ShibaMood, string[]> = {
  thriving: THRIVING_LINES,
  good: GOOD_LINES,
  meh: MEH_LINES,
  struggling: STRUGGLING_LINES,
  rotting: ROTTING_LINES,
};

// ─── Mood Calculation ────────────────────────────────────

/**
 * Compute Shiba mood from available signals.
 * @param focusScore - Today's Focus Score (0-100), null if not checked in
 * @param resistRate - Today's Shield resist rate (0-100), null if no interceptions
 * @param streakDays - Current streak count
 * @param completedChallenge - Whether today's challenge was completed
 */
export function computeShibaMood(
  focusScore: number | null,
  resistRate: number | null,
  streakDays: number,
  completedChallenge: boolean,
): ShibaState {
  // Weighted composite: focus score (40%), resist rate (20%), streak bonus (20%), challenge (20%)
  let score = 50; // baseline

  if (focusScore != null) {
    score = focusScore * 0.4;
  } else {
    score = 40; // haven't checked in = slightly below average
  }

  if (resistRate != null) {
    score += resistRate * 0.2;
  } else {
    score += 10; // no interceptions = neutral (not bad)
  }

  // Streak bonus
  if (streakDays >= 14) score += 20;
  else if (streakDays >= 7) score += 15;
  else if (streakDays >= 3) score += 10;
  else if (streakDays >= 1) score += 5;

  // Challenge completion
  if (completedChallenge) score += 20;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Map to mood
  let mood: ShibaMood;
  if (score >= 80) mood = 'thriving';
  else if (score >= 60) mood = 'good';
  else if (score >= 40) mood = 'meh';
  else if (score >= 20) mood = 'struggling';
  else mood = 'rotting';

  const lines = MOOD_LINES[mood];
  const message = lines[Math.floor(Math.random() * lines.length)];

  return {
    mood,
    label: getMoodLabel(mood),
    message,
    color: getMoodColor(mood),
  };
}

function getMoodLabel(mood: ShibaMood): string {
  switch (mood) {
    case 'thriving': return 'Thriving';
    case 'good': return 'Doing Good';
    case 'meh': return 'Meh';
    case 'struggling': return 'Struggling';
    case 'rotting': return 'Brain Rot';
  }
}

function getMoodColor(mood: ShibaMood): string {
  switch (mood) {
    case 'thriving': return '#2ECC71';
    case 'good': return '#3498DB';
    case 'meh': return '#F39C12';
    case 'struggling': return '#E67E22';
    case 'rotting': return '#E74C3C';
  }
}
