import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { FeatureImportance } from '../../api/types';

interface FeatureImportanceChartProps {
  features: FeatureImportance[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ features }) => {
  const chartData = features.map((f) => ({
    feature: f.feature.split(' ')[0], // short label
    fullName: f.feature,
    importance: Math.round(f.importance * 100),
    impact: f.impact,
    description: f.description,
  }));

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-100">Model Feature Importance</h3>
        <p className="text-xs text-slate-400">Relative weight of engineered cashflow signals in XGBoost model</p>
      </div>

      <div className="w-full h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
            <XAxis type="number" stroke="#94a3b8" fontSize={11} unit="%" domain={[0, 50]} />
            <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="glass-card p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700 max-w-xs">
                    <p className="font-bold text-slate-200">{d.fullName}</p>
                    <p className="text-teal-400 font-semibold">Importance Weight: {d.importance}%</p>
                    <p className="text-slate-400 text-[11px] leading-snug">{d.description}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="importance" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.impact === 'positive' ? '#10b981' : entry.impact === 'negative' ? '#f43f5e' : '#0284c7'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
