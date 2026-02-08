import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../api/client';

type ReportItem = { id: string; year: number; downloadUrl: string | null; createdAt: string };

export function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reportApi
      .list()
      .then((data) => setReports(data.reports))
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (id: string) => {
    try {
      const url = await reportApi.getDownloadUrl(id);
      window.open(url, '_blank');
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取下载链接失败');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-slate-900">我的年度报告</h1>
          <Link to="/" className="text-sm text-brand-500">返回首页</Link>
        </div>
        {loading && <p className="text-sm text-slate-500">加载中…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && reports.length === 0 && (
          <div className="glass-card p-6 text-center">
            <p className="text-slate-600">暂无报告</p>
            <p className="mt-2 text-sm text-slate-500">在「年度总结」页生成后会自动出现在这里</p>
            <Link to="/export" className="mt-4 inline-block text-brand-500 text-sm font-medium">去生成</Link>
          </div>
        )}
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Fitness Year Recap {r.year}</p>
                <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString('zh-CN')}</p>
              </div>
              <button
                onClick={() => handleDownload(r.id)}
                className="rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-medium text-white"
              >
                下载
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
