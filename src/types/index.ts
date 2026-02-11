export interface Session {
  id: string;
  duration: number; // in seconds
  date: string; // ISO date string for the day (YYYY-MM-DD)
  timestamp: number; // Unix timestamp
  isRogueMode: boolean;
  completed: boolean;
  // V2 camera-verified metrics (optional for backward compatibility with V1 sessions)
  stillnessPercent?: number;  // 0-100, from frame processor stillness tracking
  blinksCount?: number;       // total blinks detected during session
}

export interface UserStats {
  totalSessions: number;
  totalTimeSeconds: number;
  longestSessionSeconds: number;
  currentStreak: number;
  lastSessionDate?: string; // ISO date string (YYYY-MM-DD)
  // V2 camera-verified aggregate stats
  avgStillnessPercent?: number;  // average stillness across all sessions
  totalBlinks?: number;          // total blinks across all sessions
}

export type Screen = 'Home' | 'Prepare' | 'Timer' | 'Selfie' | 'Results';
