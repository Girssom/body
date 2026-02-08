import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserPlan, WorkoutLog } from '../types';
import { buildYearlyRecap } from '../utils/level';
import { FitnessRings } from '../components/FitnessRings';
import { YearStatsCards } from '../components/YearStatsCards';
import { AchievementWall } from '../components/AchievementWall';
import { WeeklyHeatmap } from '../components/WeeklyHeatmap';
import { reportApi } from '../api/client';
import { exportYearRecapAsPng } from '../utils/exportPdf';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts';

type Props = {
  plan: UserPlan;
  logs: WorkoutLog[];
  onUpgrade?: () => void;
};

const YEAR = new Date().getFullYear();
const EXPORT_ROOT_ID = 'year-recap-root';

export const ExportPage: React.FC<Props> = ({ plan, logs, onUpgrade }) => {
  const navigate = useNavigate();
  const recap = useMemo(() => buildYearlyRecap(logs, YEAR), [logs]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const monthlyData = useMemo(
    () =>
      recap.monthlyWorkouts.map((m) => ({
        name: `${m.month + 1}`,
        workouts: m.count,
      })),
    [recap],
  );

  const volumeData = useMemo(
    () =>
      recap.volumeTimeline.map((v) => ({
        name: new Date(v.date).toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
        }),
        volume: v.volume,
      })),
    [recap],
  );

  const handleExportPdf = async () => {
    if (plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    setExporting(true);
    setGeneratedUrl(null);
    try {
      const res = await reportApi.generate(YEAR);
      if (res.downloadUrl) {
        setGeneratedUrl(res.downloadUrl);
        window.open(res.downloadUrl, '_blank');
      } else {
        navigate('/reports');
      }
    } catch {
      // fallback: client-side PDF if API fails
      const { exportYearRecapAsPdf } = await import('../utils/exportPdf');
      await exportYearRecapAsPdf(EXPORT_ROOT_ID, YEAR);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPng = async () => {
    if (plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    setExporting(true);
    try {
      await exportYearRecapAsPng(EXPORT_ROOT_ID, YEAR);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50 flex justify-center">
      <div className="w-full max-w-3xl px-4 py-4 pb-10 space-y-4">
        <header className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Grissom Fitness
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
              🎉 Fitness Year Recap {YEAR}
            </h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200"
          >
            Back
          </button>
        </header>

        <div
          id={EXPORT_ROOT_ID}
          className="space-y-4 sm:space-y-5 mt-2"
        >
          <section className="glass-dark-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Grissom Fitness Year Recap
              </h2>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Your year in motion, captured like an Apple Fitness report.
              </p>
              <div className="mt-3 flex gap-3 items-baseline">
                <span className="text-3xl sm:text-4xl font-semibold text-slate-50">
                  {recap.totalWorkouts}
                </span>
                <span className="text-xs text-slate-400">total workouts</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-400/40 px-3 py-1 text-[11px] text-emerald-200">
                {plan === 'pro' ? 'Fitness Pro' : 'Free'}
              </span>
              <span className="text-[11px] text-slate-500">
                Active days: {recap.activeDays} · Longest streak: {recap.longestStreak}d
              </span>
            </div>
          </section>

          <FitnessRings recap={recap} />

          <YearStatsCards recap={recap} />

          {/* 趋势图表区域 */}
          <section className="glass-dark-card p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Monthly Workout Trend
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Each bar represents sessions completed in that month.
              </p>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" tickLine={false} stroke="#64748b" fontSize={10} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: 999,
                      paddingInline: 10,
                      paddingBlock: 6,
                    }}
                    labelStyle={{ color: '#e2e8f0', fontSize: 10 }}
                    itemStyle={{ color: '#e2e8f0', fontSize: 10 }}
                  />
                  <Bar dataKey="workouts" fill="#38bdf8" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <WeeklyHeatmap recap={recap} />

          <section className="glass-dark-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Volume Growth Line
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Daily move volume across the year.
                </p>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData}>
                  <XAxis hide dataKey="name" />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: 999,
                      paddingInline: 10,
                      paddingBlock: 6,
                    }}
                    labelStyle={{ color: '#e2e8f0', fontSize: 10 }}
                    itemStyle={{ color: '#e2e8f0', fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#fb7185"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <AchievementWall recap={recap} logs={logs} />
        </div>

        {/* 导出操作：Free 显示升级，Pro 显示生成 PDF */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="inline-flex items-center justify-center rounded-full bg-slate-50 text-slate-900 px-5 py-2.5 text-xs font-semibold shadow-md shadow-slate-900/40 disabled:opacity-60"
            >
              {plan === 'pro'
                ? 'Generate Year Recap PDF'
                : '升级 Pro 解锁年度报告'}
            </button>
            <button
              onClick={handleExportPng}
              disabled={exporting || plan !== 'pro'}
              className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-xs text-slate-100 disabled:opacity-40"
            >
              Export as PNG
            </button>
          </div>
        </div>

        {/* 付费墙弹窗 */}
        {showPaywall && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-dark-card p-5 w-full max-w-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-50">
                Upgrade to Fitness Pro
              </h2>
              <p className="text-xs text-slate-400">
                Unlock Year Recap + PDF Export
              </p>
              <button
                onClick={() => {
                  setShowPaywall(false);
                  navigate('/pro');
                }}
                className="w-full inline-flex items-center justify-center rounded-full bg-slate-50 text-slate-900 px-4 py-2.5 text-sm font-semibold shadow-md"
              >
                Subscribe ¥68/年
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full text-xs text-slate-500"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

