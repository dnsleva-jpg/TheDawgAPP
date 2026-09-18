import AsyncStorage from '@react-native-async-storage/async-storage';

const PICKUPS_KEY = 'dawg_pickups';

interface DailyPickups {
  [date: string]: number;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

async function getAllPickups(): Promise<DailyPickups> {
  try {
    const data = await AsyncStorage.getItem(PICKUPS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Record a phone pickup (call this when app comes to foreground).
 */
export async function recordPickup(): Promise<void> {
  try {
    const all = await getAllPickups();
    const today = getToday();
    all[today] = (all[today] ?? 0) + 1;

    // Keep only last 90 days
    const keys = Object.keys(all).sort();
    if (keys.length > 90) {
      const toDelete = keys.slice(0, keys.length - 90);
      for (const k of toDelete) delete all[k];
    }

    await AsyncStorage.setItem(PICKUPS_KEY, JSON.stringify(all));
  } catch {}
}

/**
 * Get today's pickup count.
 */
export async function getTodayPickups(): Promise<number> {
  const all = await getAllPickups();
  return all[getToday()] ?? 0;
}

/**
 * Get average daily pickups over the last 7 days.
 */
export async function getWeeklyAvgPickups(): Promise<number> {
  const all = await getAllPickups();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  const counts = dates.map((d) => all[d] ?? 0);
  const daysWithData = counts.filter((c) => c > 0).length || 1;
  return Math.round(counts.reduce((a, b) => a + b, 0) / daysWithData);
}
