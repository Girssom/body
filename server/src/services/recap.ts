type WorkoutLog = {
  id: string;
  date: string;
  exercise: string;
  sets?: number;
  reps?: number;
  weight?: number;
  distance?: number;
  duration?: number;
  note?: string;
};

const STRENGTH = ['卧推', '深蹲', '硬拉', '引体向上'];
const CARDIO = ['跑步', '骑行', '游泳'];
const FLEX = ['瑜伽', '拉伸'];

function getType(exercise: string): 'strength' | 'cardio' | 'flex' {
  if (STRENGTH.includes(exercise)) return 'strength';
  if (CARDIO.includes(exercise)) return 'cardio';
  if (FLEX.includes(exercise)) return 'flex';
  return 'strength';
}

function moveVolume(log: WorkoutLog): number {
  const t = getType(log.exercise);
  if (t === 'strength') {
    return (log.sets ?? 0) * (log.reps ?? 0) * (log.weight ?? 1);
  }
  if (t === 'cardio') {
    if ((log.distance ?? 0) > 0) return (log.distance ?? 0) * 80;
    return (log.duration ?? 0) * 1;
  }
  return (log.duration ?? 0) * 20;
}

export type YearlyRecap = {
  year: number;
  totalWorkouts: number;
  totalVolume: number;
  totalDistance: number;
  totalMinutes: number;
  activeDays: number;
  bestExercise: string | null;
  longestStreak: number;
  monthlyWorkouts: { month: number; count: number; volume: number }[];
  weeklyHeatmap: { weekIndex: number; dayOfWeek: number; hasWorkout: boolean }[];
  volumeTimeline: { date: string; volume: number }[];
};

export function buildYearlyRecap(logs: WorkoutLog[], year: number): YearlyRecap {
  const yearLogs = logs.filter((l) => new Date(l.date).getFullYear() === year);
  if (!yearLogs.length) {
    return {
      year,
      totalWorkouts: 0,
      totalVolume: 0,
      totalDistance: 0,
      totalMinutes: 0,
      activeDays: 0,
      bestExercise: null,
      longestStreak: 0,
      monthlyWorkouts: [],
      weeklyHeatmap: [],
      volumeTimeline: [],
    };
  }

  const totalWorkouts = yearLogs.length;
  const totalVolume = yearLogs.reduce((s, l) => s + moveVolume(l), 0);
  const totalDistance = yearLogs.reduce((s, l) => s + (l.distance ?? 0), 0);
  const totalMinutes = yearLogs.reduce((s, l) => s + (l.duration ?? 0), 0);

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const daySet = new Set<string>();
  for (const log of yearLogs) {
    daySet.add(dayKey(new Date(log.date)));
  }
  const activeDays = daySet.size;

  const sortedDays = Array.from(daySet)
    .map((k) => new Date(k))
    .sort((a, b) => a.getTime() - b.getTime());
  let longestStreak = 0;
  let current = 0;
  let prev: Date | null = null;
  for (const d of sortedDays) {
    current = !prev || (d.getTime() - prev.getTime()) / 86400000 === 1 ? current + 1 : 1;
    longestStreak = Math.max(longestStreak, current);
    prev = d;
  }

  const byEx: Record<string, number> = {};
  for (const log of yearLogs) {
    byEx[log.exercise] = (byEx[log.exercise] ?? 0) + 1;
  }
  const bestExercise = Object.entries(byEx).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const monthlyMap: Record<number, { count: number; volume: number }> = {};
  for (const log of yearLogs) {
    const m = new Date(log.date).getMonth();
    if (!monthlyMap[m]) monthlyMap[m] = { count: 0, volume: 0 };
    monthlyMap[m].count += 1;
    monthlyMap[m].volume += moveVolume(log);
  }
  const monthlyWorkouts = Array.from({ length: 12 }, (_, m) => ({
    month: m,
    count: monthlyMap[m]?.count ?? 0,
    volume: monthlyMap[m]?.volume ?? 0,
  }));

  const yearStart = new Date(year, 0, 1);
  const heatSet = new Set<string>();
  const weeklyHeatmap: { weekIndex: number; dayOfWeek: number; hasWorkout: boolean }[] = [];
  for (const log of yearLogs) {
    const d = new Date(log.date);
    const diffDays = Math.floor((d.getTime() - yearStart.getTime()) / 86400000);
    const weekIndex = Math.floor(diffDays / 7);
    const dayOfWeek = d.getDay();
    const key = `${weekIndex}-${dayOfWeek}`;
    if (!heatSet.has(key)) {
      heatSet.add(key);
      weeklyHeatmap.push({ weekIndex, dayOfWeek, hasWorkout: true });
    }
  }

  const volumeTimeline = yearLogs
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log) => ({ date: log.date, volume: moveVolume(log) }));

  return {
    year,
    totalWorkouts,
    totalVolume,
    totalDistance,
    totalMinutes,
    activeDays,
    bestExercise,
    longestStreak,
    monthlyWorkouts,
    weeklyHeatmap,
    volumeTimeline,
  };
}
