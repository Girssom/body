import React, { useMemo } from 'react';
import type { YearlyRecap } from '../types';

type Props = {
  recap: YearlyRecap;
};

export const WeeklyHeatmap: React.FC<Props> = ({ recap }) => {
  const { year, weeklyHeatmap } = recap;

  const grid = useMemo(() => {
    const yearStart = new Date(year, 0, 1);
    const weeksInYear = 53;
    const daysPerWeek = 7;
    const set = new Set(
      weeklyHeatmap.map((h) => `${h.weekIndex}-${h.dayOfWeek}`),
    );
    const rows: boolean[][] = [];
    for (let day = 0; day < daysPerWeek; day++) {
      const row: boolean[] = [];
      for (let week = 0; week < weeksInYear; week++) {
        row.push(set.has(`${week}-${day}`));
      }
      rows.push(row);
    }
    return rows;
  }, [year, weeklyHeatmap]);

  return (
    <div className="glass-dark-card p-4 sm:p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">
          Weekly Consistency Heatmap
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Each cell is a day; filled = day with a workout.
        </p>
      </div>
      <div className="overflow-x-auto">
        <div
          className="inline-flex flex-col gap-0.5"
          style={{ minWidth: 'min(100%, 320px)' }}
        >
          {grid.map((row, dayIndex) => (
            <div key={dayIndex} className="flex gap-0.5 justify-start">
              {row.map((filled, weekIndex) => (
                <div
                  key={weekIndex}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-[2px] flex-shrink-0 transition-colors ${
                    filled
                      ? 'bg-emerald-400/90'
                      : 'bg-slate-800/60'
                  }`}
                  title={
                    filled
                      ? `Week ${weekIndex + 1}, day ${dayIndex}`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>Jan</span>
        <span>Dec</span>
      </div>
    </div>
  );
};
