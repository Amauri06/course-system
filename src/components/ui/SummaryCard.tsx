import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'slate';
  trend?: {
    label: string;
    isPositive: boolean;
  };
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  variant = 'slate',
  trend
}) => {
  const gradients = {
    brand: 'from-brand-500/10 to-indigo-500/5 border-brand-100 hover:border-brand-300 text-brand-700',
    success: 'from-emerald-500/10 to-teal-500/5 border-emerald-100 hover:border-emerald-300 text-emerald-700',
    danger: 'from-rose-500/10 to-red-500/5 border-rose-100 hover:border-rose-300 text-rose-700',
    warning: 'from-amber-500/10 to-orange-500/5 border-amber-100 hover:border-amber-300 text-amber-700',
    info: 'from-sky-500/10 to-blue-500/5 border-sky-100 hover:border-sky-300 text-sky-700',
    slate: 'from-slate-500/10 to-slate-600/5 border-slate-100 hover:border-slate-300 text-slate-700',
  };

  const iconContainers = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-emerald-50 text-emerald-600',
    danger: 'bg-rose-50 text-rose-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-sky-50 text-sky-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  return (
    <div className={`relative overflow-hidden bg-white border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-linear-to-br ${gradients[variant]}`}>
      {/* Icon top-right */}
      <div className="absolute top-6 right-6">
        <div className={`p-3 rounded-xl border border-slate-100/50 shadow-xs ${iconContainers[variant]}`}>
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 pr-14">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none my-1.5">
          {value}
        </span>
        {trend && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.label}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              vs ayer
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
