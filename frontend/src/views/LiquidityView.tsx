import React from 'react';
import { useCashflowStore } from '../store/useCashflowStore';
import { usePredictCashflow } from '../api/useCashflowQuery';
import { RiskGauge } from '../components/ui/RiskGauge';
import { Sliders, Lightbulb, RefreshCcw, ArrowUpRight, ArrowDownRight, Zap, ShieldCheck, ShieldAlert, Upload } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const LiquidityView: React.FC = () => {
  const {
    baselineForecastResult,
    scenarioForecastResult,
    forecastResult: legacyForecastResult,
    scenario,
    setScenario,
    resetScenario,
    setActiveTab,
  } = useCashflowStore();
  const predictMutation = usePredictCashflow();

  // Active forecast displays scenarioForecastResult if a scenario is active, else baselineForecastResult
  const isScenarioActive =
    Boolean(scenarioForecastResult) || scenario.inflow_multiplier !== 1.0 || scenario.outflow_multiplier !== 1.0;
  const forecastResult = scenarioForecastResult || baselineForecastResult || legacyForecastResult;

  if (!forecastResult) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-200">No Liquidity Data</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Upload a bank statement to evaluate liquidity risk scores and stress test scenarios.
        </p>
        <button
          onClick={() => setActiveTab('upload')}
          className="mt-4 px-4 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-all flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" /> Upload Bank Statement
        </button>
      </div>
    );
  }

  const { liquidity_score, risk, recommendations, runway_days, current_balance, next_day_cashflow } = forecastResult;

  const handleInflowChange = (val: number) => {
    setScenario({ inflow_multiplier: val });
  };

  const handleOutflowChange = (val: number) => {
    setScenario({ outflow_multiplier: val });
  };

  const handleApplyPreset = (inflow: number, outflow: number) => {
    setScenario({ inflow_multiplier: inflow, outflow_multiplier: outflow });
  };

  const handleApplyScenario = () => {
    predictMutation.mutate(scenario);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-100">
            Liquidity Risk Assessment & Scenario Stress-Testing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated solvency monitoring, alerts, and interactive inflow/outflow stress simulation
          </p>
        </div>

        {isScenarioActive && (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
            <Zap className="w-4 h-4 text-amber-400" />
            Scenario Active (Dashboard & Forecast Remain Baseline)
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Gauge Panel */}
        <div className="lg:col-span-1">
          <RiskGauge score={liquidity_score} risk={risk} runwayDays={runway_days} />
        </div>

        {/* Actionable Recommendations Panel */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">AI Treasury Recommendations</h3>
                <p className="text-xs text-slate-400">Automated liquidity risk mitigations</p>
              </div>
            </div>

            <ul className="space-y-3">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Working Capital Buffer: <strong className="text-slate-200">{formatCurrency(current_balance)}</strong></span>
            <span>Next-Day Projected Net: <strong className="text-teal-400">{formatCurrency(next_day_cashflow)}</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Simulator */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-400" /> Interactive Cashflow Scenario Simulator
            </h3>
            <p className="text-xs text-slate-400">Stress test liquidity by scaling projected revenue inflows and vendor outflows</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetScenario}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Reset Baseline
            </button>

            <button
              onClick={handleApplyScenario}
              disabled={predictMutation.isPending}
              className="px-4 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl shadow-md shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              {predictMutation.isPending ? 'Recalculating...' : 'Recalculate Stress Test'}
            </button>
          </div>
        </div>

        {/* 1-Click Scenario Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> 1-Click Executive Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Baseline', inflow: 1.0, outflow: 1.0, desc: 'Normal operations' },
              { label: 'Recession Stress', inflow: 0.7, outflow: 1.2, desc: '-30% Inflow / +20% Expense' },
              { label: 'Growth Surge', inflow: 1.3, outflow: 1.1, desc: '+30% Inflow / +10% Expense' },
              { label: 'Receivable Delay', inflow: 0.6, outflow: 1.0, desc: '-40% Delayed Collections' },
            ].map((p) => {
              const isActive = scenario.inflow_multiplier === p.inflow && scenario.outflow_multiplier === p.outflow;
              return (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p.inflow, p.outflow)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-200">{p.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inflow Slider */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Revenue Inflow Scale
              </label>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-sm border border-emerald-500/30">
                {(scenario.inflow_multiplier * 100).toFixed(0)}%
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={scenario.inflow_multiplier}
              onChange={(e) => handleInflowChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Drop (-50%)</span>
              <span>Baseline (100%)</span>
              <span>Surge (+50%)</span>
            </div>
          </div>

          {/* Outflow Slider */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-400" /> Operating Outflow Scale
              </label>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-extrabold text-sm border border-rose-500/30">
                {(scenario.outflow_multiplier * 100).toFixed(0)}%
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={scenario.outflow_multiplier}
              onChange={(e) => handleOutflowChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Cut (-50%)</span>
              <span>Baseline (100%)</span>
              <span>Spike (+50%)</span>
            </div>
          </div>
        </div>

        {/* Live Impact Notification */}
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" /> Live Simulation Active: Next-Day Net adjusted to{' '}
            <strong className="text-slate-100">{formatCurrency(next_day_cashflow)}</strong>
          </span>
          <span className="font-bold text-emerald-400">Estimated Runway: {runway_days} Days</span>
        </div>
      </div>
    </div>
  );
};
