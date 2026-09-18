// Session storage: Already exists and works with AsyncStorage.
// V2 enhancement: Session type now includes optional stillnessPercent and blinksCount
// fields. Existing V1 sessions (without these fields) remain backward compatible.
// No need to rebuild storage from scratch — just save the enhanced Session objects.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types';

const SESSIONS_KEY = '@dawg_sessions';

/**
 * Save a completed session to storage
 */
export async function saveSession(session: Session): Promise<void> {
  try {
    const sessions = await getSessions();
    sessions.push(session);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    // Silently fail — session not saved but app continues
  }
}

/**
 * Get all saved sessions
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Validate that parsed data is an array
      if (!Array.isArray(parsed)) return [];
      return parsed;
    }
    return [];
  } catch (error) {
    // Corrupted data — return empty and don't crash
    return [];
  }
}

/**
 * Clear all sessions (for debugging)
 */
export async function clearSessions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    // Silently fail
  }
}
