import { supabase } from '../../lib/supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@donothin_device_id';

/**
 * Get or create a persistent anonymous device ID.
 */
async function getDeviceId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

/**
 * Log an anonymous analytics event to Supabase.
 *
 * Table: anonymous_events
 * Columns: device_id, event_name, event_data (jsonb), created_at
 *
 * Create table SQL:
 * ```sql
 * CREATE TABLE IF NOT EXISTS anonymous_events (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   device_id text NOT NULL,
 *   event_name text NOT NULL,
 *   event_data jsonb DEFAULT '{}',
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * -- Allow anonymous inserts (anon key)
 * ALTER TABLE anonymous_events ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow anonymous inserts"
 *   ON anonymous_events FOR INSERT
 *   WITH CHECK (true);
 * ```
 */
export async function logEvent(
  eventName: string,
  eventData: Record<string, unknown> = {},
): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    await (supabase.from('anonymous_events') as any).insert({
      device_id: deviceId,
      event_name: eventName,
      event_data: eventData,
    });
  } catch {
    // Analytics failure is non-critical — never block the user
  }
}

// ─── Convenience wrappers ───────────────────────────────

export function logOnboardingComplete(data: {
  userGoal?: string;
  baselineScore?: number;
}): void {
  logEvent('onboarding_complete', data);
}

export function logMilestoneReached(dayNumber: number): void {
  logEvent('milestone_reached', { dayNumber });
}

export function logSessionComplete(data: {
  dawgScore?: number;
  grade?: string;
  durationSeconds: number;
  dayNumber?: number;
}): void {
  logEvent('session_complete', data);
}

export function logWalkModeComplete(data: {
  durationSeconds: number;
  leftApp: boolean;
  leftCount?: number;
}): void {
  logEvent('walk_mode_complete', data);
}
