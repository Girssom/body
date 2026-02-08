import React from 'react';
import type { YearlyRecap } from '../types';

type Props = {
  recap: YearlyRecap;
};

const StatCard: React.FC<{
  label: string;
  value: string;
  accent?: string;
}> = ({ label, value, accent }) => (
  <div className="glass-soft-card p-3 sm:p-4 flex flex-col justify-between">
    <span className="text-[11px] text-slate-400">{label}</span>
    <div className="mt-2 flex items-baseline gap-1">
      <span className="text-xl font-semibold text-slate-50">{value}</span>
      {accent && <span className="text-[11px] text-slate-500">{accent}</span>}
    </div>
  </div>
);

export const YearStatsCards: React.FC<Props> = ({ recap }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Total Workouts"
        value={String(recap.totalWorkouts)}
      />
      <StatCard
        label="Total Volume"
        value={Math.round(recap.totalVolume).toLocaleString()}
      />
      <StatCard
        label="Total Distance"
        value={recap.totalDistance.toFixed(1)}
        accent="km"
      />
      <StatCard
        label="Total Minutes"
        value={String(recap.totalMinutes)}
        accent="min"
      />
      <StatCard
        label="Longest Streak"
        value={String(recap.longestStreak)}
        accent="days"
      />
      <StatCard
        label="Best Exercise"
        value={recap.bestExercise ?? '—'}
      />
    </div>
  );
};

