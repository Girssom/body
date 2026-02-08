import React, { useMemo } from 'react';
import type { YearlyRecap } from '../types';
import { getTrainingType } from '../utils/level';
import type { WorkoutLog } from '../types';

type Props = {
  recap: YearlyRecap;
  logs: WorkoutLog[];
};

const ACHIEVEMENTS_BASE = [
  { id: 'first', label: 'First Workout', emoji: '🏅' },
  { id: 'streak7', label: '7-Day Streak', emoji: '🔥' },
  { id: 'strength', label: 'Strength Master', emoji: '💪' },
  { id: 'cardio', label: 'Cardio Runner', emoji: '🏃' },
  { id: 'level5', label: 'Level Up Lv5', emoji: '⭐' },
];

export const AchievementWall: React.FC<Props> = ({ recap, logs }) => {
  const unlocked = useMemo(() => {
    const result: string[] = [];
    if (recap.totalWorkouts > 0) result.push('first');
    if (recap.longestStreak >= 7) result.push('streak7');

    const strengthCount = logs.filter(
      (l) => getTrainingType(l.exercise) === 'strength',
    ).length;
    const cardioCount = logs.filter(
      (l) => getTrainingType(l.exercise) === 'cardio',
    ).length;

    if (strengthCount >= 30) result.push('strength');
    if (cardioCount >= 30) result.push('cardio');
    if (recap.totalWorkouts >= 100) result.push('level5');
    return result;
  }, [recap, logs]);

  return (
    <div className="glass-dark-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-50">Achievements</h2>
        <span className="text-[11px] text-slate-500">
          {unlocked.length} / {ACHIEVEMENTS_BASE.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {ACHIEVEMENTS_BASE.map((badge) => {
          const isActive = unlocked.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center justify-center rounded-2xl border px-2.5 py-3 text-center transition-all ${
                isActive
                  ? 'bg-gradient-to-b from-slate-800 to-slate-950 border-slate-600 shadow-[0_0_25px_rgba(250,250,250,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="text-xl">{badge.emoji}</div>
              <div className="mt-1 text-[10px] text-slate-200">{badge.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

