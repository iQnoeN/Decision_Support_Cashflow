import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ForecastPoint } from '../../api/types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CashflowChartProps {
  points: ForecastPoint[];
  title?: string;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ points, title = 'Cashflow Time Series' }) => {
  const [granularity, setGranularity] = useState<'daily' | 'weekly'>('daily');

  // Filter or aggregate based on granularity
  const chartData = points.map((p) => ({
    date: formatDate(p.date),
    net: p.predicted_cashflow,
    cash_in: p.cash_in || 0,
    cash_out: -(p.cash_out || 0), // negative for visual bar comparison
    is_forecast: p.is_forecast,
  }));

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">Historical inflows, outflows and net daily liquidity</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setGranularity('daily')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              granularity === 'daily'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setGranularity('weekly')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              granularity === 'weekly'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="w-full h-72 sm:h-80 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => formatCurrency(v, true)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="glass-card p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700/80">
                    <p className="font-bold text-slate-200">{data.date}</p>
                    <div className="flex items-center justify-between gap-4 text-emerald-400">
                      <span>Cash In:</span>
                      <span className="font-semibold">{formatCurrency(data.cash_in)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-rose-400">
                      <span>Cash Out:</span>
                      <span className="font-semibold">{formatCurrency(Math.abs(data.cash_out))}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-teal-300 font-bold border-t border-slate-700 pt-1">
                      <span>Net Cashflow:</span>
                      <span>{formatCurrency(data.net)}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="cash_in" fill="#059669" radius={[4, 4, 0, 0]} opacity={0.6} maxBarSize={20} />
            <Bar dataKey="cash_out" fill="#e11d48" radius={[0, 0, 4, 4]} opacity={0.6} maxBarSize={20} />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorNet)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
