import React from 'react';
import { useCashflowStore } from '../store/useCashflowStore';
import { usePredictCashflow } from '../api/useCashflowQuery';
import { ForecastCIChart } from '../components/charts/ForecastCIChart';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import { formatCurrency, formatDate } from '../utils/formatters';
import { RefreshCw, Download, Cpu, Activity, FileText, CheckCircle } from 'lucide-react';

export const ForecastView: React.FC = () => {
  const { forecastResult } = useCashflowStore();
  const predictMutation = usePredictCashflow();

  if (!forecastResult) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center">
        <p className="text-slate-400">No active forecast data. Please upload a bank statement first.</p>
      </div>
    );
  }

  const { metrics, points, feature_importance, next_day_cashflow } = forecastResult;

  const handleDownloadPredictionsCSV = () => {
    const headers = 'Date,Predicted_Cashflow,Lower_CI_95,Upper_CI_95,Type\n';
    const rows = points
      .map(
        (p) =>
          `"${p.date}",${p.predicted_cashflow},${p.lower_ci},${p.upper_ci},"${p.is_forecast ? 'Forecast' : 'Historical'}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDownloadMetricsJSON = () => {
    const jsonStr = JSON.stringify(
      {
        model_metadata: metrics,
        feature_importance: feature_importance,
        latest_prediction: {
          next_day_net: next_day_cashflow,
          generated_at: forecastResult.generated_at,
        },
      },
      null,
      2
    );

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_metrics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Trigger Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-100">
            ML Cashflow Forecasting & Confidence Bounds
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Machine Learning multi-day trajectory projections with 95% confidence intervals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadMetricsJSON}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-teal-400" /> Download Metrics JSON
          </button>

          <button
            onClick={handleDownloadPredictionsCSV}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-teal-400" /> Download Predictions CSV
          </button>

          <button
            onClick={() => predictMutation.mutate()}
            disabled={predictMutation.isPending}
            className="px-5 py-2.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${predictMutation.isPending ? 'animate-spin' : ''}`} />
            Run Model Prediction
          </button>
        </div>
      </div>

      {/* Model Metadata Banner */}
      <div className="glass-panel rounded-2xl p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-teal-400" /> Model Architecture
          </span>
          <div className="text-sm font-bold text-slate-100">{metrics.model_name}</div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Trained Date</span>
          <div className="text-sm font-bold text-slate-200">{metrics.trained_date}</div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Model RMSE
          </span>
          <div className="text-sm font-bold text-emerald-400">${metrics.rmse.toLocaleString()}</div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Model MAE</span>
          <div className="text-sm font-bold text-slate-200">${metrics.mae.toLocaleString()}</div>
        </div>

        <div className="space-y-1 col-span-2 md:col-span-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">R² Score</span>
          <div className="text-sm font-bold text-teal-400">{(metrics.r2 * 100).toFixed(1)}% Accuracy</div>
        </div>
      </div>

      {/* Main Forecast Confidence Interval Chart */}
      <div className="w-full">
        <ForecastCIChart points={points} />
      </div>

      {/* Forecast Data Table & Feature Importance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predictions Data Table */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100">Forecasted Daily Values & Bounds</h3>
            <span className="text-xs text-teal-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> 14-Day Horizon
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Predicted Net</th>
                  <th className="px-4 py-2.5 text-right text-emerald-400">Upper 95% CI</th>
                  <th className="px-4 py-2.5 text-right text-rose-400">Lower 95% CI</th>
                  <th className="px-4 py-2.5 text-right">Confidence Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {points
                  .filter((p) => p.is_forecast)
                  .map((p) => {
                    const margin = p.upper_ci - p.predicted_cashflow;
                    return (
                      <tr key={p.date} className="hover:bg-slate-800/40">
                        <td className="px-4 py-2 font-medium text-slate-300">{formatDate(p.date)}</td>
                        <td className="px-4 py-2 text-right font-bold text-teal-400">
                          {formatCurrency(p.predicted_cashflow)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-emerald-400">
                          {formatCurrency(p.upper_ci)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-rose-400">
                          {formatCurrency(p.lower_ci)}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-400">± {formatCurrency(margin)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Importance Component */}
        <div className="lg:col-span-1">
          <FeatureImportanceChart features={feature_importance} />
        </div>
      </div>
    </div>
  );
};
