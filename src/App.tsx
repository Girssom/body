import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom';
import { WorkoutForm } from './components/WorkoutForm';
import { WorkoutHistory } from './components/WorkoutHistory';
import { LevelProgress } from './components/LevelProgress';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ExportPage } from './pages/ExportPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProPage } from './pages/ProPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { workoutsApi } from './api/client';
import type { WorkoutLog, WeeklySummary, LevelInfo } from './types';
import { calcLevelInfo, calcWeeklySummaries } from './utils/level';

type ToastState = { message: string; visible: boolean };

const HomePage: React.FC<{
  logs: WorkoutLog[];
  levelInfo: LevelInfo | null;
  onAdd: (log: WorkoutLog) => void;
  onDelete: (id: string) => void;
  toast: ToastState;
}> = ({ logs, levelInfo, onAdd, onDelete, toast }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const headerSubtitle = useMemo(() => {
    if (!logs.length) return '从今天开始，记录你的每一次进步';
    const last = logs[0];
    return `上次训练：${new Date(last.date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })} · ${last.exercise}`;
  }, [logs]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center">
      <div className="w-full max-w-md px-4 py-4 pb-6 space-y-4">
        <header className="mt-2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                🏋️ 健身成长记录
              </h1>
              <p className="mt-1 text-xs text-slate-500">{headerSubtitle}</p>
            </div>
            {levelInfo && (
              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600">
                  当前等级
                  <span className="ml-1 text-brand-500 font-semibold">
                    Lv {levelInfo.level}
                  </span>
                </span>
                {levelInfo.badges.length > 0 && (
                  <span className="text-[10px] text-emerald-600">
                    {levelInfo.badges[0]}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Link
              to="/export"
              className="inline-flex items-center rounded-full bg-slate-900 text-slate-50 px-3 py-1.5 text-[11px] font-medium"
            >
              年度总结 Pro ▸
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center rounded-full border border-slate-300 text-slate-600 px-3 py-1.5 text-[11px]"
            >
              我的报告
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="inline-flex items-center rounded-full border border-slate-300 text-slate-500 px-3 py-1.5 text-[11px]"
            >
              退出
            </button>
          </div>
        </header>

        {levelInfo && <LevelProgress info={levelInfo} />}

        <WorkoutForm onAdd={onAdd} />

        <WorkoutHistory logs={logs} onDelete={onDelete} />

        {toast.visible && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-5 z-50">
            <div className="toast-enter rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-2.5 text-xs text-slate-50 shadow-lg shadow-slate-900/60">
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function MainApp() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });

  const loadLogs = useCallback(async () => {
    try {
      const { logs: remote } = await workoutsApi.list();
      const sorted = (remote as WorkoutLog[]).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setLogs(sorted);
      const s = calcWeeklySummaries(sorted);
      setSummaries(s);
      setLevelInfo(calcLevelInfo(sorted, s));
    } catch {
      setLogs([]);
      setSummaries([]);
      setLevelInfo(calcLevelInfo([], []));
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!logs.length) return;
    const newSummaries = calcWeeklySummaries(logs);
    setSummaries(newSummaries);
    const newLevel = calcLevelInfo(logs, newSummaries);
    setLevelInfo((prev) => {
      if (prev && newLevel.level > prev.level) {
        showToast(`恭喜升级到 Lv${newLevel.level}！继续保持～`);
      }
      return newLevel;
    });
  }, [logs]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2600);
  };

  const handleAdd = useCallback(
    async (log: WorkoutLog) => {
      const next = [log, ...logs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setLogs(next);
      try {
        await workoutsApi.save(next);
        showToast('训练已保存 ✅');
      } catch {
        showToast('保存失败，请重试');
      }
    },
    [logs],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const next = logs.filter((l) => l.id !== id);
      setLogs(next);
      try {
        await workoutsApi.delete(id);
        await workoutsApi.save(next);
      } catch {
        showToast('删除失败，请重试');
      }
    },
    [logs],
  );

  const plan = user?.plan ?? 'free';

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            logs={logs}
            levelInfo={levelInfo}
            onAdd={handleAdd}
            onDelete={handleDelete}
            toast={toast}
          />
        }
      />
      <Route
        path="/export"
        element={
          <ExportPage plan={plan} logs={logs} />
        }
      />
      <Route path="/pro" element={<ProPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
