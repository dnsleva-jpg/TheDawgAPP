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
  // V3 scoring engine results (optional for backward compatibility)
  rawDawgScore?: number;        // 0-100 composite score
  stillnessScore?: number;      // 0-100 sub-score
  blinkScore?: number;          // 0-100 sub-score
  durationScore?: number;       // 0-100 sub-score
  grade?: string;               // "S", "A", "B", "C", "D", "F"
  gradeLabel?: string;          // "TRANSCENDENT", "FOCUSED", "SOLID", etc.
  blinksPerMinute?: number;     // raw blinks per minute
  facePresencePercent?: number; // how much of session face was detected
  committedDuration?: number;   // what timer they selected (seconds)
  protectionLevel?: string;     // "easy", "strict", "ruthless" (for future use)
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
  // V3 scoring engine aggregate stats
  bestRawDawgScore?: number;       // highest Raw Dawg Score ever
  bestGrade?: string;              // grade of best session
  avgRawDawgScore7d?: number;      // average Raw Dawg Score from last 7 days
  totalScoredSessions?: number;    // count of sessions with scoring data
}

export type Screen = 'Home' | 'Prepare' | 'Timer' | 'Selfie' | 'Results';
