import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number; // percentage
  changeLabel?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'neutral';
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs last 30d',
  icon: Icon,
  iconBgColor = 'bg-teal-500/10 dark:bg-teal-500/20',
  iconTextColor = 'text-teal-600 dark:text-teal-400',
  badgeText,
  badgeType = 'neutral',
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 bg-slate-700/50 rounded"></div>
          <div className="h-10 w-10 bg-slate-700/50 rounded-xl"></div>
        </div>
        <div className="h-8 w-36 bg-slate-700/50 rounded mb-2"></div>
        <div className="h-3 w-24 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  const isPositiveChange = change !== undefined && change >= 0;

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-slate-400/30 hover:shadow-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-400 dark:text-slate-400">{title}</span>
        <div className={clsx('p-2.5 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', iconBgColor)}>
          <Icon className={clsx('w-5 h-5', iconTextColor)} />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
          {value}
        </h3>

        {badgeText && (
          <span
            className={clsx(
              'px-2.5 py-1 rounded-full text-xs font-semibold border',
              badgeType === 'success' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
              badgeType === 'warning' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
              badgeType === 'danger' && 'bg-rose-500/10 text-rose-500 border-rose-500/20',
              badgeType === 'neutral' && 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span
            className={clsx(
              'inline-flex items-center font-semibold gap-0.5',
              isPositiveChange ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
            )}
          >
            {isPositiveChange ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isPositiveChange ? `+${change}%` : `${change}%`}
          </span>
        )}
        {(subtitle || changeLabel) && (
          <span className="text-slate-500 dark:text-slate-400">{subtitle || changeLabel}</span>
        )}
      </div>
    </div>
  );
};
