import { supabase } from './supabase';

export async function getProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
}

export async function updateStreak(userId: string, newStreak: number) {
  const { data: current } = await supabase
    .from('profiles')
    .select('longest_streak')
    .eq('id', userId)
    .single();

  const longestStreak = current
    ? Math.max(current.longest_streak, newStreak)
    : newStreak;

  return supabase
    .from('profiles')
    .update({ current_streak: newStreak, longest_streak: longestStreak })
    .eq('id', userId)
    .select()
    .single();
}

export async function markOnboardingComplete(userId: string, startDate: Date) {
  return supabase
    .from('profiles')
    .update({
      has_onboarded: true,
      program_start_date: startDate.toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
}

export async function incrementSessionStats(userId: string, minutesAdded: number) {
  const { data: current, error: fetchError } = await supabase
    .from('profiles')
    .select('total_sessions_completed, total_focus_minutes')
    .eq('id', userId)
    .single();

  if (fetchError || !current) return { data: null, error: fetchError };

  return supabase
    .from('profiles')
    .update({
      total_sessions_completed: current.total_sessions_completed + 1,
      total_focus_minutes: current.total_focus_minutes + minutesAdded,
    })
    .eq('id', userId)
    .select()
    .single();
}
