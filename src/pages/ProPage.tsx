import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { payApi } from '../api/client';
import { QRCodeSVG } from 'qrcode.react';

export function ProPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(68);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  const handleCreateOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await payApi.createOrder();
      setCodeUrl(data.code_url);
      setAmount(data.amount);
      setPolling(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!polling || !codeUrl) return;
    const t = setInterval(() => {
      refreshUser();
    }, 3000);
    return () => clearInterval(t);
  }, [polling, codeUrl, refreshUser]);

  React.useEffect(() => {
    if (user?.plan === 'pro' && codeUrl) {
      setPolling(false);
      setCodeUrl(null);
      navigate('/reports', { replace: true });
    }
  }, [user?.plan, codeUrl, navigate]);

  if (user?.plan === 'pro') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
        <div className="glass-card p-6 text-center max-w-sm">
          <p className="text-lg font-semibold text-slate-900">你已是 Pro 会员</p>
          <p className="mt-2 text-sm text-slate-500">可导出年度报告并保存至云端</p>
          <Link to="/reports" className="mt-4 inline-block rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white">
            查看我的报告
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="glass-card p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">升级 Fitness Pro</h1>
          <p className="mt-2 text-sm text-slate-500">¥68/年 · 解锁年度总结 PDF 与云端保存</p>
          {!codeUrl && (
            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? '生成中…' : '微信支付 ¥68'}
            </button>
          )}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
        {codeUrl && (
          <div className="glass-card p-6 flex flex-col items-center">
            <p className="text-sm text-slate-600 mb-3">请使用微信扫描二维码支付</p>
            <div className="bg-white p-3 rounded-2xl">
              <QRCodeSVG value={codeUrl} size={200} level="M" />
            </div>
            <p className="mt-3 text-xs text-slate-500">支付成功后将自动刷新会员状态</p>
          </div>
        )}
        <Link to="/" className="block text-center text-sm text-slate-500">返回首页</Link>
      </div>
    </div>
  );
}
