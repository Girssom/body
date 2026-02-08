import React from 'react';
import type { WorkoutLog } from '../types';
import { getTrainingType } from '../utils/level';

type Props = {
  logs: WorkoutLog[];
  onDelete: (id: string) => void;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const WorkoutHistory: React.FC<Props> = ({ logs, onDelete }) => {
  if (!logs.length) {
    return (
      <div className="glass-card p-4 sm:p-5 text-center text-xs text-slate-400">
        暂无训练记录，先来完成今天的第一组吧～
      </div>
    );
  }

  return (
    <div className="glass-card p-3 sm:p-4 space-y-2 max-h-[45vh] overflow-y-auto">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold text-slate-800">历史记录</h2>
        <span className="text-[10px] text-slate-400">共 {logs.length} 条</span>
      </div>
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="group flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2.5"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-xs font-medium text-slate-900">
                  {log.exercise}
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">
                  {formatDate(log.date)}
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-700">
                    {(() => {
                      const type = getTrainingType(log.exercise);
                      if (type === 'strength') {
                        return (
                          <>
                            {log.sets != null && log.reps != null && (
                              <span>
                                {log.sets} 组 × {log.reps} 次
                              </span>
                            )}
                            {log.weight != null && (
                              <span className="ml-1 text-brand-500 font-medium">
                                @ {log.weight} kg
                              </span>
                            )}
                          </>
                        );
                      }
                      if (type === 'cardio') {
                        return (
                          <>
                            {log.distance != null && <span>{log.distance} km</span>}
                            {log.distance != null && log.duration != null && <span> · </span>}
                            {log.duration != null && <span>{log.duration} 分钟</span>}
                          </>
                        );
                      }
                      // flex
                      return log.duration != null ? (
                        <span>{log.duration} 分钟</span>
                      ) : null;
                    })()}
                  </div>
                  {log.note && (
                    <div className="truncate text-[10px] text-slate-400 max-w-[9rem] text-right">
                      {log.note}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => onDelete(log.id)}
              className="shrink-0 rounded-full border border-slate-200 bg-white p-1.5 text-[10px] text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

