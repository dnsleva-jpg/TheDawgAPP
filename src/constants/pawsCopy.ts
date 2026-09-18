// ─── Paws Personality Copy ────────────────────────────────
// All user-facing text that references the mascot.
// Organized by context so any screen can pull the right line.

// ─── Home Screen Mood Messages ───────────────────────────
export const HOME_MOOD_MESSAGES: Record<string, string[]> = {
  high: [ // Score 80-100
    "Paws is meditating harder than you right now. Keep going.",
    "Paws approves. Don't stop here.",
    "Your focus is elite. Paws is running out of compliments.",
    "Paws has never been this proud. Don't ruin it.",
  ],
  good: [ // Score 65-79
    "Paws has seen better. But also much worse.",
    "Solid day. Paws nods approvingly.",
    "Not bad. Paws expected worse honestly.",
    "Your brain is getting there. Paws can tell.",
  ],
  mid: [ // Score 50-64
    "Paws is giving you the side-eye. You know why.",
    "Average. Paws doesn't celebrate average.",
    "Could be worse. Could also be a lot better.",
    "Paws has thoughts. None of them are great.",
  ],
  low: [ // Score 30-49
    "Paws is worried about you. No seriously.",
    "Your phone has seen more of you than your friends today.",
    "Paws checked your pickups. Paws is concerned.",
    "This is a cry for help from your attention span.",
  ],
  terrible: [ // Score 0-29
    "Paws has given up. Just kidding. But do better.",
    "Your brain called. It wants its dopamine back.",
    "Paws isn't angry. Paws is just disappointed.",
    "Full brainrot detected. Paws is prescribing a session.",
  ],
  noScore: [
    "Paws is ready. The only question is whether you are.",
    "No score yet. Time to do your first test.",
    "Paws is waiting. Tap Focus Test to begin.",
  ],
};

// ─── Beat Paws Messages ──────────────────────────────────
export const BEAT_PAWS = {
  countdown: "Don't blink. Don't move.",
  active: "Paws sees you. Stay still.",
  winHigh: "Paws knew you had it in you.",
  winLow: "You beat Paws... barely. Room to improve.",
  lose: "Paws isn't angry. Paws is just disappointed.",
  keepGoing: "Hold still. Paws dares you.",
  rematch: "Paws wants a rematch. Right now.",
};

// ─── Paws Mode Messages ──────────────────────────────────
export const PAWS_MODE = {
  start: "Put your phone down. Paws will wait.",
  pickup0: "Perfect session. Paws is proud. Zero pickups.",
  pickup1: "One pickup. Not bad. Not great either.",
  pickup2: "2 pickups. Paws noticed both of them.",
  pickupMany: "You picked up {count} times. Paws was counting.",
  endEarly: "Leaving already? You had {time} left.",
};

// ─── Challenge Messages ──────────────────────────────────
export const CHALLENGES = {
  start: "Paws dares you.",
  completed: "Paws gave you a little nod. That means a lot.",
  skipped: "Paws noticed you skipped. Paws always notices.",
  streak7: "7 days. Paws is running out of ways to be surprised by you.",
  streak14: "14 days. Paws has upgraded you from occasional to serious.",
  streak30: "30 days. Paws has upgraded you from serious to legendary.",
  streak60: "60 days. Paws isn't sure who's training who anymore.",
  streak90: "90 days. You did it. Paws has nothing left to teach you.",
};

// ─── Push Notification Strings ───────────────────────────
export const NOTIFICATIONS = {
  morningReminder: "Paws is awake. Morning match? 🐕",
  streakRisk: "Your {count}-day streak disappears at midnight. 20 seconds is all it takes.",
  newChallenge: "Paws has a challenge for you. Paws thinks you'll fail. Prove Paws wrong.",
  scoreImproved: "Paws noticed your score went up. Paws is choosing not to make a big deal of it.",
  longAbsence: "Paws has been sitting here for {days} days. Paws has thoughts.",
  weeklySummary: "Paws ran the numbers. Here's what Paws found.",
};

// ─── Empty States ────────────────────────────────────────
export const EMPTY_STATES = {
  noSessions: "Paws is still waiting for your first session. No pressure. Some pressure.",
  noStreak: "Paws says a streak of zero is technically still a streak. Start today.",
  noChallenges: "Paws has challenges ready. Paws is patient. Paws will not wait forever.",
  noJourneyData: "Paws doesn't have enough data yet. Do a few sessions and Paws will show you everything.",
  noInsights: "Not enough data for insights yet. Give Paws a week.",
};

// ─── Settings Footer ─────────────────────────────────────
export const SETTINGS_FOOTER = "Paws built this with you in mind.";

// ─── Helper ──────────────────────────────────────────────
export function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getMoodMessage(score: number | null): string {
  if (score == null) return getRandomLine(HOME_MOOD_MESSAGES.noScore);
  if (score >= 80) return getRandomLine(HOME_MOOD_MESSAGES.high);
  if (score >= 65) return getRandomLine(HOME_MOOD_MESSAGES.good);
  if (score >= 50) return getRandomLine(HOME_MOOD_MESSAGES.mid);
  if (score >= 30) return getRandomLine(HOME_MOOD_MESSAGES.low);
  return getRandomLine(HOME_MOOD_MESSAGES.terrible);
}
