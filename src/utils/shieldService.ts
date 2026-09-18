import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────

export interface Interception {
  id: string;
  app: string;           // e.g. "instagram", "tiktok"
  timestamp: number;     // Unix ms
  date: string;          // YYYY-MM-DD
  outcome: 'proceeded' | 'resisted';
}

export interface ShieldConfig {
  enabledApps: string[];
  breathingDurationSec: number;
  shortcutsConfigured: boolean;
}

export interface ShieldStats {
  totalInterceptions: number;
  totalResisted: number;
  todayInterceptions: number;
  todayResisted: number;
  weekInterceptions: number;
  weekResisted: number;
  resistRate: number;     // 0-100
}

export interface AppInterceptionStats {
  app: string;
  label: string;
  emoji: string;
  totalInterceptions: number;
  totalResisted: number;
  resistRate: number;
}

// ─── App Catalog ──────────────────────────────────────────

export const DOOM_SCROLL_APPS = [
  { id: 'instagram', emoji: '📸', label: 'Instagram', urlScheme: 'instagram://' },
  { id: 'tiktok', emoji: '🎵', label: 'TikTok', urlScheme: 'snssdk1233://' },
  { id: 'twitter', emoji: '𝕏', label: 'Twitter / X', urlScheme: 'twitter://' },
  { id: 'reddit', emoji: '🤖', label: 'Reddit', urlScheme: 'reddit://' },
  { id: 'youtube', emoji: '▶️', label: 'YouTube', urlScheme: 'youtube://' },
  { id: 'snapchat', emoji: '👻', label: 'Snapchat', urlScheme: 'snapchat://' },
  { id: 'facebook', emoji: '📘', label: 'Facebook', urlScheme: 'fb://' },
  { id: 'news', emoji: '📰', label: 'News Apps', urlScheme: null },
] as const;

// ─── Storage Keys ─────────────────────────────────────────

const INTERCEPTIONS_KEY = 'dawg_interceptions';
const SHIELD_CONFIG_KEY = 'dawg_shield_config';

const DEFAULT_CONFIG: ShieldConfig = {
  enabledApps: [],
  breathingDurationSec: 30,
  shortcutsConfigured: false,
};

// ─── Config ───────────────────────────────────────────────

export async function getShieldConfig(): Promise<ShieldConfig> {
  try {
    const data = await AsyncStorage.getItem(SHIELD_CONFIG_KEY);
    return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveShieldConfig(config: Partial<ShieldConfig>): Promise<void> {
  try {
    const existing = await getShieldConfig();
    const merged = { ...existing, ...config };
    await AsyncStorage.setItem(SHIELD_CONFIG_KEY, JSON.stringify(merged));
  } catch {
    // Silently fail
  }
}

// ─── Interceptions ────────────────────────────────────────

async function getAllInterceptions(): Promise<Interception[]> {
  try {
    const data = await AsyncStorage.getItem(INTERCEPTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveAllInterceptions(interceptions: Interception[]): Promise<void> {
  try {
    // Keep last 1000 to prevent unbounded storage growth
    const trimmed = interceptions.slice(-1000);
    await AsyncStorage.setItem(INTERCEPTIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // Silently fail
  }
}

export async function saveInterception(interception: Interception): Promise<void> {
  const all = await getAllInterceptions();
  all.push(interception);
  await saveAllInterceptions(all);
}

export async function getInterceptions(since?: string): Promise<Interception[]> {
  const all = await getAllInterceptions();
  if (!since) return all;
  return all.filter((i) => i.date >= since);
}

// ─── Stats ────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

export async function getShieldStats(): Promise<ShieldStats> {
  const all = await getAllInterceptions();
  const today = getToday();
  const weekAgo = getWeekAgo();

  const todayInterceptions = all.filter((i) => i.date === today);
  const weekInterceptions = all.filter((i) => i.date >= weekAgo);

  const totalResisted = all.filter((i) => i.outcome === 'resisted').length;
  const todayResisted = todayInterceptions.filter((i) => i.outcome === 'resisted').length;
  const weekResisted = weekInterceptions.filter((i) => i.outcome === 'resisted').length;

  return {
    totalInterceptions: all.length,
    totalResisted,
    todayInterceptions: todayInterceptions.length,
    todayResisted,
    weekInterceptions: weekInterceptions.length,
    weekResisted,
    resistRate: all.length > 0 ? Math.round((totalResisted / all.length) * 100) : 0,
  };
}

export async function getPerAppStats(): Promise<AppInterceptionStats[]> {
  const all = await getAllInterceptions();
  const config = await getShieldConfig();

  return config.enabledApps.map((appId) => {
    const appData = DOOM_SCROLL_APPS.find((a) => a.id === appId);
    const appInterceptions = all.filter((i) => i.app === appId);
    const resisted = appInterceptions.filter((i) => i.outcome === 'resisted').length;

    return {
      app: appId,
      label: appData?.label ?? appId,
      emoji: appData?.emoji ?? '📱',
      totalInterceptions: appInterceptions.length,
      totalResisted: resisted,
      resistRate: appInterceptions.length > 0
        ? Math.round((resisted / appInterceptions.length) * 100)
        : 0,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────

export function getAppInfo(appId: string) {
  return DOOM_SCROLL_APPS.find((a) => a.id === appId) ?? { id: appId, emoji: '📱', label: appId, urlScheme: null };
}

export function createInterception(app: string, outcome: 'proceeded' | 'resisted'): Interception {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    app,
    timestamp: Date.now(),
    date: getToday(),
    outcome,
  };
}
