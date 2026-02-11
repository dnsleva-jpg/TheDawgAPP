// Session storage: Already exists and works with AsyncStorage.
// V2 enhancement: Session type now includes optional stillnessPercent and blinksCount
// fields. Existing V1 sessions (without these fields) remain backward compatible.
// No need to rebuild storage from scratch — just save the enhanced Session objects.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types';

const SESSIONS_KEY = '@raw_dawg_sessions';

/**
 * Save a completed session to storage
 */
export async function saveSession(session: Session): Promise<void> {
  try {
    const sessions = await getSessions();
    sessions.push(session);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

/**
 * Get all saved sessions
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading sessions:', error);
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
    console.error('Error clearing sessions:', error);
  }
}
