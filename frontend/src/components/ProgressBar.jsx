import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export const ProgressBar = ({ percentage, showLabel = true, size = 'md' }) => {
  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
          <span className="text-slate-400">Completion Progress</span>
          <span className="text-brand-400 font-bold">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50 ${heightClass}`}>
        <div
          className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm shadow-brand-500/50"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'acknowledged':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse-slow">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Acknowledged
        </span>
      );
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          Submitted
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          Pending
        </span>
      );
  }
};
