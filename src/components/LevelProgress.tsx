import React from 'react';
import type { LevelInfo } from '../types';

type Props = {
  info: LevelInfo;
};

export const LevelProgress: React.FC<Props> = ({ info }) => {
  const progress = Math.min(100, (info.currentDay / info.daysInCycle) * 100);

  return (
    <section className="glass-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 items-center rounded-full border border-brand-100 bg-brand-50 px-2.5 text-xs font-semibold text-brand-500">
            Lv {info.level}
          </span>
          <span className="text-xs text-slate-500">7 天一个小阶段</span>
        </div>
        {info.badges.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1 max-w-[9rem]">
            {info.badges.slice(0, 3).map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            当前周期：第{' '}
            <span className="text-slate-900 font-semibold">
              {info.currentDay}
            </span>{' '}
            / {info.daysInCycle} 天
          </span>
          {info.currentWeekSummary && (
            <span>
              本周训练{' '}
              <span className="text-slate-900 font-semibold">
                {info.currentWeekSummary.totalSessions}
              </span>{' '}
              次
            </span>
          )}
        </div>

        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {info.currentWeekSummary && (
        <div className="mt-1 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              周期 {info.currentWeekSummary.weekIndex + 1}:{' '}
              {info.currentWeekSummary.startDate} -{' '}
              {info.currentWeekSummary.endDate}
            </span>
            <span className="text-emerald-600">
              总训练量 {Math.round(info.currentWeekSummary.totalVolume)}
            </span>
          </div>

          {/* 简单周报图表：按天分布的柱状图 */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-2.5 py-2">
            <p className="text-[10px] text-slate-500 mb-1.5">过去 7 天训练活跃度</p>
            <div className="flex items-end gap-1.5 h-16">
              {info.summaries.length ? (
                info.summaries
                  .slice(-1)[0]
                  .dailyVolumes?.map((v, idx: number) => {
                    const max = Math.max(...(info.summaries.slice(-1)[0].dailyVolumes ?? [1]));
                    const h = max === 0 ? 0 : (v / max) * 100;
                    const labels = ['一', '二', '三', '四', '五', '六', '日'];
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-0.5"
                      >
                        <div
                          className="w-full rounded-full bg-gradient-to-t from-brand-300 to-brand-500"
                          style={{ height: `${h || 4}%` }}
                        />
                        <span className="text-[9px] text-slate-400">
                          {labels[idx]}
                        </span>
                      </div>
                    );
                  })
              ) : (
                <div className="text-[10px] text-slate-400">
                  记录几天训练后，将自动生成周报图表。
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

