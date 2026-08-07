import React from 'react';
import { useCashflowStore } from '../store/useCashflowStore';
import {
  TrendingUp,
  Upload,
  LineChart,
  ShieldAlert,
  LayoutDashboard,
  CheckCircle2,
  Zap,
  Brain,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

export const HelpView: React.FC = () => {
  const { setActiveTab, forecastResult } = useCashflowStore();

  const steps = [
    {
      step: '01',
      icon: Upload,
      title: 'Upload Bank Statement',
      desc: 'Drag & drop any transaction CSV export from your bank or accounting system. The system validates, parses, and runs automated preprocessing.',
      action: () => setActiveTab('upload'),
      actionLabel: 'Upload a Statement',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
    },
    {
      step: '02',
      icon: Brain,
      title: 'AI Feature Engineering & Prediction',
      desc: 'The XGBoost ML model automatically computes 7-day lag features, rolling averages, and generates a next-day cashflow forecast with 95% confidence bounds.',
      action: () => setActiveTab('forecast'),
      actionLabel: 'View ML Forecast',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      step: '03',
      icon: LineChart,
      title: 'Inspect Forecast & Confidence Intervals',
      desc: 'Visualize the predicted cashflow trajectory over 14 days with upper/lower confidence bands, model accuracy metrics (RMSE, MAE, R²), and feature importance.',
      action: () => setActiveTab('forecast'),
      actionLabel: 'Open Forecast Charts',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
    },
    {
      step: '04',
      icon: ShieldAlert,
      title: 'Liquidity Risk & Scenario Testing',
      desc: 'Get an automated liquidity score (0–100), risk classification, and AI-generated treasury recommendations. Stress test with 1-click presets like "Recession Stress" or "Revenue Surge".',
      action: () => setActiveTab('liquidity'),
      actionLabel: 'View Risk Assessment',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  const features = [
    { icon: Zap, label: 'Instant CSV Parsing', desc: 'Auto-detects headers & validates format' },
    { icon: Brain, label: 'XGBoost ML Model', desc: 'Track A feature engineering pipeline' },
    { icon: BarChart3, label: '95% Confidence Intervals', desc: 'Uncertainty bands on every forecast' },
    { icon: ShieldAlert, label: 'Liquidity Score 0–100', desc: 'Automated solvency risk monitoring' },
    { icon: CheckCircle2, label: 'Scenario Stress Testing', desc: 'Adjust inflow/outflow sliders live' },
    { icon: TrendingUp, label: 'Historical Analytics', desc: '30-day burn rate & runway estimation' },
  ];

  return (
    <div className="space-y-12 animate-fade-in max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold mb-6">
          <Zap className="w-3.5 h-3.5 fill-teal-400" /> AI-Powered Financial Intelligence
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 mb-4">
          Welcome to <span className="text-teal-400">CashflowAI</span>
        </h1>
        <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
          An intelligent decision-support platform that transforms raw bank transaction data into actionable
          cashflow forecasts, liquidity risk assessments, and financial scenario simulations — powered by
          machine learning.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('upload')}
            className="px-6 py-3 text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl shadow-lg shadow-teal-500/25 transition-all flex items-center gap-2"
          >
            Get Started — Upload Statement <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-3 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-teal-400" /> View Dashboard
          </button>
        </div>
      </div>

      {/* How It Works Steps */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-100">How It Works</h2>
          <p className="text-slate-400 text-sm mt-1">Four simple steps from raw data to financial intelligence</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className={`glass-panel rounded-2xl p-6 border ${s.border} hover:shadow-xl transition-all duration-300 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${s.bg} border ${s.border}`}>
                    <Icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <span className={`text-4xl font-black opacity-10 ${s.color}`}>{s.step}</span>
                </div>

                <h3 className="text-base font-bold text-slate-100 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{s.desc}</p>

                <button
                  onClick={s.action}
                  className={`text-xs font-bold ${s.color} hover:underline flex items-center gap-1 group-hover:gap-2 transition-all`}
                >
                  {s.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Grid */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-100">Platform Capabilities</h2>
          <p className="text-slate-400 text-sm mt-1">Everything built into one integrated financial intelligence system</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="glass-panel rounded-2xl p-5 text-center hover:border-teal-500/30 transition-all"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-sm font-bold text-slate-100">{f.label}</div>
                <div className="text-[11px] text-slate-400 mt-1">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Banner */}
      {forecastResult && (
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Session</div>
              <div className="text-sm font-bold text-slate-100">
                Forecast ready — Risk: <span className={
                  forecastResult.risk === 'Stable' ? 'text-emerald-400' :
                  forecastResult.risk === 'Moderate Risk' ? 'text-amber-400' : 'text-rose-400'
                }>{forecastResult.risk}</span> · Liquidity Score: {forecastResult.liquidity_score}/100 · Runway: {forecastResult.runway_days} Days
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('liquidity')}
            className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            View Risk Assessment <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
