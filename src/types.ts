export type WorkoutLog = {
  id: string;
  date: string;
  exercise: string;
  // Strength
  sets?: number;
  reps?: number;
  weight?: number;

  // Cardio
  distance?: number;
  duration?: number;

  note?: string;
};

export type UserPlan = 'free' | 'pro';

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

export type WeeklySummary = {
  weekIndex: number;
  startDate: string;
  endDate: string;
  totalSessions: number;
  mostFrequentExercise: string | null;
  totalVolume: number;
  // 用于简单周报柱状图（长度 7，按周一到周日）
  dailyVolumes?: number[];
};

export type LevelInfo = {
  level: number;
  currentDay: number;
  daysInCycle: number;
  currentWeekSummary?: WeeklySummary;
  summaries: WeeklySummary[];
  badges: string[];
};

