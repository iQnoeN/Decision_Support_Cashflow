import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ForecastPoint } from '../../api/types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ForecastCIChartProps {
  points: ForecastPoint[];
  title?: string;
}

export const ForecastCIChart: React.FC<ForecastCIChartProps> = ({ points, title = 'ML Forecast & Confidence Intervals (95% CI)' }) => {
  const chartData = points.map((p) => ({
    date: formatDate(p.date),
    predicted: p.predicted_cashflow,
    actual: p.actual_cashflow,
    lower_ci: p.lower_ci,
    upper_ci: p.upper_ci,
    ci_range: [p.lower_ci, p.upper_ci], // for area band rendering
    is_forecast: p.is_forecast,
  }));

  // Find index where forecast starts
  const forecastStartIndex = points.findIndex((p) => p.is_forecast);
  const forecastStartDate = forecastStartIndex !== -1 ? formatDate(points[forecastStartIndex].date) : undefined;

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">
            Shaded region represents 95% Machine Learning confidence bounds
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-400 inline-block"></span>
            <span className="text-slate-300">Predicted Cashflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-500/30 border border-teal-500/50 inline-block"></span>
            <span className="text-slate-300">95% CI Band</span>
          </div>
        </div>
      </div>

      <div className="w-full h-80 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.08} />
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
                const d = payload[0].payload;
                return (
                  <div className="glass-card p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700/80">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-200">{d.date}</span>
                      {d.is_forecast ? (
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 font-semibold text-[10px]">
                          Forecast
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold text-[10px]">
                          Historical
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4 text-teal-300 font-bold border-t border-slate-700/80 pt-1">
                      <span>Predicted:</span>
                      <span>{formatCurrency(d.predicted)}</span>
                    </div>

                    {d.is_forecast && (
                      <>
                        <div className="flex items-center justify-between gap-4 text-emerald-400">
                          <span>Upper Bound (95% CI):</span>
                          <span>{formatCurrency(d.upper_ci)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-rose-400">
                          <span>Lower Bound (95% CI):</span>
                          <span>{formatCurrency(d.lower_ci)}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              }}
            />

            {forecastStartDate && (
              <ReferenceLine
                x={forecastStartDate}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: 'Forecast Start',
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'top',
                }}
              />
            )}

            {/* Confidence Interval Shaded Band */}
            <Area
              type="monotone"
              dataKey="ci_range"
              stroke="none"
              fill="url(#ciGradient)"
            />

            {/* Central Forecast Line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#070c1b' }}
              activeDot={{ r: 7, fill: '#34d399' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
