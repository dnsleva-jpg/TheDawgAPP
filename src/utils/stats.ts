import { Session, UserStats } from '../types';

/**
 * Calculate user stats from sessions.
 * NOTE: Stats tracking already exists (storage.ts, streakManager.ts, this file).
 * V2 enhances the existing system with camera-verified metrics (stillnessPercent,
 * blinksCount) — it does NOT need to be built from scratch.
 */
export function calculateStats(sessions: Session[]): UserStats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalTimeSeconds: 0,
      longestSessionSeconds: 0,
      currentStreak: 0,
    };
  }

  // Filter completed sessions only
  const completedSessions = sessions.filter(s => s.completed);

  // Total sessions
  const totalSessions = completedSessions.length;

  // Total time
  const totalTimeSeconds = completedSessions.reduce((sum, s) => sum + s.duration, 0);

  // Longest session (guard against empty array — Math.max(...[]) returns -Infinity)
  const longestSessionSeconds = completedSessions.length > 0
    ? Math.max(...completedSessions.map(s => s.duration || 0))
    : 0;

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(completedSessions);

  // Last session date
  const lastSessionDate = completedSessions.length > 0
    ? completedSessions[completedSessions.length - 1].date
    : undefined;

  // V2 camera-verified aggregate stats
  const sessionsWithStillness = completedSessions.filter(s => s.stillnessPercent != null);
  const avgStillnessPercent = sessionsWithStillness.length > 0
    ? Math.round(sessionsWithStillness.reduce((sum, s) => sum + (s.stillnessPercent || 0), 0) / sessionsWithStillness.length)
    : undefined;
  const totalBlinks = completedSessions.reduce((sum, s) => sum + (s.blinksCount || 0), 0) || undefined;

  // V3 scoring engine aggregate stats
  const scoredSessions = completedSessions.filter(s => s.rawDawgScore != null);
  const totalScoredSessions = scoredSessions.length > 0 ? scoredSessions.length : undefined;

  // Best score ever
  let bestRawDawgScore: number | undefined;
  let bestGrade: string | undefined;
  if (scoredSessions.length > 0) {
    const best = scoredSessions.reduce((prev, curr) =>
      (curr.rawDawgScore || 0) > (prev.rawDawgScore || 0) ? curr : prev
    );
    bestRawDawgScore = best.rawDawgScore;
    bestGrade = best.grade;
  }

  // 7-day average (only scored sessions from the last 7 days)
  let avgRawDawgScore7d: number | undefined;
  if (scoredSessions.length > 0) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = scoredSessions.filter(s => s.timestamp >= sevenDaysAgo);
    if (recent.length > 0) {
      avgRawDawgScore7d = Math.round(
        recent.reduce((sum, s) => sum + (s.rawDawgScore || 0), 0) / recent.length * 10
      ) / 10;
    }
  }

  return {
    totalSessions,
    totalTimeSeconds,
    longestSessionSeconds,
    currentStreak,
    lastSessionDate,
    avgStillnessPercent,
    totalBlinks,
    bestRawDawgScore,
    bestGrade,
    avgRawDawgScore7d,
    totalScoredSessions,
  };
}

/**
 * Calculate current streak of consecutive days with sessions
 */
function calculateCurrentStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => b.timestamp - a.timestamp);

  // Get unique dates
  const uniqueDates = [...new Set(sortedSessions.map(s => s.date))];

  // Check if user has a session today or yesterday
  const today = getDateString(new Date());
  const yesterday = getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

  // If no session today or yesterday, streak is 0
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  // Count consecutive days
  let streak = 0;
  let currentDate = new Date();

  // Start from today or yesterday depending on last session
  if (uniqueDates[0] === yesterday) {
    currentDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  // Count backwards from current date
  for (let i = 0; i < uniqueDates.length; i++) {
    const dateStr = getDateString(currentDate);
    
    if (uniqueDates.includes(dateStr)) {
      streak++;
      // Move to previous day
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format seconds into human-readable time (e.g., "2h 34m", "45m", "30s")
 */
export function formatTotalTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}
