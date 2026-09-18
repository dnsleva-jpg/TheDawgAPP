import { supabase } from './supabase';

export async function createSession(
  userId: string,
  durationSelectedMinutes: number,
  mode: string,
) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      duration_selected_minutes: durationSelectedMinutes,
      session_mode: mode,
      completed: false,
    })
    .select('id')
    .single();

  return { id: data?.id ?? null, error };
}

export async function completeSession(sessionId: string, actualSeconds: number) {
  return supabase
    .from('sessions')
    .update({
      completed: true,
      duration_actual_seconds: actualSeconds,
    })
    .eq('id', sessionId)
    .select()
    .single();
}

export async function breakSession(sessionId: string, actualSeconds: number) {
  return supabase
    .from('sessions')
    .update({
      completed: false,
      duration_actual_seconds: actualSeconds,
      broken_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();
}
