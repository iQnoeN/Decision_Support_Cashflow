import React from 'react';
import { getRiskBadgeColor } from '../../utils/formatters';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface RiskGaugeProps {
  score: number; // 0 to 100
  risk: string;
  runwayDays: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, risk, runwayDays }) => {
  const badgeColors = getRiskBadgeColor(risk);
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine indicator position
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-40 h-40 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-800 dark:text-slate-800"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke={badgeColors.iconColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {normalizedScore}
          </span>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Liquidity Index
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center gap-2">
        <span
          className={clsx(
            'px-3.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5',
            badgeColors.bg,
            badgeColors.text,
            badgeColors.border
          )}
        >
          {risk === 'Stable' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          {risk === 'Moderate Risk' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          {(risk === 'High Risk' || risk === 'Critical') && <ShieldAlert className="w-4 h-4 text-rose-400" />}
          {risk}
        </span>

        <p className="text-xs text-slate-400 mt-1">
          Estimated Runway: <span className="font-semibold text-slate-200">{runwayDays} Days</span>
        </p>
      </div>
    </div>
  );
};
