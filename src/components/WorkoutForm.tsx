import React, { useMemo, useState } from 'react';
import type { WorkoutLog } from '../types';
import { getTrainingType, type TrainingType } from '../utils/level';

const PRESET_EXERCISES = ['跑步', '骑行', '游泳', '卧推', '深蹲', '硬拉', '引体向上', '瑜伽'];

type Props = {
  onAdd: (log: WorkoutLog) => void;
};

const todayISO = () => new Date().toISOString();

// 生成唯一ID的兼容方法
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const WorkoutForm: React.FC<Props> = ({ onAdd }) => {
  const [exercise, setExercise] = useState(PRESET_EXERCISES[0]);
  const [customExercise, setCustomExercise] = useState('');
  const [sets, setSets] = useState<number | ''>('');
  const [reps, setReps] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [note, setNote] = useState('');

  const [distance, setDistance] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const activeExerciseName = useMemo(
    () => (customExercise || exercise).trim(),
    [customExercise, exercise],
  );

  const trainingType: TrainingType = useMemo(
    () => getTrainingType(activeExerciseName || exercise),
    [activeExerciseName, exercise],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = activeExerciseName;
    if (!name) {
      setError('请输入或选择训练项目');
      return;
    }

    // 校验必填字段
    if (trainingType === 'strength') {
      if (!sets || !reps) {
        setError('力量训练需要填写组数和次数');
        return;
      }
    } else if (trainingType === 'cardio') {
      if (distance === '' && duration === '') {
        setError('有氧训练至少填写距离或时长');
        return;
      }
    } else if (trainingType === 'flex') {
      if (duration === '') {
        setError('该项目需要填写时长');
        return;
      }
    }

    setError(null);

    const log: WorkoutLog = {
      id: generateId(),
      date: todayISO(),
      exercise: name,
      // Strength
      sets: trainingType === 'strength' && sets !== '' ? Number(sets) : undefined,
      reps: trainingType === 'strength' && reps !== '' ? Number(reps) : undefined,
      weight:
        trainingType === 'strength' && weight !== '' ? Number(weight) : undefined,
      // Cardio / Flex
      distance:
        (trainingType === 'cardio' && distance !== '') ? Number(distance) : undefined,
      duration:
        (trainingType === 'cardio' || trainingType === 'flex') && duration !== ''
          ? Number(duration)
          : undefined,
      note: note.trim() || undefined,
    };

    onAdd(log);

    // clear form after save
    setCustomExercise('');
    setSets('');
    setReps('');
    setWeight('');
    setNote('');
    setDistance('');
    setDuration('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-50">记录训练</h2>
          <p className="text-xs text-slate-400">选择项目并填写本次训练数据</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">训练项目</label>
          <div className="flex gap-2">
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="w-1/2 rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/70"
            >
              {PRESET_EXERCISES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
            <input
              value={customExercise}
              onChange={(e) => setCustomExercise(e.target.value)}
              placeholder="或自定义项目"
              className="flex-1 rounded-2xl bg-slate-50 border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/70"
            />
          </div>
        </div>

        {/* Strength 字段组：组数 / 次数 / 重量 */}
        <div
          className={`grid grid-cols-3 gap-2 transition-all duration-200 ${
            trainingType === 'strength' ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'
          }`}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">组数</label>
            <input
              type="number"
              min={1}
              value={sets}
              onChange={(e) => setSets(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/70"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">次数</label>
            <input
              type="number"
              min={1}
              value={reps}
              onChange={(e) => setReps(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/70"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">重量(kg)</label>
            <input
              type="number"
              min={0}
              value={weight}
              onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/70"
            />
          </div>
        </div>

        {/* Cardio 字段：距离 + 时长 */}
        <div
          className={`grid grid-cols-2 gap-2 transition-all duration-200 ${
            trainingType === 'cardio' ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'
          }`}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">距离 (km)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={distance}
              onChange={(e) =>
                setDistance(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/70"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">时长 (分钟)</label>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/70"
            />
          </div>
        </div>

        {/* Flex 字段：仅时长 */}
        <div
          className={`transition-all duration-200 ${
            trainingType === 'flex' ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0 overflow-hidden'
          }`}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">时长 (分钟)</label>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/70"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">备注</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="例如：状态很好，准备下次加重 2.5kg"
            className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/70 resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      <button
        type="submit"
        className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={!((customExercise || exercise).trim())}
      >
        保存训练
      </button>
    </form>
  );
};

