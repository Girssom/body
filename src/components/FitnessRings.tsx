import React from 'react';
import type { YearlyRecap } from '../types';

type Props = {
  recap: YearlyRecap;
};

const Ring: React.FC<{
  label: string;
  value: number;
  goal: number;
  color: string;
}> = ({ label, value, goal, color }) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, value / goal);
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="140" height="140" className="drop-shadow-[0_0_25px_rgba(59,130,246,0.4)]">
        <defs>
          <linearGradient id={`ring-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke={`url(#ring-${label})`}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="mt-2 text-xs text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-50">
        {Math.round(value)} / {goal}
      </div>
    </div>
  );
};

export const FitnessRings: React.FC<Props> = ({ recap }) => {
  const move = recap.totalVolume;
  const minutes = recap.totalMinutes;

  // Stand: 活跃天数
  const stand = recap.activeDays;

  const moveGoal = Math.max(500, Math.round(move * 0.75));
  const exerciseGoal = Math.max(2000, Math.round(minutes * 0.75));
  const standGoal = Math.max(150, Math.round(stand * 0.75));

  return (
    <div className="glass-dark-card p-4 sm:p-6 flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
          Yearly Rings
        </p>
        <p className="text-3xl font-semibold text-slate-50">
          {recap.totalWorkouts} Sessions
        </p>
      </div>
      <div className="mt-2 flex items-center justify-center gap-5">
        <Ring label="Move" value={move} goal={moveGoal} color="#fb3878" />
        <Ring label="Exercise" value={minutes} goal={exerciseGoal} color="#34d399" />
        <Ring label="Stand" value={stand} goal={standGoal} color="#38bdf8" />
      </div>
    </div>
  );
};

