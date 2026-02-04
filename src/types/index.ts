export interface Session {
  id: string;
  duration: number; // in seconds
  date: string; // ISO date string for the day (YYYY-MM-DD)
  timestamp: number; // Unix timestamp
  isRogueMode: boolean;
  completed: boolean;
}

export interface UserStats {
  totalSessions: number;
  totalTimeSeconds: number;
  longestSessionSeconds: number;
  currentStreak: number;
  lastSessionDate?: string; // ISO date string (YYYY-MM-DD)
}

export type Screen = 'Home' | 'Prepare' | 'Timer' | 'Selfie' | 'Results';
