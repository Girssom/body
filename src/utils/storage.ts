import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { WorkoutLog, WeeklySummary, LevelInfo } from '../types';

// 生成唯一ID的兼容方法
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const WORKOUT_KEY = 'fitness_workouts_v1';
const SUMMARY_KEY = 'fitness_weekly_summaries_v1';
const LEVEL_KEY = 'fitness_level_info_v1';

let supabase: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient | null => {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  supabase = createClient(url, anonKey);
  return supabase;
};

export const loadWorkouts = (): WorkoutLog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WORKOUT_KEY);
    return raw ? (JSON.parse(raw) as WorkoutLog[]) : [];
  } catch {
    return [];
  }
};

export const saveWorkouts = (logs: WorkoutLog[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WORKOUT_KEY, JSON.stringify(logs));
  syncWorkoutsToCloud(logs).catch(() => {});
};

export const loadSummaries = (): WeeklySummary[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SUMMARY_KEY);
    return raw ? (JSON.parse(raw) as WeeklySummary[]) : [];
  } catch {
    return [];
  }
};

export const saveSummaries = (summaries: WeeklySummary[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SUMMARY_KEY, JSON.stringify(summaries));
  syncSummariesToCloud(summaries).catch(() => {});
};

export const loadLevelInfo = (): LevelInfo | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LEVEL_KEY);
    return raw ? (JSON.parse(raw) as LevelInfo) : null;
  } catch {
    return null;
  }
};

export const saveLevelInfo = (info: LevelInfo) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LEVEL_KEY, JSON.stringify(info));
};

const syncWorkoutsToCloud = async (logs: WorkoutLog[]) => {
  const client = getSupabaseClient();
  if (!client) return;

  const userId = window.localStorage.getItem('fitness_user_id') ?? generateId();
  window.localStorage.setItem('fitness_user_id', userId);

  await client.from('workouts').upsert(
    logs.map((log) => ({
      user_id: userId,
      log_id: log.id,
      data: log,
    })),
    { onConflict: 'log_id' },
  );
};

const syncSummariesToCloud = async (summaries: WeeklySummary[]) => {
  const client = getSupabaseClient();
  if (!client) return;

  const userId = window.localStorage.getItem('fitness_user_id') ?? generateId();
  window.localStorage.setItem('fitness_user_id', userId);

  await client.from('weekly_summaries').upsert(
    summaries.map((s) => ({
      user_id: userId,
      week_index: s.weekIndex,
      data: s,
    })),
    { onConflict: 'user_id,week_index' },
  );
};

