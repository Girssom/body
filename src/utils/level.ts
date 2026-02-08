import type { LevelInfo, WeeklySummary, WorkoutLog, YearlyRecap } from '../types';

export type TrainingType = 'strength' | 'cardio' | 'flex';

const STRENGTH_EXERCISES = ['卧推', '深蹲', '硬拉', '引体向上'];
const CARDIO_EXERCISES = ['跑步', '骑行', '游泳'];
const FLEX_EXERCISES = ['瑜伽', '拉伸'];

export const getTrainingType = (exercise: string): TrainingType => {
  if (STRENGTH_EXERCISES.includes(exercise)) return 'strength';
  if (CARDIO_EXERCISES.includes(exercise)) return 'cardio';
  if (FLEX_EXERCISES.includes(exercise)) return 'flex';
  // 默认按力量算，后续可以扩展智能识别
  return 'strength';
};

export const computeLogVolume = (log: WorkoutLog): number => {
  const type = getTrainingType(log.exercise);

  if (type === 'strength') {
    const sets = log.sets ?? 0;
    const reps = log.reps ?? 0;
    const weight = log.weight ?? 1;
    return sets * reps * weight;
  }

  if (type === 'cardio') {
    const distance = log.distance ?? 0;
    const duration = log.duration ?? 0;
    if (distance > 0) {
      // 1 km 约等于 60 单位积分
      return distance * 60;
    }
    return duration;
  }

  // flex
  const duration = log.duration ?? 0;
  return duration * 10;
};

// Apple Fitness 年度 Move Ring 规则
export const computeMoveRingVolume = (log: WorkoutLog): number => {
  const type = getTrainingType(log.exercise);

  if (type === 'strength') {
    const sets = log.sets ?? 0;
    const reps = log.reps ?? 0;
    const weight = log.weight ?? 1;
    return sets * reps * weight;
  }

  if (type === 'cardio') {
    const distance = log.distance ?? 0;
    const duration = log.duration ?? 0;
    if (distance > 0) {
      return distance * 80;
    }
    return duration * 1;
  }

  const duration = log.duration ?? 0;
  return duration * 20;
};

