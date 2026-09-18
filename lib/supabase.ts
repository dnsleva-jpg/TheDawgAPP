import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

const SUPABASE_URL = 'https://cpagkuhosiksgdconbiv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4hYtgSlw3gUCM5a8f5P3MA_cjdYYAOO';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
