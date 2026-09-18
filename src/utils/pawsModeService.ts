import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PawsModeSession {
  id: string;
  date: string;
  activity: string;
  durationMinutes: number;
  actualMinutes: number;
  pickups: number;
  timestamp: number;
}

const STORAGE_KEY = 'dawg_paws_mode_sessions';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export async function savePawsModeSession(session: PawsModeSession): Promise<void> {
  try {
    const all = await getPawsModeSessions();
    all.push(session);
    const trimmed = all.slice(-200);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

export async function getPawsModeSessions(date?: string): Promise<PawsModeSession[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const all: PawsModeSession[] = data ? JSON.parse(data) : [];
    if (date) return all.filter((s) => s.date === date);
    return all;
  } catch {
    return [];
  }
}

export async function getTodayPhoneFreeMinutes(): Promise<number> {
  const sessions = await getPawsModeSessions(getToday());
  return sessions.reduce((sum, s) => sum + s.actualMinutes, 0);
}

export async function getWeeklyPhoneFreeMinutes(): Promise<number> {
  const all = await getPawsModeSessions();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];
  return all.filter((s) => s.date >= weekStr).reduce((sum, s) => sum + s.actualMinutes, 0);
}

export function createPawsModeSession(
  activity: string,
  durationMinutes: number,
  actualMinutes: number,
  pickups: number,
): PawsModeSession {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: getToday(),
    activity,
    durationMinutes,
    actualMinutes,
    pickups,
    timestamp: Date.now(),
  };
}
