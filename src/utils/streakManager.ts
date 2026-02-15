import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_STORAGE_KEY = '@dawg_streak';

export interface StreakData {
  currentStreak: number;
  lastSessionDate: string | null; // ISO date string (YYYY-MM-DD)
  longestStreak: number;
}

/**
 * Get current streak data from storage
 */
export async function getStreakData(): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Validate structure
      if (parsed && typeof parsed.currentStreak === 'number') {
        return parsed;
      }
    }
  } catch (error) {
    // Corrupted data — return defaults
  }
  
  // Default values
  return {
    currentStreak: 0,
    lastSessionDate: null,
    longestStreak: 0,
  };
}

/**
 * Save streak data to storage
 */
async function saveStreakData(data: StreakData): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Silently fail — streak not saved but app continues
  }
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Check if the user has completed a session today
 */
export function hasSessionToday(lastSessionDate: string | null): boolean {
  if (!lastSessionDate) return false;
  return lastSessionDate === getTodayString();
}

/**
 * Update streak after completing a session
 * Returns the updated streak data
 */
export async function updateStreakAfterSession(): Promise<StreakData> {
  const streakData = await getStreakData();
  const today = getTodayString();
  const yesterday = getYesterdayString();
  
  // If session already completed today, don't change streak
  if (streakData.lastSessionDate === today) {
    return streakData;
  }
  
  let newStreak: number;
  
  if (streakData.lastSessionDate === yesterday) {
    // Last session was yesterday → increment streak
    newStreak = streakData.currentStreak + 1;
  } else {
    // Last session was 2+ days ago or never → reset to 1
    newStreak = 1;
  }
  
  const updatedData: StreakData = {
    currentStreak: newStreak,
    lastSessionDate: today,
    longestStreak: Math.max(newStreak, streakData.longestStreak),
  };
  
  await saveStreakData(updatedData);
  return updatedData;
}

/**
 * Get formatted streak message for display
 */
export function getStreakMessage(streakData: StreakData): {
  emoji: string;
  mainText: string;
  subText: string | null;
} {
  const { currentStreak, lastSessionDate } = streakData;
  
  if (currentStreak === 0) {
    return {
      emoji: '🔥',
      mainText: 'Start Your Streak',
      subText: null,
    };
  }
  
  const hasToday = hasSessionToday(lastSessionDate);
  const dayText = currentStreak === 1 ? 'Day' : 'Days';
  
  return {
    emoji: '🔥',
    mainText: `${currentStreak} ${dayText} Streak`,
    subText: hasToday ? null : "Don't break it!",
  };
}