export const calcWeeklySummaries = (logs: WorkoutLog[]): WeeklySummary[] => {
  if (!logs.length) return [];

  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const first = new Date(sorted[0].date);

  const summariesMap = new Map<number, WeeklySummary & { dailyVolumes: number[] }>();

  for (const log of sorted) {
    const d = new Date(log.date);
    const diffDays = Math.floor(
      (d.getTime() - first.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weekIndex = Math.floor(diffDays / 7);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0-6 (Mon-Sun)

    const volume = computeLogVolume(log);

    let s = summariesMap.get(weekIndex);
    if (!s) {
      const start = new Date(first);
      start.setDate(first.getDate() + weekIndex * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      s = {
        weekIndex,
        startDate: start.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        endDate: end.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        totalSessions: 0,
        mostFrequentExercise: null,
        totalVolume: 0,
        dailyVolumes: Array(7).fill(0),
      };
      summariesMap.set(weekIndex, s);
    }

    s.totalSessions += 1;
    s.totalVolume += volume;
    s.dailyVolumes[dayOfWeek] += volume;
  }

  // most frequent exercise per week
  for (const [weekIndex, summary] of summariesMap) {
    const exerciseCount: Record<string, number> = {};
    for (const log of logs) {
      const d = new Date(log.date);
      const diffDays = Math.floor(
        (d.getTime() - new Date(logs[0].date).getTime()) / (1000 * 60 * 60 * 24),
      );
      const wi = Math.floor(diffDays / 7);
      if (wi !== weekIndex) continue;
      exerciseCount[log.exercise] = (exerciseCount[log.exercise] ?? 0) + 1;
    }
    const most = Object.entries(exerciseCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    summary.mostFrequentExercise = most;
  }

  return Array.from(summariesMap.values()).sort((a, b) => a.weekIndex - b.weekIndex);
};

export const calcLevelInfo = (logs: WorkoutLog[], summaries: WeeklySummary[]): LevelInfo => {
  if (!logs.length) {
    return {
      level: 1,
      currentDay: 0,
      daysInCycle: 7,
      summaries,
      badges: [],
    };
  }

  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const first = new Date(sorted[0].date);
  const now = new Date();
  const diffDaysTotal = Math.floor(
    (now.getTime() - first.getTime()) / (1000 * 60 * 60 * 24),
  );
  const level = Math.floor(diffDaysTotal / 7) + 1;
  const currentDay = (diffDaysTotal % 7) + 1;

  const currentWeekIndex = level - 1;
  const currentWeekSummary = summaries.find((s) => s.weekIndex === currentWeekIndex) ?? summaries.at(-1);

  // badge system（沿用原有规则）
  const badges: string[] = [];
  const byExercise: Record<string, number> = {};
  for (const log of logs) {
    byExercise[log.exercise] = (byExercise[log.exercise] ?? 0) + 1;
  }

  const count = (name: string) => byExercise[name] ?? 0;
  if (count('深蹲') >= 10) badges.push('深蹲达人');
  if (count('跑步') >= 10) badges.push('跑步王者');
  if (count('硬拉') >= 8) badges.push('硬拉勇士');
  if (logs.length >= 30) badges.push('坚持之王');

  return {
    level,
    currentDay,
    daysInCycle: 7,
    currentWeekSummary: currentWeekSummary ?? undefined,
    summaries,
    badges,
  };
};

export const buildYearlyRecap = (logs: WorkoutLog[], year: number): YearlyRecap => {
  const yearLogs = logs.filter((log) => new Date(log.date).getFullYear() === year);

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
  const totalVolume = yearLogs.reduce((sum, l) => sum + computeMoveRingVolume(l), 0);
  const totalDistance = yearLogs.reduce(
    (sum, l) => sum + (l.distance ?? 0),
    0,
  );
  const totalMinutes = yearLogs.reduce(
    (sum, l) => sum + (l.duration ?? 0),
    0,
  );

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const daySet = new Set<string>();
  const perDay: Record<string, number> = {};

  for (const log of yearLogs) {
    const d = new Date(log.date);
    const key = dayKey(d);
    daySet.add(key);
    perDay[key] = (perDay[key] ?? 0) + 1;
  }

  const activeDays = daySet.size;

  // 最长连续训练天数
  const sortedDays = Array.from(daySet)
    .map((k) => new Date(k))
    .sort((a, b) => a.getTime() - b.getTime());
  let longestStreak = 0;
  let currentStreak = 0;
  let prev: Date | null = null;
  for (const d of sortedDays) {
    if (!prev) {
      currentStreak = 1;
    } else {
      const diff = (d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      currentStreak = diff === 1 ? currentStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    prev = d;
  }

  // 最常练项目
  const byExercise: Record<string, number> = {};
  for (const log of yearLogs) {
    byExercise[log.exercise] = (byExercise[log.exercise] ?? 0) + 1;
  }
  const bestExercise =
    Object.entries(byExercise).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // 月度统计
  const monthlyMap: Record<number, { count: number; volume: number }> = {};
  for (const log of yearLogs) {
    const d = new Date(log.date);
    const month = d.getMonth(); // 0-11
    if (!monthlyMap[month]) {
      monthlyMap[month] = { count: 0, volume: 0 };
    }
    monthlyMap[month].count += 1;
    monthlyMap[month].volume += computeMoveRingVolume(log);
  }
  const monthlyWorkouts = Array.from({ length: 12 }, (_, m) => ({
    month: m,
    count: monthlyMap[m]?.count ?? 0,
    volume: monthlyMap[m]?.volume ?? 0,
  }));

  // 周热力图：weekIndex 与 dayOfWeek
  const weeklyHeatmap: { weekIndex: number; dayOfWeek: number; hasWorkout: boolean }[] = [];
  const yearStart = new Date(year, 0, 1);
  const heatSet = new Set<string>();
  for (const log of yearLogs) {
    const d = new Date(log.date);
    const diffDays = Math.floor(
      (d.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weekIndex = Math.floor(diffDays / 7);
    const dayOfWeek = d.getDay(); // 0-6
    const key = `${weekIndex}-${dayOfWeek}`;
    if (!heatSet.has(key)) {
      heatSet.add(key);
      weeklyHeatmap.push({ weekIndex, dayOfWeek, hasWorkout: true });
    }
  }

  // 训练量时间线
  const volumeTimeline = yearLogs
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log) => ({
      date: log.date,
      volume: computeMoveRingVolume(log),
    }));

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
};


