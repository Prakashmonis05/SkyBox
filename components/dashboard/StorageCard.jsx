'use client';

import { HardDrive, ShieldCheck, Database } from 'lucide-react';

export default function StorageCard({ usedBytes = 0, totalBytes = 1073741824 }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const rawPercentage = (usedBytes / totalBytes) * 100;
  const displayPercentage =
    usedBytes === 0
      ? '0%'
      : rawPercentage < 0.1
      ? '< 0.1%'
      : rawPercentage < 1
      ? `${rawPercentage.toFixed(1)}%`
      : `${Math.min(100, Math.round(rawPercentage))}%`;

  const barWidth =
    usedBytes === 0 ? 0 : Math.max(Math.min(100, rawPercentage), 2);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Vault Storage Space
            </h4>
            <p className="text-xs text-slate-500">
              Free Tier Allocation (1 GB Limit)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-bold text-slate-900">
            {formatBytes(usedBytes)}
          </span>
          <span className="text-xs text-slate-400">
            {' '}/ {formatBytes(totalBytes)}
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            rawPercentage >= 90
              ? 'bg-red-500'
              : rawPercentage >= 75
              ? 'bg-amber-500'
              : 'bg-blue-600'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Storage Isolated with Supabase RLS</span>
        </span>
        <span
          className={`font-semibold ${
            rawPercentage >= 90
              ? 'text-red-600'
              : rawPercentage >= 75
              ? 'text-amber-600'
              : 'text-slate-600'
          }`}
        >
          {displayPercentage} used
        </span>
      </div>
    </div>
  );
}
